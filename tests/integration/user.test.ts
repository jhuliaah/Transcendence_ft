// @vitest-environment node

import { afterAll, beforeEach, expect, it } from 'vitest';
import { getPrisma } from '../../src/lib/server/db';

const prisma = getPrisma();

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

it('creates a user and retrieves it from the database', async () => {
  const createdUser = await prisma.user.create({
    data: {
      email: 'integration@example.com',
      name: 'Integration Test User'
    }
  });

  const foundUser = await prisma.user.findUnique({
    where: {
      email: 'integration@example.com'
    }
  });

  expect(foundUser).not.toBeNull();
  expect(foundUser?.id).toBe(createdUser.id);
  expect(foundUser?.email).toBe(createdUser.email);
  expect(foundUser?.name).toBe(createdUser.name);
});

it('rejects a duplicate email address', async () => {
  const email = 'duplicate@example.com';

  await prisma.user.create({
    data: { email }
  });

  await expect(
    prisma.user.create({
      data: { email }
    })
  ).rejects.toMatchObject({
    code: 'P2002'
  });
});
