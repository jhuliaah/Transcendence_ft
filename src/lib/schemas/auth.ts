// REGRAS DE VALIDAÇÃO (schemas)
// O zod descreve o formato que os dados devem ter e confere isso quando o programa roda.
// O `maxlength` do HTML pode ser burlado por quem envia a requisição direto,
// então são estas regras no servidor que valem de verdade.
import { z } from 'zod';

export const registerSchema = z.object({
  // trim() tira os espaços das pontas. O texto dentro de email() é a mensagem de erro.
  // 254 é o tamanho máximo de um endereço de e-mail.
  email: z.string().trim().email('Invalid email address').max(254),
  // Sem trim(): espaço também é um caractere válido em senha.
  password: z.string().min(8, 'Password must contain at least 8 characters').max(128),
  // optional() aceita não receber o nome. Se ele vier, precisa ter pelo menos 1 caractere.
  name: z.string().trim().min(1, 'Name is required').max(100).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(254),
  // No login, só exigimos que a senha não esteja vazia. Quem confere se ela está certa é o argon2.
  password: z.string().min(1, 'Password is required').max(128)
});

// z.infer cria o tipo TypeScript a partir do schema, para não escrever a mesma coisa duas vezes.
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
