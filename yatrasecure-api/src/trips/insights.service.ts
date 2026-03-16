import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';

@Injectable()
export class InsightsService {
  private groq: Groq;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.groq = new Groq({ apiKey });
    }
  }

  async getTripSummaryStats(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: true,
        photos: { include: { likes: true } },
        wallet: { include: { expenses: true } },
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    const expenses = (trip as any).wallet?.expenses || [];
    const totalSpent = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const categories = [...new Set(expenses.map((e: any) => e.category))];
    const categoryBreakdown = categories.map((cat) => ({
      category: cat,
      amount: expenses
        .filter((e: any) => e.category === cat)
        .reduce((sum: number, e: any) => sum + e.amount, 0),
    }));

    const topContributor = trip.members.length > 0 
      ? await this.getTopContributor(expenses)
      : null;

    return {
      totalSpent,
      memberCount: trip.members.length,
      photoCount: trip.photos.length,
      categoryBreakdown,
      topContributor,
    };
  }

  private async getTopContributor(expenses: any[]) {
    const usage: Record<string, number> = {};
    expenses.forEach((e) => {
      usage[e.paidById] = (usage[e.paidById] || 0) + e.amount;
    });

    let topId = '';
    let maxAmount = 0;
    for (const [id, amt] of Object.entries(usage)) {
      if (amt > maxAmount) {
        maxAmount = amt;
        topId = id;
      }
    }

    if (!topId) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: topId },
      select: { username: true, profileImage: true },
    });

    return { ...user, amount: maxAmount };
  }

  async generateTripStory(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        admin: { select: { username: true } },
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    const prompt = `
      Write a beautiful, nostalgic short story about a group trip to ${trip.toCity}.
      The trip was from ${trip.fromCity} and led by ${trip.admin.username}.
      
      Focus on the emotions of travel, discovery, and friendship. 
      The tone should be premium, evocative, and heartwarming.
      Keep it to 3 short paragraphs.
      Return ONLY the story text.
    `;

    try {
      if (!this.groq) {
        throw new Error('Groq not initialized');
      }

      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
      });

      const story = completion.choices[0]?.message?.content || "A journey that will be remembered forever.";
      
      // We could save this in the database field if we had 'story' field in Trip model
      // For now, we'll just return it.
      return { story };
    } catch (error) {
      console.error('Groq Story Error:', error);
      return { story: "A beautiful journey of discovery and shared memories at " + trip.toCity };
    }
  }
}
