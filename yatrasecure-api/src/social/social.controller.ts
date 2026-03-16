import { Controller, Post, Delete, Get, Param, UseGuards, Req } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private socialService: SocialService) {}

  @Post('follow/:userId')
  async follow(
    @Req() req: any,
    @Param('userId') followingId: string,
  ) {
    return this.socialService.followUser(req.user.sub ?? req.user.id, followingId);
  }

  @Delete('unfollow/:userId')
  async unfollow(
    @Req() req: any,
    @Param('userId') followingId: string,
  ) {
    return this.socialService.unfollowUser(req.user.sub ?? req.user.id, followingId);
  }

  @Get('stats/:userId')
  async getStats(@Param('userId') userId: string) {
    return this.socialService.getSocialStats(userId);
  }

  @Get('following/:userId')
  async getFollowing(@Param('userId') userId: string) {
    return this.socialService.getFollowing(userId);
  }

  @Get('followers/:userId')
  async getFollowers(@Param('userId') userId: string) {
    return this.socialService.getFollowers(userId);
  }

  @Get('suggestions')
  async getSuggestions(@Req() req: any) {
    return this.socialService.getSuggestedTravelers(req.user.sub ?? req.user.id);
  }

  @Get('is-following/:userId')
  async isFollowing(
    @Req() req: any,
    @Param('userId') followingId: string,
  ) {
    const following = await this.socialService.isFollowing(req.user.sub ?? req.user.id, followingId);
    return { following };
  }
}
