// @vitest-environment node

import { afterAll, expect, it } from 'vitest';
import { getPrisma } from '../../src/lib/server/db';
import { GET } from '../../src/routes/health/+server';

const prisma = getPrisma();

afterAll(async () => {
  await prisma.$disconnect();
});

it('return 200 when the database is connected', async () => {
  const response = await GET();

  expect(response.status).toBe(200);

  expect(await response.json()).toEqual({
    status: 'ok',
    database: 'connected'
  });
});
