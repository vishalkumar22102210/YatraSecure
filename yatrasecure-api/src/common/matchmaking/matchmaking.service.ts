import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Calculates a compatibility score (0-100) between two travel personalities.
   * If personality strings are identical, it returns a high base score.
   * Otherwise, it uses a semantic logical mapping or LLM if needed.
   */
  calculateCompatibility(p1: string, p2: string): number {
    if (!p1 || !p2) return 50; // Neutral fallback
    if (p1 === p2) return 92 + Math.floor(Math.random() * 6); // High match for same persona

    const mappings: Record<string, string[]> = {
      'Adventure Seeker': ['Budget Explorer', 'Soul Searcher'],
      'Luxury Traveler': ['Culture Enthusiast'],
      'Soul Searcher': ['Culture Enthusiast', 'Adventure Seeker'],
      'Budget Explorer': ['Adventure Seeker', 'Culture Enthusiast'],
      'Culture Enthusiast': ['Luxury Traveler', 'Soul Searcher'],
    };

    if (mappings[p1]?.includes(p2)) return 75 + Math.floor(Math.random() * 10);
    if (mappings[p2]?.includes(p1)) return 75 + Math.floor(Math.random() * 10);

    return 60 + Math.floor(Math.random() * 10); // Standard base match
  }

  /**
   * Future-proof: AI Matchmaking using Groq
   * Can be used to explain WHY they are a match.
   */
  async getAIMatchReason(u1: any, u2: any): Promise<string> {
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (!groqKey || groqKey === 'PASTE_YOUR_GROQ_API_KEY_HERE') {
      return `Both of you enjoy ${u1.travelPersonality || 'exploring'}!`;
    }

    try {
      const prompt = `Two travelers are being matched. 
      Traveler 1: ${u1.username}, Persona: ${u1.travelPersonality}, Bio: ${u1.bio || 'None'}
      Traveler 2: ${u2.username}, Persona: ${u2.travelPersonality}, Bio: ${u2.bio || 'None'}
      Why would they be a good match for a trip? Give a 1-sentence friendly explanation.`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
        }),
      });

      if (!res.ok) return `You both share a love for ${u1.travelPersonality}!`;
      const data = await res.json();
      return data.choices?.[0]?.message?.content || `Compatible travel styles!`;
    } catch (e) {
      return `Potential travel buddies!`;
    }
  }
}
