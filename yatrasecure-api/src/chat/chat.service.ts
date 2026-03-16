import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly prisma: PrismaService,
  ) {}

  // Check if user is member of trip
  async ensureIsMember(tripId: string, userId: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this trip');
    }
  }

  // Send Message (with membership check)
  async sendMessage(
    tripId: string,
    userId: string,
    username: string,
    content: string,
  ) {
    await this.ensureIsMember(tripId, userId);

    const message = new this.messageModel({
      tripId,
      userId,
      username,
      content,
      type: 'text',
    });

    return message.save();
  }

  // Save system/AI message (NO membership check)
  async saveSystemMessage(
    tripId: string,
    userId: string,
    username: string,
    content: string,
  ) {
    const message = new this.messageModel({
      tripId,
      userId,
      username,
      content,
      type: 'ai',
    });

    return message.save();
  }

  // Get Messages of a Trip
  async getMessages(tripId: string) {
    return this.messageModel
      .find({ tripId })
      .sort({ createdAt: 1 })
      .limit(200)
      .exec();
  }
}
