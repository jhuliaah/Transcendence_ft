import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { loginSchema } from '../../lib/schemas/auth';
import { authenticateUser, createSession } from '../../lib/server/services/auth';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();

    const email = formData.get('email');
    const password = formData.get('password');

    const values = {
      email: typeof email === 'string' ? email : ''
    };

    const input = {
      email: values.email,
      password: typeof password === 'string' ? password : ''
    };

    const parsed = loginSchema.safeParse(input);

    if (!parsed.success) {
      return fail(400, {
        success: false,
        message: 'Please enter a valid email and password.',
        values
      });
    }

    try {
      const result = await authenticateUser(parsed.data);

      if (!result.success) {
        return fail(400, {
          success: false,
          message: 'Invalid email or password.',
          values
        });
      }

      const session = await createSession(result.user.id);

      cookies.set('session', session.token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: session.expiresAt,
        maxAge: session.maxAge
      });
    } catch (error) {
      console.error('Login failed:', error);

      return fail(500, {
        success: false,
        message: 'An unexpected error occurred. Please try again.',
        values
      });
    }

    redirect(303, '/');
  }
};
