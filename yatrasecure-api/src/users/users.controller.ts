import { 
  Controller, 
  Get, 
  Patch, 
  Body, 
  Param, 
  Query,
  UseGuards, 
  Request, 
  Post, 
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MatchmakingService } from '../common/matchmaking/matchmaking.service';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private matchmakingService: MatchmakingService,
  ) {}

  /**
   * GET /users
   * ✅ SECURE: Public - returns minimal user list, paginated
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.usersService.findAll(pageNumber, limitNumber);
  }

  /**
   * GET /users/matches
   * ✅ SECURE: Protected - returns AI-scored user match suggestions
   */
  @Get('matches')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMatches(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.sub || req.user?.id;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.matchmakingService.getMatches(userId, limitNum);
  }

  /**
   * GET /users/me
   * ✅ SECURE: Protected - returns own user data
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Request() req: any) {
    return this.usersService.findById(req.user?.sub || req.user?.id);
  }

  /**
   * PATCH /users/me
   * ✅ SECURE: Protected - update own profile
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user?.sub || req.user?.id, updateProfileDto);
  }

  /**
   * GET /users/profile/:username
   * ✅ SECURE: Public - returns safe profile data (NO email)
   */
  @Get('profile/:username')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  /**
   * POST /users/profile/:username/follow
   * ✅ SECURE: Protected - follow user
   */
  @Post('profile/:username/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async followUser(
    @Request() req: any,
    @Param('username') username: string,
  ) {
    return this.usersService.followUser(req.user?.sub || req.user?.id, username);
  }

  /**
   * DELETE /users/profile/:username/follow
   * ✅ SECURE: Protected - unfollow user
   */
  @Delete('profile/:username/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unfollowUser(
    @Request() req: any,
    @Param('username') username: string,
  ) {
    return this.usersService.unfollowUser(req.user?.sub || req.user?.id, username);
  }

  /**
   * GET /users/profile/:username/followers
   * ✅ SECURE: Protected - returns minimal user data with mutual flags
   */
  @Get('profile/:username/followers')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getFollowers(@Request() req: any, @Param('username') username: string) {
    return this.usersService.getFollowers(username, req.user?.sub || req.user?.id);
  }

  /**
   * GET /users/profile/:username/following
   * ✅ SECURE: Protected - returns minimal user data with mutual flags
   */
  @Get('profile/:username/following')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getFollowing(@Request() req: any, @Param('username') username: string) {
    return this.usersService.getFollowing(username, req.user?.sub || req.user?.id);
  }

  /**
   * GET /users/profile/:username/mutuals
   * ✅ SECURE: Protected - returns users that both logged in user and target user follow
   */
  @Get('profile/:username/mutuals')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMutuals(@Request() req: any, @Param('username') username: string) {
    return this.usersService.getMutualConnections(username, req.user?.sub || req.user?.id);
  }
}