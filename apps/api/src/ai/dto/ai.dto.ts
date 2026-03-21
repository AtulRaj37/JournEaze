import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateItineraryDto {
  @IsString()
  @IsNotEmpty()
  tripId!: string;

  @IsString()
  @IsOptional()
  customPrompt?: string;
}

export class AiPromptDto {
  @IsString()
  @IsNotEmpty()
  tripId!: string;
}
