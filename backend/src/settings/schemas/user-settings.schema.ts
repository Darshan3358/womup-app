import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserSettingsDocument = UserSettings & Document;

@Schema({ _id: false })
export class NotificationPrefs {
  @Prop({ default: true })
  liveOrderTracking: boolean;

  @Prop({ default: true })
  whatsappInvoices: boolean;

  @Prop({ default: true })
  exclusiveOffers: boolean;

  @Prop({ default: true })
  orderUpdates: boolean;

  @Prop({ default: true })
  pushNotifications: boolean;

  @Prop({ default: false })
  emailMarketing: boolean;
}
export const NotificationPrefsSchema = SchemaFactory.createForClass(NotificationPrefs);

@Schema({ collection: 'user_settings', timestamps: true })
export class UserSettings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  // Privacy & Security toggles
  @Prop({ default: true })
  personalizedFeeds: boolean;

  @Prop({ default: true })
  anonymousAnalytics: boolean;

  @Prop({ default: false })
  hideSensitiveItems: boolean;

  @Prop({ default: true })
  searchHistoryEnabled: boolean;

  // Notification Preferences
  @Prop({ type: NotificationPrefsSchema, default: () => ({}) })
  notificationPrefs: NotificationPrefs;
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettings);
