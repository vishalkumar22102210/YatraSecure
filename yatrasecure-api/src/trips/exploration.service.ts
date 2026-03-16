import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

@Injectable()
export class ExplorationService {
  private groq: Groq;
  private readonly logger = new Logger(ExplorationService.name);
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 1000 * 60 * 30; // 30 minutes

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey !== 'PASTE_YOUR_GROQ_API_KEY_HERE') {
      this.groq = new Groq({ apiKey });
      this.logger.log('Groq AI initialized for Exploration Engine');
    } else {
      this.logger.warn('GROQ_API_KEY missing. Exploration Engine will run in Demo Mode.');
    }
  }

  async discoverHiddenGems(city: string) {
    // Check cache first
    const cacheKey = `gems_${city.toLowerCase().trim()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.log(`Cache hit for hidden gems: ${city}`);
      return cached.data;
    }

    const prompt = `
      Act as a world-class travel scout. Identify 5-7 underrated, "hidden gem" places or experiences in or near ${city}.
      These should be spots that typical tourists miss (e.g., a secret cafe, a quiet viewpoint, a local art alley).
      
      Return the response in JSON format:
      {
        "city": "${city}",
        "tagline": "A catchy phrase about exploring ${city}",
        "gems": [
          {
            "name": "...",
            "description": "Why it's a hidden gem and what to do there",
            "vibe": "Rustic / Artistic / Quiet / Vibrant",
            "crowdLevel": "Low / Moderate / High",
            "bestTime": "...",
            "coordinates": {"lat": 0, "lng": 0}, 
            "travelTip": "A unique pro-tip for this specific spot"
          }
        ]
      }
      Return ONLY valid JSON.
    `;

    for (const model of MODELS) {
      try {
        if (!this.groq) throw new Error('Groq not initialized');

        this.logger.log(`Trying model ${model} for hidden gems: ${city}`);
        const completion = await this.groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model,
          response_format: { type: 'json_object' },
          temperature: 0.8,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('AI returned no content');

        const result = JSON.parse(content);
        this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      } catch (error) {
        this.logger.warn(`Model ${model} failed for gems ${city}: ${(error as any)?.message}`);
        continue;
      }
    }

    this.logger.error(`All models failed for hidden gems: ${city}`);
    return {
      city,
      tagline: `Uncover the hidden wonders of ${city}`,
      gems: [
        { name: "Secret Sunrise Point", description: "A quiet viewpoint locals visit at dawn", vibe: "Quiet", crowdLevel: "Low", bestTime: "Early morning", travelTip: "Bring a warm jacket" },
        { name: "Artisan Market Lane", description: "Handmade crafts and local delicacies", vibe: "Vibrant", crowdLevel: "Moderate", bestTime: "Late morning", travelTip: "Bargain politely" },
        { name: "Heritage Cafe", description: "A century-old cafe with incredible ambiance", vibe: "Rustic", crowdLevel: "Low", bestTime: "Afternoon", travelTip: "Try the local specialty" },
      ],
      _mode: "demo"
    };
  }
}
