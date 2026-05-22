import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'customer' | 'restaurant' | 'rider' | 'admin';

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  isEmailVerified: boolean;
  isVerified: boolean;
  avatar: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: [true, 'Full name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: { type: String, enum: ['customer', 'restaurant', 'rider', 'admin'], default: 'customer' },
    phone: { type: String, trim: true },
    isEmailVerified: { type: Boolean, default: false }, // requires OTP verification
    isVerified: { type: Boolean, default: false },      // admin approval (restaurants/riders)
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
