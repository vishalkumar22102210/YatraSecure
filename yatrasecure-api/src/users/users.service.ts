import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        profileImage: true,
        bio: true,
        age: true,
        city: true,
        state: true,
        travelStyle: true,
        budgetRange: true, // @ts-ignore
        travelPersonality: true, // @ts-ignore
        reputationScore: true, // @ts-ignore
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // NEW: Update user profile
  async updateProfile(
    userId: string,
    data: {
      bio?: string;
      age?: number;
      city?: string;
      state?: string;
      travelStyle?: string[];
      budgetRange?: string;
      travelPersonality?: string;
    },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        profileImage: true,
        bio: true,
        age: true,
        city: true,
        state: true,
        travelStyle: true,
        budgetRange: true, // @ts-ignore
        travelPersonality: true, // @ts-ignore
        reputationScore: true, // @ts-ignore
        isVerified: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // FRIENDS & FOLLOW SYSTEM
  // ══════════════════════════════════════════════════════════════════════════════
  async followUser(currentUserId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({ where: { username: targetUsername } });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === currentUserId) throw new ConflictException('You cannot follow yourself');

    return this.prisma.user.update({
      where: { id: currentUserId },
      data: {
        // @ts-ignore
        following: {
          connect: { id: target.id }
        }
      }
    });
  }

  async unfollowUser(currentUserId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({ where: { username: targetUsername } });
    if (!target) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: currentUserId },
      data: {
        // @ts-ignore
        following: {
          disconnect: { id: target.id }
        }
      }
    });
  }

  async getPublicProfile(username: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        profileImage: true,
        bio: true,
        city: true,
        state: true,
        country: true,
        travelStyle: true, // @ts-ignore
        travelPersonality: true, // @ts-ignore
        reputationScore: true, // @ts-ignore
        isVerified: true,
        // @ts-ignore
        _count: {
          // @ts-ignore
          select: { followers: true, following: true, trips: true }
        },
        // @ts-ignore
        followers: currentUserId ? {
          where: { id: currentUserId },
          select: { id: true }
        } : false
      } as any
    });

    if (!user) throw new NotFoundException('User not found');

    const isFollowing = currentUserId ? user.followers.length > 0 : false;
    const { followers, ...rest } = user as any;

    return { ...rest, isFollowing };
  }
}
