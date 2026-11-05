import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  userCreate,
  userFindUnique,
  sessionCreate,
  sessionFindUnique,
  sessionDelete,
  sessionDeleteMany
} = vi.hoisted(() => ({
  userCreate: vi.fn(),
  userFindUnique: vi.fn(),
  sessionCreate: vi.fn(),
  sessionFindUnique: vi.fn(),
  sessionDelete: vi.fn(),
  sessionDeleteMany: vi.fn()
}));

vi.mock('../db', () => ({
  getPrisma: () => ({
    user: {
      create: userCreate,
      findUnique: userFindUnique
    },
    session: {
      create: sessionCreate,
      findUnique: sessionFindUnique,
      delete: sessionDelete,
      deleteMany: sessionDeleteMany
    }
  })
}));

vi.mock('argon2', () => ({
  default: {
    hash: vi.fn(),
    verify: vi.fn()
  }
}));

import argon2 from 'argon2';
import {
  authenticateUser,
  registerUser,
  createSession,
  validateSession,
  revokeSession
} from './auth';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registerUser', () => {
  it('creates a user with a hashed password', async () => {
    userCreate.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User'
    });

    vi.mocked(argon2.hash).mockResolvedValue('hashed-password');

    const result = await registerUser({
      email: 'user@example.com',
      password: 'password123',
      name: 'Test User'
    });

    expect(result.success).toBe(true);

    expect(argon2.hash).toHaveBeenCalledWith('password123');

    expect(userCreate).toHaveBeenCalledWith({
      data: {
        email: 'user@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User'
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
  });

  it('normalizes the email address to lowercase', async () => {
    userCreate.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: null
    });

    vi.mocked(argon2.hash).mockResolvedValue('hashed-password');

    await registerUser({
      email: 'USER@EXAMPLE.COM',
      password: 'password123'
    });

    expect(userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'user@example.com'
        })
      })
    );
  });

  it('rejects invalid input without accessing the database', async () => {
    const result = await registerUser({
      email: 'invalid-email',
      password: '123'
    });

    expect(result).toEqual({
      success: false,
      reason: 'INVALID_INPUT'
    });

    expect(userCreate).not.toHaveBeenCalled();
    expect(argon2.hash).not.toHaveBeenCalled();
  });
});

describe('authenticateUser', () => {
  it('rejects invalid input', async () => {
    const result = await authenticateUser({
      email: 'invalid-email',
      password: ''
    });

    expect(result).toEqual({
      success: false,
      reason: 'INVALID_INPUT'
    });

    expect(userFindUnique).not.toHaveBeenCalled();
  });

  it('rejects an email that does not exist', async () => {
    userFindUnique.mockResolvedValue(null);

    const result = await authenticateUser({
      email: 'unknown@example.com',
      password: 'password123'
    });

    expect(result).toEqual({
      success: false,
      reason: 'INVALID_CREDENTIALS'
    });

    expect(argon2.verify).not.toHaveBeenCalled();
  });

  it('rejects an incorrect password', async () => {
    userFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      passwordHash: 'hashed-password'
    });

    vi.mocked(argon2.verify).mockResolvedValue(false);

    const result = await authenticateUser({
      email: 'user@example.com',
      password: 'wrong-password'
    });

    expect(result).toEqual({
      success: false,
      reason: 'INVALID_CREDENTIALS'
    });

    expect(argon2.verify).toHaveBeenCalledWith('hashed-password', 'wrong-password');
  });

  it('authenticates a user with the correct password', async () => {
    userFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      passwordHash: 'hashed-password'
    });

    vi.mocked(argon2.verify).mockResolvedValue(true);

    const result = await authenticateUser({
      email: 'user@example.com',
      password: 'password123'
    });

    expect(result).toEqual({
      success: true,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User'
      }
    });
  });
});

describe('createSession', () => {
  it('creates a session with a hashed token', async () => {
    sessionCreate.mockResolvedValue({});

    const result = await createSession('user-1');

    expect(result.token).toBeDefined();
    expect(result.token).toHaveLength(64);
    expect(result.maxAge).toBe(60 * 60 * 24 * 7);

    const createCall = sessionCreate.mock.calls[0][0];

    expect(createCall.data.userId).toBe('user-1');
    expect(createCall.data.id).not.toBe(result.token);
    expect(createCall.data.id).toMatch(/^[a-f0-9]{64}$/);
    expect(createCall.data.expiresAt).toEqual(result.expiresAt);
  });
});

describe('validateSession', () => {
  it('returns null when the session does not exist', async () => {
    sessionFindUnique.mockResolvedValue(null);

    const result = await validateSession('some-token');

    expect(result).toBeNull();
  });

  it('returns the user when the session is valid', async () => {
    const expiresAt = new Date(Date.now() + 60_000);

    sessionFindUnique.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User'
      },
      expiresAt
    });

    const result = await validateSession('some-token');

    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User'
      },
      expiresAt
    });

    expect(sessionDelete).not.toHaveBeenCalled();
  });

  it('deletes an expired session and returns null', async () => {
    sessionFindUnique.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User'
      },
      expiresAt: new Date(Date.now() - 60_000)
    });

    sessionDelete.mockResolvedValue({});

    const result = await validateSession('some-token');

    expect(result).toBeNull();
    expect(sessionDelete).toHaveBeenCalledWith({
      where: {
        id: expect.any(String)
      }
    });

    expect(sessionDelete.mock.calls[0][0].where.id).not.toBe('some-token');
  });
});

describe('revokeSession', () => {
  it('deletes the session associated with the token hash', async () => {
    sessionDeleteMany.mockResolvedValue({ count: 1 });

    await revokeSession('some-token');

    expect(sessionDeleteMany).toHaveBeenCalledWith({
      where: {
        id: expect.any(String)
      }
    });

    expect(sessionDeleteMany.mock.calls[0][0].where.id).not.toBe('some-token');
  });
});
