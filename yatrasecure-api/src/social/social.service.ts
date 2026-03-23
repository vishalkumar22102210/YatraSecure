import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchmakingService } from '../common/matchmaking/matchmaking.service';

@Injectable()
export class SocialService {
  constructor(
    private prisma: PrismaService,
    private matchmakingService: MatchmakingService,
  ) {}

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: followingId }, select: { id: true } });
    if (!targetUser) throw new NotFoundException('User to follow not found');

    const followObj = await this.prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      create: { followerId, followingId },
      update: {},
    });

    // Auto-update reputation
    await this.updateReputation(followingId);
    return { message: 'Followed successfully' };
  }

  async unfollowUser(followerId: string, followingId: string) {
    try {
      return await this.prisma.follow.delete({
        where: {
          followerId_followingId: { followerId, followingId },
        },
      });
      
      // Auto-update reputation
      await this.updateReputation(followingId);
      return { message: 'Unfollowed' };
    } catch (e) {
      // If not following, silently succeed or handle
      return { message: 'Not following' };
    }
  }

  async getFollowing(userId: string) {
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            reputationScore: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFollowers(userId: string) {
    return this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            reputationScore: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSocialStats(userId: string) {
    const [followers, following] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);
    return { followers, following };
  }

  async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    return !!follow;
  }

  async updateReputation(userId: string) {
    const followersCount = await this.prisma.follow.count({ where: { followingId: userId } });
    const tripsCount = await this.prisma.tripMember.count({ where: { userId } });
    
    // Logic: Base score = followers * 10 + trips * 20
    // Future: Add AI photo verification multiplier
    const score = (followersCount * 10) + (tripsCount * 20);

    await this.prisma.user.update({
      where: { id: userId },
      data: { reputationScore: Math.min(score, 1000) }, // Cap at 1000
      select: { id: true, reputationScore: true },
    });
  }

  async getSuggestedTravelers(userId: string) {
    // 1. Get current user's personality
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { travelPersonality: true },
    });

    // 2. Get users not followed by me
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);

    const candidates = await this.prisma.user.findMany({
      where: {
        id: { notIn: [userId, ...followingIds] },
        reputationScore: { gt: 0 },
      },
      orderBy: { reputationScore: 'desc' },
      take: 10, // Fetch more to filter/sort
      select: {
        id: true,
        username: true,
        profileImage: true,
        reputationScore: true,
        isVerified: true,
        travelPersonality: true,
      }
    });

    // 3. Map with compatibility score
    const suggestions = candidates.map(u => {
      const matchScore = this.matchmakingService.calculateCompatibility(
        me?.travelPersonality || '',
        u.travelPersonality || '',
      );
      return { ...u, matchScore };
    });

    // 4. Sort by score then reputation
    return suggestions
      .sort((a, b) => b.matchScore - a.matchScore || b.reputationScore - a.reputationScore)
      .slice(0, 5);
  }
}
