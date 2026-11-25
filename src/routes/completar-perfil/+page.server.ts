import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { completeProfileSchema } from '../../lib/schemas/profile';
import { completeProfile } from '../../lib/server/services/profile';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/login');
  }

  // Quem já tem nome não precisa passar por esta etapa.
  if (locals.user.name) {
    redirect(303, '/dashboard');
  }

  return {
    user: locals.user
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      redirect(303, '/login');
    }

    const formData = await request.formData();
    const name = formData.get('name');

    const values = {
      name: typeof name === 'string' ? name : ''
    };

    const parsed = completeProfileSchema.safeParse(values);

    if (!parsed.success) {
      return fail(400, {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
        values
      });
    }

    let result;

    try {
      result = await completeProfile(locals.user.id, parsed.data);
    } catch (error) {
      console.error('Profile completion failed:', error);

      return fail(500, {
        success: false,
        message: 'Ocorreu um erro inesperado. Tente novamente.',
        values
      });
    }

    if (!result.success) {
      if (result.reason === 'USER_NOT_FOUND') {
        redirect(303, '/login');
      }

      return fail(400, {
        success: false,
        message: 'Os dados enviados são inválidos.',
        values
      });
    }

    redirect(303, '/dashboard');
  }
};
