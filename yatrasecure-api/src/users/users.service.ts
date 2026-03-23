import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserMapperService } from '../common/mappers/user.mapper';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private userMapper: UserMapperService,
  ) {}

  // ✅ Safe selection fields for all queries
  private readonly SAFE_USER_SELECT = {
    id: true,
    email: true,
    username: true,
    profileImage: true,
    bio: true,
    age: true,
    city: true,
    state: true,
    country: true,
    firstName: true,
    lastName: true,
    phone: true,
    travelStyle: true,
    budgetRange: true,
    travelPersonality: true,
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
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: this.SAFE_USER_SELECT,
    });

    return this.userMapper.toSafeUserDto(user);
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

    await this.prisma.user.update({
      where: { id: followerId },
      data: {
        // @ts-ignore
        following: {
          connect: { id: target.id },
        },
      },
    });

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

    await this.prisma.user.update({
      where: { id: followerId },
      data: {
        // @ts-ignore
        following: {
          disconnect: { id: target.id },
        },
      },
    });

    return { message: 'Unfollowed successfully' };
  }

  /**
   * Get followers
   */
  async getFollowers(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        // @ts-ignore
        followers: {
          select: this.MINIMAL_SELECT,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userMapper.toMinimalUserDtoArray(user.followers as any);
  }

  /**
   * Get following
   */
  async getFollowing(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        // @ts-ignore
        following: {
          select: this.MINIMAL_SELECT,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userMapper.toMinimalUserDtoArray(user.following as any);
  }
}