// @vitest-environment node

import { createHash } from 'node:crypto';
import { afterAll, beforeEach, expect, it } from 'vitest';

import { getPrisma } from '../../src/lib/server/db';
import { createSession, validateSession, revokeSession } from '../../src/lib/server/services/auth';

const prisma = getPrisma();

const email = 'session-integration@example.com';

let userId: string;

beforeEach(async () => {
  await prisma.user.deleteMany({
    where: { email }
  });

  const user = await prisma.user.create({
    data: { email }
  });

  userId = user.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email }
  });

  await prisma.$disconnect();
});

it('creates a session with a random token', async () => {
  const session = await createSession(userId);

  expect(session.token).toBeTruthy();
  expect(session.token).toHaveLength(64);
  expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  expect(session.maxAge).toBe(60 * 60 * 24 * 7);
});

it('stores the session token hash instead of the original token', async () => {
  const session = await createSession(userId);

  const sessionHash = createHash('sha256').update(session.token).digest('hex');

  const storedSession = await prisma.session.findUnique({
    where: { id: sessionHash }
  });

  expect(storedSession).not.toBeNull();
  expect(storedSession?.id).toBe(sessionHash);
  expect(storedSession?.id).not.toBe(session.token);
  expect(storedSession?.userId).toBe(userId);
});

it('validates a session and returns its associated user', async () => {
  const session = await createSession(userId);

  const result = await validateSession(session.token);

  expect(result).not.toBeNull();
  expect(result?.user.id).toBe(userId);
  expect(result?.user.email).toBe(email);
  expect(result?.expiresAt.getTime()).toBe(session.expiresAt.getTime());
});

it('rejects and deletes an expired session', async () => {
  const session = await createSession(userId);

  const sessionHash = createHash('sha256').update(session.token).digest('hex');

  await prisma.session.update({
    where: { id: sessionHash },
    data: {
      expiresAt: new Date(Date.now() - 1000)
    }
  });

  const result = await validateSession(session.token);

  expect(result).toBeNull();

  const storedSession = await prisma.session.findUnique({
    where: { id: sessionHash }
  });

  expect(storedSession).toBeNull();
});

it('rejects a nonexistent session token', async () => {
  const result = await validateSession('nonexistent-token');

  expect(result).toBeNull();
});

it('revokes a session and prevents further validation', async () => {
  const session = await createSession(userId);

  await revokeSession(session.token);

  const result = await validateSession(session.token);

  expect(result).toBeNull();
});

it('allows revoking a nonexistent session without throwing an error', async () => {
  await expect(revokeSession('nonexistent-token')).resolves.toBeUndefined();
});
