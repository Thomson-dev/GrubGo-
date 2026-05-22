import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItem extends Document {
  restaurantId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  image: string;
  isAvailable: boolean;
  isVeg: boolean;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    isVeg: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IMenuItem>('MenuItem', menuItemSchema);
