import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus =
  | 'pending'       // placed, waiting for restaurant to accept
  | 'accepted'      // restaurant confirmed
  | 'preparing'     // being cooked
  | 'ready'         // ready for pickup by rider
  | 'picked_up'     // rider collected it
  | 'delivered'     // customer received
  | 'cancelled';

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

export interface IOrder extends Document {
  customerId: string;
  restaurantId: mongoose.Types.ObjectId;
  riderId?: string;
  items: IOrderItem[];
  totalAmount: number;
  deliveryAddress: IAddress;
  status: OrderStatus;
  paymentMethod: 'paystack' | 'stripe';
  paymentId?: string;
  isPaid: boolean;
}

const orderSchema = new Schema<IOrder>(
  {
    customerId: { type: String, required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    riderId: { type: String, default: null },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      lat: Number,
      lng: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: { type: String, enum: ['paystack', 'stripe'], required: true },
    paymentId: { type: String, default: null },
    isPaid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', orderSchema);
