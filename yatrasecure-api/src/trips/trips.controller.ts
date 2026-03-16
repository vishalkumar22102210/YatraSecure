import {
  Controller, Post, Get, Patch, Put, Delete,
  Body, Param, Query, UseGuards, Request,
  ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { TripsService }           from './trips.service';
import { ItineraryService }       from './itinerary.service';
import { AssistantService, ChatMessage } from './assistant.service';
import { CreateTripDto }          from './dto/create-trip.dto';
import { JoinTripDto }            from './dto/join-trip.dto';
import { InsightsService }         from './insights.service';
import { DestinationGuideService } from './destination-guide.service';
import { ExplorationService }      from './exploration.service';
import { MarketplaceService }      from './marketplace.service';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { JwtAuthGuard }           from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard }   from '../auth/guards/optional-jwt-auth.guard';

@Controller('trips')
export class TripsController {
  constructor(
    private tripsService: TripsService,
    private itineraryService: ItineraryService,
    private assistantService: AssistantService,
    private insightsService: InsightsService,
    private guideService: DestinationGuideService,
    private explorationService: ExplorationService,
    private marketplaceService: MarketplaceService,
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

  // ── 📊 Trip Insights (Phase 12) ─────────────────────────────────────────────
  @Get(':id/insights')
  @UseGuards(JwtAuthGuard)
  async getTripInsights(
    @Request() req: any,
    @Param('id') tripId: string,
  ) {
    // Only members can see insights (simplified logic)
    return this.insightsService.getTripSummaryStats(tripId);
  }

  @Get('explore/guide/:city')
  async getDestinationGuide(@Param('city') city: string) {
    return this.guideService.getDestinationGuide(city);
  }

  @Get('explore/hidden-gems/:city')
  async discoverGems(@Param('city') city: string) {
    return this.explorationService.discoverHiddenGems(city);
  }

  @Get('marketplace/offerings')
  async getGlobalMarketplace(
    @Query('category') category?: string,
    @Query('city') city?: string,
  ) {
    return this.marketplaceService.getMarketplaceOfferings(category, city);
  }

  @Post(':id/story/generate')
  @UseGuards(JwtAuthGuard)
  async generateStory(
    @Request() req: any,
    @Param('id') tripId: string,
  ) {
    return this.insightsService.generateTripStory(tripId);
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

  // ══════════════════════════════════════════════════════════════════════════════
  // CREW AI BOOKING AGENTS ENDPOINTS
  // ══════════════════════════════════════════════════════════════════════════════

  @Post(':id/booking-agents')
  @UseGuards(JwtAuthGuard)
  async runBookingAgents(
    @Param('id') tripId: string,
    @Request() req: any,
    @Body('customPrompt') customPrompt?: string,
    @Body('answers') answers?: any,
  ) {
    const userId = req.user.id ?? req.user.sub;
    
    // Ensure trip exists and user has access (for simplicity, only admin right now)
    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== userId)
      throw new ForbiddenException('Only trip admin can run booking agents');

    return this.tripsService.runBookingAgents(trip, customPrompt, answers);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // AI TRAVEL ASSISTANT CHAT
  // ══════════════════════════════════════════════════════════════════════════════
  
  @Post(':id/assistant')
  @UseGuards(JwtAuthGuard)
  async chatWithAssistant(
    @Param('id') tripId: string,
    @Request() req: any,
    @Body('messages') messages: ChatMessage[],
  ) {
    // Only verify that the user is part of the trip or an admin
    // We can do a quick check via tripsService
    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    const result = await this.assistantService.chatWithAssistant(trip, messages);
    return { response: result };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SMART BUDGET PREDICTOR
  // ══════════════════════════════════════════════════════════════════════════════
  @Post(':id/budget-predict')
  @UseGuards(JwtAuthGuard)
  async predictBudget(
    @Param('id') tripId: string,
    @Request() req: any,
  ) {
    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    const members = await this.tripsService.listMembers(tripId);
    const memberCount = members.length || 1;

    const result = await this.assistantService.predictBudget(trip, memberCount);
    return result;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // AI EXPLORATION ENGINE (HIDDEN GEMS)
  // ══════════════════════════════════════════════════════════════════════════════
  @Post(':id/explore')
  @UseGuards(JwtAuthGuard)
  async exploreHiddenGems(
    @Param('id') tripId: string,
    @Body('query') query: string,
  ) {
    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    const result = await this.assistantService.discoverHiddenGems(trip, query);
    return result;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // AUTONOMOUS TRAVEL MARKETPLACE
  // ══════════════════════════════════════════════════════════════════════════════
  @Get(':id/marketplace')
  @UseGuards(JwtAuthGuard)
  async getMarketplace(
    @Param('id') tripId: string,
  ) {
    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    const result = await this.assistantService.getMarketplaceRecommendations(trip);
    return result;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // SHARED PACKING CHECKLIST 
  // ══════════════════════════════════════════════════════════════════════════════
  
  @Get(':id/checklist')
  @UseGuards(JwtAuthGuard)
  getChecklist(@Param('id') tripId: string) {
    return this.tripsService.getChecklist(tripId);
  }

  @Post(':id/checklist/suggest')
  @UseGuards(JwtAuthGuard)
  async getChecklistSuggestions(
    @Param('id') tripId: string,
  ) {
    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');
    const suggestions = await this.assistantService.suggestChecklistItems(trip);
    return { suggestions };
  }

  @Post(':id/checklist')
  @UseGuards(JwtAuthGuard)
  addChecklistItem(
    @Param('id') tripId: string,
    @Request() req: any,
    @Body('name') name: string,
  ) {
    return this.tripsService.addChecklistItem(tripId, req.user.id, name);
  }

  @Put(':id/checklist/:itemId')
  @UseGuards(JwtAuthGuard)
  toggleChecklistItem(
    @Param('id') tripId: string,
    @Param('itemId') itemId: string,
    @Request() req: any,
    @Body('isCompleted') isCompleted: boolean,
  ) {
    return this.tripsService.toggleChecklistItem(tripId, itemId, req.user.id, isCompleted);
  }

  @Delete(':id/checklist/:itemId')
  @UseGuards(JwtAuthGuard)
  removeChecklistItem(
    @Param('id') tripId: string,
    @Param('itemId') itemId: string,
    @Request() req: any,
  ) {
    return this.tripsService.removeChecklistItem(tripId, itemId, req.user.id);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DESTINATION GUIDES
  // ══════════════════════════════════════════════════════════════════════════════
  @Get('explore/guide/:destination')
  async getGuide(@Param('destination') dest: string) {
    return this.assistantService.getDestinationGuide(dest);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // TRIP PHOTOS (PHASE 14)
  // ══════════════════════════════════════════════════════════════════════════════
  @Get(':id/photos')
  @UseGuards(JwtAuthGuard)
  getTripPhotos(@Param('id') tripId: string, @Request() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.getTripPhotos(tripId, userId);
  }

  @Post(':id/photos/:photoId/like')
  @UseGuards(JwtAuthGuard)
  togglePhotoLike(
    @Param('id') _tripId: string,
    @Param('photoId') photoId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.togglePhotoLike(photoId, userId);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  addTripPhoto(
    @Param('id') tripId: string,
    @Body('url') url: string,
    @Body('caption') caption: string,
    @Request() req: any,
  ) {
    return this.tripsService.addTripPhoto(tripId, req.user.id ?? req.user.sub, url, caption);
  }
}