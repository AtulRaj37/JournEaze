import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ItineraryService } from './itinerary.service';
import { CreateItineraryDayDto, CreateItineraryActivityDto, UpdateItineraryActivityDto } from './dto/itinerary.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@journeaze/database';

@UseGuards(JwtAuthGuard)
@Controller()
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Post('trips/:tripId/itinerary/day')
  createDay(
    @Param('tripId') tripId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateItineraryDayDto,
  ) {
    return this.itineraryService.createDay(tripId, user.id, dto);
  }

  @Get('trips/:tripId/itinerary')
  getItinerary(
    @Param('tripId') tripId: string,
    @CurrentUser() user: User,
  ) {
    return this.itineraryService.getItinerary(tripId, user.id);
  }

  @Post('itinerary/day/:dayId/activity')
  createActivity(
    @Param('dayId') dayId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateItineraryActivityDto,
  ) {
    return this.itineraryService.createActivity(dayId, user.id, dto);
  }

  @Patch('activity/:activityId')
  updateActivity(
    @Param('activityId') activityId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateItineraryActivityDto,
  ) {
    return this.itineraryService.updateActivity(activityId, user.id, dto);
  }

  @Delete('activity/:activityId')
  removeActivity(
    @Param('activityId') activityId: string,
    @CurrentUser() user: User,
  ) {
    return this.itineraryService.removeActivity(activityId, user.id);
  }
}
