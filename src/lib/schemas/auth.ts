import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email adress').max(254),
  password: z.string().min(8, 'Password must contain at least 8 characters').max(128),
  name: z.string().trim().min(1, 'Name is required').max(100).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(254),
  password: z.string().min(1, 'Password is required').max(128)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
