import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateItineraryDto {
  @IsString()
  @IsNotEmpty()
  tripId!: string;
}

export class AiPromptDto {
  @IsString()
  @IsNotEmpty()
  tripId!: string;
}
