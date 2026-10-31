import { describe, expect, it, vi, beforeEach } from 'vitest';

const { registerUser } = vi.hoisted(() => ({
  registerUser: vi.fn()
}));

vi.mock('../../lib/server/services/auth', () => ({
  registerUser
}));

import { actions } from './+page.server';

function createRequest(data: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value);
  }

  return new Request('http://localhost/cadastro', {
    method: 'POST',
    body: formData
  });
}

const createEvent = (data: Record<string, string>) => ({
  request: createRequest(data)
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registration action', () => {
  it('rejects invalid form data', async () => {
    const result = await actions.default({
      ...createEvent({
        email: 'invalid-email',
        password: '123'
      })
    } as never);

    expect(result).toMatchObject({
      status: 400,
      data: {
        success: false
      }
    });

    expect(registerUser).not.toHaveBeenCalled();
  });

  it('rejects an existing email address', async () => {
    registerUser.mockResolvedValue({
      success: false,
      reason: 'EMAIL_ALREADY_EXISTS'
    });

    const result = await actions.default({
      ...createEvent({
        email: 'user@example.com',
        password: 'password123'
      })
    } as never);

    expect(result).toMatchObject({
      status: 409,
      data: {
        success: false,
        message: 'An account with this email already exists.'
      }
    });
  });

  it('creates an account with valid data', async () => {
    registerUser.mockResolvedValue({
      success: true,
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User'
      }
    });

    const result = await actions.default({
      ...createEvent({
        email: 'user@example.com',
        password: 'password123',
        name: 'Test User'
      })
    } as never);

    expect(result).toMatchObject({
      success: true
    });

    expect(registerUser).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
      name: 'Test User'
    });
  });
});
