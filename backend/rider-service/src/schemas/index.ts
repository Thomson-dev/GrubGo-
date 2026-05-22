import { z } from 'zod';

export const riderProfileSchema = z.object({
  name: z.string().min(2).trim(),
  phone: z.string().min(7, 'Enter a valid phone number').trim(),
  vehicleType: z.enum(['bicycle', 'motorcycle', 'car']),
  vehicleNumber: z.string().min(2).trim(),
});

export const riderStatusSchema = z.object({
  status: z.enum(['offline', 'available']),
});

export const deliveryStatusSchema = z.object({
  status: z.enum(['picked_up', 'delivered']),
});
