// src/lib/server/permissions/community-permissions.ts
export type CommunityRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type CommunityAction =
  | 'community:edit_settings'
  | 'community:leave'
  | 'join_request:review'
  | 'invitation:send'
  | 'member:remove'
  | 'message:send'
  | 'message:moderate'
  | 'rules:change';

export const COMMUNITY_PERMISSIONS: Record<CommunityAction, readonly CommunityRole[]> = {
  'community:edit_settings': ['OWNER'],
  'community:leave': ['ADMIN', 'MEMBER'],
  'join_request:review': ['OWNER', 'ADMIN'],
  'invitation:send': ['OWNER', 'ADMIN'],
  'member:remove': ['OWNER', 'ADMIN'],
  'message:send': ['OWNER', 'ADMIN', 'MEMBER'],
  'message:moderate': ['OWNER', 'ADMIN'],
  'rules:change': ['OWNER', 'ADMIN']
};

const MANAGEABLE_TARGETS: Record<CommunityRole, readonly CommunityRole[]> = {
  OWNER: ['ADMIN', 'MEMBER'],
  ADMIN: ['MEMBER'],
  MEMBER: []
};

export function can(role: CommunityRole, action: CommunityAction): boolean {
  return COMMUNITY_PERMISSIONS[action].includes(role);
}

export function canManageMember(actor: CommunityRole, target: CommunityRole): boolean {
  return MANAGEABLE_TARGETS[actor].includes(target);
}

export function canChangeRole(
  actor: CommunityRole,
  target: CommunityRole,
  newRole: CommunityRole
): boolean {
  return actor === 'OWNER' && target !== 'OWNER' && newRole !== 'OWNER';
}
