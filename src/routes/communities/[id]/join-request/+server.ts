import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import {
  requestCommunityJoin,
  getCommunityJoinRequest,
  cancelCommunityJoinRequest
} from '../../../../lib/server/services/community-join-request';

export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const result = await requestCommunityJoin(params.id, locals.user.id);

  if (!result.success) {
    switch (result.reason) {
      case 'COMMUNITY_NOT_FOUND':
        return json({ error: result.reason }, { status: 404 });

      case 'OPEN_COMMUNITY':
      case 'ALREADY_PENDING':
      case 'ALREADY_MEMBER':
      case 'CONFLICT':
        return json({ error: result.reason }, { status: 409 });
    }
  }

  return json({ request: result.request }, { status: 201 });
};

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const result = await getCommunityJoinRequest(params.id, locals.user.id);

  if (!result.success) {
    return json({ error: result.reason }, { status: 404 });
  }

  return json({ request: result.request });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const result = await cancelCommunityJoinRequest(params.id, locals.user.id);

  if (!result.success) {
    switch (result.reason) {
      case 'COMMUNITY_NOT_FOUND':
      case 'REQUEST_NOT_FOUND':
        return json({ error: result.reason }, { status: 404 });

      case 'REQUEST_NOT_PENDING':
        return json({ error: result.reason }, { status: 409 });
    }
  }

  return new Response(null, { status: 204 });
};
