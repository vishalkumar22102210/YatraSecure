import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { JoinTripDto } from './dto/join-trip.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import * as crypto from 'crypto';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  private generateInviteCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  // ================= CREATE TRIP =================
  async createTrip(userId: string, dto: CreateTripDto) {
    const { startDate, endDate, budget, isPublic = true, ...rest } = dto;
    const inviteCode = !isPublic ? this.generateInviteCode() : null;

    const trip = await this.prisma.trip.create({
      data: {
        ...rest,
        budget,
        isPublic,
        inviteCode,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        adminId: userId,
      },
      include: {
        admin: {
          select: { id: true, username: true, city: true, state: true, profileImage: true },
        },
      },
    });

    await this.prisma.tripMember.create({
      data: { tripId: trip.id, userId, role: 'admin' },
    });

    await this.prisma.wallet.create({
      data: { tripId: trip.id, totalBudget: budget },
    });

    return trip;
  }

  // ================= UPDATE TRIP =================
  async updateTrip(id: string, updateTripDto: any, userId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== userId) throw new ForbiddenException('Only trip admin can update');

    const data: any = { ...updateTripDto };
    if (updateTripDto.startDate) data.startDate = new Date(updateTripDto.startDate);
    if (updateTripDto.endDate)   data.endDate   = new Date(updateTripDto.endDate);

    if (updateTripDto.isPublic === false && !trip.inviteCode) {
      data.inviteCode = this.generateInviteCode();
    }
    if (updateTripDto.isPublic === true) {
      data.inviteCode = null;
    }

    return this.prisma.trip.update({
      where: { id },
      data,
      include: {
        admin: {
          select: { id: true, username: true, city: true, state: true, profileImage: true },
        },
      },
    });
  }

  // ================= DELETE TRIP =================
  async deleteTrip(id: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: { members: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== userId) throw new ForbiddenException('Only trip admin can delete');

    await this.prisma.$transaction([
      this.prisma.joinRequest.deleteMany({ where: { tripId: id } }),
      this.prisma.tripMember.deleteMany({ where: { tripId: id } }),
      this.prisma.transaction.deleteMany({ where: { wallet: { tripId: id } } }),
      this.prisma.expenseParticipant.deleteMany({
        where: { expense: { wallet: { tripId: id } } },
      }),
      this.prisma.expense.deleteMany({ where: { wallet: { tripId: id } } }),
      this.prisma.wallet.deleteMany({ where: { tripId: id } }),
      this.prisma.trip.delete({ where: { id } }),
    ]);

    return { message: 'Trip deleted successfully' };
  }

  // ================= LIST TRIPS =================
  async findAll(query: any, requestingUserId?: string) {
    const {
      search, fromCity, toCity,
      minBudget, maxBudget,
      tripType, startDate,
      page = 1, limit = 12,
      sortBy = 'createdAt', sortOrder = 'desc',
      myTrips = false,
    } = query;

    // Convert myTrips string "true" to boolean
    const isMyTrips = myTrips === true || myTrips === 'true';

    let where: any;

    if (isMyTrips && requestingUserId) {
      // My Trips → show ALL trips where user is admin or member (public + private)
      where = {
        OR: [
          { adminId: requestingUserId },
          { members: { some: { userId: requestingUserId } } },
        ],
      };
    } else {
      // Browse → only public trips
      where = { isPublic: true };
    }

    if (search) {
      const searchCondition = [
        { name:     { contains: search, mode: 'insensitive' as const } },
        { fromCity: { contains: search, mode: 'insensitive' as const } },
        { toCity:   { contains: search, mode: 'insensitive' as const } },
      ];
      if (where.OR) {
        where = {
          AND: [
            { OR: where.OR },
            { OR: searchCondition },
          ],
        };
      } else {
        where.OR = searchCondition;
      }
    }

    if (fromCity) where.fromCity = { contains: fromCity, mode: 'insensitive' };
    if (toCity)   where.toCity   = { contains: toCity,   mode: 'insensitive' };

    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = parseFloat(minBudget);
      if (maxBudget) where.budget.lte = parseFloat(maxBudget);
    }

    if (tripType)  where.tripType  = { equals: tripType, mode: 'insensitive' };
    if (startDate) where.startDate = { gte: new Date(startDate) };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const take  = parseInt(limit);
    const total = await this.prisma.trip.count({ where });

    const orderBy: any =
      sortBy === 'budget'    ? { budget: sortOrder }    :
      sortBy === 'startDate' ? { startDate: sortOrder } :
                               { createdAt: sortOrder };

    const trips = await this.prisma.trip.findMany({
      where,
      include: {
        admin:   { select: { id: true, username: true, city: true, state: true, profileImage: true } },
        members: { select: { userId: true, role: true } },
        _count:  { select: { members: true } },
      },
      orderBy,
      skip,
      take,
    });

    // ★ KEY FIX: Only strip inviteCode for public browsing, NOT for myTrips
    let resultTrips;
    if (isMyTrips && requestingUserId) {
      // My Trips → keep inviteCode so frontend can show it
      resultTrips = trips;
    } else {
      // Public browse → remove inviteCode for security
      resultTrips = trips.map(({ inviteCode, ...t }: any) => t);
    }

    return {
      trips: resultTrips,
      pagination: {
        total,
        page:       parseInt(page),
        limit:      parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore:    skip + take < total,
      },
    };
  }

  // ================= GET TRIP BY ID =================
  async getTripById(id: string, requestingUserId?: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        admin: {
          select: { id: true, username: true, city: true, state: true, profileImage: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, city: true, state: true, profileImage: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    const isMemberOrAdmin =
      requestingUserId &&
      (trip.adminId === requestingUserId ||
        trip.members.some((m) => m.userId === requestingUserId));

    if (!isMemberOrAdmin) {
      const { inviteCode, ...rest } = trip as any;
      return rest;
    }

    return trip;
  }

  // ================= JOIN BY INVITE CODE =================
  async joinByInviteCode(code: string, userId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { inviteCode: code.toUpperCase().trim() },
    });
    if (!trip) throw new NotFoundException('Invalid invite code');

    const existing = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId: trip.id, userId } },
    });
    if (existing) throw new BadRequestException('Already a member of this trip');

    await this.prisma.tripMember.create({
      data: { tripId: trip.id, userId, role: 'member' },
    });

    return { message: 'Joined trip successfully', tripId: trip.id };
  }

  // ================= REGENERATE INVITE CODE =================
  async regenerateInviteCode(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip)                   throw new NotFoundException('Trip not found');
    if (trip.adminId !== userId) throw new ForbiddenException('Only admin can regenerate code');
    if (trip.isPublic)           throw new BadRequestException('Public trips do not have invite codes');

    const newCode = this.generateInviteCode();
    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data:  { inviteCode: newCode },
    });

    return { inviteCode: updated.inviteCode };
  }

  // ================= REQUEST TO JOIN (Public trips) =================
  async requestToJoinTrip(tripId: string, userId: string, dto: JoinTripDto) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    const existingMember = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (existingMember) throw new BadRequestException('Already a member');

    const existingRequest = await this.prisma.joinRequest.findFirst({
      where: { tripId, userId, status: 'pending' },
    });
    if (existingRequest) throw new BadRequestException('Request already pending');

    return this.prisma.joinRequest.create({
      data: { tripId, userId, message: dto.message },
      include: {
        user: {
          select: { id: true, username: true, profileImage: true },
        },
      },
    });
  }

  // ================= LIST JOIN REQUESTS =================
  async listJoinRequests(tripId: string, adminId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== adminId) throw new ForbiddenException('Only admin can view requests');

    return this.prisma.joinRequest.findMany({
      where: { tripId },
      include: {
        user: {
          select: { id: true, username: true, profileImage: true, city: true, state: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ================= UPDATE JOIN REQUEST =================
  async updateJoinRequest(
    tripId: string,
    requestId: string,
    adminId: string,
    dto: UpdateRequestStatusDto,
  ) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== adminId) throw new ForbiddenException('Only admin can manage requests');

    const request = await this.prisma.joinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.tripId !== tripId) throw new BadRequestException('Request does not belong to this trip');

    const updated = await this.prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: dto.status },
    });

    if (dto.status === 'accepted') {
      const existingMember = await this.prisma.tripMember.findUnique({
        where: { tripId_userId: { tripId, userId: request.userId } },
      });
      if (!existingMember) {
        await this.prisma.tripMember.create({
          data: { tripId, userId: request.userId, role: 'member' },
        });
      }
    }

    return updated;
  }

  // ================= LIST MEMBERS =================
  async listMembers(tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    return this.prisma.tripMember.findMany({
      where: { tripId },
      include: {
        user: {
          select: {
            id: true, username: true, firstName: true, lastName: true,
            city: true, state: true, profileImage: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  // ================= REMOVE MEMBER =================
  async removeMember(tripId: string, memberId: string, adminId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== adminId) throw new ForbiddenException('Only admin can remove members');
    if (memberId === adminId) throw new BadRequestException('Admin cannot remove themselves');

    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: memberId } },
    });
    if (!member) throw new NotFoundException('Member not found');

    await this.prisma.tripMember.delete({
      where: { tripId_userId: { tripId, userId: memberId } },
    });

    return { message: 'Member removed successfully' };
  }

  // ================= LEAVE TRIP =================
  async leaveTrip(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId === userId) throw new BadRequestException('Admin cannot leave their own trip');

    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new NotFoundException('Not a member of this trip');

    await this.prisma.tripMember.delete({
      where: { tripId_userId: { tripId, userId } },
    });

    return { message: 'Left trip successfully' };
  }
}