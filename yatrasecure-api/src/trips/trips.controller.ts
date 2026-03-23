import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { ItineraryService } from './itinerary.service';
import { AssistantService, ChatMessage } from './assistant.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { JoinTripDto } from './dto/join-trip.dto';
import { InsightsService } from './insights.service';
import { DestinationGuideService } from './destination-guide.service';
import { ExplorationService } from './exploration.service';
import { MarketplaceService } from './marketplace.service';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

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

  // ═══════════════════════════════════════════════════════════════════════════════
  // TRIP CRUD
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createTrip(@Request() req: any, @Body() dto: CreateTripDto) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.createTrip(userId, dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async listTrips(@Query() query: any, @Request() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub ?? undefined;
    return this.tripsService.findAll(query, userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getTrip(@Param('id') id: string, @Request() req: any) {
    const userId = req?.user?.id ?? req?.user?.sub ?? undefined;
    return this.tripsService.getTripById(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateTrip(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: any,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.updateTrip(id, updateDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteTrip(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.deleteTrip(id, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MEMBERS - ✅ SECURE: Safe data only
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/members')
  @HttpCode(HttpStatus.OK)
  async listMembers(@Param('id') tripId: string) {
    return this.tripsService.listMembers(tripId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // JOIN REQUESTS - ✅ SECURE: Admin only
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/requests')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getJoinRequests(
    @Request() req: any,
    @Param('id') tripId: string,
  ) {
    const adminId = req.user.id ?? req.user.sub;
    return this.tripsService.listJoinRequests(tripId, adminId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async joinTrip(
    @Request() req: any,
    @Param('id') tripId: string,
    @Body() dto: JoinTripDto,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.requestToJoinTrip(tripId, userId, dto);
  }

  @Post('join/invite')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async joinByInviteCode(
    @Request() req: any,
    @Body('code') code: string,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.joinByInviteCode(code, userId);
  }

  @Patch(':id/requests/:requestId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateJoinRequestStatus(
    @Request() req: any,
    @Param('id') tripId: string,
    @Param('requestId') requestId: string,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    const adminId = req.user.id ?? req.user.sub;
    return this.tripsService.updateJoinRequest(tripId, requestId, adminId, dto);
  }

  @Post(':id/invite/regenerate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async regenerateInviteCode(
    @Request() req: any,
    @Param('id') tripId: string,
  ) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.regenerateInviteCode(tripId, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ITINERARY
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/itinerary/generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
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
        name: trip.name,
        fromCity: trip.fromCity,
        toCity: trip.toCity,
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        budget: trip.budget,
        tripType: trip.tripType,
        description: trip.description ?? undefined,
      },
      customPrompt,
    );

    await this.tripsService.updateItinerary(tripId, itinerary);
    return { itinerary };
  }

  @Patch(':id/itinerary')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // CREW AI BOOKING AGENTS
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/booking-agents')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async runBookingAgents(
    @Param('id') tripId: string,
    @Request() req: any,
    @Body('customPrompt') customPrompt?: string,
    @Body('answers') answers?: any,
  ) {
    const userId = req.user.id ?? req.user.sub;

    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.adminId !== userId)
      throw new ForbiddenException('Only trip admin can run booking agents');

    return this.tripsService.runBookingAgents(trip, customPrompt, answers);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // AI TRAVEL ASSISTANT
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/assistant')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async chatWithAssistant(
    @Param('id') tripId: string,
    @Request() req: any,
    @Body('messages') messages: ChatMessage[],
  ) {
    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    const result = await this.assistantService.chatWithAssistant(trip, messages);
    return { response: result };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BUDGET PREDICTOR
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/budget-predict')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async predictBudget(
    @Param('id') tripId: string,
    @Request() req: any,
  ) {
    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    const members = await this.tripsService.listMembers(tripId);
    const memberCount = (members as any).data?.length || 1;

    const result = await this.assistantService.predictBudget(
      trip,
      memberCount,
    );
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EXPLORATION ENGINE
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post(':id/explore')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async exploreHiddenGems(
    @Param('id') tripId: string,
    @Body('query') query: string,
  ) {
    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    const result = await this.assistantService.discoverHiddenGems(trip, query);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MARKETPLACE
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/marketplace')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMarketplace(@Param('id') tripId: string) {
    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    const result =
      await this.assistantService.getMarketplaceRecommendations(trip);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHECKLIST
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/checklist')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getChecklist(@Param('id') tripId: string) {
    return this.tripsService.getChecklist(tripId);
  }

  @Post(':id/checklist/suggest')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getChecklistSuggestions(@Param('id') tripId: string) {
    const trip = await this.tripsService.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');
    const suggestions = await this.assistantService.suggestChecklistItems(
      trip,
    );
    return { suggestions };
  }

  @Post(':id/checklist')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  addChecklistItem(
    @Param('id') tripId: string,
    @Request() req: any,
    @Body('name') name: string,
  ) {
    return this.tripsService.addChecklistItem(
      tripId,
      req.user.id ?? req.user.sub,
      name,
    );
  }

  @Put(':id/checklist/:itemId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  toggleChecklistItem(
    @Param('id') tripId: string,
    @Param('itemId') itemId: string,
    @Request() req: any,
    @Body('isCompleted') isCompleted: boolean,
  ) {
    return this.tripsService.toggleChecklistItem(
      tripId,
      itemId,
      req.user.id ?? req.user.sub,
      isCompleted,
    );
  }

  @Delete(':id/checklist/:itemId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  removeChecklistItem(
    @Param('id') tripId: string,
    @Param('itemId') itemId: string,
    @Request() req: any,
  ) {
    return this.tripsService.removeChecklistItem(
      tripId,
      itemId,
      req.user.id ?? req.user.sub,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PUBLIC EXPLORATION
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('explore/guide/:city')
  @HttpCode(HttpStatus.OK)
  async getDestinationGuide(@Param('city') city: string) {
    return this.guideService.getDestinationGuide(city);
  }

  @Get('explore/hidden-gems/:city')
  @HttpCode(HttpStatus.OK)
  async discoverGems(@Param('city') city: string) {
    return this.explorationService.discoverHiddenGems(city);
  }

  @Get('marketplace/offerings')
  @HttpCode(HttpStatus.OK)
  async getGlobalMarketplace(
    @Query('category') category?: string,
    @Query('city') city?: string,
  ) {
    return this.marketplaceService.getMarketplaceOfferings(category, city);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/insights')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getTripInsights(
    @Request() req: any,
    @Param('id') tripId: string,
  ) {
    return this.insightsService.getTripSummaryStats(tripId);
  }

  @Post(':id/story/generate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async generateStory(
    @Request() req: any,
    @Param('id') tripId: string,
  ) {
    return this.insightsService.generateTripStory(tripId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PHOTOS - ✅ SECURE: Safe user data
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id/photos')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getTripPhotos(@Param('id') tripId: string, @Request() req: any) {
    const userId = req.user.id ?? req.user.sub;
    return this.tripsService.getTripPhotos(tripId, userId);
  }

  @Post(':id/photos/:photoId/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.CREATED)
  addTripPhoto(
    @Param('id') tripId: string,
    @Body('url') url: string,
    @Body('caption') caption: string,
    @Request() req: any,
  ) {
    return this.tripsService.addTripPhoto(
      tripId,
      req.user.id ?? req.user.sub,
      url,
      caption,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DESTINATION GUIDES (Duplicate - moved to public)
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('explore/guide/:destination')
  @HttpCode(HttpStatus.OK)
  async getGuide(@Param('destination') dest: string) {
    return this.assistantService.getDestinationGuide(dest);
  }
}