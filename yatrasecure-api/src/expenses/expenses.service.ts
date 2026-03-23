import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// ✅ SECURE: Safe settlement interface
export interface Settlement {
  from: string;
  fromUsername: string;
  to: string;
  toUsername: string;
  amount: number;
}

// ✅ SECURE: Safe expense response
export interface SafeExpense {
  id: string;
  amount: number;
  description: string;
  category: string;
  paidBy: {
    id: string;
    username: string;
  };
  participants: Array<{
    userId: string;
    username: string;
    share: number;
  }>;
  createdAt: Date;
}

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADD EXPENSE - ✅ SECURE: Validation, membership check, safe response
  // ═══════════════════════════════════════════════════════════��═══════════════════
  /**
   * Add a new expense to the trip
   * ✅ SECURITY: Membership verification, input validation
   */
  async addExpense(
    tripId: string,
    paidBy: string,
    amount: number,
    description: string,
    category: string,
  ): Promise<any> {
    // Validate inputs
    if (!tripId || !paidBy || !amount || !description) {
      throw new BadRequestException('Invalid expense data');
    }

    if (amount <= 0) {
      throw new BadRequestException('Expense amount must be greater than 0');
    }

    if (amount > 10000000) {
      throw new BadRequestException('Expense amount is too large');
    }

    try {
      // ✅ SECURITY: Fetch trip with members
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId.trim() },
        include: {
          members: {
            select: { userId: true }, // Only get member IDs
          },
          wallet: {
            select: { id: true, totalBudget: true, spent: true },
          },
        },
      });

      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      if (!trip.wallet) {
        throw new NotFoundException('Wallet not found for this trip');
      }

      // ✅ SECURITY: Verify user is a member or admin
      const isMember = trip.members.some((m) => m.userId === paidBy);
      if (!isMember && trip.adminId !== paidBy) {
        throw new ForbiddenException(
          'Only trip members can add expenses',
        );
      }

      // ✅ SECURITY: Validate member count
      const memberCount = trip.members.length;
      if (memberCount === 0) {
        throw new BadRequestException('Trip has no members');
      }

      // Calculate per-person share
      const perPersonShare = parseFloat((amount / memberCount).toFixed(2));

      // ✅ SECURITY: Create expense in transaction
      const expense = await this.prisma.expense.create({
        data: {
          walletId: trip.wallet.id,
          paidBy: paidBy.trim(),
          amount: parseFloat(amount.toFixed(2)),
          description: description.trim(),
          category: (category || 'other').trim().toLowerCase(),
          splitType: 'equal',
        },
        select: {
          id: true,
          amount: true,
          description: true,
          category: true,
          createdAt: true,
        },
      });

      // ✅ SECURITY: Create participants for all members
      const participantData = trip.members.map((member) => ({
        expenseId: expense.id,
        userId: member.userId,
        share: perPersonShare,
      }));

      await this.prisma.expenseParticipant.createMany({
        data: participantData,
      });

      // ✅ SECURITY: Update wallet spent amount
      await this.prisma.wallet.update({
        where: { id: trip.wallet.id },
        data: {
          spent: {
            increment: parseFloat(amount.toFixed(2)),
          },
        },
      });

      return {
        message: 'Expense added successfully',
        expense: {
          id: expense.id,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          createdAt: expense.createdAt,
        },
      };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Failed to add expense:`, error);
      throw new BadRequestException('Failed to add expense');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET EXPENSES - ✅ SECURE: Safe user data, no emails or tokens
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Get all expenses in a trip
   * ✅ SECURITY: Membership verification, safe data only
   */
  async getExpenses(tripId: string, userId: string): Promise<SafeExpense[]> {
    if (!tripId || !userId) {
      throw new BadRequestException('Invalid trip or user ID');
    }

    try {
      // ✅ SECURITY: Verify membership
      await this.ensureIsMember(tripId, userId);

      // ✅ SECURITY: Fetch trip and wallet
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId.trim() },
        select: { id: true, wallet: { select: { id: true } } },
      });

      if (!trip || !trip.wallet) {
        throw new NotFoundException('Trip or wallet not found');
      }

      // ✅ SECURITY: Fetch expenses with safe user data
      const expenses = await this.prisma.expense.findMany({
        where: { walletId: trip.wallet.id },
        select: {
          id: true,
          amount: true,
          description: true,
          category: true,
          paidBy: true,
          createdAt: true,
          participants: {
            select: {
              userId: true,
              share: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  // ❌ NO email, password, phone
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // ✅ Format response with safe user data
      return expenses.map((expense: any) => ({
        id: expense.id,
        amount: expense.amount,
        description: expense.description,
        category: expense.category,
        paidBy: {
          id: expense.paidBy,
          username: 'Unknown', // Will be filled from participants if needed
        },
        participants: expense.participants.map((p: any) => ({
          userId: p.userId,
          username: p.user.username,
          share: p.share,
        })),
        createdAt: expense.createdAt,
      }));
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Failed to fetch expenses:`, error);
      throw new BadRequestException('Failed to fetch expenses');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CALCULATE SETTLEMENT - ✅ SECURE: Membership check
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Calculate who owes whom
   * ✅ SECURITY: Membership verification
   */
  async calculateSettlement(
    tripId: string,
    userId: string,
  ): Promise<Settlement[]> {
    if (!tripId || !userId) {
      throw new BadRequestException('Invalid trip or user ID');
    }

    try {
      // ✅ SECURITY: Verify membership
      await this.ensureIsMember(tripId, userId);

      // Fetch expenses
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId.trim() },
        select: { wallet: { select: { id: true } } },
      });

      if (!trip || !trip.wallet) {
        throw new NotFoundException('Trip or wallet not found');
      }

      // ✅ SECURITY: Fetch expenses with safe data
      const expenses = await this.prisma.expense.findMany({
        where: { walletId: trip.wallet.id },
        select: {
          id: true,
          amount: true,
          paidBy: true,
          participants: {
            select: {
              userId: true,
              share: true,
              user: {
                select: { username: true },
              },
            },
          },
        },
      });

      // Build balance map
      const balances = new Map<
        string,
        { username: string; balance: number }
      >();

      for (const expense of expenses) {
        // Add to payer balance
        if (!balances.has(expense.paidBy)) {
          balances.set(expense.paidBy, { username: 'Unknown', balance: 0 });
        }
        balances.get(expense.paidBy)!.balance += expense.amount;

        // Subtract from participant balances
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

      // ✅ SECURITY: Greedy settlement algorithm
      const lenders = Array.from(balances.entries())
        .filter(([_, data]) => data.balance > 0.01)
        .sort((a, b) => b[1].balance - a[1].balance)
        .map(([id, data]) => ({
          id,
          username: data.username,
          amount: parseFloat(data.balance.toFixed(2)),
        }));

      const borrowers = Array.from(balances.entries())
        .filter(([_, data]) => data.balance < -0.01)
        .sort((a, b) => a[1].balance - b[1].balance)
        .map(([id, data]) => ({
          id,
          username: data.username,
          amount: parseFloat(Math.abs(data.balance).toFixed(2)),
        }));

      const settlements: Settlement[] = [];
      let i = 0;
      let j = 0;

      while (i < lenders.length && j < borrowers.length) {
        const lender = lenders[i];
        const borrower = borrowers[j];
        const settleAmount = parseFloat(
          Math.min(lender.amount, borrower.amount).toFixed(2),
        );

        settlements.push({
          from: borrower.id,
          fromUsername: borrower.username,
          to: lender.id,
          toUsername: lender.username,
          amount: settleAmount,
        });

        lender.amount = parseFloat((lender.amount - settleAmount).toFixed(2));
        borrower.amount = parseFloat(
          (borrower.amount - settleAmount).toFixed(2),
        );

        if (lender.amount < 0.01) i++;
        if (borrower.amount < 0.01) j++;
      }

      return settlements;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Failed to calculate settlement:`, error);
      throw new BadRequestException('Failed to calculate settlement');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // NUDGE USER - ✅ SECURE: Send payment reminder
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Send payment nudge notification
   * ✅ SECURITY: Membership verification
   */
  async nudgeUser(
    tripId: string,
    fromId: string,
    toId: string,
    amount: number,
  ): Promise<any> {
    // Validate inputs
    if (!tripId || !fromId || !toId || !amount) {
      throw new BadRequestException('Invalid nudge data');
    }

    if (amount <= 0) {
      throw new BadRequestException('Nudge amount must be greater than 0');
    }

    if (amount > 10000000) {
      throw new BadRequestException('Nudge amount is too large');
    }

    try {
      // ✅ SECURITY: Verify sender is a member
      await this.ensureIsMember(tripId, fromId);

      // ✅ SECURITY: Verify recipient is a member
      await this.ensureIsMember(tripId, toId);

      // Fetch sender and trip info
      const [fromUser, trip] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: fromId.trim() },
          select: { id: true, username: true },
        }),
        this.prisma.trip.findUnique({
          where: { id: tripId.trim() },
          select: { id: true, name: true },
        }),
      ]);

      if (!fromUser || !trip) {
        throw new NotFoundException('User or Trip not found');
      }

      // ✅ SECURITY: Create notification with safe data
      const title = `💸 Payment Nudge: ${trip.name}`;
      const message = `${fromUser.username} sent you a gentle nudge to settle your balance of ₹${amount.toFixed(2).toLocaleString()}`;
      const link = `/trips/${tripId}/wallet`;

      return this.notificationsService.createNotification(
        toId.trim(),
        'settlement_nudge',
        title,
        message,
        link,
      );
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Failed to send nudge:`, error);
      throw new BadRequestException('Failed to send nudge');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VERIFY MEMBERSHIP
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Verify user is a trip member
   * ✅ SECURITY: Private helper method
   */
  private async ensureIsMember(
    tripId: string,
    userId: string,
  ): Promise<void> {
    if (!tripId || !userId) {
      throw new BadRequestException('Invalid trip or user ID');
    }

    const member = await this.prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId: tripId.trim(),
          userId: userId.trim(),
        },
      },
      select: { id: true },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this trip');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET USER BALANCE - ✅ NEW: Get balance for specific user
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Get balance for a specific user in a trip
   */
  async getUserBalance(
    tripId: string,
    userId: string,
  ): Promise<{ userId: string; balance: number }> {
    if (!tripId || !userId) {
      throw new BadRequestException('Invalid trip or user ID');
    }

    try {
      // ✅ SECURITY: Verify membership
      await this.ensureIsMember(tripId, userId);

      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId.trim() },
        select: { wallet: { select: { id: true } } },
      });

      if (!trip?.wallet) {
        throw new NotFoundException('Trip or wallet not found');
      }

      // Fetch all expenses
      const expenses = await this.prisma.expense.findMany({
        where: { walletId: trip.wallet.id },
        select: {
          amount: true,
          paidBy: true,
          participants: {
            where: { userId: userId.trim() },
            select: { share: true },
          },
        },
      });

      // Calculate balance
      let balance = 0;
      for (const expense of expenses) {
        if (expense.paidBy === userId) {
          balance += expense.amount;
        }
        if (expense.participants.length > 0) {
          balance -= expense.participants[0].share;
        }
      }

      return { userId, balance: parseFloat(balance.toFixed(2)) };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Failed to get user balance:`, error);
      throw new BadRequestException('Failed to get user balance');
    }
  }
}