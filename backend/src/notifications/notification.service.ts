import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { TrackingGateway } from '../tracking/tracking.gateway';

export interface CreateNotificationParams {
  recipientType?: 'CUSTOMER' | 'ADMIN' | 'STORE' | 'RIDER' | 'VENDOR';
  recipientId: string;
  userId?: string;
  role?: string;
  storeId?: string;
  riderId?: string;
  customerId?: string;
  areaId?: string;
  title: string;
  message?: string;
  body?: string;
  type?: string;
  entityType?: string;
  entityId?: string;
  orderId?: string;
  actionType?: string;
  metadata?: Record<string, any>;
  dedupeKey?: string;
  deepLink?: string;
  channels?: string[];
  data?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => TrackingGateway))
    private readonly trackingGateway: TrackingGateway,
  ) {}

  /**
   * Production-grade idempotent notification creator.
   * Prevents duplicates via dedupeKey, persists to MongoDB, and emits via scoped Socket.IO rooms.
   */
  async create(params: CreateNotificationParams): Promise<any> {
    const {
      dedupeKey,
      title,
      message,
      body,
      type = 'ORDER_STATUS',
      entityType,
      entityId,
      orderId,
      storeId,
      riderId,
      customerId,
      areaId,
      actionType,
      metadata = {},
      deepLink = '',
      channels = ['websocket', 'push', 'db'],
      data = {},
    } = params;

    const resolvedRole = (params.role || params.recipientType || 'CUSTOMER').toUpperCase();
    const resolvedRecipientType: 'CUSTOMER' | 'ADMIN' | 'STORE' | 'RIDER' | 'VENDOR' =
      params.recipientType ||
      (resolvedRole === 'STORE' || resolvedRole === 'VENDOR'
        ? 'STORE'
        : resolvedRole === 'RIDER'
        ? 'RIDER'
        : resolvedRole === 'ADMIN'
        ? 'ADMIN'
        : 'CUSTOMER');

    const resolvedRecipientId =
      params.recipientId ||
      (resolvedRecipientType === 'STORE' ? storeId : resolvedRecipientType === 'RIDER' ? riderId : params.userId) ||
      'system';

    const content = message || body || '';

    // 1. Idempotency Check
    if (dedupeKey) {
      try {
        const existing = await this.notificationModel.findOne({ dedupeKey }).lean();
        if (existing) {
          this.logger.debug(`[NotificationService] Duplicate suppressed via dedupeKey "${dedupeKey}"`);
          return this.formatNotification(existing);
        }
      } catch (err) {
        // Continue to save attempt
      }
    }

    // 2. Prepare Database Record
    let userIdObj: Types.ObjectId | undefined = undefined;
    if (params.userId && Types.ObjectId.isValid(params.userId)) {
      userIdObj = new Types.ObjectId(params.userId);
    } else if (resolvedRecipientType === 'CUSTOMER' && Types.ObjectId.isValid(resolvedRecipientId)) {
      userIdObj = new Types.ObjectId(resolvedRecipientId);
    }

    let savedDoc: any = null;
    try {
      savedDoc = await this.notificationModel.create({
        recipientType: resolvedRecipientType,
        recipientId: resolvedRecipientId.toString(),
        userId: userIdObj,
        role: resolvedRole,
        storeId: storeId ? storeId.toString() : undefined,
        riderId: riderId ? riderId.toString() : undefined,
        customerId: customerId ? customerId.toString() : undefined,
        areaId: areaId ? areaId.toString() : undefined,
        title,
        message: content,
        body: content,
        type,
        entityType,
        entityId,
        orderId,
        actionType,
        metadata: { ...metadata, ...(data || {}) },
        data: { ...metadata, ...(data || {}) },
        dedupeKey,
        deepLink,
        channels,
        isRead: false,
      });
    } catch (err: any) {
      // MongoDB E11000 duplicate key error
      if (err.code === 11000 && dedupeKey) {
        this.logger.warn(`[NotificationService] E11000 duplicate dedupeKey "${dedupeKey}". Returning existing record.`);
        const existing = await this.notificationModel.findOne({ dedupeKey }).lean();
        if (existing) return this.formatNotification(existing);
      }
      this.logger.error(`[NotificationService] Error creating notification: ${err.message}`);
      throw err;
    }

    const formatted = this.formatNotification(savedDoc);

    // 3. Scoped Socket.IO Emission
    try {
      this.emitScoped(formatted, resolvedRecipientType, resolvedRecipientId, storeId, riderId);
    } catch (socketErr: any) {
      this.logger.warn(`[NotificationService] Socket emission error: ${socketErr.message}`);
    }

    return formatted;
  }

  /**
   * Helper to emit strictly to scoped room
   */
  private emitScoped(
    formatted: any,
    recipientType: string,
    recipientId: string,
    storeId?: string,
    riderId?: string,
  ) {
    if (!this.trackingGateway) return;

    if (recipientType === 'ADMIN') {
      this.trackingGateway.emitScopedNotification('admin', formatted);
    } else if (recipientType === 'STORE') {
      const targetStore = storeId || recipientId;
      this.trackingGateway.emitScopedNotification(`store:${targetStore}`, formatted);
    } else if (recipientType === 'RIDER') {
      const targetRider = riderId || recipientId;
      this.trackingGateway.emitScopedNotification(`rider:${targetRider}`, formatted);
    } else {
      // CUSTOMER
      this.trackingGateway.emitScopedNotification(`user:${recipientId}`, formatted);
    }
  }

  /**
   * Backwards-compatible createNotification wrapper
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
  ): Promise<any> {
    return this.create({
      recipientId: userId,
      userId,
      role,
      title,
      message: body,
      body,
      type,
      data,
      metadata: data,
      deepLink,
      channels,
    });
  }

  /**
   * Fetch paginated notifications scoped strictly to user, store, rider, or admin
   */
  async getNotifications(options: {
    recipientId?: string;
    role?: string;
    storeId?: string;
    riderId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    const roleUpper = (options.role || '').toUpperCase();

    if (roleUpper === 'ADMIN') {
      filter.$or = [{ role: 'ADMIN' }, { recipientType: 'ADMIN' }];
    } else if (options.storeId) {
      filter.$or = [
        { storeId: options.storeId },
        { recipientId: options.storeId },
        { 'metadata.storeId': options.storeId },
      ];
    } else if (options.riderId) {
      filter.$or = [
        { riderId: options.riderId },
        { recipientId: options.riderId },
        { 'metadata.riderId': options.riderId },
      ];
    } else if (options.recipientId) {
      const rId = options.recipientId.toString();
      const conditions: any[] = [{ recipientId: rId }];
      if (Types.ObjectId.isValid(rId)) {
        conditions.push({ userId: new Types.ObjectId(rId) });
      }
      filter.$or = conditions;
    } else {
      // Fallback empty
      return { notifications: [], total: 0, unreadCount: 0, page: 1, pages: 0 };
    }

    const [docs, total, unreadCount] = await Promise.all([
      this.notificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({ ...filter, isRead: false }),
    ]);

    return {
      notifications: docs.map((doc) => this.formatNotification(doc)),
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Backwards-compatible getUserNotifications
   */
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    return this.getNotifications({ recipientId: userId, page, limit });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(options: {
    recipientId?: string;
    role?: string;
    storeId?: string;
    riderId?: string;
  }): Promise<number> {
    const filter: any = { isRead: false };
    const roleUpper = (options.role || '').toUpperCase();

    if (roleUpper === 'ADMIN') {
      filter.$or = [{ role: 'ADMIN' }, { recipientType: 'ADMIN' }];
    } else if (options.storeId) {
      filter.$or = [
        { storeId: options.storeId },
        { recipientId: options.storeId },
      ];
    } else if (options.riderId) {
      filter.$or = [
        { riderId: options.riderId },
        { recipientId: options.riderId },
      ];
    } else if (options.recipientId) {
      const rId = options.recipientId.toString();
      const conditions: any[] = [{ recipientId: rId }];
      if (Types.ObjectId.isValid(rId)) {
        conditions.push({ userId: new Types.ObjectId(rId) });
      }
      filter.$or = conditions;
    } else {
      return 0;
    }

    return this.notificationModel.countDocuments(filter);
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, recipientId?: string) {
    const filter: any = { _id: new Types.ObjectId(notificationId) };
    if (recipientId) {
      filter.$or = [
        { recipientId: recipientId.toString() },
        { storeId: recipientId.toString() },
        { riderId: recipientId.toString() },
        { role: 'ADMIN' },
      ];
      if (Types.ObjectId.isValid(recipientId)) {
        filter.$or.push({ userId: new Types.ObjectId(recipientId) });
      }
    }

    const updated = await this.notificationModel.findOneAndUpdate(
      filter,
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    ).lean();

    return updated ? this.formatNotification(updated) : null;
  }

  /**
   * Mark all notifications as read for scoped recipient
   */
  async markAllAsRead(options: {
    recipientId?: string;
    role?: string;
    storeId?: string;
    riderId?: string;
  }) {
    const filter: any = { isRead: false };
    const roleUpper = (options.role || '').toUpperCase();

    if (roleUpper === 'ADMIN') {
      filter.$or = [{ role: 'ADMIN' }, { recipientType: 'ADMIN' }];
    } else if (options.storeId) {
      filter.$or = [
        { storeId: options.storeId },
        { recipientId: options.storeId },
      ];
    } else if (options.riderId) {
      filter.$or = [
        { riderId: options.riderId },
        { recipientId: options.riderId },
      ];
    } else if (options.recipientId) {
      const rId = options.recipientId.toString();
      const conditions: any[] = [{ recipientId: rId }];
      if (Types.ObjectId.isValid(rId)) {
        conditions.push({ userId: new Types.ObjectId(rId) });
      }
      filter.$or = conditions;
    } else {
      return { modifiedCount: 0, success: true };
    }

    const res = await this.notificationModel.updateMany(filter, {
      $set: { isRead: true, readAt: new Date() },
    });
    return { modifiedCount: res.modifiedCount, success: true };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, recipientId?: string) {
    const filter: any = { _id: new Types.ObjectId(notificationId) };
    if (recipientId) {
      filter.$or = [
        { recipientId: recipientId.toString() },
        { storeId: recipientId.toString() },
        { riderId: recipientId.toString() },
        { role: 'ADMIN' },
      ];
      if (Types.ObjectId.isValid(recipientId)) {
        filter.$or.push({ userId: new Types.ObjectId(recipientId) });
      }
    }

    return this.notificationModel.findOneAndDelete(filter);
  }

  /**
   * Format document to standardized JSON payload
   */
  private formatNotification(doc: any) {
    if (!doc) return null;
    const id = (doc._id || doc.id || '').toString();
    const message = doc.message || doc.body || '';
    return {
      id,
      _id: id,
      recipientType: doc.recipientType || doc.role || 'CUSTOMER',
      recipientId: doc.recipientId || (doc.userId ? doc.userId.toString() : ''),
      role: doc.role || 'CUSTOMER',
      title: doc.title,
      message,
      body: message,
      type: doc.type || 'ORDER_STATUS',
      entityType: doc.entityType || 'ORDER',
      entityId: doc.entityId || doc.orderId || '',
      orderId: doc.orderId || (doc.entityType === 'ORDER' ? doc.entityId : undefined),
      storeId: doc.storeId,
      riderId: doc.riderId,
      customerId: doc.customerId,
      areaId: doc.areaId,
      actionType: doc.actionType,
      metadata: doc.metadata || doc.data || {},
      data: doc.data || doc.metadata || {},
      isRead: Boolean(doc.isRead),
      readAt: doc.readAt,
      dedupeKey: doc.dedupeKey,
      deepLink: doc.deepLink || '',
      channels: doc.channels || ['websocket', 'push', 'db'],
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * User notification preferences
   */
  async updatePreferences(userId: string, prefs: any) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.notificationPrefs = { ...(user.notificationPrefs || {}), ...prefs };
    await user.save();
    return { success: true, preferences: user.notificationPrefs };
  }

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
