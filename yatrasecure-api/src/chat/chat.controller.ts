import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';

// ✅ SECURE: Validated DTO
export class SendMessageDto {
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content cannot be empty' })
  @MinLength(1, { message: 'Message must be at least 1 character' })
  @MaxLength(5000, { message: 'Message cannot exceed 5000 characters' })
  content: string;
}

@Controller('trips/:tripId/messages')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET TRIP MESSAGES - ✅ SECURE: Membership check, safe data
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Get all messages in a trip
   * @param req - Request object with authenticated user
   * @param tripId - Trip ID
   * @returns Messages in the trip with safe user data
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async listMessages(
    @Request() req: any,
    @Param('tripId') tripId: string,
  ) {
    // Extract user ID from JWT token
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // ✅ SECURITY: Verify user is a member of this trip
    await this.chatService.ensureIsMember(tripId, userId);

    // ✅ Returns safe message format (no sensitive sender data)
    return this.chatService.getMessages(tripId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SEND MESSAGE - ✅ SECURE: Membership check, validation, safe response
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Send a message to a trip
   * @param req - Request object with authenticated user
   * @param tripId - Trip ID
   * @param body - Message content
   * @returns Sent message with safe response data
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Request() req: any,
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
    body: SendMessageDto,
  ) {
    // Extract user info from JWT token
    const userId = req.user?.id || req.user?.sub;
    const username = req.user?.username;

    // Validate inputs
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    if (!tripId || tripId.trim().length === 0) {
      throw new NotFoundException('Trip not found');
    }

    if (!body.content || body.content.trim().length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    // ✅ SECURITY: Send message with membership verification
    return this.chatService.sendMessage(
      tripId,
      userId,
      username || 'Anonymous',
      body.content,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET MESSAGE COUNT - ✅ SECURE: Quick count
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Get total message count in a trip
   * @param req - Request object with authenticated user
   * @param tripId - Trip ID
   * @returns Message count
   */
  @Get('count')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMessageCount(
    @Request() req: any,
    @Param('tripId') tripId: string,
  ) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // ✅ SECURITY: Verify membership
    await this.chatService.ensureIsMember(tripId, userId);

    const count = await this.chatService.getMessageCount(tripId);
    return {
      tripId,
      messageCount: count,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SEARCH MESSAGES - ✅ SECURE: Full text search with membership check
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Search messages in a trip
   * @param req - Request object with authenticated user
   * @param tripId - Trip ID
   * @param query - Search query
   * @returns Matching messages
   */
  @Get('search')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async searchMessages(
    @Request() req: any,
    @Param('tripId') tripId: string,
    @Body('query') query: string,
  ) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query cannot be empty');
    }

    if (query.length > 100) {
      throw new BadRequestException('Search query too long (max 100 characters)');
    }

    // ✅ SECURITY: Verify membership before search
    return this.chatService.searchMessages(tripId, userId, query);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET MY MESSAGES - ✅ SECURE: Only current user's messages
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Get messages sent by current user in a trip
   * @param req - Request object with authenticated user
   * @param tripId - Trip ID
   * @returns User's messages
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyMessages(
    @Request() req: any,
    @Param('tripId') tripId: string,
  ) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    // ✅ SECURITY: Verify membership
    await this.chatService.ensureIsMember(tripId, userId);

    return this.chatService.getMessagesByUser(tripId, userId);
  }
}