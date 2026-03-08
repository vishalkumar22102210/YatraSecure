import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, Query, UseGuards, Request,
  ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { TripsService }           from './trips.service';
import { ItineraryService }       from './itinerary.service';
import { CreateTripDto }          from './dto/create-trip.dto';
import { JoinTripDto }            from './dto/join-trip.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { JwtAuthGuard }           from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard }   from '../auth/guards/optional-jwt-auth.guard';

@Controller('trips')
export class TripsController {
  constructor(
    private tripsService: TripsService,
    private itineraryService: ItineraryService,
  ) {}

  // ── Create Trip ──────────────────────────────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard)
  async createTrip(@Request() req: any, @Body() dto: CreateTripDto) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.createTrip(userId, dto);
  }

  // ── List Trips ────���──────────────────────────────────────────────────────────
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async listTrips(@Query() query: any, @Request() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub ?? undefined;
    return this.tripsService.findAll(query, userId);
  }

  // ── Get Trip by ID ───────────────────────────────────────────────────────────
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getTrip(@Param('id') id: string, @Request() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub ?? undefined;
    return this.tripsService.getTripById(id, userId);
  }

  // ── Update Trip ──────────────────────────────────────────────────────────────
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateTrip(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: any,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.updateTrip(id, updateDto, userId);
  }

  // ── Delete Trip ──────────────────────────────────────────────────────────────
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteTrip(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.deleteTrip(id, userId);
  }

  // ── Request to Join (Public trips) ──────────────────────────────────────────
  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinTrip(
    @Request() req: any,
    @Param('id') tripId: string,
    @Body() dto: JoinTripDto,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.requestToJoinTrip(tripId, userId, dto);
  }

  // ── Join by Invite Code ──────────────────────────────────────────────────────
  @Post('join/invite')
  @UseGuards(JwtAuthGuard)
  async joinByInviteCode(
    @Request() req: any,
    @Body('code') code: string,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.joinByInviteCode(code, userId);
  }

  // ── List Join Requests (Admin) ───────────────────────────────────────────────
  @Get(':id/requests')
  @UseGuards(JwtAuthGuard)
  async getJoinRequests(
    @Request() req: any,
    @Param('id') tripId: string,
  ) {
    const adminId = req.user.id ?? req.user.sub;
    return this.tripsService.listJoinRequests(tripId, adminId);
  }

  // ── Update Join Request Status (Admin) ──────────────────────────────────────
  @Patch(':id/requests/:requestId')
  @UseGuards(JwtAuthGuard)
  async updateJoinRequestStatus(
    @Request() req: any,
    @Param('id') tripId: string,
    @Param('requestId') requestId: string,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    const adminId = req.user.id ?? req.user.sub;
    return this.tripsService.updateJoinRequest(tripId, requestId, adminId, dto);
  }

  // ── List Members ─────────────────────────────────────────────────────────────
  @Get(':id/members')
  async listMembers(@Param('id') tripId: string) {
    return this.tripsService.listMembers(tripId);
  }

  // ── Regenerate Invite Code ───────────────────────────────────────────────────
  @Post(':id/invite/regenerate')
  @UseGuards(JwtAuthGuard)
  async regenerateInviteCode(
    @Request() req: any,
    @Param('id') tripId: string,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.regenerateInviteCode(tripId, userId);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ITINERARY ENDPOINTS
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Generate Itinerary with Groq AI ─────────────────────────────────────────
  @Post(':id/itinerary/generate')
  @UseGuards(JwtAuthGuard)
  async generateItinerary(
    @Param('id') tripId: string,
    @Request() req: any,
    @Body('customPrompt') customPrompt?: string,
  ) {
    const userId = req.user.id ?? req.user.sub;

    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== userId)
      throw new ForbiddenException('Only trip admin can generate itinerary');

    const itinerary = await this.itineraryService.generateItinerary(
      {
        name:        trip.name,
        fromCity:    trip.fromCity,
        toCity:      trip.toCity,
        startDate:   trip.startDate.toISOString(),
        endDate:     trip.endDate.toISOString(),
        budget:      trip.budget,
        tripType:    trip.tripType,
        description: trip.description ?? undefined,
      },
      customPrompt,
    );

    await this.tripsService.updateItinerary(tripId, itinerary);
    return { itinerary };
  }

  // ── Save / Edit Itinerary ────────────────────────────────────────────────────
  @Patch(':id/itinerary')
  @UseGuards(JwtAuthGuard)
  async updateItinerary(
    @Param('id') tripId: string,
    @Body('itinerary') itinerary: string,
    @Request() req: any,
  ) {
    const userId = req.user.id ?? req.user.sub;

    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== userId)
      throw new ForbiddenException('Only trip admin can edit itinerary');

    const updated = await this.tripsService.updateItinerary(tripId, itinerary);
    return { itinerary: updated.itinerary };
  }
}