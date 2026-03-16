import { Controller, Get, Patch, Body, UseGuards, Request, Param, Post, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // GET /api/users/me - Get current logged-in user
  @Get('me')
  @UseGuards(JwtAuthGuard) // 👈 Protected route
  async getCurrentUser(@Request() req) {
    return req.user; // User is attached by JWT strategy
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // FRIENDS & FOLLOW SYSTEM
  // ══════════════════════════════════════════════════════════════════════════════
  @Get('profile/:username')
  async getProfile(@Request() req, @Param('username') username: string) {
    // Optional auth extraction to see if current user follows them
    const authHeader = req.headers.authorization;
    let currentUserId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
       try {
         // rudimentary check if we want, or just assume frontend passes it via guard
         // Better: use an OptionalJwtGuard if needed. 
       } catch (e) {}
    }
    // For simplicity, we'll let frontend pass ?userId= current user id
    const cId = req.query.userId;
    return this.usersService.getPublicProfile(username, cId);
  }

  @Post('profile/:username/follow')
  @UseGuards(JwtAuthGuard)
  async followUser(@Request() req, @Param('username') username: string) {
    await this.usersService.followUser(req.user.id, username);
    return { message: 'Followed successfully' };
  }

  @Delete('profile/:username/follow')
  @UseGuards(JwtAuthGuard)
  async unfollowUser(@Request() req, @Param('username') username: string) {
    await this.usersService.unfollowUser(req.user.id, username);
    return { message: 'Unfollowed successfully' };
  }
}
