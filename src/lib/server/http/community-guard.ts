// src/lib/server/http/community-guard.ts
import { error } from '@sveltejs/kit';
import { authorizeCommunityAction, type AuthorizeParams } from '../services/community-access';

export async function requireCommunityPermission(params: AuthorizeParams) {
  const result = await authorizeCommunityAction(params);

  if (result.allowed) {
    return result;
  }

  if (result.reason === 'NOT_MEMBER' || result.reason === 'TARGET_NOT_FOUND') {
    error(404, 'Not found');
  }

  error(403, 'You are not allowed to do this');
}
