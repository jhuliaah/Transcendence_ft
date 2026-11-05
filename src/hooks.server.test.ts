import { describe, expect, it, vi, beforeEach } from 'vitest';

const { validateSession } = vi.hoisted(() => ({
  validateSession: vi.fn()
}));

vi.mock('./lib/server/services/auth', () => ({
  validateSession
}));

import { handle } from './hooks.server';

const user = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User'
};

function createEvent(token?: string) {
  return {
    cookies: {
      get: vi.fn().mockReturnValue(token),
      delete: vi.fn()
    },
    locals: {
      user: null
    }
  };
}

const resolve = vi.fn().mockResolvedValue(new Response('OK'));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authentication hook', () => {
  it('sets locals.user when the session is valid', async () => {
    validateSession.mockResolvedValue({
      user,
      expiresAt: new Date(Date.now() + 60_000)
    });

    const event = createEvent('session-token');

    await handle({
      event,
      resolve
    } as never);

    expect(event.locals.user).toEqual(user);
    expect(resolve).toHaveBeenCalled();
  });

  it('keeps locals.user null when there is no session', async () => {
    const event = createEvent();

    await handle({
      event,
      resolve
    } as never);

    expect(event.locals.user).toBeNull();
    expect(validateSession).not.toHaveBeenCalled();
    expect(resolve).toHaveBeenCalled();
  });

  it('deletes the cookie when the session is invalid', async () => {
    validateSession.mockResolvedValue(null);

    const event = createEvent('invalid-token');

    await handle({
      event,
      resolve
    } as never);

    expect(event.locals.user).toBeNull();

    expect(event.cookies.delete).toHaveBeenCalledWith('session', {
      path: '/'
    });
  });
});
