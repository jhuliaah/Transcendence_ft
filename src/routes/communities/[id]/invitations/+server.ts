import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { createCommunityInvitationSchema } from '../../../../lib/schemas/community';
import { createCommunityInvitation } from '../../../../lib/server/services/community-invitation';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'INVALID_BODY' }, { status: 400 });
  }

  const parsed = createCommunityInvitationSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const result = await createCommunityInvitation(
    params.id,
    parsed.data.invitedUserId,
    locals.user.id
  );

  if (!result.success) {
    switch (result.reason) {
      case 'COMMUNITY_NOT_FOUND':
      case 'USER_NOT_FOUND':
        return json({ error: result.reason }, { status: 404 });

      case 'FORBIDDEN':
        return json({ error: result.reason }, { status: 403 });

      case 'ALREADY_MEMBER':
      case 'ALREADY_PENDING':
      case 'CONFLICT':
        return json({ error: result.reason }, { status: 409 });
    }
  }

  return json({ invitation: result.invitation }, { status: 201 });
};
