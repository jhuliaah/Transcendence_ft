// @vitest-environment node

import { afterAll, beforeEach, expect, it } from 'vitest';
import { getPrisma } from '../../src/lib/server/db';
import { completeProfile } from '../../src/lib/server/services/profile';

const prisma = getPrisma();
const email = 'complete-profile@example.com';

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
});

it('stores the name of a user who did not provide one', async () => {
  const user = await prisma.user.create({ data: { email } });

  const result = await completeProfile(user.id, { name: '  Júlia Almeida  ' });

  expect(result.success).toBe(true);

  const stored = await prisma.user.findUnique({ where: { id: user.id } });
  expect(stored?.name).toBe('Júlia Almeida');
  expect(stored?.email).toBe(email);
});

it('returns USER_NOT_FOUND for an unknown user', async () => {
  const result = await completeProfile('missing-user-id', { name: 'Júlia' });

  expect(result).toEqual({ success: false, reason: 'USER_NOT_FOUND' });
});
