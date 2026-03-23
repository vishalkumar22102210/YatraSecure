/**
 * Safe User DTOs - These control what data gets exposed in API responses
 */

// Full user profile (for own user)
export class SafeUserDto {
  id: string;
  username: string;
  email: string;
  profileImage?: string | null;
  bio?: string | null;
  age?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  travelStyle?: string[];
  budgetRange?: string | null;
  travelPersonality?: string | null;
  reputationScore?: number;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Minimal user (for lists, suggestions)
export class MinimalUserDto {
  id: string;
  username: string;
  profileImage?: string | null;
  reputationScore?: number;
  isVerified?: boolean;
  travelPersonality?: string | null;
}

// Public profile (what others see)
export class PublicProfileDto {
  id: string;
  username: string;
  profileImage?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  travelStyle?: string[];
  travelPersonality?: string | null;
  reputationScore?: number;
  isVerified?: boolean;
  createdAt?: Date;
  // ❌ NO email
  // ❌ NO sensitive fields
}

// User with follow info
export class UserWithFollowDto extends PublicProfileDto {
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
  tripCount?: number;
}