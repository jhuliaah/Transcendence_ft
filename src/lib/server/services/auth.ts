// SERVIÇO DE AUTENTICAÇÃO
// Aqui fica a lógica de contas e sessões. Estar dentro de lib/server garante que
// o SvelteKit nunca envie este código para o navegador.

// argon2: algoritmo feito para guardar senhas. Prisma: acesso ao banco de dados.
import argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client';
import { getPrisma } from '../db';
import { registerSchema, loginSchema } from '../../schemas/auth';
// createHash gera o hash do token de sessão, e randomBytes gera números aleatórios seguros.
import { createHash, randomBytes } from 'node:crypto';

// O resultado é um OU outro (o | significa "ou"). Quem chama olha `success`, e o TypeScript
// passa a saber quais campos existem em cada caso: `user` no sucesso, `reason` na falha.
export type RegisterResult =
  | { success: true; user: { id: string; email: string; name: string | null } }
  | {
      success: false;
      reason: 'INVALID_INPUT' | 'EMAIL_ALREADY_EXISTS';
    };

// Cria uma conta nova. `unknown` obriga a validar a entrada antes de usar.
export async function registerUser(input: unknown): Promise<RegisterResult> {
  // Valida de novo, mesmo a action já tendo validado: assim a função é segura
  // para qualquer outro lugar que venha a chamá-la.
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, reason: 'INVALID_INPUT' };
  }

  // E-mail sempre em minúsculas, para Ana@x.com e ana@x.com serem a mesma conta.
  const email = parsed.data.email.toLowerCase();
  // A senha nunca é salva como foi digitada, só o hash dela (o argon2 já inclui um salt).
  const passwordHash = await argon2.hash(parsed.data.password);

  try {
    // Insere o usuário no banco.
    const user = await getPrisma().user.create({
      data: {
        email,
        passwordHash,
        name: parsed.data.name || null
      },
      // `select` escolhe o que volta do banco. O passwordHash fica de fora, para não vazar.
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    return { success: true, user };
  } catch (error) {
    // P2002 é o código do Prisma para "esse valor único já existe" (aqui, o e-mail).
    // Tentar criar e tratar o erro é mais seguro do que consultar antes: se dois cadastros
    // chegarem juntos, os dois poderiam passar pela consulta.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, reason: 'EMAIL_ALREADY_EXISTS' };
    }
    // Qualquer outro erro é inesperado e sobe para quem chamou (o try/catch da action).
    throw error;
  }
}

export type LoginResult =
  | {
      success: true;
      user: {
        id: string;
        email: string;
        name: string | null;
      };
    }
  | {
      success: false;
      reason: 'INVALID_INPUT' | 'INVALID_CREDENTIALS';
    };

// Confere e-mail e senha no login.
export async function authenticateUser(input: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, reason: 'INVALID_INPUT' };
  }

  const email = parsed.data.email.toLowerCase();

  // Busca pelo e-mail. Aqui o passwordHash é necessário, para comparar com a senha digitada.
  const user = await getPrisma().user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true
    }
  });

  // Usamos a mesma resposta para e-mail inexistente e senha incorreta.
  if (!user?.passwordHash) {
    return { success: false, reason: 'INVALID_CREDENTIALS' };
  }

  // verify aplica o argon2 na senha digitada e compara com o hash salvo.
  const passwordIsValid = await argon2.verify(user.passwordHash, parsed.data.password);

  if (!passwordIsValid) {
    return { success: false, reason: 'INVALID_CREDENTIALS' };
  }

  // Monta o retorno à mão para o passwordHash não sair desta função.
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  };
}

// Uma sessão dura 7 dias: 60 s × 60 min × 24 h × 7 dias.
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

// O banco guarda só o hash do token. Se alguém copiar o banco, não terá os tokens
// verdadeiros, e sem eles não consegue se passar por um usuário logado.
function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Cria a sessão depois de um login que deu certo. A sessão é o que mantém a pessoa logada.
export async function createSession(userId: string) {
  // O token original é conhecido apenas pelo servidor e pelo navegador.
  const token = randomBytes(32).toString('hex');

  // Date.now() está em milissegundos, por isso o × 1000.
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  // Salva no banco com o hash do token como id.
  await getPrisma().session.create({
    data: {
      id: hashSessionToken(token),
      userId,
      expiresAt
    }
  });

  // Devolve o token original, que quem chamou coloca no cookie do navegador.
  return {
    token,
    expiresAt,
    maxAge: SESSION_DURATION_SECONDS
  };
}

// Recebe o token do cookie e descobre de quem é a sessão. Devolve null se não for válida.
export async function validateSession(token: string) {
  // Aplica o mesmo hash, porque é ele que está salvo no banco.
  const sessionId = hashSessionToken(token);

  const session = await getPrisma().session.findUnique({
    where: { id: sessionId },
    // `include` traz junto os dados do usuário dono da sessão, sem o hash da senha.
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  if (!session) {
    return null;
  }

  // Sessão vencida: apaga do banco e trata como se não existisse.
  if (session.expiresAt <= new Date()) {
    await getPrisma().session.delete({
      where: { id: sessionId }
    });

    return null;
  }

  return {
    user: session.user,
    expiresAt: session.expiresAt
  };
}

// Encerra a sessão (logout). deleteMany não dá erro se a sessão já não existir.
export async function revokeSession(token: string): Promise<void> {
  await getPrisma().session.deleteMany({
    where: {
      id: hashSessionToken(token)
    }
  });
}
