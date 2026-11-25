import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../generated/prisma/client';

const { userUpdate } = vi.hoisted(() => ({
  userUpdate: vi.fn()
}));

vi.mock('../db', () => ({
  getPrisma: () => ({
    user: {
      update: userUpdate
    }
  })
}));

import { completeProfile } from './profile';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('completeProfile', () => {
  it('stores the trimmed name and only the name', async () => {
    userUpdate.mockResolvedValue({ id: 'user-1', email: 'julia@example.com', name: 'Júlia' });

    const result = await completeProfile('user-1', {
      name: '  Júlia  ',
      email: 'attacker@example.com'
    });

    expect(result).toEqual({
      success: true,
      user: { id: 'user-1', email: 'julia@example.com', name: 'Júlia' }
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Júlia' },
      select: { id: true, email: true, name: true }
    });
  });

  it('rejects invalid input without touching the database', async () => {
    const result = await completeProfile('user-1', { name: '' });

    expect(result).toEqual({ success: false, reason: 'INVALID_INPUT' });
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('returns USER_NOT_FOUND when the user no longer exists', async () => {
    userUpdate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: 'test'
      })
    );

    const result = await completeProfile('missing', { name: 'Júlia' });

    expect(result).toEqual({ success: false, reason: 'USER_NOT_FOUND' });
  });

  it('rethrows unexpected database errors', async () => {
    userUpdate.mockRejectedValue(new Error('connection lost'));

    await expect(completeProfile('user-1', { name: 'Júlia' })).rejects.toThrow('connection lost');
  });
});
