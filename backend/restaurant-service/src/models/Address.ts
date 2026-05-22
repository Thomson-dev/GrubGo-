import mongoose, { Document, Schema } from 'mongoose';

export type AddressLabel = 'home' | 'work' | 'other';

export interface IAddress extends Document {
  customerId: string;
  label: AddressLabel;
  street: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

const addressSchema = new Schema<IAddress>(
  {
    customerId: { type: String, required: true, index: true },
    label: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    lat: { type: Number },
    lng: { type: Number },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IAddress>('Address', addressSchema);
