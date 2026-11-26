// src/lib/server/services/community-access.ts
import { getPrisma } from '../db';
import {
  can,
  canManageMember,
  type CommunityAction,
  type CommunityRole
} from '../permissions/community-permissions';

export type AuthorizationResult =
  | { allowed: true; role: CommunityRole }
  | {
      allowed: false;
      reason: 'NOT_MEMBER' | 'FORBIDDEN' | 'TARGET_NOT_FOUND' | 'TARGET_PROTECTED';
    };

export type AuthorizeParams = {
  userId: string;
  communityId: string;
  action: CommunityAction;
  targetUserId?: string;
};

async function findActiveRole(userId: string, communityId: string): Promise<CommunityRole | null> {
  const membership = await getPrisma().communityMembership.findUnique({
    where: { userId_communityId: { userId, communityId } },
    select: { role: true, status: true }
  });

  return membership?.status === 'ACTIVE' ? membership.role : null;
}

export async function authorizeCommunityAction({
  userId,
  communityId,
  action,
  targetUserId
}: AuthorizeParams): Promise<AuthorizationResult> {
  const role = await findActiveRole(userId, communityId);

  if (!role) {
    return { allowed: false, reason: 'NOT_MEMBER' };
  }

  if (!can(role, action)) {
    return { allowed: false, reason: 'FORBIDDEN' };
  }

  if (action === 'member:remove') {
    if (!targetUserId || targetUserId === userId) {
      return { allowed: false, reason: 'FORBIDDEN' };
    }

    const targetRole = await findActiveRole(targetUserId, communityId);

    if (!targetRole) {
      return { allowed: false, reason: 'TARGET_NOT_FOUND' };
    }

    if (!canManageMember(role, targetRole)) {
      return { allowed: false, reason: 'TARGET_PROTECTED' };
    }
  }

  return { allowed: true, role };
}
