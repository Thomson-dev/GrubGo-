import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface ICart extends Document {
  customerId: string;
  restaurantId: mongoose.Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
}

const cartSchema = new Schema<ICart>(
  {
    customerId: { type: String, required: true, unique: true }, // one cart per customer
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, default: '' },
        quantity: { type: Number, required: true, min: 1 },
        _id: false,
      },
    ],
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Recalculate total before every save
cartSchema.pre('save', function (next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  next();
});

export default mongoose.model<ICart>('Cart', cartSchema);
