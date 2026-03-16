import { Module, Global } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';

@Global()
@Module({
  providers: [MatchmakingService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
