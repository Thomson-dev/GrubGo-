import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IOtp extends Document {
  email: string;
  hashedOtp: string;
  expiresAt: Date;
  compareOtp(candidate: string): Promise<boolean>;
}

const otpSchema = new Schema<IOtp>({
  email: { type: String, required: true, index: true },
  hashedOtp: { type: String, required: true },
  // TTL index — MongoDB automatically deletes the document after expiresAt
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

otpSchema.methods.compareOtp = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.hashedOtp);
};

export default mongoose.model<IOtp>('Otp', otpSchema);
