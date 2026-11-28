import { z } from 'zod';

export const completeProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe como você quer ser chamado.')
    .max(100, 'O nome pode ter no máximo 100 caracteres.')
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
