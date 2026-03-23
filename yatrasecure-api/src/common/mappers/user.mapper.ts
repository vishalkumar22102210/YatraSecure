import { Injectable } from '@nestjs/common';

// ✅ SECURE: DTOs for different use cases
export interface SafeUserDto {
  id: string;
  username: string;
  email?: string;
  profileImage?: string;
  bio?: string;
  age?: number;
  city?: string;
  state?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  travelStyle?: string[];
  budgetRange?: string;
  travelPersonality?: string;
  reputationScore: number;
  isVerified: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MinimalUserDto {
  id: string;
  username: string;
  profileImage?: string;
  reputationScore: number;
  isVerified: boolean;
  travelPersonality?: string;
}

export interface PublicProfileDto {
  id: string;
  username: string;
  profileImage?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  travelStyle?: string[];
  travelPersonality?: string;
  reputationScore: number;
  isVerified: boolean;
  createdAt: Date;
}

export interface UserWithFollowDto extends PublicProfileDto {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
  tripCount: number;
}

@Injectable()
export class UserMapperService {
  /**
   * Map full user to safe DTO (for own profile)
   * ✅ SECURE: Returns all user fields when accessed by owner
   */
  toSafeUserDto(user: any): SafeUserDto | null {
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email || undefined,
      profileImage: user.profileImage || undefined,
      bio: user.bio || undefined,
      age: user.age || undefined,
      city: user.city || undefined,
      state: user.state || undefined,
      country: user.country || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      phone: user.phone || undefined,
      travelStyle: user.travelStyle || [],
      budgetRange: user.budgetRange || undefined,
      travelPersonality: user.travelPersonality || undefined,
      reputationScore: user.reputationScore || 50,
      isVerified: user.isVerified || false,
      isEmailVerified: user.isEmailVerified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Map user to minimal DTO (for lists, suggestions)
   * ✅ SECURE: Only essential fields
   */
  toMinimalUserDto(user: any): MinimalUserDto | null {
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      profileImage: user.profileImage || undefined,
      reputationScore: user.reputationScore || 50,
      isVerified: user.isVerified || false,
      travelPersonality: user.travelPersonality || undefined,
    };
  }

  /**
   * Map user to public profile DTO (what others see)
   * ✅ SECURE: No email, phone, or sensitive data
   */
  toPublicProfileDto(user: any): PublicProfileDto | null {
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      profileImage: user.profileImage || undefined,
      bio: user.bio || undefined,
      city: user.city || undefined,
      state: user.state || undefined,
      country: user.country || undefined,
      travelStyle: user.travelStyle || [],
      travelPersonality: user.travelPersonality || undefined,
      reputationScore: user.reputationScore || 50,
      isVerified: user.isVerified || false,
      createdAt: user.createdAt,
    };
  }

  /**
   * Map user with follow info
   * ✅ SECURE: Includes follow statistics
   */
  toUserWithFollowDto(
    user: any,
    isFollowing: boolean = false,
    counts: any = {},
  ): UserWithFollowDto | null {
    if (!user) return null;

    const publicProfile = this.toPublicProfileDto(user);
    if (!publicProfile) return null;

    return {
      ...publicProfile,
      isFollowing,
      followerCount: counts?.followers || 0,
      followingCount: counts?.following || 0,
      tripCount: counts?.trips || 0,
    };
  }

  /**
   * Map array of users to minimal DTOs
   */
  toMinimalUserDtoArray(users: any[]): MinimalUserDto[] {
    if (!Array.isArray(users)) return [];
    return users
      .map((u) => this.toMinimalUserDto(u))
      .filter((u): u is MinimalUserDto => u !== null);
  }

  /**
   * Map array of users to public profile DTOs
   */
  toPublicProfileDtoArray(users: any[]): PublicProfileDto[] {
    if (!Array.isArray(users)) return [];
    return users
      .map((u) => this.toPublicProfileDto(u))
      .filter((u): u is PublicProfileDto => u !== null);
  }

  /**
   * Extract safe fields from user object (removes sensitive data)
   * ✅ SECURE: Filters out passwords, tokens, etc.
   */
  extractSafeFields(user: any) {
    if (!user) return null;

    const {
      password,
      refreshToken,
      resetToken,
      verificationToken,
      resetTokenExpiry,
      verificationExpiry,
      __v,
      ...safe
    } = user;

    return safe;
  }

  /**
   * Check if user object has all required fields
   */
  validateUserObject(user: any): boolean {
    return user && user.id && user.username;
  }
}