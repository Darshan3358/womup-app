import mongoose, { Document, Schema } from 'mongoose';

export interface IStore extends Document {
  name: string;
  code: string;
  address: string;
  city: string;
  pincode: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  serviceRadiusKm: number;
  estimatedDeliveryMinutes: number;
  isActive: boolean;
  areaId?: mongoose.Types.ObjectId;
  areaName?: string;
  cityName?: string;
  managerName?: string;
  managerPhone?: string;
}

const StoreSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }],
    },
    serviceRadiusKm: { type: Number, default: 5 },
    estimatedDeliveryMinutes: { type: Number, default: 9 },
    isActive: { type: Boolean, default: true },
    areaId: { type: Schema.Types.ObjectId, ref: 'Area' },
    areaName: { type: String },
    cityName: { type: String },
  },
  { collection: 'stores', timestamps: true, strict: false }
);

export const StoreModel = mongoose.model<IStore>('Store', StoreSchema);
