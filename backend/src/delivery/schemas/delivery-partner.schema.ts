import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeliveryPartnerDocument = DeliveryPartner & Document;
export type DeliveryAssignmentDocument = DeliveryAssignment & Document;
export type DeliveryLocationDocument = DeliveryLocation & Document;
export type RiderSettlementDocument = RiderSettlement & Document;
export type RiderBankAccountDocument = RiderBankAccount & Document;
export type RiderDutySessionDocument = RiderDutySession & Document;
export type DeliveryPartnerDocumentRecord = DeliveryPartnerDocumentItem & Document;
export type SupportTicketDocument = SupportTicket & Document;
export type RiderLocationLogDocument = RiderLocationLog & Document;

@Schema({ collection: 'delivery_partners', timestamps: true })
export class DeliveryPartner {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  partnerCode: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true, index: true, trim: true })
  phoneNumber: string;

  @Prop({ required: true, unique: true, sparse: true, lowercase: true, trim: true, index: true })
  email?: string;

  @Prop()
  avatar?: string;

  @Prop({ type: Types.ObjectId, ref: 'City' })
  cityId?: Types.ObjectId;

  @Prop({ default: 'Ahmedabad' })
  city: string;

  @Prop({ trim: true })
  cityName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Store' })
  hubId?: Types.ObjectId;

  @Prop({ default: 'Satellite Hub Dark Store' })
  hubName: string;

  @Prop({ default: 'APPROVED', enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] })
  status: string;

  @Prop({ default: 'VERIFIED', enum: ['PENDING', 'VERIFIED', 'REJECTED'] })
  verificationStatus: string;

  @Prop({ default: true })
  isOnline: boolean;

  @Prop({ default: 'EV_SCOOTER' })
  vehicleType: string;

  @Prop({ required: true })
  vehicleNumber: string;

  @Prop({ default: 4.88 })
  rating: number;

  @Prop({ default: 4.88 })
  averageRating: number;

  @Prop({ default: 128 })
  totalReviews: number;

  @Prop({
    type: Object,
    default: { five: 104, four: 18, three: 4, two: 1, one: 1 },
  })
  ratingBreakdown: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };

  @Prop()
  lastRatedAt?: Date;

  @Prop({ default: 428 })
  totalDeliveries: number;

  @Prop({ default: 428 })
  completedDeliveries: number;

  @Prop({ default: 3 })
  cancelledDeliveries: number;

  @Prop({ default: 94.0 })
  acceptanceRate: number;

  @Prop({ default: 99.0 })
  completionRate: number;

  @Prop({ default: 11.4 })
  avgDeliveryMinutes: number;

  @Prop({ default: 97.2 })
  onTimeRate: number;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  currentOrderId?: Types.ObjectId;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [72.5298, 23.0245],
    },
  })
  currentLocation: {
    type: string;
    coordinates: number[];
  };

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ type: Date })
  locationUpdatedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'RiderBankAccount' })
  bankAccountId?: Types.ObjectId;
}

export const DeliveryPartnerSchema = SchemaFactory.createForClass(DeliveryPartner);
DeliveryPartnerSchema.index({ currentLocation: '2dsphere' });

export enum RiderAssignmentStatus {
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  GOING_TO_STORE = 'GOING_TO_STORE',
  ARRIVED_AT_STORE = 'ARRIVED_AT_STORE',
  PICKUP_VERIFIED = 'PICKUP_VERIFIED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  ARRIVED_AT_CUSTOMER = 'ARRIVED_AT_CUSTOMER',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Schema({ collection: 'delivery_assignments', timestamps: true })
export class DeliveryAssignment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner', required: true, index: true })
  partnerId: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(RiderAssignmentStatus),
    default: RiderAssignmentStatus.GOING_TO_STORE,
  })
  status: RiderAssignmentStatus;

  @Prop({ default: 48 })
  payoutAmount: number;

  @Prop({ default: 1.8 })
  distanceKm: number;

  @Prop({ default: 11 })
  etaMinutes: number;

  @Prop({ default: Date.now })
  assignedAt: Date;

  @Prop()
  acceptedAt?: Date;

  @Prop()
  arrivedStoreAt?: Date;

  @Prop()
  pickedUpAt?: Date;

  @Prop()
  arrivedCustomerAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'DeliveryPartner' }], default: [] })
  rejectedBy: Types.ObjectId[];
}

export const DeliveryAssignmentSchema = SchemaFactory.createForClass(DeliveryAssignment);

@Schema({ collection: 'rider_settlements', timestamps: true })
export class RiderSettlement {
  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner', required: true, index: true })
  riderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', index: true })
  orderId?: Types.ObjectId;

  @Prop({ required: true })
  orderNumber: string;

  @Prop({ required: true, default: 48 })
  basePay: number;

  @Prop({ default: 15 })
  incentive: number;

  @Prop({ default: 0 })
  tip: number;

  @Prop({ default: 0 })
  adjustment: number;

  @Prop({ required: true })
  total: number;

  @Prop({
    required: true,
    enum: ['PENDING', 'CALCULATED', 'PROCESSING', 'SETTLED', 'FAILED'],
    default: 'SETTLED',
  })
  status: string;

  @Prop({ default: 'TODAY' })
  period: string;

  @Prop({ default: Date.now })
  settledAt: Date;
}

export const RiderSettlementSchema = SchemaFactory.createForClass(RiderSettlement);

@Schema({ collection: 'rider_bank_accounts', timestamps: true })
export class RiderBankAccount {
  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner', required: true, unique: true, index: true })
  riderId: Types.ObjectId;

  @Prop({ required: true, default: 'HDFC Bank Ltd' })
  bankName: string;

  @Prop({ required: true })
  accountHolderName: string;

  @Prop({ required: true })
  maskedAccount: string;

  @Prop({ required: true })
  ifsc: string;

  @Prop({ default: 'VERIFIED', enum: ['PENDING', 'VERIFIED', 'REJECTED'] })
  verificationStatus: string;

  @Prop({ default: Date.now })
  verifiedAt: Date;
}

export const RiderBankAccountSchema = SchemaFactory.createForClass(RiderBankAccount);

@Schema({ collection: 'rider_duty_sessions', timestamps: true })
export class RiderDutySession {
  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner', required: true, index: true })
  riderId: Types.ObjectId;

  @Prop({ default: Date.now })
  startedAt: Date;

  @Prop()
  endedAt?: Date;

  @Prop({ default: 0 })
  onlineDurationMinutes: number;

  @Prop({ default: 0 })
  ordersCompleted: number;

  @Prop({ default: 'Ahmedabad' })
  city: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const RiderDutySessionSchema = SchemaFactory.createForClass(RiderDutySession);

@Schema({ collection: 'delivery_partner_documents', timestamps: true })
export class DeliveryPartnerDocumentItem {
  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner', required: true, index: true })
  riderId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['DRIVING_LICENSE', 'VEHICLE_RC', 'INSURANCE', 'AADHAAR_PAN', 'PUC'],
  })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  documentNumberMasked: string;

  @Prop({
    required: true,
    enum: ['VERIFIED', 'PENDING', 'REJECTED', 'EXPIRED', 'CORRECTION_REQUIRED'],
    default: 'VERIFIED',
  })
  status: string;

  @Prop()
  issuedAt?: string;

  @Prop()
  expiresAt?: string;

  @Prop()
  rejectionReason?: string;
}

export const DeliveryPartnerDocumentSchema = SchemaFactory.createForClass(DeliveryPartnerDocumentItem);

@Schema({ collection: 'support_tickets', timestamps: true })
export class SupportTicket {
  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner', required: true, index: true })
  riderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  orderId?: Types.ObjectId;

  @Prop({ required: true })
  category: string;

  @Prop({ default: 'MEDIUM', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  priority: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 'OPEN', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] })
  status: string;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);

@Schema({ collection: 'rider_location_logs', timestamps: true })
export class RiderLocationLog {
  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner', required: true, index: true })
  riderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', index: true })
  orderId?: Types.ObjectId;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ default: 0 })
  speedKmph: number;

  @Prop({ default: 0 })
  headingDegrees: number;

  @Prop({ default: 0 })
  accuracyMeters: number;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const RiderLocationLogSchema = SchemaFactory.createForClass(RiderLocationLog);

@Schema({ collection: 'delivery_locations', timestamps: true })
export class DeliveryLocation {
  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner', required: true, index: true })
  partnerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', index: true })
  orderId?: Types.ObjectId;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ default: 0 })
  speedKmph: number;

  @Prop({ default: 0 })
  headingDegrees: number;
}

export const DeliveryLocationSchema = SchemaFactory.createForClass(DeliveryLocation);
DeliveryLocationSchema.index({ location: '2dsphere' });
