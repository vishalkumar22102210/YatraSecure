import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserMapperService } from '../common/mappers/user.mapper';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private userMapper: UserMapperService,
    private notificationsService: NotificationsService,
  ) {}

  // ✅ Safe selection fields for all queries
  private readonly SAFE_USER_SELECT = {
    id: true,
    email: true,
    username: true,
    profileImage: true,
    bio: true,
    age: true,
    gender: true,
    city: true,
    hometown: true,
    state: true,
    country: true,
    professionalStatus: true,
    firstName: true,
    lastName: true,
    phone: true,
    travelStyle: true,
    interests: true,
    budgetRange: true,
    travelPersonality: true,
    emergencyContacts: true,
    reputationScore: true,
    isVerified: true,
    isEmailVerified: true,
    createdAt: true,
    updatedAt: true,
  };

  // ✅ Minimal selection for lists
  private readonly MINIMAL_SELECT = {
    id: true,
    username: true,
    profileImage: true,
    reputationScore: true,
    isVerified: true,
    travelPersonality: true,
  };

  // ✅ Public profile selection
  private readonly PUBLIC_SELECT = {
    id: true,
    username: true,
    profileImage: true,
    bio: true,
    city: true,
    state: true,
    country: true,
    travelStyle: true,
    travelPersonality: true,
    reputationScore: true,
    isVerified: true,
    createdAt: true,
    // ❌ NO email
  };

  /**
   * Create user (signup)
   */
  async create(email: string, username: string, password: string) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: this.SAFE_USER_SELECT,
    });

    return this.userMapper.toSafeUserDto(user);
  }

  /**
   * Find by email (FOR INTERNAL USE ONLY)
   * Returns full user including password
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find by ID (safe response)
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.SAFE_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userMapper.toSafeUserDto(user);
  }

  /**
   * Update profile
   */
  async updateProfile(userId: string, data: any) {
    console.log('Updating profile for user:', userId, 'with data:', data);
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: this.SAFE_USER_SELECT,
      });
      return this.userMapper.toSafeUserDto(user);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Get public profile
   */
  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        ...this.PUBLIC_SELECT,
        // @ts-ignore
        _count: {
          select: { followers: true, following: true, trips: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { _count, ...userWithoutCount } = user as any;

    return this.userMapper.toUserWithFollowDto(
      userWithoutCount,
      false,
      _count,
    );
  }

  /**
   * Get multiple users (for suggestions, lists)
   */
  async findMany(ids: string[]) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: this.MINIMAL_SELECT,
    });

    return this.userMapper.toMinimalUserDtoArray(users);
  }

  /**
   * Get all users (paginated)
   */
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: this.MINIMAL_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users: this.userMapper.toMinimalUserDtoArray(users),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Validate password
   */
  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Follow user
   */
  async followUser(followerId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (followerId === target.id) {
      throw new ConflictException('You cannot follow yourself');
    }

    // Create Follow record
    await this.prisma.follow.create({
      data: {
        followerId,
        followingId: target.id,
      },
    }).catch((e) => {
      // Ignore unique constraint (already following)
      if (e.code !== 'P2002') throw e;
    });

    // Send Notification to Target
    try {
      const follower = await this.prisma.user.findUnique({ where: { id: followerId } });
      if (follower) {
        await this.notificationsService.createNotification(
          target.id,
          'FOLLOW',
          'New Follower',
          `@${follower.username} started following you`,
          `/profile/${follower.username}`,
        );
      }
    } catch (e) {
      console.error('Failed to create follow notification:', e);
    }

    return { message: 'Followed successfully' };
  }

  /**
   * Unfollow user
   */
  async unfollowUser(followerId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.follow.deleteMany({
      where: {
        followerId,
        followingId: target.id,
      },
    });

    return { message: 'Unfollowed successfully' };
  }

  /**
   * Get followers (with optional mutual check)
   */
  async getFollowers(username: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        followers: {
          select: {
            follower: {
              select: this.MINIMAL_SELECT
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const followersList = user.followers.map(f => f.follower);
    
    // Optional: flag mutuals
    let detailedFollowers = followersList as any[];
    if (currentUserId && followersList.length > 0) {
      const mutuals = await this.prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: followersList.map(f => f.id) }
        },
        select: { followingId: true }
      });
      const mutualIds = new Set(mutuals.map(m => m.followingId));
      detailedFollowers = followersList.map(f => ({
        ...f,
        isMutual: mutualIds.has(f.id)
      }));
    }

    return this.userMapper.toMinimalUserDtoArray(detailedFollowers);
  }

  /**
   * Get following (with optional mutual check)
   */
  async getFollowing(username: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        following: {
          select: {
            following: {
              select: this.MINIMAL_SELECT
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const followingList = user.following.map(f => f.following);

    let detailedFollowing = followingList as any[];
    if (currentUserId && followingList.length > 0) {
      const mutuals = await this.prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: followingList.map(f => f.id) }
        },
        select: { followingId: true }
      });
      const mutualIds = new Set(mutuals.map(m => m.followingId));
      detailedFollowing = followingList.map(f => ({
        ...f,
        isMutual: mutualIds.has(f.id)
      }));
    }

    return this.userMapper.toMinimalUserDtoArray(detailedFollowing);
  }

  /**
   * Get mutual connections (uses native intersection)
   */
  async getMutualConnections(username: string, currentUserId: string) {
    if (!currentUserId) return [];
    
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    // Mutuals = users that target follows AND current user follows
    const mutuals = await this.prisma.user.findMany({
      where: {
        AND: [
          { followers: { some: { followerId: target.id } } },
          { followers: { some: { followerId: currentUserId } } }
        ]
      },
      select: this.MINIMAL_SELECT
    });

    return this.userMapper.toMinimalUserDtoArray(mutuals.map(m => ({ ...m, isMutual: true })));
  }
}