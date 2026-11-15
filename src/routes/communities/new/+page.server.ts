import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createCommunitySchema } from '../../../lib/schemas/community';
import { createCommunity } from '../../../lib/server/services/community';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/login');
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
    const description = formData.get('description');
    const visibility = formData.get('visibility');
    const joinPolicy = formData.get('joinPolicy');

    const values = {
      name: typeof name === 'string' ? name : '',
      description: typeof description === 'string' ? description : '',
      visibility: typeof visibility === 'string' ? visibility : 'PUBLIC',
      joinPolicy: typeof joinPolicy === 'string' ? joinPolicy : 'OPEN'
    };

    const parsed = createCommunitySchema.safeParse(values);

    if (!parsed.success) {
      return fail(400, {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
        values
      });
    }

    let result;

    try {
      result = await createCommunity(parsed.data, locals.user.id);
    } catch (error) {
      console.error('Community creation failed:', error);

      return fail(500, {
        success: false,
        message: 'An unexpected error occurred. Please try again.',
        values
      });
    }

    if (!result.success) {
      return fail(400, {
        success: false,
        message: 'The submitted data is invalid.',
        values
      });
    }

    redirect(303, `/communities/${result.community.id}`);
  }
};
