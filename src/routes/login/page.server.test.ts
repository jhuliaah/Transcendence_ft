import { describe, expect, it, vi, beforeEach } from 'vitest';

const { authenticateUser, createSession } = vi.hoisted(() => ({
  authenticateUser: vi.fn(),
  createSession: vi.fn()
}));

vi.mock('../../lib/server/services/auth', () => ({
  authenticateUser,
  createSession
}));

import { actions } from './+page.server';

function createRequest(data: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value);
  }

  return new Request('http://localhost/login', {
    method: 'POST',
    body: formData
  });
}

const createCookies = () => ({
  set: vi.fn()
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('login action', () => {
  it('rejects invalid form data', async () => {
    const cookies = createCookies();

    const result = await actions.default({
      request: createRequest({
        email: 'invalid-email',
        password: ''
      }),
      cookies
    } as never);

    expect(result).toMatchObject({
      status: 400,
      data: {
        success: false
      }
    });

    expect(authenticateUser).not.toHaveBeenCalled();
    expect(cookies.set).not.toHaveBeenCalled();
  });

  it('rejects invalid credentials', async () => {
    authenticateUser.mockResolvedValue({
      success: false,
      reason: 'INVALID_CREDENTIALS'
    });

    const cookies = createCookies();

    const result = await actions.default({
      request: createRequest({
        email: 'user@example.com',
        password: 'wrong-password'
      }),
      cookies
    } as never);

    expect(result).toMatchObject({
      status: 400,
      data: {
        success: false,
        message: 'Invalid email or password.'
      }
    });

    expect(createSession).not.toHaveBeenCalled();
    expect(cookies.set).not.toHaveBeenCalled();
  });

  it('creates a session and sets the authentication cookie', async () => {
    authenticateUser.mockResolvedValue({
      success: true,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User'
      }
    });

    const expiresAt = new Date(Date.now() + 60_000);

    createSession.mockResolvedValue({
      token: 'session-token',
      expiresAt,
      maxAge: 604800
    });

    const cookies = createCookies();

    await expect(
      actions.default({
        request: createRequest({
          email: 'user@example.com',
          password: 'password123'
        }),
        cookies
      } as never)
    ).rejects.toMatchObject({
      status: 303,
      location: '/dashboard'
    });

    expect(createSession).toHaveBeenCalledWith('user-1');

    expect(cookies.set).toHaveBeenCalledWith(
      'session',
      'session-token',
      expect.objectContaining({
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        expires: expiresAt,
        maxAge: 604800
      })
    );
  });
});
