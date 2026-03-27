import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto, UpdateTripDto, InviteMemberDto, UpdateMemberDto } from './dto/trip.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@journeaze/database';

@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  // --- PUBLIC JOIN ROUTES (auth required, but no membership check) ---

  @Get(':id/preview')
  getPreview(@Param('id') id: string) {
    return this.tripsService.getPreview(id);
  }

  @Post(':id/join')
  joinTrip(@Param('id') tripId: string, @CurrentUser() user: User) {
    return this.tripsService.joinByLink(tripId, user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() createTripDto: CreateTripDto) {
    return this.tripsService.create(user.id, createTripDto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.tripsService.findAllForUser(user.id);
  }

  @Get('public')
  getPublicTrips() {
    return this.tripsService.getPublicTrips();
  }

  @Post(':id/fork')
  forkTrip(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tripsService.forkTrip(id, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tripsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateTripDto: UpdateTripDto,
  ) {
    return this.tripsService.update(id, user.id, updateTripDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tripsService.remove(id, user.id);
  }

  // --- TRIP MEMBERSHIP ROUTES ---

  @Post(':id/invite')
  inviteMember(
    @Param('id') tripId: string,
    @CurrentUser() user: User,
    @Body() inviteDto: InviteMemberDto,
  ) {
    return this.tripsService.inviteMember(tripId, user.id, inviteDto);
  }

  @Get(':id/members')
  getMembers(@Param('id') tripId: string, @CurrentUser() user: User) {
    return this.tripsService.getMembers(tripId, user.id);
  }

  @Patch(':id/member/:memberUserId')
  updateMemberRole(
    @Param('id') tripId: string,
    @Param('memberUserId') memberUserId: string,
    @CurrentUser() user: User,
    @Body() updateDto: UpdateMemberDto,
  ) {
    return this.tripsService.updateMemberRole(tripId, user.id, memberUserId, updateDto);
  }

  @Delete(':id/member/:memberUserId')
  removeMember(
    @Param('id') tripId: string,
    @Param('memberUserId') memberUserId: string,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.removeMember(tripId, user.id, memberUserId);
  }
}
