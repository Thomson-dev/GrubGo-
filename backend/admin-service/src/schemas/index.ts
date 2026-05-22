import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminSeedSchema = z.object({
  seedSecret: z.string().min(1),
  name: z.string().min(2).trim(),
  email: z.string().email(),
  password: z.string().min(8, 'Admin password must be at least 8 characters'),
});

export const verifyEntitySchema = z.object({
  isVerified: z.boolean(),
});
