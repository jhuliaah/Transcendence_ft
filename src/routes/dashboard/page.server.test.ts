import { expect, it } from 'vitest';
import { load } from './+page.server';

function createEvent(user: App.Locals['user']) {
  return {
    locals: { user }
  } as Parameters<typeof load>[0];
}

it('redirects unauthenticated users to login', async () => {
  await expect(load(createEvent(null))).rejects.toMatchObject({
    status: 303,
    location: '/login'
  });
});

it('returns the authenticated user', async () => {
  const user = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User'
  };

  await expect(load(createEvent(user))).resolves.toEqual({ user });
});
