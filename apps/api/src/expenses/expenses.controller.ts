import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, CreateSettlementDto } from './dto/expense.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@journeaze/database';

@UseGuards(JwtAuthGuard)
@Controller()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post('expenses')
  createExpense(@CurrentUser() user: User, @Body() dto: CreateExpenseDto) {
    return this.expensesService.createExpense(user.id, dto);
  }

  @Get('trips/:tripId/expenses')
  getExpensesByTrip(@Param('tripId') tripId: string, @CurrentUser() user: User) {
    return this.expensesService.getExpensesByTrip(tripId, user.id);
  }

  @Patch('expenses/:expenseId')
  updateExpense(
    @Param('expenseId') expenseId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.updateExpense(expenseId, user.id, dto);
  }

  @Delete('expenses/:expenseId')
  removeExpense(@Param('expenseId') expenseId: string, @CurrentUser() user: User) {
    return this.expensesService.removeExpense(expenseId, user.id);
  }

  @Post('settlements')
  createSettlement(@CurrentUser() user: User, @Body() dto: CreateSettlementDto) {
    return this.expensesService.createSettlement(user.id, dto);
  }

  @Get('trips/:tripId/settlements')
  getSettlementsByTrip(@Param('tripId') tripId: string, @CurrentUser() user: User) {
    return this.expensesService.getSettlementsByTrip(tripId, user.id);
  }
}
