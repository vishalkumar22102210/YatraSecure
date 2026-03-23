import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { ExpensesService, Settlement } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  IsNumber,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

// ✅ SECURE: Validated DTOs
export class AddExpenseDto {
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Max(10000000, { message: 'Amount is too large' })
  amount: number;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(3, { message: 'Description must be at least 3 characters' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description: string;

  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  @MaxLength(50, { message: 'Category cannot exceed 50 characters' })
  category?: string;
}

export class NudgeUserDto {
  @IsString({ message: 'Recipient ID must be a string' })
  @IsNotEmpty({ message: 'Recipient ID is required' })
  toId: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Max(10000000, { message: 'Amount is too large' })
  amount: number;
}

@Controller('trips/:tripId/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // ADD EXPENSE - ✅ SECURE: Validation, membership check, safe response
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Add an expense to the trip
   * @param tripId - Trip ID
   * @param body - Expense details (amount, description, category)
   * @param req - Request with authenticated user
   * @returns Confirmation message
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addExpense(
    @Param('tripId') tripId: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )
    body: AddExpenseDto,
    @Request() req: any,
  ) {
    // Extract user ID from JWT token
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Validate tripId
    if (!tripId || tripId.trim().length === 0) {
      throw new BadRequestException('Invalid trip ID');
    }

    // ✅ SECURITY: Add expense with validation and membership check
    return this.expensesService.addExpense(
      tripId,
      userId,
      body.amount,
      body.description,
      body.category || 'other',
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET EXPENSES - ✅ SECURE: Safe user data only, no sensitive info
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Get all expenses in a trip
   * @param tripId - Trip ID
   * @param req - Request with authenticated user
   * @returns List of expenses with safe user data
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getExpenses(
    @Param('tripId') tripId: string,
    @Request() req: any,
  ) {
    // Extract user ID from JWT token
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Validate tripId
    if (!tripId || tripId.trim().length === 0) {
      throw new BadRequestException('Invalid trip ID');
    }

    // ✅ SECURITY: Membership check in service
    return this.expensesService.getExpenses(tripId, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET SETTLEMENT - ✅ SECURE: Calculate who owes whom
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Calculate settlement amounts (who owes whom)
   * @param tripId - Trip ID
   * @param req - Request with authenticated user
   * @returns Array of settlement transactions
   */
  @Get('settlement')
  @HttpCode(HttpStatus.OK)
  async getSettlement(
    @Param('tripId') tripId: string,
    @Request() req: any,
  ): Promise<Settlement[]> {
    // Extract user ID from JWT token
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Validate tripId
    if (!tripId || tripId.trim().length === 0) {
      throw new BadRequestException('Invalid trip ID');
    }

    // ✅ SECURITY: Membership check in service
    return this.expensesService.calculateSettlement(tripId, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // NUDGE USER - ✅ SECURE: Send payment reminder notification
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Send a payment nudge to another user
   * @param tripId - Trip ID
   * @param body - Recipient ID and amount
   * @param req - Request with authenticated user
   * @returns Notification confirmation
   */
  @Post('nudge')
  @HttpCode(HttpStatus.OK)
  async nudgeUser(
    @Param('tripId') tripId: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )
    body: NudgeUserDto,
    @Request() req: any,
  ) {
    // Extract user ID from JWT token
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // Validate tripId
    if (!tripId || tripId.trim().length === 0) {
      throw new BadRequestException('Invalid trip ID');
    }

    // Validate recipient
    if (!body.toId || body.toId.trim().length === 0) {
      throw new BadRequestException('Invalid recipient ID');
    }

    // Prevent self-nudge
    if (userId === body.toId) {
      throw new BadRequestException('Cannot send nudge to yourself');
    }

    // ✅ SECURITY: Send nudge with all validations
    return this.expensesService.nudgeUser(
      tripId,
      userId,
      body.toId,
      body.amount,
    );
  }
}