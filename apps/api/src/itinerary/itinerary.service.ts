import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItineraryDayDto, CreateItineraryActivityDto, UpdateItineraryActivityDto } from './dto/itinerary.dto';

@Injectable()
export class ItineraryService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkEditorAccess(tripId: string, userId: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member || (member.role !== 'ADMIN' && member.role !== 'EDITOR')) {
      throw new ForbiddenException('Only admins and editors can modify the itinerary');
    }
    return member;
  }

  // --- ITINERARY DAY METHODS ---

  async createDay(tripId: string, userId: string, dto: CreateItineraryDayDto) {
    await this.checkEditorAccess(tripId, userId);

    return this.prisma.itineraryDay.create({
      data: {
        tripId,
        date: new Date(dto.date),
        dayNumber: dto.dayNumber,
      },
      include: { activities: true },
    });
  }

  async getItinerary(tripId: string, userId: string) {
    // Viewer access check
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('Access denied');

    return this.prisma.itineraryDay.findMany({
      where: { tripId },
      include: {
        activities: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { dayNumber: 'asc' },
    });
  }

  // --- ITINERARY ACTIVITY METHODS ---

  async createActivity(dayId: string, userId: string, dto: CreateItineraryActivityDto) {
    const day = await this.prisma.itineraryDay.findUnique({
      where: { id: dayId },
      include: { trip: true },
    });
    if (!day) throw new NotFoundException('Itinerary day not found');

    await this.checkEditorAccess(day.tripId, userId);

    // Calculate next orderIndex if not provided
    let nextOrderIndex = dto.orderIndex;
    if (nextOrderIndex === undefined) {
      const lastActivity = await this.prisma.itineraryActivity.findFirst({
        where: { dayId },
        orderBy: { orderIndex: 'desc' },
      });
      nextOrderIndex = lastActivity ? lastActivity.orderIndex + 1 : 0;
    }

    const activityData: any = {
      dayId,
      title: dto.title,
      description: dto.description,
      latitude: dto.latitude,
      longitude: dto.longitude,
      locationName: dto.locationName,
      costEstimate: dto.costEstimate,
      orderIndex: nextOrderIndex,
      createdById: userId,
    };

    if (dto.startTime) activityData.startTime = new Date(dto.startTime);
    if (dto.endTime) activityData.endTime = new Date(dto.endTime);

    return this.prisma.itineraryActivity.create({
      data: activityData,
    });
  }

  async updateActivity(activityId: string, userId: string, dto: UpdateItineraryActivityDto) {
    const activity = await this.prisma.itineraryActivity.findUnique({
      where: { id: activityId },
      include: { day: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    await this.checkEditorAccess(activity.day.tripId, userId);

    const updateData: any = { ...dto };
    if (dto.startTime) updateData.startTime = new Date(dto.startTime);
    if (dto.endTime) updateData.endTime = new Date(dto.endTime);

    return this.prisma.itineraryActivity.update({
      where: { id: activityId },
      data: updateData,
    });
  }

  async removeActivity(activityId: string, userId: string) {
    const activity = await this.prisma.itineraryActivity.findUnique({
      where: { id: activityId },
      include: { day: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    await this.checkEditorAccess(activity.day.tripId, userId);

    await this.prisma.itineraryActivity.delete({
      where: { id: activityId },
    });

    return { success: true, message: 'Activity deleted' };
  }
}
