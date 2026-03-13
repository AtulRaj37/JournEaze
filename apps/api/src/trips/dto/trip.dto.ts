import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsEnum } from 'class-validator';

enum TravelType {
  SOLO = 'SOLO',
  COUPLE = 'COUPLE',
  FRIENDS = 'FRIENDS',
  FAMILY = 'FAMILY',
}

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  destination!: string;

  @IsString()
  @IsOptional()
  destinationCity?: string;

  @IsString()
  @IsOptional()
  destinationCountry?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsEnum(TravelType)
  @IsOptional()
  travelType?: TravelType;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;
}

export class UpdateTripDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  destination?: string;

  @IsString()
  @IsOptional()
  destinationCity?: string;

  @IsString()
  @IsOptional()
  destinationCountry?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(TravelType)
  @IsOptional()
  travelType?: TravelType;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;
}

export class InviteMemberDto {
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  role?: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

export class UpdateMemberDto {
  @IsString()
  @IsNotEmpty()
  role!: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

