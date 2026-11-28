import { getPrisma } from '../../../src/lib/server/db';

const prisma = getPrisma();

export async function createTestUser(email: string, name?: string) {
  return prisma.user.create({
    data: {
      email,
      ...(name !== undefined && { name })
    }
  });
}
