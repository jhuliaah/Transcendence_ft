import type { Handle } from '@sveltejs/kit/hooks';
import { validateSession } from './lib/server/services/auth';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('session');

  event.locals.user = null;

  if (sessionToken) {
    try {
      const session = await validateSession(sessionToken);

      if (session) {
        event.locals.user = session.user;
      } else {
        event.cookies.delete('session', { path: '/' });
      }
    } catch (error) {
      console.error('Session validation failed:', error);
    }
  }

  return resolve(event);
};
