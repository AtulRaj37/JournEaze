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
    return this.aiService.generateItinerary(dto.tripId, user.id);
  }

  @Post('packing-list')
  generatePackingList(@CurrentUser() user: User, @Body() dto: GenerateItineraryDto) {
    return this.aiService.generatePackingList(dto.tripId, user.id);
  }

  @Post('travel-tips')
  generateTravelTips(@CurrentUser() user: User, @Body() dto: GenerateItineraryDto) {
    return this.aiService.generateTravelTips(dto.tripId, user.id);
  }

  @Get('destination-overview')
  getDestinationOverview(@Query('destination') destination: string) {
    return this.aiService.generateDestinationOverview(destination || 'Unknown');
  }

  @Get('destination-highlights')
  getDestinationHighlights(@Query('destination') destination: string) {
    return this.aiService.generateDestinationHighlights(destination || 'Unknown');
  }
}
