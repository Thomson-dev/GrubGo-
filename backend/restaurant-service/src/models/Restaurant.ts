import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurant extends Document {
  ownerId: string;       // the User._id from Auth Service (stored by value, not a ref)
  name: string;
  description: string;
  cuisine: string[];
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  phone: string;
  coverImage: string;
  isOpen: boolean;
  isVerified: boolean;   // admin must approve before restaurant appears publicly
  rating: number;
  totalRatings: number;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    ownerId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    cuisine: [{ type: String }],
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    phone: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    isOpen: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IRestaurant>('Restaurant', restaurantSchema);
