import { Prisma } from '../generated/prisma/client';
import { getPrisma } from '../db';
import { completeProfileSchema } from '../../schemas/profile';

export type CompleteProfileResult =
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
      reason: 'INVALID_INPUT' | 'USER_NOT_FOUND';
    };

export async function completeProfile(
  userId: string,
  input: unknown
): Promise<CompleteProfileResult> {
  const parsed = completeProfileSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, reason: 'INVALID_INPUT' };
  }

  try {
    const user = await getPrisma().user.update({
      where: { id: userId },
      data: { name: parsed.data.name },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    return { success: true, user };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, reason: 'USER_NOT_FOUND' };
    }

    throw error;
  }
}
