import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StoreStaffDocument = StoreStaff & Document;

export enum StaffRole {
  PICKER = 'PICKER',
  PACKER = 'PACKER',
  STORE_MANAGER = 'STORE_MANAGER',
}

export enum StaffShift {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
}

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  OFF_DUTY = 'OFF_DUTY',
}

@Schema({ collection: 'store_staff', timestamps: true })
export class StoreStaff {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true, index: true })
  storeId: Types.ObjectId;

  @Prop({ required: true, unique: true, uppercase: true, index: true })
  employeeCode: string; // e.g. "STF-SAT-041"

  @Prop({ required: true })
  fullName: string;

  // Primary login identifier
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  // Optional contact phone number
  @Prop({ required: false, index: true, sparse: true })
  phoneNumber?: string;

  @Prop({ type: String, enum: StaffRole, default: StaffRole.PICKER, index: true })
  role: StaffRole;

  @Prop({ type: String, enum: StaffShift, default: StaffShift.MORNING })
  shift: StaffShift;

  @Prop({ default: false, index: true })
  isOnShift: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Order', default: null })
  activeOrderId?: Types.ObjectId;

  @Prop({ default: 0 })
  totalOrdersPicked: number;

  @Prop({ default: 0 })
  avgPickTimeSeconds: number;

  @Prop({ default: 100 })
  accuracy: number;

  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  lifetimeOrdersPicked: number;

  @Prop({ type: String, enum: StaffStatus, default: StaffStatus.ACTIVE })
  status: StaffStatus;

  @Prop({ default: () => new Date() })
  joinedAt: Date;
}

export const StoreStaffSchema = SchemaFactory.createForClass(StoreStaff);
