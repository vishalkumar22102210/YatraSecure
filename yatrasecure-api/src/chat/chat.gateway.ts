import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAIAssistantService } from './chat-ai-assistant.service';
import { Logger } from '@nestjs/common';

interface JwtPayload {
  sub: string;
  email: string;
}

interface JoinRoomPayload {
  tripId: string;
}

interface SendMessagePayload {
  tripId: string;
  content: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private chatService: ChatService,
    private prisma: PrismaService,
    private aiAssistant: ChatAIAssistantService,
  ) {}

  // Client connects
  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn('Chat connection rejected: No token provided');
        return client.disconnect();
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          username: true,
        },
      });

      if (!user) {
        this.logger.warn(`Chat connection rejected: User not found for sub ${payload.sub}`);
        client.disconnect();
        return;
      }

      (client as any).user = user;
      this.logger.log(`User ${user.username} connected to chat`);
      client.emit('connected', { userId: user.id, username: user.username });
    } catch (e) {
      this.logger.warn('Chat connection rejected: Invalid token');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client as any).user;
    if (user) {
      this.logger.log(`User ${user.username} disconnected from chat`);
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    // 1. Check auth object (socket.io v4+ standard)
    const tokenFromAuth = (client.handshake as any).auth?.token;
    if (typeof tokenFromAuth === 'string' && tokenFromAuth.length > 0) {
      return tokenFromAuth;
    }

    // 2. Check query params ?token=...
    const tokenFromQuery = client.handshake.query?.token;
    if (typeof tokenFromQuery === 'string' && tokenFromQuery.length > 0) {
      return tokenFromQuery;
    }

    // 3. Check Authorization header
    const authHeader = client.handshake.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    return null;
  }

  // Client joins a trip room
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomPayload,
  ) {
    const user = (client as any).user;
    if (!user) return client.disconnect();

    const { tripId } = data;

    // ensure membership
    const member = await this.prisma.tripMember.findUnique({
      where: {
        tripId_userId: { tripId, userId: user.id },
      },
    });

    if (!member) {
      return client.emit('error', { message: 'Not a member of this trip' });
    }

    client.join(tripId);
    this.logger.log(`User ${user.username} joined room ${tripId}`);
    client.emit('joinedRoom', { tripId });
  }

  // Client sends message
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessagePayload,
  ) {
    const user = (client as any).user;
    if (!user) return client.disconnect();

    const { tripId, content } = data;

    await this.chatService.ensureIsMember(tripId, user.id);

    // Save to DB (Mongo)
    const msg = await this.chatService.sendMessage(tripId, user.id, user.username, content);

    // Broadcast to everyone in this trip room
    const obj = msg.toObject ? msg.toObject() : (msg as any);

    this.server.to(tripId).emit('newMessage', {
      id: obj._id?.toString?.() ?? obj._id,
      tripId: obj.tripId,
      userId: obj.userId,
      username: obj.username,
      content: obj.content,
      createdAt: obj.createdAt,
    });

    // Check for @ai mention
    if (content.toLowerCase().includes('@ai')) {
      setTimeout(async () => {
        try {
          const aiResponse = await this.aiAssistant.getAIResponse(tripId, content, user.username);
          
          // Save AI message directly to MongoDB (skip membership check)
          const aiMsg = await this.chatService.saveSystemMessage(tripId, 'system-ai', 'AI Companion', aiResponse);
          const aiObj = aiMsg.toObject ? aiMsg.toObject() : (aiMsg as any);

          this.server.to(tripId).emit('newMessage', {
            id: aiObj._id?.toString?.() ?? aiObj._id,
            tripId: aiObj.tripId,
            userId: 'system-ai',
            username: 'AI Companion',
            content: aiObj.content,
            createdAt: aiObj.createdAt,
            type: 'ai'
          });
        } catch (err) {
          this.logger.error('AI response error:', err);
        }
      }, 1000);
    }
  }
}
