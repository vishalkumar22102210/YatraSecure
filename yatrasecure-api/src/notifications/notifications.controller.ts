import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req: any, @Query('unreadOnly') unreadOnly?: string) {
    const userId = req.user?.sub || req.user?.id;
    return this.notificationsService.getUserNotifications(
      userId,
      unreadOnly === 'true',
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    await this.notificationsService.markAsRead(id, userId);
    return { message: 'Notification marked as read' };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    await this.notificationsService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    await this.notificationsService.deleteNotification(id, userId);
    return { message: 'Notification deleted' };
  }

  @Delete('clear-read')
  @HttpCode(HttpStatus.OK)
  async deleteAllRead(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    await this.notificationsService.deleteAllRead(userId);
    return { message: 'Read notifications cleared' };
  }
}