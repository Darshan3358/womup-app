import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PrintOrderDocument = PrintOrder & Document;

@Schema({ collection: 'print_orders', timestamps: true })
export class PrintOrder {
  @Prop({ required: true, unique: true, uppercase: true })
  printOrderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  userId?: Types.ObjectId;

  @Prop({ required: false, index: true })
  guestSessionId?: string; // Stable UUID stored in client AsyncStorage for unauthenticated users


  @Prop({ required: true })
  originalFileName: string;

  @Prop({ required: true })
  privateStorageKey: string; // Stored in private bucket, never publicly exposed

  @Prop({ required: false })
  fileUrl?: string; // Cloudinary or preview URL

  @Prop({ required: false })
  thumbnailUrl?: string; // Image thumbnail if image uploaded

  @Prop({ required: false })
  fileType?: string; // e.g. 'image/png', 'application/pdf'

  @Prop({ required: false })
  fileSize?: string; // e.g. '1.4 MB'

  @Prop({ required: true, default: 1 })
  pageCount: number;

  @Prop({ required: true, default: 1 })
  numberOfCopies: number;

  @Prop({ required: true, default: false })
  isColor: boolean;

  @Prop({ required: true, default: false })
  isDoubleSided: boolean;

  @Prop({ required: true, default: '70 GSM' })
  paperQuality: string;

  @Prop({ required: true, default: 'none' })
  binding: string;

  @Prop({ required: false, default: 0 })
  bindingPrice?: number;

  @Prop({ required: false, default: 3 })
  pricePerPage?: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: false })
  deliveryAddress?: string;

  @Prop({
    required: true,
    enum: ['UPLOADED', 'PROCESSING', 'PRINTING', 'READY', 'DELIVERED', 'CANCELLED', 'PURGED'],
    default: 'PRINTING',
  })
  status: string;

  @Prop({ default: false })
  isDocumentPurged: boolean; // Auto purged post delivery for data privacy

  @Prop()
  purgedAt?: Date;

  @Prop()
  deliveredAt?: Date;
}

export const PrintOrderSchema = SchemaFactory.createForClass(PrintOrder);
