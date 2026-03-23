import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface MatchResult {
  user: any;
  matchPercentage: number;
  matchReasons: string[];
}

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /* ─────────────────────────────────────────────────────────
   * Core multi-factor match algorithm
   * Weights:  Location 25% | Interests 30% | TravelStyle 25% | Personality 20%
   * ───────────────────────────────────────────────────────── */

  private readonly SAFE_SELECT = {
    id: true,
    username: true,
    profileImage: true,
    bio: true,
    city: true,
    hometown: true,
    state: true,
    interests: true,
    travelStyle: true,
    travelPersonality: true,
    reputationScore: true,
    isVerified: true,
  };

  /**
   * Get matched users for a given user, ranked by compatibility score.
   */
  async getMatches(userId: string, limit = 20): Promise<MatchResult[]> {
    // 1. Fetch current user with all matchable fields
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, city: true, hometown: true, state: true,
        interests: true, travelStyle: true, travelPersonality: true,
      },
    });

    if (!currentUser) return [];

    // 2. Fetch candidate users (exclude self)
    const candidates = await this.prisma.user.findMany({
      where: { id: { not: userId } },
      select: this.SAFE_SELECT,
      take: 100, // Scan up to 100 candidates for performance
      orderBy: { reputationScore: 'desc' },
    });

    // 3. Score each candidate
    const scored: MatchResult[] = candidates.map((candidate) => {
      const { score, reasons } = this.calculateMultiFactorScore(currentUser, candidate);
      return { user: candidate, matchPercentage: score, matchReasons: reasons };
    });

    // 4. Sort by score descending and take top N
    scored.sort((a, b) => b.matchPercentage - a.matchPercentage);
    return scored.slice(0, limit);
  }

  /**
   * Multi-factor scoring: Location (25) + Interests (30) + TravelStyle (25) + Personality (20) = 100
   */
  private calculateMultiFactorScore(
    me: any,
    other: any,
  ): { score: number; reasons: string[] } {
    let totalScore = 0;
    const reasons: string[] = [];

    // ── Location match (max 25 pts) ──
    const locationScore = this.scoreLocation(me, other);
    totalScore += locationScore;
    if (locationScore >= 20) reasons.push('📍 Same city');
    else if (locationScore >= 10) reasons.push('📍 Same state');

    // ── Interests overlap (max 30 pts) ──
    const interestScore = this.scoreArrayOverlap(
      me.interests || [],
      other.interests || [],
      30,
    );
    totalScore += interestScore;
    const commonInterests = this.getCommonItems(me.interests || [], other.interests || []);
    if (commonInterests.length > 0) {
      reasons.push(`❤️ ${commonInterests.length} shared interest${commonInterests.length > 1 ? 's' : ''}`);
    }

    // ── Travel style overlap (max 25 pts) ──
    const styleScore = this.scoreArrayOverlap(
      me.travelStyle || [],
      other.travelStyle || [],
      25,
    );
    totalScore += styleScore;
    const commonStyles = this.getCommonItems(me.travelStyle || [], other.travelStyle || []);
    if (commonStyles.length > 0) {
      reasons.push(`🧭 Similar travel style`);
    }

    // ── Personality compatibility (max 20 pts) ──
    const personalityScore = this.scorePersonality(
      me.travelPersonality,
      other.travelPersonality,
    );
    totalScore += personalityScore;
    if (personalityScore >= 16) reasons.push('✨ Personality match');

    // Ensure score is between 0-100
    const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));

    // If no specific reasons matched, add a generic one
    if (reasons.length === 0) {
      reasons.push('🌏 Fellow traveler');
    }

    return { score: finalScore, reasons };
  }

  /* ── Scoring helpers ── */

  private scoreLocation(me: any, other: any): number {
    if (me.city && other.city && me.city.toLowerCase() === other.city.toLowerCase()) return 25;
    if (me.hometown && other.hometown && me.hometown.toLowerCase() === other.hometown.toLowerCase()) return 20;
    if (me.hometown && other.city && me.hometown.toLowerCase() === other.city.toLowerCase()) return 15;
    if (me.city && other.hometown && me.city.toLowerCase() === other.hometown.toLowerCase()) return 15;
    if (me.state && other.state && me.state.toLowerCase() === other.state.toLowerCase()) return 10;
    return 0;
  }

  private scoreArrayOverlap(arr1: string[], arr2: string[], maxPoints: number): number {
    if (!arr1.length || !arr2.length) return 0;
    const set2 = new Set(arr2.map(s => s.toLowerCase()));
    const overlap = arr1.filter(item => set2.has(item.toLowerCase())).length;
    const maxPossible = Math.max(arr1.length, arr2.length);
    if (maxPossible === 0) return 0;
    return Math.round((overlap / maxPossible) * maxPoints);
  }

  private getCommonItems(arr1: string[], arr2: string[]): string[] {
    const set2 = new Set(arr2.map(s => s.toLowerCase()));
    return arr1.filter(item => set2.has(item.toLowerCase()));
  }

  private scorePersonality(p1: string | null, p2: string | null): number {
    if (!p1 || !p2) return 10; // Neutral
    if (p1.toLowerCase() === p2.toLowerCase()) return 20; // Perfect match

    // Compatible pairs
    const compatMap: Record<string, string[]> = {
      'extrovert':  ['ambivert'],
      'introvert':  ['ambivert', 'introvert'],
      'ambivert':   ['extrovert', 'introvert'],
      'adventure seeker': ['budget explorer', 'soul searcher'],
      'luxury traveler':  ['culture enthusiast'],
      'soul searcher':    ['culture enthusiast', 'adventure seeker'],
      'budget explorer':  ['adventure seeker', 'culture enthusiast'],
      'culture enthusiast': ['luxury traveler', 'soul searcher'],
    };

    const key = p1.toLowerCase();
    if (compatMap[key]?.includes(p2.toLowerCase())) return 16;
    return 8;
  }

  /**
   * Simple compatibility score between two personality strings (legacy).
   */
  calculateCompatibility(p1: string, p2: string): number {
    return this.scorePersonality(p1, p2) * 5; // Scale to ~100
  }
}
