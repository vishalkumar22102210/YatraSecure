import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

@Injectable()
export class DestinationGuideService {
  private groq: Groq;
  private readonly logger = new Logger(DestinationGuideService.name);
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 1000 * 60 * 30; // 30 minutes

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey !== 'PASTE_YOUR_GROQ_API_KEY_HERE') {
      this.groq = new Groq({ apiKey });
      this.logger.log('Groq AI initialized for Destination Guides');
    } else {
      this.logger.warn('GROQ_API_KEY missing. Destination Guides will run in Demo Mode.');
    }
  }

  async getDestinationGuide(city: string) {
    // Check cache first
    const cacheKey = city.toLowerCase().trim();
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.log(`Cache hit for destination guide: ${city}`);
      return cached.data;
    }

    const prompt = `
      Generate a premium, detailed travel guide for the city of ${city}.
      Return the response in JSON format with the following structure:
      {
        "city": "${city}",
        "description": "A short evocative intro (2-3 sentences)",
        "bestTimeToVisit": "...",
        "topAttractions": [
          {"name": "...", "description": "..."}
        ],
        "localSecrets": [
          {"name": "...", "description": "..."}
        ],
        "foodSpots": [
          {"name": "...", "description": "...", "cuisine": "..."}
        ],
        "cultureHighlights": ["...", "..."],
        "budgetTips": ["...", "..."],
        "itinerarySummary": "Suggested 3-day plan summary",
        "safetyTips": ["...", "..."],
        "budgetLevel": "Budget/Mid-range/Luxury"
      }
      Include at least 5 top attractions, 3 local secrets, 4 food spots, 3 culture highlights, and 3 budget tips.
      Focus on being accurate and helpful. Return ONLY the JSON.
    `;

    // Multi-model fallback
    for (const model of MODELS) {
      try {
        if (!this.groq) {
          throw new Error('Groq not initialized');
        }

        this.logger.log(`Trying model ${model} for destination guide: ${city}`);
        const completion = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model,
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('AI returned no content');
        
        const result = JSON.parse(content);
        
        // Cache the result
        this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
        
        return result;
      } catch (error) {
        this.logger.warn(`Model ${model} failed for ${city}: ${(error as any)?.message}`);
        continue; // Try next model
      }
    }

    // All models failed - return structured demo data
    this.logger.error(`All models failed for destination guide: ${city}`);
    return this.getDemoGuide(city);
  }

  private getDemoGuide(city: string) {
    return {
      city,
      description: `${city} is a vibrant destination offering rich culture, stunning landscapes, and unforgettable experiences for every type of traveler.`,
      bestTimeToVisit: "October to March for pleasant weather",
      topAttractions: [
        { name: `${city} Central Market`, description: "The heart of local commerce and culture" },
        { name: `${city} Heritage Walk`, description: "A guided tour through historic neighborhoods" },
        { name: `Old ${city} Quarter`, description: "Traditional architecture and local life" },
      ],
      localSecrets: [
        { name: "Hidden Rooftop Cafe", description: "A local favorite with panoramic views" },
        { name: "Artisan Street", description: "Where local craftspeople showcase their work" },
      ],
      foodSpots: [
        { name: "Local Street Food Market", description: "Authentic flavors at unbeatable prices", cuisine: "Local" },
        { name: "Heritage Restaurant", description: "Traditional recipes passed down generations", cuisine: "Traditional" },
      ],
      cultureHighlights: ["Visit during local festivals for authentic cultural immersion", "Try a cooking class with local chefs"],
      budgetTips: ["Use local transport for cost savings", "Eat where locals eat for best value"],
      itinerarySummary: `Day 1: Explore Old ${city}. Day 2: Market and food tour. Day 3: Nature and hidden gems.`,
      safetyTips: ["Keep copies of important documents", "Stay hydrated and carry water"],
      budgetLevel: "Mid-range",
      _mode: "demo"
    };
  }
}
