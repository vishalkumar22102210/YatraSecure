import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Get all members of a trip
  async getTripMembers(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return this.prisma.tripMember.findMany({
      where: { tripId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            city: true,
            state: true,
            profileImage: true,
            reputationScore: true,
            isVerified: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  // Add member to trip (called from join-requests)
  async addMember(tripId: string, userId: string, role: string = 'member') {
    const existing = await this.prisma.tripMember.findUnique({
      where: {
        tripId_userId: { tripId, userId },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a member of this trip');
    }

    return this.prisma.tripMember.create({
      data: {
        tripId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            city: true,
            state: true,
          },
        },
      },
    });
  }

  // Remove member (kick) — Admin only
  async removeMember(tripId: string, userId: string, requestingUserId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.adminId !== requestingUserId) {
      throw new ForbiddenException('Only admin can remove members');
    }

    if (userId === trip.adminId) {
      throw new BadRequestException('Cannot remove trip admin');
    }

    const member = await this.prisma.tripMember.findUnique({
      where: {
        tripId_userId: { tripId, userId },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('User is not a member of this trip');
    }

    await this.prisma.tripMember.delete({
      where: {
        tripId_userId: { tripId, userId },
      },
    });

    try {
      await this.notificationsService.createNotification(
        userId,
        'member_removed',
        'Removed from Trip',
        `You have been removed from "${trip.name}"`,
        '/trips',
      );
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return {
      message: `${member.user.username} has been removed from the trip`,
    };
  }

  // Leave trip — Any member except admin
  async leaveTrip(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.adminId === userId) {
      throw new BadRequestException(
        'Admin cannot leave trip. Transfer ownership or delete trip instead.',
      );
    }

    const member = await this.prisma.tripMember.findUnique({
      where: {
        tripId_userId: { tripId, userId },
      },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this trip');
    }

    await this.prisma.tripMember.delete({
      where: {
        tripId_userId: { tripId, userId },
      },
    });

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      if (user) {
        await this.notificationsService.createNotification(
          trip.adminId,
          'member_left',
          'Member Left Trip',
          `@${user.username} has left "${trip.name}"`,
          `/trips/${tripId}/admin`,
        );
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return {
      message: 'You have left the trip successfully',
    };
  }
}