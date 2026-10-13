import mongoose, { Document, Schema } from 'mongoose';

export interface IArea extends Document {
  name: string;
  city: string;
  pincodes: string[];
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  defaultDeliveryMinutes?: number;
  darkStore?: string;
  hubStoreId?: mongoose.Types.ObjectId;
  isActive: boolean;
}

const AreaSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    pincodes: [{ type: String }],
    centerLat: { type: Number },
    centerLng: { type: Number },
    radiusKm: { type: Number },
    defaultDeliveryMinutes: { type: Number, default: 9 },
    darkStore: { type: String },
    hubStoreId: { type: Schema.Types.ObjectId },
    isActive: { type: Boolean, default: true },
  },
  { collection: 'areas', timestamps: true, strict: false }
);

export const AreaModel = mongoose.model<IArea>('Area', AreaSchema);
