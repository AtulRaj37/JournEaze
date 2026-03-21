import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GenerateItineraryDto } from './dto/ai.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@journeaze/database';

@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-itinerary')
  generateItinerary(@CurrentUser() user: User, @Body() dto: GenerateItineraryDto) {
    return this.aiService.generateItinerary(dto.tripId, user.id, dto.customPrompt);
  }

  @Post('packing-list')
  generatePackingList(@CurrentUser() user: User, @Body() dto: GenerateItineraryDto) {
    return this.aiService.generatePackingList(dto.tripId, user.id);
  }

  @Post('regenerate-day')
  regenerateDay(@CurrentUser() user: User, @Body() dto: { tripId: string, dayIdx: number, feedback?: string }) {
    if (dto.dayIdx === undefined) throw new Error('dayIdx is required');
    return this.aiService.regenerateDay(dto.tripId, user.id, dto.dayIdx, dto.feedback);
  }

  @Post('optimize-day')
  optimizeDay(@CurrentUser() user: User, @Body() dto: { tripId: string, dayIdx: number }) {
    if (dto.dayIdx === undefined) throw new Error('dayIdx is required');
    return this.aiService.optimizeDay(dto.tripId, user.id, dto.dayIdx);
  }

  @Post('travel-tips')
  generateTravelTips(@CurrentUser() user: User, @Body() dto: GenerateItineraryDto) {
    return this.aiService.generateTravelTips(dto.tripId, user.id);
  }

  @Get('destination-info')
  getDestinationInfo(@Query('destination') destination: string) {
    return this.aiService.generateDestinationInfo(destination || 'Unknown');
  }

  @Get('explore-places')
  getExplorePlaces(
    @Query('destination') destination: string,
    @Query('extraPlaces') extraPlaces?: string,
  ) {
    const extras = extraPlaces ? extraPlaces.split(',').map(p => p.trim()).filter(Boolean) : undefined;
    return this.aiService.generateExplorePlaces(destination || 'Unknown', extras);
  }

  @Post('chat')
  async chat(@CurrentUser() user: User, @Body() dto: { tripId: string, messages: any[] }) {
    if (!dto.tripId || !dto.messages || !Array.isArray(dto.messages)) {
      throw new Error('tripId and messages array are required');
    }
    return this.aiService.chatWithCopilot(dto.tripId, user.id, dto.messages);
  }
}
