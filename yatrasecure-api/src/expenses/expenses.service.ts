import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface Settlement {
  from: string;
  fromUsername: string;
  to: string;
  toUsername: string;
  amount: number;
}

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async addExpense(
    tripId: string,
    paidBy: string,
    amount: number,
    description: string,
    category: string,
  ) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: true,
        wallet: true,
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (!trip.wallet) {
      throw new NotFoundException('Wallet not found for this trip');
    }

    const isMember = trip.members.some((m) => m.userId === paidBy);
    if (!isMember && trip.adminId !== paidBy) {
      throw new ForbiddenException('Only trip members can add expenses');
    }

    const memberCount = trip.members.length;
    const perPersonShare = amount / memberCount;

    const expense = await this.prisma.expense.create({
      data: {
        walletId: trip.wallet.id,
        paidBy,
        amount,
        description,
        category,
        splitType: 'equal',
      },
    });

    const participantData = trip.members.map((member) => ({
      expenseId: expense.id,
      userId: member.userId,
      share: perPersonShare,
    }));

    await this.prisma.expenseParticipant.createMany({
      data: participantData,
    });

    await this.prisma.wallet.update({
      where: { id: trip.wallet.id },
      data: {
        spent: {
          increment: amount,
        },
      },
    });

    return {
      message: 'Expense added successfully',
      expense,
    };
  }

  async getExpenses(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { wallet: true },
    });

    if (!trip || !trip.wallet) {
      throw new NotFoundException('Trip or wallet not found');
    }

    return this.prisma.expense.findMany({
      where: { walletId: trip.wallet.id },
      include: {
        paidByUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async calculateSettlement(tripId: string): Promise<Settlement[]> {
    const expenses = await this.getExpenses(tripId);

    const balances = new Map<string, { username: string; balance: number }>();

    for (const expense of expenses) {
      const payer = expense.paidByUser;
      if (!balances.has(payer.id)) {
        balances.set(payer.id, { username: payer.username, balance: 0 });
      }
      balances.get(payer.id)!.balance += expense.amount;

      for (const participant of expense.participants) {
        if (!balances.has(participant.userId)) {
          balances.set(participant.userId, {
            username: participant.user.username,
            balance: 0,
          });
        }
        balances.get(participant.userId)!.balance -= participant.share;
      }
    }

    const lendersCopy = Array.from(balances.entries())
      .filter(([_, data]) => data.balance > 0.01)
      .sort((a, b) => b[1].balance - a[1].balance)
      .map(([id, data]) => ({ id, username: data.username, amount: data.balance }));

    const borrowersCopy = Array.from(balances.entries())
      .filter(([_, data]) => data.balance < -0.01)
      .sort((a, b) => a[1].balance - b[1].balance)
      .map(([id, data]) => ({ id, username: data.username, amount: Math.abs(data.balance) }));

    const settlements: Settlement[] = [];
    let i = 0;
    let j = 0;

    while (i < lendersCopy.length && j < borrowersCopy.length) {
      const lender = lendersCopy[i];
      const borrower = borrowersCopy[j];
      const settleAmount = Math.min(lender.amount, borrower.amount);

      settlements.push({
        from: borrower.id,
        fromUsername: borrower.username,
        to: lender.id,
        toUsername: lender.username,
        amount: parseFloat(settleAmount.toFixed(2)),
      });

      lender.amount -= settleAmount;
      borrower.amount -= settleAmount;

      if (lender.amount < 0.01) i++;
      if (borrower.amount < 0.01) j++;
    }

    return settlements;
  }

  async nudgeUser(tripId: string, fromId: string, toId: string, amount: number) {
    const fromUser = await this.prisma.user.findUnique({ where: { id: fromId } });
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });

    if (!fromUser || !trip) throw new NotFoundException('User or Trip not found');

    const title = `💸 Payment Nudge: ${trip.name}`;
    const message = `${fromUser.username} sent you a gentle nudge to settle your balance of ₹${amount.toLocaleString()}.`;
    const link = `/trips/${tripId}/wallet`;

    return this.notificationsService.createNotification(
      toId,
      'settlement_nudge',
      title,
      message,
      link,
    );
  }
}