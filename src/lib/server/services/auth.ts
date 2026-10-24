import argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client';
import { getPrisma } from '../db';
import { registerSchema, loginSchema } from '../../schemas/auth';
import { createHash, randomBytes } from 'node:crypto';

export type RegisterResult =
  | { success: true; user: { id: string; email: string; name: string | null } }
  | {
      success: false;
      reason: 'INVALID_INPUT' | 'EMAIL_ALREADY_EXISTS';
    };

export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, reason: 'INVALID_INPUT' };
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await argon2.hash(parsed.data.password);

  try {
    const user = await getPrisma().user.create({
      data: {
        email,
        passwordHash,
        name: parsed.data.name || null
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    return { success: true, user };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, reason: 'EMAIL_ALREADY_EXISTS' };
    }
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

export async function authenticateUser(input: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, reason: 'INVALID_INPUT' };
  }

  const email = parsed.data.email.toLowerCase();

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

  const passwordIsValid = await argon2.verify(user.passwordHash, parsed.data.password);

  if (!passwordIsValid) {
    return { success: false, reason: 'INVALID_CREDENTIALS' };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  };
}

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string) {
  // O token original é conhecido apenas pelo servidor e pelo navegador.
  const token = randomBytes(32).toString('hex');

  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await getPrisma().session.create({
    data: {
      id: hashSessionToken(token),
      userId,
      expiresAt
    }
  });

  return {
    token,
    expiresAt,
    maxAge: SESSION_DURATION_SECONDS
  };
}

export async function validateSession(token: string) {
  const sessionId = hashSessionToken(token);

  const session = await getPrisma().session.findUnique({
    where: { id: sessionId },
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

export async function revokeSession(token: string): Promise<void> {
  await getPrisma().session.deleteMany({
    where: {
      id: hashSessionToken(token)
    }
  });
}
