import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ItineraryService } from './itinerary.service';
import { ChatAIAssistantService } from '../chat/chat-ai-assistant.service';
import { InsightsService } from './insights.service';
import { DestinationGuideService } from './destination-guide.service';
import { ExplorationService } from './exploration.service';
import { MarketplaceService } from './marketplace.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AssistantService } from './assistant.service';
import { MatchmakingModule } from '../common/matchmaking/matchmaking.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [PrismaModule, NotificationsModule, MatchmakingModule, CommonModule],
  controllers: [TripsController],
  providers: [
    TripsService, 
    ItineraryService, 
    AssistantService, 
    ChatAIAssistantService, 
    InsightsService, 
    DestinationGuideService,
    ExplorationService,
    MarketplaceService
  ],
  exports: [TripsService, InsightsService, DestinationGuideService, ExplorationService, MarketplaceService],
})
export class TripsModule {}
