import { IsString, IsInt, IsArray, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(18, { message: 'Age must be at least 18' })
  @Max(100, { message: 'Age must not exceed 100' })
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  hometown?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  professionalStatus?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  travelStyle?: string[];

  @IsOptional()
  @IsString()
  budgetRange?: string;

  @IsOptional()
  @IsString()
  travelPersonality?: string;

  @IsOptional()
  @IsArray()
  emergencyContacts?: any[];
}
