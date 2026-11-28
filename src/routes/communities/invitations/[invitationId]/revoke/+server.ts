import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { revokeCommunityInvitation } from '../../../../../lib/server/services/community-invitation';

export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const result = await revokeCommunityInvitation(params.invitationId, locals.user.id);

  if (!result.success) {
    switch (result.reason) {
      case 'INVITATION_NOT_FOUND':
        return json({ error: result.reason }, { status: 404 });

      case 'FORBIDDEN':
        return json({ error: result.reason }, { status: 403 });

      case 'INVITATION_NOT_PENDING':
      case 'CONFLICT':
        return json({ error: result.reason }, { status: 409 });
    }
  }

  return json({ success: true });
};
