import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import { NotificationDispatcherService } from './dispatcher.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@Controller(['api/v1/notifications', 'notifications'])
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushService: PushService,
    private readonly dispatcherService: NotificationDispatcherService,
  ) {}

  /**
   * Endpoint 1: Register Push Token
   * POST /api/v1/notifications/register-token
   * POST /api/v1/notifications/push-token
   */
  @Post(['register-token', 'push-token'])
  @ApiOperation({ summary: 'Register or update FCM/APNs push token' })
  async registerPushToken(@Body() body: any, @CurrentUser() user?: any) {
    const userId = body.userId || user?.id || user?._id;
    const token = body.token;
    const platform = body.platform || 'android';
    const appVersion = body.appVersion || '1.0.0';

    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const success = await this.pushService.registerPushToken(
      userId,
      token,
      platform,
      appVersion,
    );

    return {
      success,
      message: success ? 'Push token registered successfully' : 'Failed to register token',
    };
  }

  /**
   * Endpoint 2: Update Preferences
   * PATCH /api/v1/notifications/preferences
   */
  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences (orders, promotions, whatsapp, etc.)' })
  async updatePreferences(@Body() body: any, @CurrentUser() user?: any, @Req() req?: any) {
    const userId = body.userId || user?.id || user?._id || req?.headers['x-user-id'];
    if (!userId) throw new BadRequestException('User ID required to update preferences');

    return this.notificationService.updatePreferences(userId, {
      orderUpdates: body.orderUpdates,
      promotions: body.promotions,
      whatsappInvoices: body.whatsappInvoices,
      emailReceipts: body.emailReceipts,
      dndEnabled: body.dndEnabled,
    });
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get current user notification preferences' })
  async getPreferences(@CurrentUser() user?: any, @Req() req?: any, @Query('userId') queryUserId?: string) {
    const userId = queryUserId || user?.id || user?._id || req?.headers['x-user-id'];
    if (!userId) throw new BadRequestException('User ID required');
    return this.notificationService.getPreferences(userId);
  }

  /**
   * Endpoint 3: Unread Count
   * GET /api/v1/notifications/unread-count
   * GET /notifications/unread-count
   */
  @Get(['unread-count', 'unread'])
  @ApiOperation({ summary: 'Get unread notification count for authenticated actor' })
  async getUnreadCount(
    @CurrentUser() user: any,
    @Req() req: any,
    @Query('userId') queryUserId?: string,
    @Query('storeId') queryStoreId?: string,
    @Query('riderId') queryRiderId?: string,
    @Query('role') queryRole?: string,
  ) {
    const role = queryRole || user?.role || req?.headers['x-role'];
    const storeId = queryStoreId || user?.storeId || req?.headers['x-store-id'];
    const riderId = queryRiderId || user?.riderId || req?.headers['x-rider-id'];
    const recipientId = queryUserId || user?.id || user?._id || req?.headers['x-user-id'];

    const count = await this.notificationService.getUnreadCount({
      recipientId,
      role,
      storeId,
      riderId,
    });

    return {
      success: true,
      count,
      data: { count },
    };
  }

  /**
   * Endpoint 4: Get Notifications History
   * GET /api/v1/notifications/history
   * GET /api/v1/notifications
   */
  @Get(['', 'history'])
  @ApiOperation({ summary: 'Fetch user/store/rider/admin notifications history' })
  async getUserNotifications(
    @CurrentUser() user: any,
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') queryUserId?: string,
    @Query('storeId') queryStoreId?: string,
    @Query('riderId') queryRiderId?: string,
    @Query('role') queryRole?: string,
  ) {
    const role = queryRole || user?.role || req?.headers['x-role'];
    const storeId = queryStoreId || user?.storeId || req?.headers['x-store-id'];
    const riderId = queryRiderId || user?.riderId || req?.headers['x-rider-id'];
    const recipientId = queryUserId || user?.id || user?._id || req?.headers['x-user-id'];

    const result = await this.notificationService.getNotifications({
      recipientId,
      role,
      storeId,
      riderId,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });

    return {
      success: true,
      data: result,
      notifications: result.notifications,
      unreadCount: result.unreadCount,
      total: result.total,
    };
  }

  /**
   * Endpoint 5: Mark as Read
   * POST /api/v1/notifications/:id/read
   * PATCH /api/v1/notifications/:id/read
   */
  @Post([':id/read', ':id/mark-read'])
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: any,
    @Body('userId') bodyUserId?: string,
  ) {
    const userId = bodyUserId || user?.id || user?._id || req?.headers['x-user-id'];
    const updated = await this.notificationService.markAsRead(id, userId);
    return {
      success: true,
      message: 'Notification marked as read',
      data: updated,
    };
  }

  @Post('read-all')
  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current user/store/rider' })
  async markAllAsRead(
    @CurrentUser() user: any,
    @Req() req: any,
    @Body('userId') bodyUserId?: string,
    @Body('storeId') bodyStoreId?: string,
    @Body('riderId') bodyRiderId?: string,
    @Body('role') bodyRole?: string,
  ) {
    const role = bodyRole || user?.role || req?.headers['x-role'];
    const storeId = bodyStoreId || user?.storeId || req?.headers['x-store-id'];
    const riderId = bodyRiderId || user?.riderId || req?.headers['x-rider-id'];
    const recipientId = bodyUserId || user?.id || user?._id || req?.headers['x-user-id'];

    return this.notificationService.markAllAsRead({
      recipientId,
      role,
      storeId,
      riderId,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: any,
    @Query('userId') queryUserId?: string,
  ) {
    const userId = queryUserId || user?.id || user?._id || req?.headers['x-user-id'];
    await this.notificationService.deleteNotification(id, userId);
    return { success: true, message: 'Notification deleted' };
  }

  /**
   * Endpoint 5: Send Custom Notification (Admin)
   * POST /api/v1/notifications/send
   * POST /api/v1/admin/notifications/send
   */
  @Post(['send', 'admin/send'])
  @ApiOperation({ summary: 'Send custom notification across Push, WebSocket, DB, SMS, and Email' })
  async sendCustomNotification(@Body() body: any) {
    const {
      recipients = {},
      channels = ['websocket', 'push', 'db'],
      title,
      body: content,
      deepLink = '',
      type = 'ADMIN_BROADCAST',
      templateKey,
      vars = {},
    } = body;

    if (!title && !templateKey) {
      throw new BadRequestException('Either title or templateKey is required');
    }

    // Direct single user dispatch
    if (body.userId) {
      if (templateKey) {
        return this.dispatcherService.sendFromTemplate({
          templateKey,
          recipientId: body.userId,
          role: body.role || 'CUSTOMER',
          vars: { ...vars, deepLink },
          channels,
        });
      }
      return this.dispatcherService.dispatch({
        userId: body.userId,
        role: body.role || 'CUSTOMER',
        title,
        body: content,
        type,
        deepLink,
        channels,
        data: vars,
      });
    }

    // Recipients list dispatch
    if (recipients.userIds && Array.isArray(recipients.userIds)) {
      const results = await this.dispatcherService.dispatchBatch(recipients.userIds, {
        role: recipients.roles?.[0] || 'CUSTOMER',
        title: title || 'WOMART Alert',
        body: content || '',
        type,
        deepLink,
        channels,
        data: vars,
      });
      return { success: true, ...results };
    }

    return {
      success: true,
      message: 'Notification queued for delivery',
    };
  }

  @Post('test-dispatch')
  @ApiOperation({ summary: 'Test multi-channel notification dispatcher' })
  async testDispatch(@Body() body: any) {
    const { userId, title, body: content, type, channels, templateKey, vars } = body;
    if (templateKey && userId) {
      return this.dispatcherService.sendFromTemplate({
        templateKey,
        recipientId: userId,
        vars: vars || {},
        channels,
      });
    }
    if (!userId || !title || !content) {
      throw new BadRequestException('userId, title, and body are required');
    }
    return this.dispatcherService.dispatch({
      userId,
      title,
      body: content,
      type: type || 'TEST_NOTIFICATION',
      channels: channels || ['websocket', 'push', 'db'],
      data: vars,
    });
  }
}
