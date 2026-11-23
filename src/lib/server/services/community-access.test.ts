// src/lib/server/services/community-access.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findUnique } = vi.hoisted(() => ({
  findUnique: vi.fn()
}));

vi.mock('../db', () => ({
  getPrisma: () => ({
    communityMembership: { findUnique }
  })
}));

import { authorizeCommunityAction } from './community-access';

const base = { userId: 'actor', communityId: 'c1' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authorizeCommunityAction', () => {
  it('denies users who are not members', async () => {
    findUnique.mockResolvedValueOnce(null);

    const result = await authorizeCommunityAction({ ...base, action: 'message:send' });

    expect(result).toEqual({ allowed: false, reason: 'NOT_MEMBER' });
  });

  it('treats a pending membership as no membership', async () => {
    findUnique.mockResolvedValueOnce({ role: 'MEMBER', status: 'PENDING' });

    const result = await authorizeCommunityAction({ ...base, action: 'message:send' });

    expect(result).toEqual({ allowed: false, reason: 'NOT_MEMBER' });
  });

  it('allows an active member to send messages', async () => {
    findUnique.mockResolvedValueOnce({ role: 'MEMBER', status: 'ACTIVE' });

    const result = await authorizeCommunityAction({ ...base, action: 'message:send' });

    expect(result).toEqual({ allowed: true, role: 'MEMBER' });
  });

  it('forbids a member from reviewing join requests', async () => {
    findUnique.mockResolvedValueOnce({ role: 'MEMBER', status: 'ACTIVE' });

    const result = await authorizeCommunityAction({ ...base, action: 'join_request:review' });

    expect(result).toEqual({ allowed: false, reason: 'FORBIDDEN' });
  });

  it('allows an admin to remove a member', async () => {
    findUnique
      .mockResolvedValueOnce({ role: 'ADMIN', status: 'ACTIVE' })
      .mockResolvedValueOnce({ role: 'MEMBER', status: 'ACTIVE' });

    const result = await authorizeCommunityAction({
      ...base,
      action: 'member:remove',
      targetUserId: 'target'
    });

    expect(result).toEqual({ allowed: true, role: 'ADMIN' });
  });

  it('prevents an admin from removing the owner', async () => {
    findUnique
      .mockResolvedValueOnce({ role: 'ADMIN', status: 'ACTIVE' })
      .mockResolvedValueOnce({ role: 'OWNER', status: 'ACTIVE' });

    const result = await authorizeCommunityAction({
      ...base,
      action: 'member:remove',
      targetUserId: 'owner'
    });

    expect(result).toEqual({ allowed: false, reason: 'TARGET_PROTECTED' });
  });

  it('lets the owner remove an admin', async () => {
    findUnique
      .mockResolvedValueOnce({ role: 'OWNER', status: 'ACTIVE' })
      .mockResolvedValueOnce({ role: 'ADMIN', status: 'ACTIVE' });

    const result = await authorizeCommunityAction({
      ...base,
      action: 'member:remove',
      targetUserId: 'admin'
    });

    expect(result).toEqual({ allowed: true, role: 'OWNER' });
  });

  it('rejects removing yourself or omitting the target', async () => {
    findUnique.mockResolvedValue({ role: 'OWNER', status: 'ACTIVE' });

    const self = await authorizeCommunityAction({
      ...base,
      action: 'member:remove',
      targetUserId: 'actor'
    });
    const missing = await authorizeCommunityAction({ ...base, action: 'member:remove' });

    expect(self).toEqual({ allowed: false, reason: 'FORBIDDEN' });
    expect(missing).toEqual({ allowed: false, reason: 'FORBIDDEN' });
  });

  it('reports a target that is not an active member', async () => {
    findUnique
      .mockResolvedValueOnce({ role: 'ADMIN', status: 'ACTIVE' })
      .mockResolvedValueOnce({ role: 'MEMBER', status: 'REMOVED' });

    const result = await authorizeCommunityAction({
      ...base,
      action: 'member:remove',
      targetUserId: 'gone'
    });

    expect(result).toEqual({ allowed: false, reason: 'TARGET_NOT_FOUND' });
  });
});
