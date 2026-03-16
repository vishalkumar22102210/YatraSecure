import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Message, MessageSchema } from './schemas/message.schema';
import { TripsModule } from '../trips/trips.module';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ChatAIAssistantService } from './chat-ai-assistant.service';

@Module({
  imports: [
    TripsModule,
    JwtModule.register({}), // ConfigService se runtime secret lenge
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatAIAssistantService],
})
export class ChatModule {}
