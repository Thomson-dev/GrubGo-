import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  image: string;
}

const categorySchema = new Schema<ICategory>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>('Category', categorySchema);
