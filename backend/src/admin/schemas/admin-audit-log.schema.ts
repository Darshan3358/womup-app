import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminAuditLogDocument = AdminAuditLog & Document;

@Schema({ collection: 'admin_audit_logs', timestamps: true })
export class AdminAuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  actorId: Types.ObjectId;

  @Prop({ required: true })
  actorRole: string;

  @Prop({ required: true })
  action: string; // e.g. 'ADMIN_UPDATED_PRODUCT_PRICE', 'STORE_PACKED_ORDER'

  @Prop({ required: true })
  entity: string; // 'Product' | 'Order' | 'Inventory' | 'Coupon'

  @Prop({ required: true })
  entityId: string;

  @Prop({ type: Object })
  oldValue?: Record<string, any>;

  @Prop({ type: Object })
  newValue?: Record<string, any>;

  @Prop()
  ipAddress?: string;
}

export const AdminAuditLogSchema = SchemaFactory.createForClass(AdminAuditLog);
