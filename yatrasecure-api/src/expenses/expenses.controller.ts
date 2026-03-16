import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ExpensesService, Settlement } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trips/:tripId/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  async addExpense(
    @Param('tripId') tripId: string,
    @Body() body: { amount: number; description: string; category?: string },
    @Req() req: any,
  ) {
    return this.expensesService.addExpense(
      tripId,
      req.user.id ?? req.user.sub,
      body.amount,
      body.description,
      body.category || 'other',
    );
  }

  @Get()
  async getExpenses(@Param('tripId') tripId: string) {
    return this.expensesService.getExpenses(tripId);
  }

  @Get('settlement')
  async getSettlement(@Param('tripId') tripId: string): Promise<Settlement[]> {
    return this.expensesService.calculateSettlement(tripId);
  }

  @Post('nudge')
  async nudgeUser(
    @Param('tripId') tripId: string,
    @Body() body: { toId: string; amount: number },
    @Req() req: any,
  ) {
    return this.expensesService.nudgeUser(
      tripId,
      req.user.id ?? req.user.sub,
      body.toId,
      body.amount,
    );
  }
}