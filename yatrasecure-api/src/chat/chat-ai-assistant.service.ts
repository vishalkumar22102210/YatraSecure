import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

@Injectable()
export class ChatAIAssistantService {
  private groq: Groq;
  private readonly logger = new Logger(ChatAIAssistantService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get('GROQ_API_KEY');
    if (apiKey && apiKey !== 'PASTE_YOUR_GROQ_API_KEY_HERE') {
      this.groq = new Groq({ apiKey });
      this.logger.log('Groq AI initialized for Chat Assistant');
    } else {
      this.logger.warn('GROQ_API_KEY missing. Chat Assistant will run in Demo Mode.');
    }
  }

  async getAIResponse(tripId: string, userQuery: string, username: string): Promise<string> {
    try {
      // 1. Fetch Trip Context
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          members: {
            include: {
              user: {
                select: { username: true }
              }
            }
          }
        }
      });

      if (!trip) return "I'm sorry, I couldn't find the trip context.";

      const memberNames = trip.members.map(m => m.user.username).join(', ');

      // 2. Build System Prompt
      const systemPrompt = `
You are the YatraSecure AI Travel Companion. You are participating in a group chat for a trip.
TRIP CONTEXT:
- Trip Name: ${trip.name}
- Destination: From ${trip.fromCity} to ${trip.toCity}
- Dates: ${trip.startDate?.toDateString()} to ${trip.endDate?.toDateString()}
- Budget: ₹${trip.budget}
- Members: ${memberNames}
- Itinerary (JSON): ${trip.itinerary || 'No itinerary planned yet.'}

USER INFO:
- Current User: ${username}

TASK:
- Answer the user's query politely and helpfully.
- If they ask for recommendations, suggest places based on the trip destination.
- Keep it concise as this is a chat bubble (2-3 sentences max).
- Use emojis to keep it friendly.
- Do not make up facts; if unsure, suggest searching online.
`;

      // 3. Multi-model fallback
      if (!this.groq) {
        throw new Error('Groq not initialized');
      }

      for (const model of MODELS) {
        try {
          this.logger.log(`Trying model ${model} for chat AI response`);
          const completion = await this.groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userQuery.replace('@ai', '').trim() },
            ],
            model,
            temperature: 0.7,
            max_tokens: 500,
          });

          const response = completion.choices[0]?.message?.content;
          if (response) return response;
        } catch (err) {
          this.logger.warn(`Model ${model} failed for chat AI: ${(err as any)?.message}`);
          continue;
        }
      }

      return "I'm having a bit of trouble with my AI models right now. Try again in a moment! 😅";
    } catch (error) {
      if (!this.groq) {
        return `Hey ${username}! 👋 I'm the YatraSecure AI Companion (Demo Mode). Once the GROQ_API_KEY is configured, I'll help you plan your trip with personalized recommendations! 🌍✨`;
      }
      this.logger.error('Error in AI Assistant Chat:', error);
      return "I'm having a bit of trouble connecting right now. Try asking again! 😅";
    }
  }
}
