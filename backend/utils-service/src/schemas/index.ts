import { z } from 'zod';

export const paystackInitSchema = z.object({
  email: z.string().email(),
  amount: z.number().positive('Amount must be positive'),
  orderId: z.string().min(1),
});

export const paystackVerifySchema = z.object({
  reference: z.string().min(1, 'Payment reference is required'),
});

export const stripeIntentSchema = z.object({
  amount: z.number().positive(),
  orderId: z.string().min(1),
  currency: z.string().length(3).default('usd'),
});
