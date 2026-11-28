// @vitest-environment node

import { afterAll, beforeEach, expect, it } from 'vitest';

import { getPrisma } from '../../src/lib/server/db';
import {
  requestCommunityJoin,
  getCommunityJoinRequest,
  cancelCommunityJoinRequest
} from '../../src/lib/server/services/community-join-request';

import { createTestUser } from './helpers/users';
import { createTestCommunity, createTestMembership } from './helpers/communities';
import { cleanupTestData } from './helpers/cleanup';

const prisma = getPrisma();

const testEmails = ['join-owner@example.com', 'join-member@example.com', 'join-other@example.com'];

const testCommunityNames = ['Join Request Approval Community', 'Join Request Open Community'];

beforeEach(async () => {
  await cleanupTestData({
    userEmails: testEmails,
    communityNames: testCommunityNames
  });
});

afterAll(async () => {
  await cleanupTestData({
    userEmails: testEmails,
    communityNames: testCommunityNames
  });

  await prisma.$disconnect();
});

it('creates a pending join request for an approval community', async () => {
  const user = await createTestUser(testEmails[1]);
  const community = await createTestCommunity({
    name: testCommunityNames[0],
    joinPolicy: 'APPROVAL'
  });

  const result = await requestCommunityJoin(community.id, user.id);

  expect(result.success).toBe(true);

  if (!result.success) {
    throw new Error('Join request creation unexpectedly failed');
  }

  expect(result.request.status).toBe('PENDING');

  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: user.id,
        communityId: community.id
      }
    }
  });

  expect(membership).not.toBeNull();
  expect(membership?.status).toBe('PENDING');
  expect(membership?.role).toBe('MEMBER');
});

it('rejects a request for a nonexistent community', async () => {
  const user = await createTestUser(testEmails[1]);

  const result = await requestCommunityJoin('nonexistent-community-id', user.id);

  expect(result).toEqual({
    success: false,
    reason: 'COMMUNITY_NOT_FOUND'
  });
});

it('rejects a request for an open community', async () => {
  const user = await createTestUser(testEmails[1]);
  const community = await createTestCommunity({
    name: testCommunityNames[1],
    joinPolicy: 'OPEN'
  });

  const result = await requestCommunityJoin(community.id, user.id);

  expect(result).toEqual({
    success: false,
    reason: 'OPEN_COMMUNITY'
  });

  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: user.id,
        communityId: community.id
      }
    }
  });

  expect(membership).toBeNull();
});

it('rejects duplicate pending requests', async () => {
  const user = await createTestUser(testEmails[1]);
  const community = await createTestCommunity({
    name: testCommunityNames[0],
    joinPolicy: 'APPROVAL'
  });

  const first = await requestCommunityJoin(community.id, user.id);
  const second = await requestCommunityJoin(community.id, user.id);

  expect(first.success).toBe(true);
  expect(second).toEqual({
    success: false,
    reason: 'ALREADY_PENDING'
  });

  const memberships = await prisma.communityMembership.findMany({
    where: {
      userId: user.id,
      communityId: community.id
    }
  });

  expect(memberships).toHaveLength(1);
});

it('rejects a request from an active member', async () => {
  const user = await createTestUser(testEmails[1]);
  const community = await createTestCommunity({
    name: testCommunityNames[0],
    joinPolicy: 'APPROVAL'
  });

  await createTestMembership({
    userId: user.id,
    communityId: community.id,
    status: 'ACTIVE'
  });

  const result = await requestCommunityJoin(community.id, user.id);

  expect(result).toEqual({
    success: false,
    reason: 'ALREADY_MEMBER'
  });

  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: user.id,
        communityId: community.id
      }
    }
  });

  expect(membership?.status).toBe('ACTIVE');
});

it.each(['REJECTED', 'REMOVED'] as const)(
  'allows a new request after a previous %s status',
  async (previousStatus) => {
    const user = await createTestUser(testEmails[1]);
    const community = await createTestCommunity({
      name: testCommunityNames[0],
      joinPolicy: 'APPROVAL'
    });

    await createTestMembership({
      userId: user.id,
      communityId: community.id,
      role: 'ADMIN',
      status: previousStatus
    });

    const result = await requestCommunityJoin(community.id, user.id);

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('New join request unexpectedly failed');
    }

    expect(result.request.status).toBe('PENDING');

    const membership = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId: user.id,
          communityId: community.id
        }
      }
    });

    expect(membership?.status).toBe('PENDING');
    expect(membership?.role).toBe('MEMBER');
  }
);

it('returns the current membership status', async () => {
  const user = await createTestUser(testEmails[1]);
  const community = await createTestCommunity({
    name: testCommunityNames[0],
    joinPolicy: 'APPROVAL'
  });

  await createTestMembership({
    userId: user.id,
    communityId: community.id,
    status: 'PENDING'
  });

  const result = await getCommunityJoinRequest(community.id, user.id);

  expect(result.success).toBe(true);

  if (!result.success) {
    throw new Error('Join request lookup unexpectedly failed');
  }

  expect(result.request?.status).toBe('PENDING');
  expect(result.request?.createdAt).toBeInstanceOf(Date);
  expect(result.request?.updatedAt).toBeInstanceOf(Date);
});

it('does not expose another user membership', async () => {
  const user = await createTestUser(testEmails[1]);
  const otherUser = await createTestUser(testEmails[2]);

  const community = await createTestCommunity({
    name: testCommunityNames[0],
    joinPolicy: 'APPROVAL'
  });

  await createTestMembership({
    userId: otherUser.id,
    communityId: community.id,
    status: 'PENDING'
  });

  const result = await getCommunityJoinRequest(community.id, user.id);

  expect(result).toEqual({
    success: true,
    request: null
  });
});

it('returns null when the user has no membership', async () => {
  const user = await createTestUser(testEmails[1]);
  const community = await createTestCommunity({
    name: testCommunityNames[0],
    joinPolicy: 'APPROVAL'
  });

  const result = await getCommunityJoinRequest(community.id, user.id);

  expect(result).toEqual({
    success: true,
    request: null
  });
});

it('returns an error when looking up a nonexistent community', async () => {
  const user = await createTestUser(testEmails[1]);

  const result = await getCommunityJoinRequest('nonexistent-community-id', user.id);

  expect(result).toEqual({
    success: false,
    reason: 'COMMUNITY_NOT_FOUND'
  });
});

it('cancels a pending request and deletes its membership', async () => {
  const user = await createTestUser(testEmails[1]);
  const community = await createTestCommunity({
    name: testCommunityNames[0],
    joinPolicy: 'APPROVAL'
  });

  await requestCommunityJoin(community.id, user.id);

  const result = await cancelCommunityJoinRequest(community.id, user.id);

  expect(result).toEqual({ success: true });

  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: user.id,
        communityId: community.id
      }
    }
  });

  expect(membership).toBeNull();
});

it('does not cancel an active membership', async () => {
  const user = await createTestUser(testEmails[1]);
  const community = await createTestCommunity({
    name: testCommunityNames[0],
    joinPolicy: 'APPROVAL'
  });

  await createTestMembership({
    userId: user.id,
    communityId: community.id,
    status: 'ACTIVE'
  });

  const result = await cancelCommunityJoinRequest(community.id, user.id);

  expect(result).toEqual({
    success: false,
    reason: 'REQUEST_NOT_PENDING'
  });

  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: user.id,
        communityId: community.id
      }
    }
  });

  expect(membership?.status).toBe('ACTIVE');
});

it('does not cancel another user membership', async () => {
  const owner = await createTestUser(testEmails[0]);
  const user = await createTestUser(testEmails[1]);
  const otherUser = await createTestUser(testEmails[2]);

  const community = await createTestCommunity({
    name: testCommunityNames[0],
    joinPolicy: 'APPROVAL'
  });

  await prisma.communityMembership.createMany({
    data: [
      {
        userId: owner.id,
        communityId: community.id,
        role: 'OWNER',
        status: 'ACTIVE'
      },
      {
        userId: user.id,
        communityId: community.id,
        status: 'PENDING'
      },
      {
        userId: otherUser.id,
        communityId: community.id,
        status: 'PENDING'
      }
    ]
  });

  const result = await cancelCommunityJoinRequest(community.id, user.id);

  expect(result).toEqual({ success: true });

  const otherMembership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: otherUser.id,
        communityId: community.id
      }
    }
  });

  expect(otherMembership?.status).toBe('PENDING');
});

it('handles concurrent requests without creating duplicate memberships', async () => {
  const user = await createTestUser(testEmails[1]);
  const community = await createTestCommunity({
    name: testCommunityNames[0],
    joinPolicy: 'APPROVAL'
  });

  const results = await Promise.all([
    requestCommunityJoin(community.id, user.id),
    requestCommunityJoin(community.id, user.id)
  ]);

  expect(results.filter((result) => result.success)).toHaveLength(1);

  expect(
    results.filter((result) => !result.success && result.reason === 'ALREADY_PENDING')
  ).toHaveLength(1);

  const memberships = await prisma.communityMembership.findMany({
    where: {
      userId: user.id,
      communityId: community.id
    }
  });

  expect(memberships).toHaveLength(1);
  expect(memberships[0].status).toBe('PENDING');
});

it('handles concurrent join requests without creating duplicates', async () => {
  const user = await createTestUser(testEmails[1]);
  const community = await createTestCommunity({
    name: testCommunityNames[0],
    joinPolicy: 'APPROVAL'
  });

  const results = await Promise.all([
    requestCommunityJoin(community.id, user.id),
    requestCommunityJoin(community.id, user.id)
  ]);

  expect(results.filter((result) => result.success)).toHaveLength(1);

  expect(results).toContainEqual({
    success: false,
    reason: 'ALREADY_PENDING'
  });

  const memberships = await prisma.communityMembership.findMany({
    where: {
      userId: user.id,
      communityId: community.id
    }
  });

  expect(memberships).toHaveLength(1);
  expect(memberships[0].status).toBe('PENDING');
});

it('handles concurrent cancellation of the same request', async () => {
  const user = await createTestUser(testEmails[1]);
  const community = await createTestCommunity({
    name: testCommunityNames[0],
    joinPolicy: 'APPROVAL'
  });

  await requestCommunityJoin(community.id, user.id);

  const results = await Promise.all([
    cancelCommunityJoinRequest(community.id, user.id),
    cancelCommunityJoinRequest(community.id, user.id)
  ]);

  expect(results.filter((result) => result.success)).toHaveLength(1);

  expect(results).toContainEqual({
    success: false,
    reason: 'REQUEST_NOT_FOUND'
  });

  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: user.id,
        communityId: community.id
      }
    }
  });

  expect(membership).toBeNull();
});
