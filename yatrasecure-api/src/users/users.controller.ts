import { 
  Controller, 
  Get, 
  Patch, 
  Body, 
  Param, 
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

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * GET /users/me
   * ✅ SECURE: Protected - returns own user data
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Request() req: any) {
    return this.usersService.findById(req.user.sub);
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
    return this.usersService.updateProfile(req.user.sub, updateProfileDto);
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
    return this.usersService.followUser(req.user.sub, username);
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
    return this.usersService.unfollowUser(req.user.sub, username);
  }

  /**
   * GET /users/profile/:username/followers
   * ✅ SECURE: Public - returns minimal user data
   */
  @Get('profile/:username/followers')
  @HttpCode(HttpStatus.OK)
  async getFollowers(@Param('username') username: string) {
    return this.usersService.getFollowers(username);
  }

  /**
   * GET /users/profile/:username/following
   * ✅ SECURE: Public - returns minimal user data
   */
  @Get('profile/:username/following')
  @HttpCode(HttpStatus.OK)
  async getFollowing(@Param('username') username: string) {
    return this.usersService.getFollowing(username);
  }
}