import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto, UpdateTripDto } from './dto/trip.dto';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTripDto) {
    const trip = await this.prisma.trip.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        creatorId: userId,
        members: {
          create: {
            userId: userId,
            role: 'ADMIN',
          },
        },
        activityLogs: {
          create: {
            userId: userId,
            action: 'CREATED_TRIP',
            details: JSON.stringify({ title: dto.title, destination: dto.destination }),
          },
        },
      },
    });
    return trip;
  }

  async findAllForUser(userId: string) {
    return this.prisma.trip.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        _count: { select: { members: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, image: true, email: true } } },
        },
        days: { include: { activities: true }, orderBy: { dayNumber: 'asc' } },
        expenses: { include: { payer: { select: { name: true } }, splits: true }, orderBy: { date: 'desc' } },
        notes: { include: { user: { select: { id: true, name: true, image: true } } }, orderBy: { createdAt: 'desc' } },
        _count: { select: { members: true } },
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    const isMember = trip.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('You do not have access to this trip');

    return trip;
  }

  async update(tripId: string, userId: string, dto: UpdateTripDto) {
    // 1. Check access and role
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });

    if (!member) throw new ForbiddenException('Access denied');
    if (member.role === 'VIEWER') throw new ForbiddenException('Only editors and admins can update trips');

    const updateData: any = { ...dto };
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        ...updateData,
        activityLogs: {
          create: {
            userId,
            action: 'UPDATED_TRIP',
            details: JSON.stringify(dto),
          },
        },
      },
    });

    return updatedTrip;
  }

  async remove(tripId: string, userId: string) {
    // Only ADMIN can delete
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });

    if (!member || member.role !== 'ADMIN') {
      throw new ForbiddenException('Only trip admins can delete the trip');
    }

    await this.prisma.trip.delete({ where: { id: tripId } });
    return { success: true, message: 'Trip deleted successfully' };
  }

  // --- TRIP MEMBERSHIP LOGIC ---

  async inviteMember(tripId: string, adminUserId: string, dto: any) {
    // 1. Verify admin executing the request
    const adminMember = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: adminUserId } },
    });

    if (!adminMember || adminMember.role !== 'ADMIN') {
      throw new ForbiddenException('Only trip admins can invite members');
    }

    // 2. Find the user being invited
    const userToInvite = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!userToInvite) {
      throw new NotFoundException('User with that email not found');
    }

    // 3. Prevent duplicate invites
    const existingMember = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: userToInvite.id } },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this trip');
    }

    // 4. Create Member, Notification, and ActivityLog
    const [newMember] = await this.prisma.$transaction([
      this.prisma.tripMember.create({
        data: {
          tripId,
          userId: userToInvite.id,
          role: dto.role || 'EDITOR',
        },
      }),
      this.prisma.notification.create({
        data: {
          userId: userToInvite.id,
          title: 'New Trip Invitation',
          body: `You have been invited to join a trip.`,
          type: 'INVITE',
          link: `/trip/${tripId}`,
        },
      }),
      this.prisma.activityLog.create({
        data: {
          tripId,
          userId: adminUserId,
          action: 'INVITED_MEMBER',
          details: JSON.stringify({ invitedUserId: userToInvite.id, role: dto.role || 'EDITOR' }),
        },
      }),
    ]);

    return newMember;
  }

  async getMembers(tripId: string, userId: string) {
    const isMember = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });

    if (!isMember) throw new ForbiddenException('Access denied');

    return this.prisma.tripMember.findMany({
      where: { tripId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });
  }

  async updateMemberRole(tripId: string, adminUserId: string, memberUserId: string, dto: any) {
    const adminMember = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: adminUserId } },
    });

    if (!adminMember || adminMember.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update roles');
    }

    return this.prisma.tripMember.update({
      where: { tripId_userId: { tripId, userId: memberUserId } },
      data: { role: dto.role },
    });
  }

  async removeMember(tripId: string, adminUserId: string, memberUserId: string) {
    const adminMember = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: adminUserId } },
    });

    if (!adminMember || adminMember.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can remove members');
    }

    if (adminUserId === memberUserId) {
      throw new ForbiddenException('Admins cannot remove themselves. Delete trip instead.');
    }

    await this.prisma.tripMember.delete({
      where: { tripId_userId: { tripId, userId: memberUserId } },
    });

    // Log action
    await this.prisma.activityLog.create({
      data: {
        tripId,
        userId: adminUserId,
        action: 'REMOVED_MEMBER',
        details: JSON.stringify({ removedUserId: memberUserId }),
      },
    });

    return { success: true, message: 'Member removed successfully' };
  }
}
