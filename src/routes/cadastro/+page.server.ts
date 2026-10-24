import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { registerSchema } from '../../lib/schemas/auth';
import { registerUser } from '../../lib/server/services/auth';

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();

    const email = formData.get('email');
    const password = formData.get('password');
    const name = formData.get('name');

    const values = {
      email: typeof email === 'string' ? email : '',
      name: typeof name === 'string' ? name : ''
    };

    const input = {
      email: values.email,
      password: typeof password === 'string' ? password : '',
      name: values.name.trim() || undefined
    };

    const parsed = registerSchema.safeParse(input);

    if (!parsed.success) {
      return fail(400, {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
        values
      });
    }

    let result;

    try {
      result = await registerUser(parsed.data);
    } catch (error) {
      console.error('Registration failed:', error);

      return fail(500, {
        success: false,
        message: 'An unexpected error occurred. Please try again.',
        values
      });
    }

    if (!result.success) {
      if (result.reason === 'EMAIL_ALREADY_EXISTS') {
        return fail(409, {
          success: false,
          message: 'An account with this email already exists.',
          values
        });
      }

      return fail(400, {
        success: false,
        message: 'The submitted data is invalid.',
        values
      });
    }

    return {
      success: true,
      message: 'Account created successfully. You can log in once the login page is available.'
    };
  }
};
