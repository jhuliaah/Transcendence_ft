import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { revokeSession } from '../../lib/server/services/auth';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get('session');

  if (token) {
    await revokeSession(token);
  }

  cookies.delete('session', { path: '/' });

  redirect(303, '/');
};
