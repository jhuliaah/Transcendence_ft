import { describe, expect, it, vi, beforeEach } from 'vitest';

const { revokeSession } = vi.hoisted(() => ({
  revokeSession: vi.fn()
}));

vi.mock('../../lib/server/services/auth', () => ({
  revokeSession
}));

import { POST } from './+server';

const createCookies = (token?: string) => ({
  get: vi.fn().mockReturnValue(token),
  delete: vi.fn()
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('logout endpoint', () => {
  it('revokes the session and deletes the cookie', async () => {
    const cookies = createCookies('session-token');

    await expect(POST({ cookies } as never)).rejects.toMatchObject({
      status: 303,
      location: '/'
    });

    expect(revokeSession).toHaveBeenCalledWith('session-token');

    expect(cookies.delete).toHaveBeenCalledWith('session', {
      path: '/'
    });
  });

  it('deletes the cookie even when no session exists', async () => {
    const cookies = createCookies();

    await expect(POST({ cookies } as never)).rejects.toMatchObject({
      status: 303,
      location: '/'
    });

    expect(revokeSession).not.toHaveBeenCalled();

    expect(cookies.delete).toHaveBeenCalledWith('session', {
      path: '/'
    });
  });
});
