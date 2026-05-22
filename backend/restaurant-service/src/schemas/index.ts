import { z } from 'zod';

// Restaurant
export const restaurantProfileSchema = z.object({
  name: z.string().min(2).trim(),
  description: z.string().optional(),
  cuisine: z.array(z.string()).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
  }).optional(),
  phone: z.string().optional(),
});

// Category
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').trim(),
  image: z.string().url().optional().or(z.literal('')),
});

// Menu item
export const menuItemSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Item name is required').trim(),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  image: z.string().optional(),
  isVeg: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});

// Order
export const placeOrderSchema = z.object({
  restaurantId: z.string().min(1),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1, 'Order must have at least one item'),
  deliveryAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  paymentMethod: z.enum(['paystack', 'stripe']),
});

// Cart
export const addToCartSchema = z.object({
  menuItemId: z.string().min(1),
  restaurantId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

// Address
export const addressSchema = z.object({
  label: z.enum(['home', 'work', 'other']).default('home'),
  street: z.string().min(1, 'Street is required').trim(),
  city: z.string().min(1, 'City is required').trim(),
  state: z.string().min(1, 'State is required').trim(),
  pincode: z.string().min(1, 'Pincode is required').trim(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isDefault: z.boolean().optional(),
});
