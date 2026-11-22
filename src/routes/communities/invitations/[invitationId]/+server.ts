import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { getCommunityInvitation } from '../../../../lib/server/services/community-invitation';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const result = await getCommunityInvitation(params.invitationId, locals.user.id);

  if (!result.success) {
    return json({ error: result.reason }, { status: 404 });
  }

  return json({ invitation: result.invitation });
};
