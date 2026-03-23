import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserMapperService } from '../common/mappers/user.mapper';
import { AssistantService } from './assistant.service';
import { MatchmakingService } from '../common/matchmaking/matchmaking.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { JoinTripDto } from './dto/join-trip.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  // ✅ Safe user selection for responses
  private readonly SAFE_USER_SELECT = {
    id: true,
    username: true,
    profileImage: true,
    bio: true,
    city: true,
    state: true,
    reputationScore: true,
    isVerified: true,
    // ❌ NO email, password, tokens
  };

  constructor(
    private prisma: PrismaService,
    private assistantService: AssistantService,
    private matchmakingService: MatchmakingService,
    private userMapper: UserMapperService,
  ) {}

  private generateInviteCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CREATE TRIP
  // ═══════════════════════════════════════════════════════════════════════════════
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
          select: {
            id: true,
            username: true,
            profileImage: true,
            city: true,
            state: true,
            reputationScore: true,
            isVerified: true,
          } as any,
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // UPDATE TRIP
  // ═══════════════════════════════════════════════════════════════════════════════
  async updateTrip(id: string, updateTripDto: any, userId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== userId)
      throw new ForbiddenException('Only trip admin can update');

    const data: any = { ...updateTripDto };
    if (updateTripDto.startDate) data.startDate = new Date(updateTripDto.startDate);
    if (updateTripDto.endDate) data.endDate = new Date(updateTripDto.endDate);

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
          select: {
            id: true,
            username: true,
            profileImage: true,
            city: true,
            state: true,
            reputationScore: true,
            isVerified: true,
          } as any,
        },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DELETE TRIP
  // ═══════════════════════════════════════════════════════════════════════════════
  async deleteTrip(id: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: { members: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== userId)
      throw new ForbiddenException('Only trip admin can delete');

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

  // ═════════════════════════════════════════════════���═════════════════════════════
  // LIST TRIPS - ✅ SECURE: No invite codes exposed publicly
  // ═══════════════════════════════════════════════════════════════════════════════
  async findAll(query: any, requestingUserId?: string) {
    const {
      search,
      fromCity,
      toCity,
      minBudget,
      maxBudget,
      tripType,
      startDate,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      myTrips = false,
    } = query;

    const isMyTrips = myTrips === true || myTrips === 'true';

    let where: any;

    if (isMyTrips && requestingUserId) {
      where = {
        OR: [
          { adminId: requestingUserId },
          { members: { some: { userId: requestingUserId } } },
        ],
      };
    } else {
      where = { isPublic: true };
    }

    if (search) {
      const searchCondition = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { fromCity: { contains: search, mode: 'insensitive' as const } },
        { toCity: { contains: search, mode: 'insensitive' as const } },
      ];
      if (where.OR) {
        where = {
          AND: [{ OR: where.OR }, { OR: searchCondition }],
        };
      } else {
        where.OR = searchCondition;
      }
    }

    if (fromCity)
      where.fromCity = { contains: fromCity, mode: 'insensitive' };
    if (toCity) where.toCity = { contains: toCity, mode: 'insensitive' };

    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = parseFloat(minBudget);
      if (maxBudget) where.budget.lte = parseFloat(maxBudget);
    }

    if (tripType) where.tripType = { equals: tripType, mode: 'insensitive' };

    // Matchmaking logic
    if (query.matchmaking === 'true' && requestingUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: requestingUserId },
        select: { travelPersonality: true },
      });

      if (user?.travelPersonality) {
        (where as any).admin = {
          travelPersonality: {
            in: [
              user.travelPersonality,
              'Culture Enthusiast',
              'Soul Searcher',
              'Adventure Seeker',
              'Budget Explorer',
              'Luxury Traveler',
            ],
          },
        };
      }
    }

    if (startDate) where.startDate = { gte: new Date(startDate) };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const total = await this.prisma.trip.count({ where });

    const orderBy: any =
      sortBy === 'budget'
        ? { budget: sortOrder }
        : sortBy === 'startDate'
        ? { startDate: sortOrder }
        : { createdAt: sortOrder };

    const trips = await this.prisma.trip.findMany({
      where,
      include: {
        admin: { select: this.SAFE_USER_SELECT as any },
        members: { select: { userId: true, role: true } },
        _count: { select: { members: true } },
      },
      orderBy,
      skip,
      take,
    });

    // Enhanced matchmaking sorting
    let resultTrips = trips;
    if (query.matchmaking === 'true' && requestingUserId) {
      const me = await this.prisma.user.findUnique({
        where: { id: requestingUserId },
      });
      const myPersonality = me?.travelPersonality || '';

      resultTrips = trips
        .map((t: any) => {
          const matchScore =
            this.matchmakingService.calculateCompatibility(
              myPersonality,
              (t.admin as any)?.travelPersonality || '',
            );
          return { ...t, matchScore };
        })
        .sort((a: any, b: any) => b.matchScore - a.matchScore);
    }

    // ✅ SECURITY: Remove inviteCode from public browse
    if (!(isMyTrips && requestingUserId)) {
      resultTrips = resultTrips.map(({ inviteCode, ...t }: any) => t);
    }

    return {
      trips: resultTrips,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + take < total,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GET TRIP BY ID
  // ═══════════════════════════════════════════════════════════════════════════════
  async getTripById(id: string, requestingUserId?: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            city: true,
            state: true,
            reputationScore: true,
            isVerified: true,
          } as any,
        },
        members: {
          include: {
            user: {
              select: this.SAFE_USER_SELECT as any,
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // JOIN BY INVITE CODE
  // ═══════════════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // REGENERATE INVITE CODE
  // ═══════════════════════════════════════════════════════════════════════════════
  async regenerateInviteCode(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== userId)
      throw new ForbiddenException('Only admin can regenerate code');
    if (trip.isPublic)
      throw new BadRequestException('Public trips do not have invite codes');

    const newCode = this.generateInviteCode();
    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: { inviteCode: newCode },
    });

    return { inviteCode: updated.inviteCode };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // REQUEST TO JOIN (Public trips)
  // ═══════════════════════════════════════════════════════════════════════════════
  async requestToJoinTrip(tripId: string, userId: string, dto: JoinTripDto) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    const existingMember = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (existingMember) throw new BadRequestException('Already a member');

    const existingRequest = await this.prisma.joinRequest.findFirst({
      where: { tripId, requesterId: userId, status: 'pending' },
    });
    if (existingRequest)
      throw new BadRequestException('Request already pending');

    return this.prisma.joinRequest.create({
      data: { tripId, requesterId: userId, message: dto.message },
      include: {
        requester: {
          select: { id: true, username: true, profileImage: true },
        },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LIST JOIN REQUESTS - ✅ SECURE: Admin only, safe data
  // ═══════════════════════════════════════════════════════════════════════════════
  async listJoinRequests(tripId: string, adminId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== adminId)
      throw new ForbiddenException('Only admin can view requests');

    const requests = await this.prisma.joinRequest.findMany({
      where: { tripId },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            bio: true,
            city: true,
            state: true,
            reputationScore: true,
            isVerified: true,
            // ❌ NO email, password, tokens
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      count: requests.length,
      data: requests.map((r) => ({
        requestId: r.id,
        submittedAt: r.createdAt,
        message: r.message,
        status: r.status,
        requester: r.requester,
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // UPDATE JOIN REQUEST
  // ═══════════════════════════════════════════════════════════════════════════════
  async updateJoinRequest(
    tripId: string,
    requestId: string,
    adminId: string,
    dto: UpdateRequestStatusDto,
  ) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== adminId)
      throw new ForbiddenException('Only admin can manage requests');

    const request = await this.prisma.joinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.tripId !== tripId)
      throw new BadRequestException('Request does not belong to this trip');

    const updated = await this.prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: dto.status },
    });

    if (dto.status === 'accepted') {
      const existingMember = await this.prisma.tripMember.findUnique({
        where: { tripId_userId: { tripId, userId: request.requesterId } },
      });
      if (!existingMember) {
        await this.prisma.tripMember.create({
          data: { tripId, userId: request.requesterId, role: 'member' },
        });
      }
    }

    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LIST MEMBERS - ✅ SECURE: Safe user data only
  // ═══════════════════════════════════════════════════════════════════════════════
  async listMembers(tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    const members = await this.prisma.tripMember.findMany({
      where: { tripId },
      include: {
        user: {
          select: this.SAFE_USER_SELECT as any,
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return {
      count: members.length,
      data: members.map((m) => ({
        userId: m.user.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: this.userMapper.toPublicProfileDto(m.user),
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // REMOVE MEMBER
  // ═══════════════════════════════════════════════════════════════════════════════
  async removeMember(tripId: string, memberId: string, adminId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== adminId)
      throw new ForbiddenException('Only admin can remove members');
    if (memberId === adminId)
      throw new BadRequestException('Admin cannot remove themselves');

    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: memberId } },
    });
    if (!member) throw new NotFoundException('Member not found');

    await this.prisma.tripMember.delete({
      where: { tripId_userId: { tripId, userId: memberId } },
    });

    return { message: 'Member removed successfully' };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LEAVE TRIP
  // ═══════════════════════════════════════════════════════════════════════════════
  async leaveTrip(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId === userId)
      throw new BadRequestException('Admin cannot leave their own trip');

    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) throw new NotFoundException('Not a member of this trip');

    await this.prisma.tripMember.delete({
      where: { tripId_userId: { tripId, userId } },
    });

    return { message: 'Left trip successfully' };
  }

  // ═══════════════════════════════════════════════════════��═══════════════════════
  // UTILS FOR ITINERARY
  // ═══════════════════════════════════════════════════════════════════════════════
  async findById(id: string) {
    return this.prisma.trip.findUnique({
      where: { id },
    });
  }

  async updateItinerary(id: string, itinerary: string) {
    return this.prisma.trip.update({
      where: { id },
      data: { itinerary },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CREW AI BOOKING AGENTS
  // ═══════════════════════════════════════════════════════════════════════════════
  async runBookingAgents(trip: any, customPrompt?: string, answers?: any) {
    try {
      const inputData = {
        destination: trip.toCity,
        dates: `${trip.startDate.toISOString().split('T')[0]} to ${trip.endDate
          .toISOString()
          .split('T')[0]}`,
        budget: trip.budget.toString(),
        customPrompt: customPrompt || '',
        answers: answers || {},
        travelers: trip.members?.length || 1,
      };

      const scriptPath = path.join(process.cwd(), 'booking_agents.py');
      const pythonExec = path.join(
        process.cwd(),
        'venv',
        'Scripts',
        'python.exe',
      );

      const payload = JSON.stringify(inputData).replace(/"/g, '\\"');

      const { stdout, stderr } = await execAsync(
        `"${pythonExec}" "${scriptPath}" "${payload}"`,
        {
          timeout: 120000,
        },
      );

      const resultString = stdout.trim().split('\n').pop();
      if (!resultString) {
        throw new Error('No output from Booking Agents script');
      }

      let result;
      try {
        result = JSON.parse(resultString);
      } catch (parseErr) {
        console.error('RAW STDOUT:', stdout);
        throw new Error('Failed to parse output from Booking Agents script');
      }

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.structured) {
        return result;
      }
      return { package: result.package };
    } catch (error: any) {
      console.error('CrewAI Execution Error:', error);
      throw new BadRequestException(
        error.message || 'Failed to run Booking Agents',
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SHARED PACKING CHECKLIST
  // ════════════════════════════════════════════════════════════════════════════���══
  async getChecklist(tripId: string) {
    return this.prisma.checklistItem.findMany({
      where: { tripId },
      include: {
        addedBy: {
          select: { id: true, username: true, profileImage: true },
        },
        completedBy: {
          select: { id: true, username: true, profileImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addChecklistItem(tripId: string, userId: string, name: string) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
      });
      if (trip?.adminId !== userId)
        throw new ForbiddenException('Not a member of this trip');
    }

    return this.prisma.checklistItem.create({
      data: { tripId, addedById: userId, name },
      select: {
        id: true,
        name: true,
        isCompleted: true,
        addedBy: { select: { id: true, username: true, profileImage: true } },
        completedBy: {
          select: { id: true, username: true, profileImage: true },
        },
        createdAt: true,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TRIP PHOTOS - ✅ SECURE: Safe user data in photos
  // ═══════════════════════════════════════════════════════════════════════════════
  async addTripPhoto(
    tripId: string,
    userId: string,
    url: string,
    caption?: string,
  ) {
    return this.prisma.photo.create({
      data: { tripId, userId, url, caption },
    });
  }

  async getTripPhotos(tripId: string, userId?: string) {
    // Verify user is member
    if (userId) {
      const isMember = await this.prisma.tripMember.findUnique({
        where: { tripId_userId: { tripId, userId } },
      });
      if (!isMember) {
        throw new ForbiddenException('Only trip members can view photos');
      }
    }

    const photos = await this.prisma.photo.findMany({
      where: { tripId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            // ❌ NO email, password
          },
        },
        likes: { select: { userId: true } },
      } as any,
      orderBy: { createdAt: 'desc' },
    });

    return {
      count: photos.length,
      data: photos.map((p: any) => ({
        id: p.id,
        url: p.url,
        caption: p.caption,
        uploadedAt: p.createdAt,
        uploadedBy: p.user,
        likesCount: p.likes.length,
        likedByCurrentUser: userId ? p.likes.some((l: any) => l.userId === userId) : false,
      })),
    };
  }

  async togglePhotoLike(photoId: string, userId: string) {
    const existing = await (this.prisma as any).photoLike.findUnique({
      where: { photoId_userId: { photoId, userId } },
    });

    if (existing) {
      await (this.prisma as any).photoLike.delete({
        where: { id: existing.id },
      });
      return { liked: false };
    } else {
      await (this.prisma as any).photoLike.create({
        data: { photoId, userId },
      });
      return { liked: true };
    }
  }

  async toggleChecklistItem(
    tripId: string,
    itemId: string,
    userId: string,
    isCompleted: boolean,
  ) {
    const member = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!member) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
      });
      if (trip?.adminId !== userId)
        throw new ForbiddenException('Not a member of this trip');
    }

    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.tripId !== tripId)
      throw new NotFoundException('Item not found');

    return this.prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        isCompleted,
        completedById: isCompleted ? userId : null,
      },
      include: {
        addedBy: { select: { id: true, username: true, profileImage: true } },
        completedBy: {
          select: { id: true, username: true, profileImage: true },
        },
      },
    });
  }

  async removeChecklistItem(tripId: string, itemId: string, userId: string) {
    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.tripId !== tripId)
      throw new NotFoundException('Item not found');

    if (item.addedById !== userId) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
      });
      if (trip?.adminId !== userId)
        throw new ForbiddenException('Not authorized to remove this item');
    }

    await this.prisma.checklistItem.delete({ where: { id: itemId } });
    return { success: true };
  }
}