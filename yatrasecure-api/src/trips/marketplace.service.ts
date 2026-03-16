import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

@Injectable()
export class MarketplaceService {
  private groq: Groq;
  private readonly logger = new Logger(MarketplaceService.name);
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 1000 * 60 * 20; // 20 minutes

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey !== 'PASTE_YOUR_GROQ_API_KEY_HERE') {
      this.groq = new Groq({ apiKey });
      this.logger.log('Groq AI initialized for Marketplace');
    } else {
      this.logger.warn('GROQ_API_KEY missing. Marketplace will run in Demo Mode.');
    }
  }

  async getMarketplaceOfferings(category?: string, city?: string) {
    const cacheKey = `${city || 'global'}_${category || 'all'}`.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.log(`Cache hit for marketplace: ${cacheKey}`);
      return cached.data;
    }

    const prompt = `
      Act as a premium travel experiences curator. Generate 6 verified local experience offerings for travelers.
      ${city ? `Focus on the city of ${city}.` : 'Focus on popular global travel destinations.'}
      ${category ? `Category filter: ${category}.` : ''}
      
      Return the response in JSON:
      {
        "offerings": [
          {
            "id": "unique-id-string",
            "title": "Experience Name",
            "description": "2-3 sentence description",
            "location": "City, Country",
            "price": 2500,
            "currency": "INR",
            "category": "Adventure / Food / Culture / Wellness / Hidden Gems",
            "groupDiscount": 15,
            "rating": 4.9,
            "verified": true,
            "provider": "Provider Name",
            "vibe": "Thrilling / Relaxing / Cultural / Spiritual",
            "duration": "2-3 hours",
            "maxGroupSize": 10
          }
        ]
      }
      Return ONLY valid JSON.
    `;

    for (const model of MODELS) {
      try {
        if (!this.groq) throw new Error('Groq not initialized');

        this.logger.log(`Trying model ${model} for marketplace: ${cacheKey}`);
        const completion = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model,
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('AI returned no content');

        const result = JSON.parse(content);
        this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      } catch (error) {
        this.logger.warn(`Model ${model} failed for marketplace ${cacheKey}: ${(error as any)?.message}`);
        continue;
      }
    }

    this.logger.error(`All models failed for marketplace: ${cacheKey}`);
    return this.getDemoOfferings(city, category);
  }

  private getDemoOfferings(city?: string, category?: string) {
    const loc = city || 'Various Locations';
    return {
      offerings: [
        { id: 'demo-1', title: `${loc} Heritage Walk`, description: 'Explore historic lanes with an expert guide', location: loc, price: 1500, currency: 'INR', category: 'Culture', groupDiscount: 20, rating: 4.8, verified: true, provider: 'Local Heritage Tours', vibe: 'Cultural', duration: '3 hours', maxGroupSize: 12 },
        { id: 'demo-2', title: `${loc} Food Trail`, description: 'Taste authentic local flavors across 6 stops', location: loc, price: 2000, currency: 'INR', category: 'Food', groupDiscount: 15, rating: 4.9, verified: true, provider: 'Foodie Adventures', vibe: 'Cultural', duration: '2.5 hours', maxGroupSize: 8 },
        { id: 'demo-3', title: 'Sunrise Trekking Experience', description: 'A scenic morning trek to a hidden viewpoint', location: loc, price: 3000, currency: 'INR', category: 'Adventure', groupDiscount: 25, rating: 4.7, verified: true, provider: 'Peak Adventures', vibe: 'Thrilling', duration: '4 hours', maxGroupSize: 15 },
        { id: 'demo-4', title: 'Yoga & Meditation Retreat', description: 'A peaceful morning session with certified instructors', location: loc, price: 1200, currency: 'INR', category: 'Wellness', groupDiscount: 10, rating: 4.9, verified: true, provider: 'Inner Peace Studio', vibe: 'Spiritual', duration: '2 hours', maxGroupSize: 20 },
      ],
      _mode: 'demo'
    };
  }
}
