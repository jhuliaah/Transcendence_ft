import { beforeEach, describe, expect, it, vi } from 'vitest';

const { completeProfile } = vi.hoisted(() => ({
  completeProfile: vi.fn()
}));

vi.mock('../../lib/server/services/profile', () => ({
  completeProfile
}));

import { actions, load } from './+page.server';

const userWithoutName = { id: 'user-1', email: 'julia@example.com', name: null };

function createLoadEvent(user: App.Locals['user']) {
  return { locals: { user } } as Parameters<typeof load>[0];
}

function createActionEvent(
  data: Record<string, string>,
  user: App.Locals['user'] = userWithoutName
) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value);
  }

  return {
    request: new Request('http://localhost/completar-perfil', { method: 'POST', body: formData }),
    locals: { user }
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('complete profile load', () => {
  it('redirects unauthenticated users to login', async () => {
    await expect(load(createLoadEvent(null))).rejects.toMatchObject({
      status: 303,
      location: '/login'
    });
  });

  it('sends users who already have a name to the dashboard', async () => {
    await expect(
      load(createLoadEvent({ ...userWithoutName, name: 'Júlia' }))
    ).rejects.toMatchObject({ status: 303, location: '/dashboard' });
  });

  it('returns the user when the name is missing', async () => {
    await expect(load(createLoadEvent(userWithoutName))).resolves.toEqual({
      user: userWithoutName
    });
  });
});

describe('complete profile action', () => {
  it('redirects unauthenticated users to login', async () => {
    await expect(
      actions.default(createActionEvent({ name: 'Júlia' }, null) as never)
    ).rejects.toMatchObject({ status: 303, location: '/login' });

    expect(completeProfile).not.toHaveBeenCalled();
  });

  it('returns a field error for an empty name', async () => {
    const result = await actions.default(createActionEvent({ name: '  ' }) as never);

    expect(result).toMatchObject({
      status: 400,
      data: {
        success: false,
        errors: { name: ['Informe como você quer ser chamado.'] },
        values: { name: '  ' }
      }
    });
    expect(completeProfile).not.toHaveBeenCalled();
  });

  it('saves only the name and continues to the dashboard', async () => {
    completeProfile.mockResolvedValue({
      success: true,
      user: { ...userWithoutName, name: 'Júlia' }
    });

    await expect(
      actions.default(createActionEvent({ name: 'Júlia', email: 'attacker@example.com' }) as never)
    ).rejects.toMatchObject({ status: 303, location: '/dashboard' });

    expect(completeProfile).toHaveBeenCalledWith('user-1', { name: 'Júlia' });
  });

  it('redirects to login when the user no longer exists', async () => {
    completeProfile.mockResolvedValue({ success: false, reason: 'USER_NOT_FOUND' });

    await expect(
      actions.default(createActionEvent({ name: 'Júlia' }) as never)
    ).rejects.toMatchObject({ status: 303, location: '/login' });
  });

  it('returns a generic error when the service throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    completeProfile.mockRejectedValue(new Error('database down'));

    const result = await actions.default(createActionEvent({ name: 'Júlia' }) as never);

    expect(result).toMatchObject({ status: 500, data: { success: false } });
    consoleError.mockRestore();
  });
});
