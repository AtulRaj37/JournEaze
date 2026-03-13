import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateItineraryDayDto {
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsNumber()
  @IsNotEmpty()
  dayNumber!: number;
}

export class CreateItineraryActivityDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  locationName?: string;

  @IsNumber()
  @IsOptional()
  costEstimate?: number;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}

export class UpdateItineraryActivityDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  locationName?: string;

  @IsNumber()
  @IsOptional()
  costEstimate?: number;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}
