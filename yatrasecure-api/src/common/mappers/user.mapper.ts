import { Injectable } from '@nestjs/common';
import { SafeUserDto, MinimalUserDto, PublicProfileDto, UserWithFollowDto } from '../dtos/user-response.dto';

@Injectable()
export class UserMapperService {
  /**
   * Map full user to safe DTO (for own profile)
   */
  toSafeUserDto(user: any): SafeUserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      bio: user.bio,
      age: user.age,
      city: user.city,
      state: user.state,
      country: user.country,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      travelStyle: user.travelStyle,
      budgetRange: user.budgetRange,
      travelPersonality: user.travelPersonality,
      reputationScore: user.reputationScore,
      isVerified: user.isVerified,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Map user to minimal DTO (for lists, suggestions)
   */
  toMinimalUserDto(user: any): MinimalUserDto {
    return {
      id: user.id,
      username: user.username,
      profileImage: user.profileImage,
      reputationScore: user.reputationScore,
      isVerified: user.isVerified,
      travelPersonality: user.travelPersonality,
    };
  }

  /**
   * Map user to public profile DTO (what others see)
   */
  toPublicProfileDto(user: any): PublicProfileDto {
    return {
      id: user.id,
      username: user.username,
      profileImage: user.profileImage,
      bio: user.bio,
      city: user.city,
      state: user.state,
      country: user.country,
      travelStyle: user.travelStyle,
      travelPersonality: user.travelPersonality,
      reputationScore: user.reputationScore,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }

  /**
   * Map user with follow info
   */
  toUserWithFollowDto(user: any, isFollowing?: boolean, counts?: any): UserWithFollowDto {
    return {
      ...this.toPublicProfileDto(user),
      isFollowing: isFollowing || false,
      followerCount: counts?.followers || 0,
      followingCount: counts?.following || 0,
      tripCount: counts?.trips || 0,
    };
  }

  /**
   * Map array of users
   */
  toMinimalUserDtoArray(users: any[]): MinimalUserDto[] {
    return users.map(u => this.toMinimalUserDto(u));
  }

  toPublicProfileDtoArray(users: any[]): PublicProfileDto[] {
    return users.map(u => this.toPublicProfileDto(u));
  }
}