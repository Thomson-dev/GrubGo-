import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string; // store hash, never the plain token
  expiresAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export default mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
