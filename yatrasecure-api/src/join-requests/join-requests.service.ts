import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembersService } from '../members/members.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class JoinRequestsService {
  constructor(
    private prisma: PrismaService,
    private membersService: MembersService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  async create(tripId: string, userId: string, message?: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { admin: { select: { id: true, email: true, username: true } } },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    if (trip.adminId === userId) {
      throw new BadRequestException('You are the admin of this trip');
    }

    const existingRequest = await this.prisma.joinRequest.findFirst({
      where: { tripId, requesterId: userId },
    });

    if (existingRequest) {
      throw new BadRequestException('You already sent a join request');
    }

    const isMember = await this.prisma.tripMember.findFirst({
      where: { tripId, userId },
    });

    if (isMember) {
      throw new BadRequestException('You are already a member of this trip');
    }

    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const request = await this.prisma.joinRequest.create({
      data: { tripId, requesterId: userId, message },
      include: {
        requester: {
          select: { id: true, username: true, city: true, state: true, profileImage: true },
        },
      },
    });

    // Send email to admin — match the EmailService param order
    try {
      if (requester) {
        await this.emailService.sendJoinRequestNotification(
          trip.admin.email,
          trip.admin.username,
          trip.name,
          requester.username,
        );
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    }

    // In-app notification for admin
    try {
      if (requester) {
        await this.notificationsService.createNotification(
          trip.adminId,
          'join_request',
          'New Join Request',
          `@${requester.username} wants to join "${trip.name}"`,
          `/trips/${tripId}/admin`,
        );
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return request;
  }

  async findAllByTrip(tripId: string, adminId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });

    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== adminId) {
      return []; // Non-admins just get an empty list instead of a 403
    }

    return this.prisma.joinRequest.findMany({
      where: { tripId },
      include: {
        requester: {
          select: { id: true, username: true, city: true, state: true, profileImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    requestId: string,
    status: 'accepted' | 'rejected',
    adminId: string,
  ) {
    const request = await this.prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        trip: { select: { id: true, name: true, adminId: true } },
        requester: {
          select: { id: true, username: true, email: true, profileImage: true },
        },
      },
    });

    if (!request) throw new NotFoundException('Join request not found');
    if (request.trip.adminId !== adminId) {
      throw new ForbiddenException('Only trip admin can update requests');
    }
    if (request.status !== 'pending') {
      throw new BadRequestException('Request already processed');
    }

    const updated = await this.prisma.joinRequest.update({
      where: { id: requestId },
      data: { status },
    });

    if (status === 'accepted') {
      await this.membersService.addMember(request.tripId, request.requesterId);

      try {
        await this.emailService.sendJoinRequestAccepted(
          request.requester.email,
          request.requester.username,
          request.trip.name,
          request.trip.id,
        );
      } catch (error) {
        console.error('Failed to send email:', error);
      }

      try {
        await this.notificationsService.createNotification(
          request.requesterId,
          'join_accepted',
          'Join Request Accepted!',
          `Your request to join "${request.trip.name}" has been accepted`,
          `/trips/${request.trip.id}`,
        );
      } catch (error) {
        console.error('Failed to create notification:', error);
      }
    } else if (status === 'rejected') {
      try {
        await this.emailService.sendJoinRequestRejected(
          request.requester.email,
          request.requester.username,
          request.trip.name,
        );
      } catch (error) {
        console.error('Failed to send email:', error);
      }

      try {
        await this.notificationsService.createNotification(
          request.requesterId,
          'join_rejected',
          'Join Request Declined',
          `Your request to join "${request.trip.name}" has been declined`,
          '/trips',
        );
      } catch (error) {
        console.error('Failed to create notification:', error);
      }
    }

    return { id: updated.id, status: updated.status, message: `Request ${status}` };
  }

  async findOne(requestId: string) {
    const request = await this.prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        trip: { select: { id: true, name: true, adminId: true } },
        requester: {
          select: { id: true, username: true, city: true, state: true, profileImage: true },
        },
      },
    });

    if (!request) throw new NotFoundException('Join request not found');
    return request;
  }

  async delete(requestId: string, userId: string) {
    const request = await this.prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: { trip: true },
    });

    if (!request) throw new NotFoundException('Join request not found');

    if (request.requesterId !== userId && request.trip.adminId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own requests or requests for your trips',
      );
    }

    await this.prisma.joinRequest.delete({ where: { id: requestId } });
    return { message: 'Join request deleted successfully' };
  }
}