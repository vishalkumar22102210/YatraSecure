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
import { ChatService, SafeMessage } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAIAssistantService } from './chat-ai-assistant.service';
import { Logger, BadRequestException } from '@nestjs/common';

// ✅ SECURE: User object for socket
interface SocketUser {
  id: string;
  email: string;
  username: string;
}

// ✅ JWT Payload interface
interface JwtPayload {
  sub: string;
  email: string;
}

// ✅ Join Room payload
interface JoinRoomPayload {
  tripId: string;
}

// ✅ Send Message payload
interface SendMessagePayload {
  tripId: string;
  content: string;
}

// ✅ Emitted message format
interface EmittedMessage {
  id: string;
  tripId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: Date;
  type?: string;
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // HANDLE CONNECTION - ✅ SECURE: JWT verification
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Handle new WebSocket connection
   * ✅ SECURITY: Verify JWT token before allowing connection
   */
  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn('Chat connection rejected: No token provided');
        return client.disconnect();
      }

      // ✅ Verify JWT token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // ✅ Get user from database
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          username: true,
        },
      });

      if (!user) {
        this.logger.warn(
          `Chat connection rejected: User not found for sub ${payload.sub}`,
        );
        client.disconnect();
        return;
      }

      // ✅ Store user in socket for later use
      (client as any).user = user as SocketUser;
      this.logger.log(`User ${user.username} connected to chat`);

      // ✅ Emit connected event with safe data
      client.emit('connected', {
        userId: user.id,
        username: user.username,
      });
    } catch (error: any) {
      this.logger.warn(`Chat connection rejected: ${error.message}`);
      client.disconnect();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HANDLE DISCONNECT
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Handle WebSocket disconnection
   */
  handleDisconnect(client: Socket) {
    const user = (client as any).user as SocketUser | undefined;
    if (user) {
      this.logger.log(`User ${user.username} disconnected from chat`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EXTRACT TOKEN FROM SOCKET - ✅ SECURE: Multiple token sources
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Extract JWT token from socket handshake
   * Checks: auth object, query params, Authorization header
   */
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
    if (
      typeof authHeader === 'string' &&
      authHeader.startsWith('Bearer ')
    ) {
      return authHeader.split(' ')[1];
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // JOIN ROOM - ✅ SECURE: Membership verification
  // ════════════════���══════════════════════════════════════════════════════════════
  /**
   * Client joins a trip chat room
   * ✅ SECURITY: Verify user is trip member before allowing join
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomPayload,
  ) {
    const user = (client as any).user as SocketUser | undefined;
    if (!user) {
      this.logger.warn('joinRoom: User not authenticated');
      return client.disconnect();
    }

    const { tripId } = data;

    // ✅ Validate tripId
    if (!tripId || typeof tripId !== 'string' || tripId.trim().length === 0) {
      return client.emit('error', { message: 'Invalid trip ID' });
    }

    try {
      // ✅ Verify membership
      const member = await this.prisma.tripMember.findUnique({
        where: {
          tripId_userId: { tripId: tripId.trim(), userId: user.id },
        },
        select: { id: true },
      });

      if (!member) {
        this.logger.warn(
          `User ${user.id} attempted to join trip ${tripId} without membership`,
        );
        return client.emit('error', {
          message: 'Not a member of this trip',
        });
      }

      // ✅ Join the room
      client.join(tripId.trim());
      this.logger.log(`User ${user.username} joined room ${tripId}`);

      // ✅ Emit success event
      client.emit('joinedRoom', { tripId: tripId.trim() });

      // ✅ Notify others in the room
      client
        .to(tripId.trim())
        .emit('userJoined', {
          userId: user.id,
          username: user.username,
          message: `${user.username} joined the chat`,
        });
    } catch (error: any) {
      this.logger.error(`Error joining room ${tripId}:`, error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SEND MESSAGE - ✅ SECURE: Membership check, validation, AI mention
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Client sends a message to the trip chat
   * ✅ SECURITY: Membership verification, input validation, AI response handling
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessagePayload,
  ) {
    const user = (client as any).user as SocketUser | undefined;
    if (!user) {
      this.logger.warn('sendMessage: User not authenticated');
      return client.disconnect();
    }

    const { tripId, content } = data;

    // ✅ Validate inputs
    if (!tripId || typeof tripId !== 'string' || tripId.trim().length === 0) {
      return client.emit('error', { message: 'Invalid trip ID' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return client.emit('error', { message: 'Message content cannot be empty' });
    }

    if (content.length > 5000) {
      return client.emit('error', {
        message: 'Message exceeds maximum length (5000 characters)',
      });
    }

    try {
      // ✅ Verify membership before saving message
      await this.chatService.ensureIsMember(tripId, user.id);

      // ✅ Save message to database
      const msg = await this.chatService.sendMessage(
        tripId,
        user.id,
        user.username,
        content.trim(),
      );

      // ✅ Format message for emission (SafeMessage doesn't have toObject)
      const emittedMessage: EmittedMessage = {
        id: msg.id,
        tripId: tripId,
        userId: msg.sender.id,
        username: msg.sender.username,
        content: msg.content,
        createdAt: msg.sentAt,
        type: 'text',
      };

      // ✅ Broadcast to everyone in this trip room
      this.server.to(tripId).emit('newMessage', emittedMessage);

      // ✅ Check for @ai mention - handle asynchronously
      if (content.toLowerCase().includes('@ai')) {
        this.handleAIResponse(tripId, content, user);
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        return client.emit('error', { message: error.message });
      }

      this.logger.error(`Error sending message in trip ${tripId}:`, error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HANDLE AI RESPONSE - ✅ NEW: Async AI response handler
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Handle AI response for @ai mentions
   * ✅ SECURITY: No membership check needed (internal operation)
   */
  private async handleAIResponse(
    tripId: string,
    content: string,
    user: SocketUser,
  ) {
    // Delay AI response slightly to feel more natural
    setTimeout(async () => {
      try {
        // ✅ Get AI response
        const aiResponse = await this.aiAssistant.getAIResponse(
          tripId,
          content,
          user.username,
        );

        // ✅ Save AI message to database (SafeMessage return)
        const aiMsg = await this.chatService.saveSystemMessage(
          tripId,
          'system-ai',
          'YatraSecure AI',
          aiResponse,
        );

        // ✅ Format AI message for emission
        const aiEmittedMessage: EmittedMessage = {
          id: aiMsg.id,
          tripId: tripId,
          userId: aiMsg.sender.id,
          username: aiMsg.sender.username,
          content: aiMsg.content,
          createdAt: aiMsg.sentAt,
          type: 'ai',
        };

        // ✅ Broadcast AI response to everyone in the room
        this.server.to(tripId).emit('newMessage', aiEmittedMessage);
      } catch (error: any) {
        this.logger.error(
          `Error generating AI response for trip ${tripId}:`,
          error,
        );

        // ✅ Emit error message to trip
        this.server.to(tripId).emit('error', {
          message: 'Failed to generate AI response',
        });
      }
    }, 1000); // 1 second delay for natural feel
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET ONLINE USERS - ✅ NEW: Get count of online users in room
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Get count of online users in a trip room
   */
  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    const user = (client as any).user as SocketUser | undefined;
    if (!user) return client.disconnect();

    const { tripId } = data;

    if (!tripId || typeof tripId !== 'string') {
      return client.emit('error', { message: 'Invalid trip ID' });
    }

    try {
      // ✅ Get all sockets in the room
      const roomSockets = await this.server.to(tripId).fetchSockets();
      const onlineCount = roomSockets.length;

      client.emit('onlineUsers', {
        tripId,
        count: onlineCount,
      });
    } catch (error: any) {
      this.logger.error(`Error getting online users for ${tripId}:`, error);
      client.emit('error', { message: 'Failed to get online users' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TYPING INDICATOR - ✅ NEW: Show when user is typing
  // ═══════════════════════════════════════════════════════════════════════════════
  /**
   * Broadcast typing indicator
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; isTyping: boolean },
  ) {
    const user = (client as any).user as SocketUser | undefined;
    if (!user) return client.disconnect();

    const { tripId, isTyping } = data;

    if (!tripId || typeof tripId !== 'string') {
      return client.emit('error', { message: 'Invalid trip ID' });
    }

    // ✅ Broadcast typing status (except to sender)
    client.to(tripId).emit('userTyping', {
      userId: user.id,
      username: user.username,
      isTyping,
    });
  }
}