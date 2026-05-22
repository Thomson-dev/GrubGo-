import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import Otp from '../models/Otp';
import RefreshToken from '../models/RefreshToken';
import { sendOtpEmail } from '../config/mailer';

// ─── Token helpers ────────────────────────────────────────────────────────────

const signAccessToken = (id: string, role: UserRole): string =>
  jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: parseInt(process.env.JWT_EXPIRES_SECONDS ?? '900', 10), // 15 min default
  });

const generateRefreshToken = async (userId: string): Promise<string> => {
  const plain = crypto.randomBytes(40).toString('hex');
  const hash = crypto.createHash('sha256').update(plain).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Invalidate any previous refresh token for this user (one session at a time)
  await RefreshToken.deleteMany({ userId });
  await RefreshToken.create({ userId, tokenHash: hash, expiresAt });

  return plain;
};

const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

// ─── Consistent response shape ────────────────────────────────────────────────

const success = (res: Response, statusCode: number, message: string, data?: object) =>
  res.status(statusCode).json({ success: true, message, data });

const fail = (res: Response, statusCode: number, message: string) =>
  res.status(statusCode).json({ success: false, message });

// ─── Controllers ─────────────────────────────────────────────────────────────

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password, role, phone } = req.body as {
      fullName: string; email: string; password: string; role?: string; phone?: string;
    };

    const existing = await User.findOne({ email });
    if (existing) {
      fail(res, 409, 'Email already in use');
      return;
    }

    const allowedRoles: UserRole[] = ['customer', 'restaurant', 'rider'];
    const safeRole: UserRole = allowedRoles.includes(role as UserRole) ? (role as UserRole) : 'customer';

    const user = await User.create({ fullName, email, password, role: safeRole, phone });

    // Generate OTP, hash it, store with 10-min TTL
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    await Otp.deleteMany({ email }); // clear any previous OTP for this email
    await Otp.create({ email, hashedOtp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });

    await sendOtpEmail(email, otp);

    success(res, 201, 'Registration successful. Check your email for the OTP.', {
      email: user.email,
      fullName: user.fullName,
    });
  } catch (err) {
    fail(res, 500, (err as Error).message);
  }
};

// POST /api/auth/verify-otp
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body as { email: string; otp: string };

    const record = await Otp.findOne({ email });
    if (!record) {
      fail(res, 400, 'OTP expired or not found. Please register again.');
      return;
    }

    const isMatch = await record.compareOtp(otp);
    if (!isMatch) {
      fail(res, 400, 'Invalid OTP');
      return;
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );
    if (!user) {
      fail(res, 404, 'User not found');
      return;
    }

    await Otp.deleteMany({ email }); // consumed — clean up

    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = await generateRefreshToken(user._id.toString());

    success(res, 200, 'Email verified successfully', {
      token: accessToken,
      refreshToken,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (err) {
    fail(res, 500, (err as Error).message);
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      fail(res, 400, 'Email and password are required');
      return;
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      fail(res, 401, 'Invalid credentials');
      return;
    }

    if (!user.isEmailVerified) {
      // Resend OTP so user can complete verification
      const otp = generateOtp();
      const hashedOtp = await bcrypt.hash(otp, 10);
      await Otp.deleteMany({ email });
      await Otp.create({ email, hashedOtp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
      await sendOtpEmail(email, otp);

      fail(res, 403, 'Email not verified. A new OTP has been sent to your email.');
      return;
    }

    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = await generateRefreshToken(user._id.toString());

    success(res, 200, 'Login successful', {
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    fail(res, 500, (err as Error).message);
  }
};

// POST /api/auth/refresh
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) {
      fail(res, 400, 'Refresh token required');
      return;
    }

    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await RefreshToken.findOne({ tokenHash: hash });

    if (!stored || stored.expiresAt < new Date()) {
      fail(res, 401, 'Invalid or expired refresh token');
      return;
    }

    const user = await User.findById(stored.userId);
    if (!user) {
      fail(res, 401, 'User not found');
      return;
    }

    const newAccessToken = signAccessToken(user._id.toString(), user.role);
    const newRefreshToken = await generateRefreshToken(user._id.toString()); // rotate

    success(res, 200, 'Token refreshed', { token: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    fail(res, 500, (err as Error).message);
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (refreshToken) {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await RefreshToken.deleteOne({ tokenHash: hash });
    }
    success(res, 200, 'Logged out successfully');
  } catch (err) {
    fail(res, 500, (err as Error).message);
  }
};

// POST /api/auth/resend-otp
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email: string };
    const user = await User.findOne({ email });
    if (!user) {
      fail(res, 404, 'No account found with this email');
      return;
    }
    if (user.isEmailVerified) {
      fail(res, 400, 'Email already verified');
      return;
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    await Otp.deleteMany({ email });
    await Otp.create({ email, hashedOtp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
    await sendOtpEmail(email, otp);

    success(res, 200, 'OTP sent successfully');
  } catch (err) {
    fail(res, 500, (err as Error).message);
  }
};

// GET /api/auth/me  (protected)
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) { fail(res, 404, 'User not found'); return; }
    success(res, 200, 'User fetched', { user });
  } catch (err) {
    fail(res, 500, (err as Error).message);
  }
};
