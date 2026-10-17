import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { NOTIFICATION_TEMPLATES, NotificationTemplate } from './templates/notification-templates';
import { NotificationDispatcherService, NotificationChannel } from './dispatcher.service';

export interface SendFromTemplateOptions {
  templateKey: keyof typeof NOTIFICATION_TEMPLATES | string;
  recipientId: string;
  vars?: Record<string, any>;
  overrideChannels?: NotificationChannel[];
  email?: string;
  phone?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  /**
   * Persist a notification in MongoDB
   */
  async createNotification(
    userId: string,
    title: string,
    body: string,
    type: string = 'ORDER_STATUS',
    data: Record<string, any> = {},
    role: string = 'CUSTOMER',
    deepLink: string = '',
    channels: string[] = ['websocket', 'push', 'db'],
  ): Promise<NotificationDocument> {
    try {
      const doc = new this.notificationModel({
        userId: new Types.ObjectId(userId),
        role,
        title,
        body,
        type,
        isRead: false,
        deepLink,
        channels,
        data,
      });
      return await doc.save();
    } catch (e: any) {
      this.logger.error(`[NotificationService] Error creating notification: ${e.message}`);
      throw e;
    }
  }

  /**
   * Fetch paginated notifications for a user
   */
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const filter = { userId: new Types.ObjectId(userId) };

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({ ...filter, isRead: false }),
    ]);

    return {
      notifications: notifications.map((n: any) => ({
        id: n._id.toString(),
        title: n.title,
        body: n.body,
        type: n.type,
        role: n.role,
        read: n.isRead,
        deepLink: n.deepLink || '',
        data: n.data || {},
        createdAt: n.createdAt,
      })),
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { $set: { isRead: true } },
      { new: true },
    );
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string) {
    const res = await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } },
    );
    return { modifiedCount: res.modifiedCount, success: true };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    return this.notificationModel.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    });
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    prefs: {
      orderUpdates?: boolean;
      promotions?: boolean;
      whatsappInvoices?: boolean;
      emailReceipts?: boolean;
      dndEnabled?: boolean;
    },
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const currentPrefs = user.notificationPrefs || {
      orderUpdates: true,
      promotions: true,
      whatsappInvoices: true,
      emailReceipts: true,
      dndEnabled: false,
    };

    user.notificationPrefs = {
      ...currentPrefs,
      ...prefs,
    };

    await user.save();
    return {
      success: true,
      message: 'Notification preferences updated',
      preferences: user.notificationPrefs,
    };
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string) {
    const user = await this.userModel.findById(userId).select('notificationPrefs').lean();
    return {
      success: true,
      preferences: user?.notificationPrefs || {
        orderUpdates: true,
        promotions: true,
        whatsappInvoices: true,
        emailReceipts: true,
        dndEnabled: false,
      },
    };
  }
}
