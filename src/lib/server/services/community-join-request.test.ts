import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  communityFindUnique,
  membershipFindUnique,
  membershipFindUniqueOrThrow,
  membershipCreate,
  membershipUpdateMany,
  membershipDeleteMany
} = vi.hoisted(() => ({
  communityFindUnique: vi.fn(),
  membershipFindUnique: vi.fn(),
  membershipFindUniqueOrThrow: vi.fn(),
  membershipCreate: vi.fn(),
  membershipUpdateMany: vi.fn(),
  membershipDeleteMany: vi.fn()
}));

vi.mock('../db', () => ({
  getPrisma: () => ({
    community: {
      findUnique: communityFindUnique
    },
    communityMembership: {
      findUnique: membershipFindUnique,
      findUniqueOrThrow: membershipFindUniqueOrThrow,
      create: membershipCreate,
      updateMany: membershipUpdateMany,
      deleteMany: membershipDeleteMany
    }
  })
}));

import {
  requestCommunityJoin,
  getCommunityJoinRequest,
  cancelCommunityJoinRequest
} from './community-join-request';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('requestCommunityJoin', () => {
  it('creates a pending request for an approval community', async () => {
    communityFindUnique.mockResolvedValue({ joinPolicy: 'APPROVAL' });
    membershipFindUnique.mockResolvedValue(null);

    membershipCreate.mockResolvedValue({
      id: 'membership-1',
      status: 'PENDING'
    });

    const result = await requestCommunityJoin('community-1', 'user-1');

    expect(result).toEqual({
      success: true,
      request: {
        id: 'membership-1',
        status: 'PENDING'
      }
    });

    expect(membershipCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        communityId: 'community-1',
        role: 'MEMBER',
        status: 'PENDING'
      },
      select: {
        id: true,
        status: true
      }
    });
  });

  it('rejects requests for nonexistent communities', async () => {
    communityFindUnique.mockResolvedValue(null);

    const result = await requestCommunityJoin('community-1', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'COMMUNITY_NOT_FOUND'
    });

    expect(membershipFindUnique).not.toHaveBeenCalled();
    expect(membershipCreate).not.toHaveBeenCalled();
  });

  it('rejects requests for open communities', async () => {
    communityFindUnique.mockResolvedValue({ joinPolicy: 'OPEN' });

    const result = await requestCommunityJoin('community-1', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'OPEN_COMMUNITY'
    });

    expect(membershipCreate).not.toHaveBeenCalled();
  });

  it('rejects duplicate pending requests', async () => {
    communityFindUnique.mockResolvedValue({ joinPolicy: 'APPROVAL' });

    membershipFindUnique.mockResolvedValue({
      id: 'membership-1',
      status: 'PENDING'
    });

    const result = await requestCommunityJoin('community-1', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'ALREADY_PENDING'
    });

    expect(membershipCreate).not.toHaveBeenCalled();
  });

  it('rejects requests from active members', async () => {
    communityFindUnique.mockResolvedValue({ joinPolicy: 'APPROVAL' });

    membershipFindUnique.mockResolvedValue({
      id: 'membership-1',
      status: 'ACTIVE'
    });

    const result = await requestCommunityJoin('community-1', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'ALREADY_MEMBER'
    });

    expect(membershipCreate).not.toHaveBeenCalled();
  });

  it('reactivates rejected requests', async () => {
    communityFindUnique.mockResolvedValue({ joinPolicy: 'APPROVAL' });

    membershipFindUnique.mockResolvedValueOnce({
      id: 'membership-1',
      status: 'REJECTED'
    });

    membershipUpdateMany.mockResolvedValue({ count: 1 });

    membershipFindUniqueOrThrow.mockResolvedValue({
      id: 'membership-1',
      status: 'PENDING'
    });

    const result = await requestCommunityJoin('community-1', 'user-1');

    expect(result).toEqual({
      success: true,
      request: {
        id: 'membership-1',
        status: 'PENDING'
      }
    });

    expect(membershipUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'membership-1',
        status: { in: ['REJECTED', 'REMOVED'] }
      },
      data: {
        status: 'PENDING'
      }
    });
  });
});

describe('getCommunityJoinRequest', () => {
  it('returns the authenticated user request', async () => {
    const dates = {
      createdAt: new Date(),
      updatedAt: new Date()
    };

    communityFindUnique.mockResolvedValue({ id: 'community-1' });

    membershipFindUnique.mockResolvedValue({
      status: 'PENDING',
      ...dates
    });

    const result = await getCommunityJoinRequest('community-1', 'user-1');

    expect(result).toEqual({
      success: true,
      request: {
        status: 'PENDING',
        ...dates
      }
    });

    expect(membershipFindUnique).toHaveBeenCalledWith({
      where: {
        userId_communityId: {
          userId: 'user-1',
          communityId: 'community-1'
        }
      },
      select: {
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
  });

  it('returns null when the user has no request', async () => {
    communityFindUnique.mockResolvedValue({ id: 'community-1' });
    membershipFindUnique.mockResolvedValue(null);

    const result = await getCommunityJoinRequest('community-1', 'user-1');

    expect(result).toEqual({
      success: true,
      request: null
    });
  });
});

describe('cancelCommunityJoinRequest', () => {
  it('cancels a pending request', async () => {
    communityFindUnique.mockResolvedValue({ id: 'community-1' });
    membershipDeleteMany.mockResolvedValue({ count: 1 });

    const result = await cancelCommunityJoinRequest('community-1', 'user-1');

    expect(result).toEqual({
      success: true
    });

    expect(membershipDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        communityId: 'community-1',
        status: 'PENDING'
      }
    });
  });

  it('does not cancel an active membership', async () => {
    communityFindUnique.mockResolvedValue({ id: 'community-1' });

    membershipDeleteMany.mockResolvedValue({ count: 0 });

    membershipFindUnique.mockResolvedValue({
      status: 'ACTIVE'
    });

    const result = await cancelCommunityJoinRequest('community-1', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'REQUEST_NOT_PENDING'
    });
  });

  it('returns not found when no membership exists', async () => {
    communityFindUnique.mockResolvedValue({ id: 'community-1' });

    membershipDeleteMany.mockResolvedValue({ count: 0 });
    membershipFindUnique.mockResolvedValue(null);

    const result = await cancelCommunityJoinRequest('community-1', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'REQUEST_NOT_FOUND'
    });
  });
});
