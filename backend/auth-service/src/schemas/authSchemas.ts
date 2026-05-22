import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['customer', 'restaurant', 'rider']).optional(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});
