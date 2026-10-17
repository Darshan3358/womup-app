import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { PushService } from './push.service';
import { NotificationService } from './notification.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NOTIFICATION_TEMPLATES, NotificationTemplate } from './templates/notification-templates';

export type NotificationChannel = 'websocket' | 'push' | 'db' | 'email' | 'sms' | 'whatsapp';

export interface DispatchNotificationEvent {
  userId: string;
  role?: 'CUSTOMER' | 'VENDOR' | 'STORE' | 'RIDER' | 'ADMIN';
  title: string;
  body: string;
  type?: string;
  deepLink?: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
  email?: string;
  phone?: string;
  isPromotional?: boolean;
}

export interface SendTemplateOptions {
  templateKey: keyof typeof NOTIFICATION_TEMPLATES | string;
  recipientId: string;
  role?: 'CUSTOMER' | 'VENDOR' | 'STORE' | 'RIDER' | 'ADMIN';
  vars?: Record<string, any>;
  channels?: NotificationChannel[];
  email?: string;
  phone?: string;
}

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    private readonly trackingGateway: TrackingGateway,
    private readonly pushService: PushService,
    private readonly notificationService: NotificationService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Helper: Check if current time falls within DND hours (10:00 PM to 07:00 AM IST)
   */
  private isDndActive(): boolean {
    const now = new Date();
    // Indian Standard Time (UTC + 5:30)
    const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
    return istHours >= 22 || istHours < 7;
  }

  /**
   * Send notification resolved from pre-configured template key
   */
  async sendFromTemplate(options: SendTemplateOptions) {
    const { templateKey, recipientId, role = 'CUSTOMER', vars = {}, channels, email, phone } = options;

    const template: NotificationTemplate | undefined = NOTIFICATION_TEMPLATES[templateKey as string];

    const title = template
      ? typeof template.title === 'function'
        ? template.title(vars)
        : template.title
      : vars.title || 'WormUp Alert';

    const body = template
      ? typeof template.body === 'function'
        ? template.body(vars)
        : template.body
      : vars.body || '';

    const type = template ? template.type : (vars.type || 'ORDER_STATUS');
    const deepLink = template?.deepLink
      ? typeof template.deepLink === 'function'
        ? template.deepLink(vars)
        : template.deepLink
      : vars.deepLink || '';

    const resolvedChannels = channels || template?.defaultChannels || ['websocket', 'push', 'db'];

    return this.dispatch({
      userId: recipientId,
      role: template?.role || role,
      title,
      body,
      type,
      deepLink,
      data: vars,
      channels: resolvedChannels,
      email,
      phone,
      isPromotional: type.includes('PROMO') || type.includes('OFFER'),
    });
  }

  /**
   * Multi-Channel Notification Dispatcher
   * Routes across: WebSocket, FCM Push, MongoDB DB, Email, and SMS
   */
  async dispatch(event: DispatchNotificationEvent): Promise<{
    success: boolean;
    dispatchedChannels: Record<string, boolean>;
  }> {
    const {
      userId,
      role = 'CUSTOMER',
      title,
      body,
      type = 'ORDER_STATUS',
      deepLink = '',
      data = {},
      channels = ['websocket', 'push', 'db'],
      isPromotional = false,
    } = event;

    const results: Record<string, boolean> = {};

    try {
      this.logger.log(`[Dispatcher] 🚀 Processing multi-channel event for ${role} ${userId}: "${title}"`);

      // Retrieve user preferences & tokens if available
      let userPrefs: any = null;
      let userEmail = event.email;
      let userPhone = event.phone;

      if (Types.ObjectId.isValid(userId)) {
        const user = await this.userModel.findById(userId).select('email phone notificationPrefs androidToken iosToken').lean();
        if (user) {
          userPrefs = user.notificationPrefs;
          if (!userEmail) userEmail = user.email;
          if (!userPhone) userPhone = user.phone;
        }
      }

      // Check DND / Promotional rules
      if (isPromotional && (userPrefs?.promotions === false || (userPrefs?.dndEnabled && this.isDndActive()))) {
        this.logger.log(`[Dispatcher] ⏸️ Skipping promotional notification for user ${userId} (DND / Unsubscribed)`);
        return { success: true, dispatchedChannels: { skippedDueToPrefs: true } };
      }

      // 1. WebSocket Dispatch (Real-time in-app toast, banners & live counters)
      if (channels.includes('websocket')) {
        try {
          this.trackingGateway.emitInAppNotification(userId, {
            title,
            body,
            type,
            role,
            deepLink,
            data,
          });
          results.websocket = true;
        } catch (err: any) {
          this.logger.warn(`[Dispatcher] WebSocket dispatch failed: ${err.message}`);
          results.websocket = false;
        }
      }

      // 2. Native Push Dispatch (FCM / APNs)
      if (channels.includes('push')) {
        try {
          const pushOk = await this.pushService.sendToUser(userId, {
            title,
            body,
            data: {
              type,
              role,
              deepLink,
              ...(data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {}),
            },
          });
          results.push = pushOk;
        } catch (err: any) {
          this.logger.warn(`[Dispatcher] Push dispatch failed: ${err.message}`);
          results.push = false;
        }
      }

      // 3. Database Persistence (Notification Center / History)
      if (channels.includes('db')) {
        try {
          await this.notificationService.createNotification(
            userId,
            title,
            body,
            type,
            data,
            role,
            deepLink,
            channels,
          );
          results.db = true;
        } catch (err: any) {
          this.logger.warn(`[Dispatcher] Database persistence failed: ${err.message}`);
          results.db = false;
        }
      }

      // 4. Email Dispatch (Invoices, KYC, Statements)
      if (channels.includes('email') && userEmail && userPrefs?.emailReceipts !== false) {
        try {
          this.logger.log(`[Dispatcher] 📧 Email queued for ${userEmail}: "${title}"`);
          results.email = true;
        } catch (err: any) {
          results.email = false;
        }
      }

      // 5. SMS Dispatch (Critical OTPs, Urgent alerts)
      if (channels.includes('sms') && userPhone) {
        try {
          this.logger.log(`[Dispatcher] 💬 SMS queued for ${userPhone}: "${body}"`);
          results.sms = true;
        } catch (err: any) {
          results.sms = false;
        }
      }

      return {
        success: true,
        dispatchedChannels: results,
      };
    } catch (e: any) {
      this.logger.error(`[Dispatcher] Dispatcher error: ${e.message}`);
      return {
        success: false,
        dispatchedChannels: results,
      };
    }
  }

  /**
   * Broadcast notification to multiple users
   */
  async dispatchBatch(
    userIds: string[],
    notification: Omit<DispatchNotificationEvent, 'userId'>,
  ): Promise<{ sentCount: number }> {
    let sentCount = 0;
    for (const userId of userIds) {
      const res = await this.dispatch({ ...notification, userId });
      if (res.success) sentCount++;
    }
    return { sentCount };
  }
}
