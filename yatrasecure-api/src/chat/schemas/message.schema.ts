import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true }) // ✅ Auto-add createdAt and updatedAt
export class Message {
  @Prop({ required: true })
  tripId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  content: string;

  @Prop({ enum: ['text', 'ai', 'system'], default: 'text' })
  type: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ index: true })
  tripId_index?: string; // For faster queries
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// ✅ Create indexes for performance
MessageSchema.index({ tripId: 1, createdAt: -1 });
MessageSchema.index({ userId: 1, tripId: 1 });
MessageSchema.index({ content: 'text' }); // For text search