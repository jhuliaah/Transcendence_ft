import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { updateCommunitySettingsSchema } from '../../../../lib/schemas/community';
import { requireCommunityPermission } from '../../../../lib/server/http/community-guard';
import {
  getCommunitySettings,
  updateCommunitySettings
} from '../../../../lib/server/services/community-settings';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) {
    redirect(303, '/login');
  }

  // 404 if not an active member, 403 if the role cannot edit settings.
  await requireCommunityPermission({
    userId: locals.user.id,
    communityId: params.id,
    action: 'community:edit_settings'
  });

  const community = await getCommunitySettings(params.id);

  if (!community) {
    error(404, 'Not found');
  }

  return { community };
};

export const actions: Actions = {
  default: async ({ request, params, locals }) => {
    if (!locals.user) {
      redirect(303, '/login');
    }

    await requireCommunityPermission({
      userId: locals.user.id,
      communityId: params.id,
      action: 'community:edit_settings'
    });

    const formData = await request.formData();

    const name = formData.get('name');
    const description = formData.get('description');
    const visibility = formData.get('visibility');
    const joinPolicy = formData.get('joinPolicy');

    const values = {
      name: typeof name === 'string' ? name : '',
      description: typeof description === 'string' ? description : '',
      visibility: typeof visibility === 'string' ? visibility : '',
      joinPolicy: typeof joinPolicy === 'string' ? joinPolicy : ''
    };

    const parsed = updateCommunitySettingsSchema.safeParse(values);

    if (!parsed.success) {
      return fail(400, {
        success: false,
        errors: parsed.error.flatten().fieldErrors,
        values
      });
    }

    let result;

    try {
      result = await updateCommunitySettings(params.id, parsed.data);
    } catch (err) {
      console.error('Community settings update failed:', err);

      return fail(500, {
        success: false,
        message: 'An unexpected error occurred. Please try again.',
        values
      });
    }

    if (!result.success) {
      if (result.reason === 'COMMUNITY_NOT_FOUND') {
        error(404, 'Not found');
      }

      return fail(400, {
        success: false,
        message: 'The submitted data is invalid.',
        values
      });
    }

    return { success: true, values: result.community };
  }
};
