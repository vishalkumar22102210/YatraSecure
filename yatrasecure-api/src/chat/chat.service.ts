import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { PrismaService } from '../prisma/prisma.service';

// ✅ SECURE: Safe message response interface
export interface SafeMessage {
  id: string;
  sender: {
    id: string;
    username: string;
  };
  content: string;
  type: string;
  sentAt: Date;
}

// ✅ SECURE: Messages response interface
export interface MessagesResponse {
  tripId: string;
  count: number;
  data: SafeMessage[];
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly prisma: PrismaService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // VERIFY MEMBERSHIP - ✅ SECURE: Private helper
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Verify user is a member of the trip
   * ✅ SECURE: Throws ForbiddenException if not member
   */
  async ensureIsMember(tripId: string, userId: string): Promise<void> {
    // Validate inputs
    if (!tripId || !userId) {
      throw new BadRequestException('Invalid trip or user ID');
    }

    try {
      const member = await this.prisma.tripMember.findUnique({
        where: {
          tripId_userId: {
            tripId: tripId.trim(),
            userId: userId.trim(),
          },
        },
        select: { id: true }, // Only check existence
      });

      if (!member) {
        throw new ForbiddenException('You are not a member of this trip');
      }
    } catch (error: any) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error checking membership:`, error);
      throw new BadRequestException('Failed to verify membership');
    }
  }

  // ═══════════════════════════════════════════════════════��═══════════════════════
  // GET MESSAGES - ✅ SECURE: Safe data only
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Get all messages in a trip
   * ✅ SECURE: Returns safe message format with minimal user data
   */
  async getMessages(tripId: string): Promise<MessagesResponse> {
    // Validate trip ID
    if (!tripId || tripId.trim().length === 0) {
      throw new NotFoundException('Trip not found');
    }

    try {
      const messages = await this.messageModel
        .find({ tripId: tripId.trim() })
        .select({
          _id: 1,
          tripId: 1,
          userId: 1,
          username: 1,
          content: 1,
          type: 1,
          createdAt: 1,
          // ❌ NO password, token, or sensitive fields
        })
        .sort({ createdAt: 1 })
        .limit(200)
        .lean() // Use lean() for better performance
        .exec();

      // ✅ Format response - safe data only
      return {
        tripId: tripId.trim(),
        count: messages.length,
        data: messages.map((m: any) => ({
          id: m._id.toString(),
          sender: {
            id: m.userId,
            username: m.username,
            // ❌ NO email, phone, or sensitive data
          },
          content: m.content,
          type: m.type || 'text',
          sentAt: m.createdAt || new Date(),
        })),
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch messages for trip ${tripId}:`, error);
      throw new BadRequestException('Failed to fetch messages');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SEND MESSAGE - ✅ SECURE: Membership check, validation
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Send a user message to trip chat
   * ✅ SECURE: Verifies membership, validates input, returns safe response
   */
  async sendMessage(
    tripId: string,
    userId: string,
    username: string,
    content: string,
  ): Promise<SafeMessage & { message?: string }> {
    // Validate inputs
    if (!tripId || !userId || !content) {
      throw new BadRequestException('Invalid message data');
    }

    const trimmedContent = content.trim();

    // Validate content
    if (trimmedContent.length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    if (trimmedContent.length > 5000) {
      throw new BadRequestException(
        'Message exceeds maximum length (5000 characters)',
      );
    }

    try {
      // ✅ SECURITY: Verify membership before saving
      await this.ensureIsMember(tripId, userId);

      // ✅ Create and save message with proper typing
      const messageData = {
        tripId: tripId.trim(),
        userId: userId.trim(),
        username: username ? username.trim() : 'Anonymous',
        content: trimmedContent,
        type: 'text',
        createdAt: new Date(),
      };

      const message = new this.messageModel(messageData);
      const saved = await message.save();

      // ✅ Convert to plain object and handle null
      const savedObj = saved.toObject ? saved.toObject() : (saved as any);

      return {
        id: saved._id.toString(),
        sender: {
          id: saved.userId,
          username: saved.username,
        },
        content: saved.content,
        type: saved.type,
        sentAt: savedObj?.createdAt || new Date(),
        message: 'Message sent successfully',
      };
    } catch (error: any) {
      if (
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Failed to send message in trip ${tripId}:`, error);
      throw new BadRequestException('Failed to send message');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SAVE SYSTEM MESSAGE - ✅ NO membership check (internal operation)
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Save system or AI-generated message
   * ✅ SECURE: No membership check needed (internal operation)
   */
  async saveSystemMessage(
    tripId: string,
    userId: string,
    username: string,
    content: string,
  ): Promise<SafeMessage> {
    // Validate inputs
    if (!tripId || !content) {
      throw new BadRequestException('Invalid system message data');
    }

    const trimmedContent = content.trim();

    // Validate content
    if (trimmedContent.length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    if (trimmedContent.length > 5000) {
      throw new BadRequestException(
        'Message exceeds maximum length (5000 characters)',
      );
    }

    try {
      const messageData = {
        tripId: tripId.trim(),
        userId: userId ? userId.trim() : 'system',
        username: username || 'YatraSecure AI',
        content: trimmedContent,
        type: 'ai',
        createdAt: new Date(),
      };

      const message = new this.messageModel(messageData);
      const saved = await message.save();

      // ✅ Convert to plain object and handle null
      const savedObj = saved.toObject ? saved.toObject() : (saved as any);

      return {
        id: saved._id.toString(),
        sender: {
          id: saved.userId,
          username: saved.username,
        },
        content: saved.content,
        type: saved.type,
        sentAt: savedObj?.createdAt || new Date(),
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to save system message in trip ${tripId}:`,
        error,
      );
      throw new BadRequestException('Failed to save system message');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET MESSAGE COUNT - ✅ SECURE: Returns only count
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Get count of messages in a trip
   * ✅ SECURE: Returns only count
   */
  async getMessageCount(tripId: string): Promise<number> {
    // Validate trip ID
    if (!tripId || tripId.trim().length === 0) {
      throw new BadRequestException('Invalid trip ID');
    }

    try {
      const count = await this.messageModel.countDocuments({
        tripId: tripId.trim(),
      });
      return count;
    } catch (error: any) {
      this.logger.error(`Failed to get message count:`, error);
      throw new BadRequestException('Failed to get message count');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET MESSAGES BY USER - ✅ SECURE: Only user's messages
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Get messages sent by a specific user in a trip
   * ✅ SECURE: Returns safe data only
   */
  async getMessagesByUser(
    tripId: string,
    userId: string,
  ): Promise<any> {
    // Validate inputs
    if (!tripId || !userId) {
      throw new BadRequestException('Invalid trip or user ID');
    }

    try {
      const messages = await this.messageModel
        .find({
          tripId: tripId.trim(),
          userId: userId.trim(),
          type: 'text', // Only user messages, not AI
        })
        .select({
          _id: 1,
          content: 1,
          createdAt: 1,
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
        .exec();

      return {
        userId: userId.trim(),
        tripId: tripId.trim(),
        count: messages.length,
        data: messages.map((m: any) => ({
          id: m._id.toString(),
          content: m.content,
          sentAt: m.createdAt || new Date(),
        })),
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch user messages:`, error);
      throw new BadRequestException('Failed to fetch messages');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SEARCH MESSAGES - ✅ SECURE: Full text search with membership check
  // ═════════════════════════════════════════════════════════════════════��═════════
  /**
   * Search messages in a trip by keyword
   * ✅ SECURE: Full text search, membership verified
   */
  async searchMessages(
    tripId: string,
    userId: string,
    query: string,
  ): Promise<any> {
    // Validate inputs
    if (!tripId || !query) {
      throw new BadRequestException('Invalid trip or search query');
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      throw new BadRequestException('Search query cannot be empty');
    }

    if (trimmedQuery.length > 100) {
      throw new BadRequestException('Search query too long');
    }

    try {
      // ✅ Verify membership before search
      await this.ensureIsMember(tripId, userId);

      const messages = await this.messageModel
        .find({
          tripId: tripId.trim(),
          content: { $regex: trimmedQuery, $options: 'i' }, // Case-insensitive regex
        })
        .select({
          _id: 1,
          userId: 1,
          username: 1,
          content: 1,
          createdAt: 1,
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
        .exec();

      return {
        query: trimmedQuery,
        count: messages.length,
        data: messages.map((m: any) => ({
          id: m._id.toString(),
          sender: {
            id: m.userId,
            username: m.username,
          },
          content: m.content,
          sentAt: m.createdAt || new Date(),
        })),
      };
    } catch (error: any) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to search messages:`, error);
      throw new BadRequestException('Failed to search messages');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DELETE MESSAGE - ✅ NEW: Delete user's own message
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Delete a user's own message (not older than 1 hour)
   * ✅ SECURE: Only message owner can delete
   */
  async deleteMessage(
    messageId: string,
    userId: string,
    tripId: string,
  ): Promise<any> {
    if (!messageId || !userId || !tripId) {
      throw new BadRequestException('Invalid message, user, or trip ID');
    }

    try {
      // ✅ Verify membership first
      await this.ensureIsMember(tripId, userId);

      const message = await this.messageModel.findById(messageId);

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // ✅ Verify ownership
      if (message.userId !== userId) {
        throw new ForbiddenException('You can only delete your own messages');
      }

      // ✅ Verify trip match
      if (message.tripId !== tripId) {
        throw new ForbiddenException('Message does not belong to this trip');
      }

      // ✅ Check if message is older than 1 hour
      const messageObj = message.toObject ? message.toObject() : (message as any);
      const createdTime = messageObj?.createdAt || message.createdAt;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      if (createdTime < oneHourAgo) {
        throw new BadRequestException(
          'Messages can only be deleted within 1 hour',
        );
      }

      await this.messageModel.findByIdAndDelete(messageId);

      return { message: 'Message deleted successfully' };
    } catch (error: any) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Failed to delete message ${messageId}:`, error);
      throw new BadRequestException('Failed to delete message');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // UPDATE MESSAGE - ✅ NEW: Edit user's own message
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Update a user's own message (not older than 15 minutes)
   * ✅ SECURE: Only message owner can edit
   */
  async updateMessage(
    messageId: string,
    userId: string,
    tripId: string,
    newContent: string,
  ): Promise<SafeMessage> {
    if (!messageId || !userId || !tripId || !newContent) {
      throw new BadRequestException('Invalid message or content data');
    }

    const trimmedContent = newContent.trim();

    if (trimmedContent.length === 0) {
      throw new BadRequestException('Message content cannot be empty');
    }

    if (trimmedContent.length > 5000) {
      throw new BadRequestException(
        'Message exceeds maximum length (5000 characters)',
      );
    }

    try {
      // ✅ Verify membership
      await this.ensureIsMember(tripId, userId);

      const message = await this.messageModel.findById(messageId);

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // ✅ Verify ownership
      if (message.userId !== userId) {
        throw new ForbiddenException('You can only edit your own messages');
      }

      // ✅ Verify trip match
      if (message.tripId !== tripId) {
        throw new ForbiddenException('Message does not belong to this trip');
      }

      // ✅ Check if message is older than 15 minutes
      const messageObj = message.toObject ? message.toObject() : (message as any);
      const createdTime = messageObj?.createdAt || message.createdAt;
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      if (createdTime < fifteenMinutesAgo) {
        throw new BadRequestException(
          'Messages can only be edited within 15 minutes',
        );
      }

      // ✅ Update message
      const updated = await this.messageModel.findByIdAndUpdate(
        messageId,
        {
          content: trimmedContent,
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (!updated) {
        throw new NotFoundException('Failed to update message');
      }

      const updatedObj = updated.toObject ? updated.toObject() : (updated as any);

      return {
        id: updated._id.toString(),
        sender: {
          id: updated.userId,
          username: updated.username,
        },
        content: updated.content,
        type: updated.type,
        sentAt: updatedObj?.createdAt || new Date(),
      };
    } catch (error: any) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Failed to update message ${messageId}:`, error);
      throw new BadRequestException('Failed to update message');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET LATEST MESSAGES - ✅ NEW: Get latest messages with pagination
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Get latest messages with pagination
   * ✅ SECURE: Membership verified
   */
  async getLatestMessages(
    tripId: string,
    userId: string,
    limit: number = 50,
    skip: number = 0,
  ): Promise<MessagesResponse> {
    if (!tripId || !userId) {
      throw new BadRequestException('Invalid trip or user ID');
    }

    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const safeSkip = Math.max(skip, 0);

    try {
      // ✅ Verify membership
      await this.ensureIsMember(tripId, userId);

      const messages = await this.messageModel
        .find({ tripId: tripId.trim() })
        .select({
          _id: 1,
          userId: 1,
          username: 1,
          content: 1,
          type: 1,
          createdAt: 1,
        })
        .sort({ createdAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean()
        .exec();

      // Reverse to get chronological order
      const reversedMessages = messages.reverse();

      return {
        tripId: tripId.trim(),
        count: reversedMessages.length,
        data: reversedMessages.map((m: any) => ({
          id: m._id.toString(),
          sender: {
            id: m.userId,
            username: m.username,
          },
          content: m.content,
          type: m.type || 'text',
          sentAt: m.createdAt || new Date(),
        })),
      };
    } catch (error: any) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to fetch latest messages:`, error);
      throw new BadRequestException('Failed to fetch messages');
    }
  }
}