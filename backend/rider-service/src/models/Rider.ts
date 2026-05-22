import mongoose, { Document, Schema } from 'mongoose';

export type VehicleType = 'bicycle' | 'motorcycle' | 'car';
export type RiderStatus = 'offline' | 'available' | 'on_delivery';

export interface ILocation {
  lat: number;
  lng: number;
  updatedAt: Date;
}

export interface IRider extends Document {
  userId: string;        // maps to User._id in auth-service
  name: string;
  phone: string;
  avatar: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  isVerified: boolean;   // admin must verify before rider can accept orders
  status: RiderStatus;
  currentLocation: ILocation | null;
  totalDeliveries: number;
  rating: number;
}

const riderSchema = new Schema<IRider>(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' },
    vehicleType: {
      type: String,
      enum: ['bicycle', 'motorcycle', 'car'],
      required: true,
    },
    vehicleNumber: { type: String, required: true, trim: true },
    isVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['offline', 'available', 'on_delivery'],
      default: 'offline',
    },
    currentLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
      _id: false,
    },
    totalDeliveries: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IRider>('Rider', riderSchema);
