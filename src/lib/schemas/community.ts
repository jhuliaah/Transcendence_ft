import { z } from 'zod';

export const createCommunitySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(2000).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
  joinPolicy: z.enum(['OPEN', 'APPROVAL'])
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;

// Editing settings accepts exactly the same fields and limits as creation.
export const updateCommunitySettingsSchema = createCommunitySchema;

export type UpdateCommunitySettingsInput = z.infer<typeof updateCommunitySettingsSchema>;
