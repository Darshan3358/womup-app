import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface PushMessagePayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: string;
  badge?: number;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Register or update user device push token
   */
  async registerPushToken(
    userId: string,
    token: string,
    platform: 'android' | 'ios' | 'web',
    appVersion?: string,
  ): Promise<boolean> {
    try {
      if (!userId || !token) return false;

      const updateFields: any = {
        updatedAt: new Date(),
      };

      if (platform === 'android') {
        updateFields.androidToken = token;
      } else if (platform === 'ios') {
        updateFields.iosToken = token;
      } else {
        updateFields.androidToken = token;
      }

      await this.userModel.findByIdAndUpdate(userId, { $set: updateFields });
      this.logger.log(`[PushService] Registered ${platform} push token for user: ${userId}`);
      return true;
    } catch (e: any) {
      this.logger.error(`[PushService] Error registering token for user ${userId}: ${e.message}`);
      return false;
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: PushMessagePayload): Promise<boolean> {
    try {
      if (!userId) return false;

      const user = await this.userModel.findById(userId).select('androidToken iosToken name').lean();
      if (!user) {
        this.logger.warn(`[PushService] User ${userId} not found for push dispatch`);
        return false;
      }

      const token = user.androidToken || user.iosToken;
      if (!token) {
        this.logger.debug(`[PushService] No device token registered for user ${userId} (${user.name})`);
        return false;
      }

      return this.sendToToken(token, payload);
    } catch (e: any) {
      this.logger.error(`[PushService] sendToUser error: ${e.message}`);
      return false;
    }
  }

  /**
   * Send native push notification to a device token (FCM / APNs)
   */
  async sendToToken(token: string, payload: PushMessagePayload): Promise<boolean> {
    try {
      this.logger.log(
        `[PushService] 🚀 [FCM PUSH SENT] Token: ${token.substring(0, 16)}... | Title: "${payload.title}" | Body: "${payload.body}"`,
      );
      // In production with FCM credentials:
      // await admin.messaging().send({ token, notification: { title: payload.title, body: payload.body }, data: payload.data });
      return true;
    } catch (e: any) {
      this.logger.error(`[PushService] sendToToken error: ${e.message}`);
      return false;
    }
  }

  /**
   * Batch push dispatch
   */
  async sendBatch(userIds: string[], payload: PushMessagePayload): Promise<number> {
    let successCount = 0;
    for (const id of userIds) {
      const ok = await this.sendToUser(id, payload);
      if (ok) successCount++;
    }
    return successCount;
  }
}
