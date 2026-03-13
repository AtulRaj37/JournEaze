import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TripGateway } from '../gateway/trip.gateway';
import { CreateExpenseDto, UpdateExpenseDto, CreateSettlementDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: TripGateway,
  ) {}

  private async checkMemberAccess(tripId: string, userId: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new ForbiddenException('Access denied');
    return member;
  }

  // --- EXPENSES ---

  async createExpense(userId: string, dto: CreateExpenseDto) {
    await this.checkMemberAccess(dto.tripId, userId);

    // If splits not provided, auto-split among all trip members
    let splitsData = dto.splits || [];
    if (splitsData.length === 0) {
      const members = await this.prisma.tripMember.findMany({ where: { tripId: dto.tripId } });
      const perPerson = dto.amount / members.length;
      splitsData = members.map(m => ({ userId: m.userId, amount: perPerson }));
    }

    const expense = await this.prisma.expense.create({
      data: {
        tripId: dto.tripId,
        payerId: userId,
        amount: dto.amount,
        description: dto.description || dto.title || 'Expense',
        category: dto.category as any,
        date: new Date(),
        splits: {
          create: splitsData.map((s) => ({
            userId: s.userId,
            amount: s.amount,
          })),
        },
      },
      include: { splits: true, payer: { select: { name: true } } },
    });

    // Real-time broadcast
    this.gateway.broadcastTripUpdate(dto.tripId, 'expensesUpdated', { action: 'CREATED', expense });

    return expense;
  }

  async getExpensesByTrip(tripId: string, userId: string) {
    await this.checkMemberAccess(tripId, userId);

    return this.prisma.expense.findMany({
      where: { tripId },
      include: {
        payer: { select: { id: true, name: true, image: true } },
        splits: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async updateExpense(expenseId: string, userId: string, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: { trip: true },
    });

    if (!expense) throw new NotFoundException('Expense not found');
    await this.checkMemberAccess(expense.tripId, userId);

    const updateData: any = {};
    if (dto.title) updateData.description = dto.title;
    if (dto.amount) updateData.amount = dto.amount;
    if (dto.category) updateData.category = dto.category as any;

    if (dto.splits) {
      // First delete old splits, then create new
      await this.prisma.expenseSplit.deleteMany({ where: { expenseId } });
      updateData.splits = {
        create: dto.splits.map((s) => ({
          userId: s.userId,
          amount: s.amount,
        })),
      };
    }

    const updatedExpense = await this.prisma.expense.update({
      where: { id: expenseId },
      data: updateData,
      include: { splits: true, payer: { select: { name: true } } },
    });

    // Real-time broadcast
    this.gateway.broadcastTripUpdate(expense.tripId, 'expensesUpdated', { action: 'UPDATED', expense: updatedExpense });

    return updatedExpense;
  }

  async removeExpense(expenseId: string, userId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) throw new NotFoundException('Expense not found');
    await this.checkMemberAccess(expense.tripId, userId);

    await this.prisma.expense.delete({ where: { id: expenseId } });

    // Real-time broadcast
    this.gateway.broadcastTripUpdate(expense.tripId, 'expensesUpdated', { action: 'DELETED', expenseId });

    return { success: true };
  }

  // --- SETTLEMENTS ---

  async createSettlement(userId: string, dto: CreateSettlementDto) {
    await this.checkMemberAccess(dto.tripId, userId);

    const settlement = await this.prisma.settlement.create({
      data: {
        tripId: dto.tripId,
        payerId: userId,
        receiverId: dto.payeeId,
        amount: dto.amount,
        date: new Date(),
        status: 'COMPLETED',
      },
    });

    this.gateway.broadcastTripUpdate(dto.tripId, 'settlementsUpdated', { action: 'CREATED', settlement });

    return settlement;
  }

  async getSettlementsByTrip(tripId: string, userId: string) {
    await this.checkMemberAccess(tripId, userId);

    return this.prisma.settlement.findMany({
      where: { tripId },
      include: {
        payer: { select: { name: true } },
        receiver: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }
}
