// @vitest-environment node

import { afterAll, beforeEach, expect, it } from 'vitest';
import argon2 from 'argon2';

import { getPrisma } from '../../src/lib/server/db';
import { registerUser, authenticateUser } from '../../src/lib/server/services/auth';

const prisma = getPrisma();

const email = 'auth-integration@example.com';
const password = 'integration-password-123';

beforeEach(async () => {
  await prisma.user.deleteMany({
    where: { email }
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email }
  });

  await prisma.$disconnect();
});

it('registers a user and stores an Argon2id password hash', async () => {
  const result = await registerUser({
    email,
    password,
    name: 'Auth Integration'
  });

  expect(result.success).toBe(true);

  const user = await prisma.user.findUnique({
    where: { email }
  });

  expect(user).not.toBeNull();

  if (!user?.passwordHash) {
    throw new Error('User or password hash was not created');
  }

  expect(user.passwordHash).toMatch(/^\$argon2id\$/);
  expect(user.passwordHash).not.toBe(password);
  expect(await argon2.verify(user.passwordHash, password)).toBe(true);
});

it('rejects a duplicate email address', async () => {
  const first = await registerUser({ email, password });
  const second = await registerUser({ email, password });

  expect(first.success).toBe(true);
  expect(second).toEqual({
    success: false,
    reason: 'EMAIL_ALREADY_EXISTS'
  });
});

it('normalizes the email address during registration', async () => {
  const result = await registerUser({
    email: '  AUTH-INTEGRATION@EXAMPLE.COM  ',
    password
  });

  expect(result.success).toBe(true);

  const user = await prisma.user.findUnique({
    where: { email }
  });

  expect(user?.email).toBe(email);
});

it('allows registration without a name', async () => {
  const result = await registerUser({
    email,
    password
  });

  expect(result.success).toBe(true);

  if (!result.success) {
    throw new Error('Registration failed');
  }

  expect(result.user.name).toBeNull();
});

it.each([
  {
    description: 'invalid email',
    input: { email: 'not-an-email', password }
  },
  {
    description: 'password shorter than 8 characters',
    input: { email, password: '1234567' }
  },
  {
    description: 'password longer than 128 characters',
    input: { email, password: 'a'.repeat(129) }
  },
  {
    description: 'missing password',
    input: { email }
  }
])('rejects registration with $description', async ({ input }) => {
  const result = await registerUser(input);

  expect(result).toEqual({
    success: false,
    reason: 'INVALID_INPUT'
  });
});

it('authenticates a registered user with the correct credentials', async () => {
  const registration = await registerUser({
    email,
    password,
    name: 'Auth Integration'
  });

  expect(registration.success).toBe(true);

  const authentication = await authenticateUser({
    email,
    password
  });

  expect(authentication.success).toBe(true);

  if (!registration.success || !authentication.success) {
    throw new Error('Authentication failed');
  }

  expect(authentication.user.id).toBe(registration.user.id);
  expect(authentication.user.email).toBe(email);
});

it('normalizes the email address during login', async () => {
  await registerUser({ email, password });

  const result = await authenticateUser({
    email: '  AUTH-INTEGRATION@EXAMPLE.COM  ',
    password
  });

  expect(result.success).toBe(true);
});

it('rejects an incorrect password', async () => {
  await registerUser({ email, password });

  const result = await authenticateUser({
    email,
    password: 'incorrect-password'
  });

  expect(result).toEqual({
    success: false,
    reason: 'INVALID_CREDENTIALS'
  });
});

it('returns the same error for a nonexistent email', async () => {
  const result = await authenticateUser({
    email,
    password
  });

  expect(result).toEqual({
    success: false,
    reason: 'INVALID_CREDENTIALS'
  });
});

it.each([
  {
    description: 'invalid email',
    input: { email: 'not-an-email', password }
  },
  {
    description: 'empty password',
    input: { email, password: '' }
  },
  {
    description: 'missing password',
    input: { email }
  }
])('rejects login with $description', async ({ input }) => {
  const result = await authenticateUser(input);

  expect(result).toEqual({
    success: false,
    reason: 'INVALID_INPUT'
  });
});
