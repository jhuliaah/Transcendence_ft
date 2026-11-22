// @vitest-environment node

import { afterAll, beforeEach, expect, it } from 'vitest';

import { getPrisma } from '../../src/lib/server/db';
import {
  acceptCommunityInvitation,
  createCommunityInvitation,
  getCommunityInvitation,
  rejectCommunityInvitation,
  revokeCommunityInvitation
} from '../../src/lib/server/services/community-invitation';

import { createTestUser } from './helpers/users';
import { createTestCommunity, createTestMembership } from './helpers/communities';
import { cleanupTestData } from './helpers/cleanup';

const prisma = getPrisma();

const testEmails = [
  'invitation-owner@example.com',
  'invitation-admin@example.com',
  'invitation-member@example.com',
  'invitation-invitee@example.com',
  'invitation-outsider@example.com'
];

const testCommunityName = 'Community Invitation Integration Test';

async function createFixture() {
  const [owner, admin, member, invitee, outsider] = await Promise.all(
    testEmails.map((email) => createTestUser(email))
  );

  const community = await createTestCommunity({
    name: testCommunityName
  });

  await Promise.all([
    createTestMembership({
      userId: owner.id,
      communityId: community.id,
      role: 'OWNER',
      status: 'ACTIVE'
    }),
    createTestMembership({
      userId: admin.id,
      communityId: community.id,
      role: 'ADMIN',
      status: 'ACTIVE'
    }),
    createTestMembership({
      userId: member.id,
      communityId: community.id,
      role: 'MEMBER',
      status: 'ACTIVE'
    })
  ]);

  return {
    owner,
    admin,
    member,
    invitee,
    outsider,
    community
  };
}

async function createInvitation(communityId: string, invitedUserId: string, actorId: string) {
  const result = await createCommunityInvitation(communityId, invitedUserId, actorId);

  if (!result.success) {
    throw new Error(`Invitation creation failed: ${result.reason}`);
  }

  return result.invitation;
}

beforeEach(async () => {
  await cleanupTestData({
    userEmails: testEmails,
    communityNames: [testCommunityName]
  });
});

afterAll(async () => {
  await cleanupTestData({
    userEmails: testEmails,
    communityNames: [testCommunityName]
  });

  await prisma.$disconnect();
});

// -----------------------------------------------------------------------------
// createCommunityInvitation
// -----------------------------------------------------------------------------

it.each(['OWNER', 'ADMIN'] as const)(
  'allows an active %s to create an invitation',
  async (role) => {
    const fixture = await createFixture();

    const actorId = role === 'OWNER' ? fixture.owner.id : fixture.admin.id;

    const result = await createCommunityInvitation(
      fixture.community.id,
      fixture.invitee.id,
      actorId
    );

    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Invitation creation unexpectedly failed');
    }

    expect(result.invitation.status).toBe('PENDING');
    expect(result.invitation.createdAt).toBeInstanceOf(Date);
    expect(result.invitation.expiresAt).toBeInstanceOf(Date);

    const invitation = await prisma.communityInvitation.findUnique({
      where: {
        id: result.invitation.id
      }
    });

    expect(invitation?.communityId).toBe(fixture.community.id);
    expect(invitation?.invitedById).toBe(actorId);
    expect(invitation?.invitedUserId).toBe(fixture.invitee.id);
    expect(invitation?.status).toBe('PENDING');

    const validity = invitation!.expiresAt.getTime() - invitation!.createdAt.getTime();

    expect(validity).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
    expect(validity).toBeLessThan(8 * 24 * 60 * 60 * 1000);
  }
);

it('rejects invitation creation by a regular member', async () => {
  const fixture = await createFixture();

  const result = await createCommunityInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.member.id
  );

  expect(result).toEqual({
    success: false,
    reason: 'FORBIDDEN'
  });
});

it('rejects invitation creation by a user without membership', async () => {
  const fixture = await createFixture();

  const result = await createCommunityInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.outsider.id
  );

  expect(result).toEqual({
    success: false,
    reason: 'FORBIDDEN'
  });
});

it('rejects invitation creation by an inactive admin', async () => {
  const fixture = await createFixture();

  await prisma.communityMembership.update({
    where: {
      userId_communityId: {
        userId: fixture.admin.id,
        communityId: fixture.community.id
      }
    },
    data: {
      status: 'REMOVED'
    }
  });

  const result = await createCommunityInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.admin.id
  );

  expect(result).toEqual({
    success: false,
    reason: 'FORBIDDEN'
  });
});

it('rejects invitation creation for a nonexistent community', async () => {
  const fixture = await createFixture();

  const result = await createCommunityInvitation(
    'nonexistent-community-id',
    fixture.invitee.id,
    fixture.owner.id
  );

  expect(result).toEqual({
    success: false,
    reason: 'COMMUNITY_NOT_FOUND'
  });
});

it('rejects invitation creation for a nonexistent user', async () => {
  const fixture = await createFixture();

  const result = await createCommunityInvitation(
    fixture.community.id,
    'nonexistent-user-id',
    fixture.owner.id
  );

  expect(result).toEqual({
    success: false,
    reason: 'USER_NOT_FOUND'
  });
});

it('rejects invitations for active members', async () => {
  const fixture = await createFixture();

  const result = await createCommunityInvitation(
    fixture.community.id,
    fixture.member.id,
    fixture.owner.id
  );

  expect(result).toEqual({
    success: false,
    reason: 'ALREADY_MEMBER'
  });
});

it('rejects duplicate pending invitations', async () => {
  const fixture = await createFixture();

  const first = await createCommunityInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  const second = await createCommunityInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  expect(first.success).toBe(true);

  expect(second).toEqual({
    success: false,
    reason: 'ALREADY_PENDING'
  });

  const invitations = await prisma.communityInvitation.findMany({
    where: {
      communityId: fixture.community.id,
      invitedUserId: fixture.invitee.id,
      status: 'PENDING'
    }
  });

  expect(invitations).toHaveLength(1);
});

it('revokes an expired pending invitation before creating a new one', async () => {
  const fixture = await createFixture();

  const first = await createInvitation(fixture.community.id, fixture.invitee.id, fixture.owner.id);

  await prisma.communityInvitation.update({
    where: { id: first.id },
    data: {
      expiresAt: new Date(Date.now() - 1000)
    }
  });

  const second = await createCommunityInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  expect(second.success).toBe(true);

  if (!second.success) {
    throw new Error('New invitation creation unexpectedly failed');
  }

  const oldInvitation = await prisma.communityInvitation.findUnique({
    where: { id: first.id }
  });

  expect(oldInvitation?.status).toBe('REVOKED');
  expect(second.invitation.id).not.toBe(first.id);

  const pendingInvitations = await prisma.communityInvitation.findMany({
    where: {
      communityId: fixture.community.id,
      invitedUserId: fixture.invitee.id,
      status: 'PENDING'
    }
  });

  expect(pendingInvitations).toHaveLength(1);
});

it('handles concurrent invitation creation without duplicates', async () => {
  const fixture = await createFixture();

  const results = await Promise.all([
    createCommunityInvitation(fixture.community.id, fixture.invitee.id, fixture.owner.id),
    createCommunityInvitation(fixture.community.id, fixture.invitee.id, fixture.owner.id)
  ]);

  expect(results.filter((result) => result.success)).toHaveLength(1);

  expect(
    results.filter((result) => !result.success && result.reason === 'ALREADY_PENDING')
  ).toHaveLength(1);

  const invitations = await prisma.communityInvitation.findMany({
    where: {
      communityId: fixture.community.id,
      invitedUserId: fixture.invitee.id,
      status: 'PENDING'
    }
  });

  expect(invitations).toHaveLength(1);
});

// -----------------------------------------------------------------------------
// getCommunityInvitation
// -----------------------------------------------------------------------------

it('allows the invited user to retrieve an invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  const result = await getCommunityInvitation(invitation.id, fixture.invitee.id);

  expect(result.success).toBe(true);

  if (!result.success) {
    throw new Error('Invitation lookup unexpectedly failed');
  }

  expect(result.invitation.id).toBe(invitation.id);
  expect(result.invitation.status).toBe('PENDING');
  expect(result.invitation.community.id).toBe(fixture.community.id);
  expect(result.invitation.community.name).toBe(testCommunityName);
});

it('does not expose an invitation to another user', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  const result = await getCommunityInvitation(invitation.id, fixture.outsider.id);

  expect(result).toEqual({
    success: false,
    reason: 'INVITATION_NOT_FOUND'
  });
});

it('returns an error for a nonexistent invitation', async () => {
  const fixture = await createFixture();

  const result = await getCommunityInvitation('nonexistent-invitation-id', fixture.invitee.id);

  expect(result).toEqual({
    success: false,
    reason: 'INVITATION_NOT_FOUND'
  });
});

// -----------------------------------------------------------------------------
// acceptCommunityInvitation
// -----------------------------------------------------------------------------

it('accepts an invitation and creates an active membership', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  const result = await acceptCommunityInvitation(invitation.id, fixture.invitee.id);

  expect(result).toEqual({
    success: true,
    membership: {
      communityId: fixture.community.id,
      userId: fixture.invitee.id,
      role: 'MEMBER',
      status: 'ACTIVE'
    }
  });

  const persistedInvitation = await prisma.communityInvitation.findUnique({
    where: { id: invitation.id }
  });

  expect(persistedInvitation?.status).toBe('ACCEPTED');

  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: fixture.invitee.id,
        communityId: fixture.community.id
      }
    }
  });

  expect(membership?.role).toBe('MEMBER');
  expect(membership?.status).toBe('ACTIVE');
});

it.each(['PENDING', 'REJECTED', 'REMOVED'] as const)(
  'reactivates an existing %s membership when accepting an invitation',
  async (previousStatus) => {
    const fixture = await createFixture();

    await prisma.communityMembership.create({
      data: {
        userId: fixture.invitee.id,
        communityId: fixture.community.id,
        role: 'MEMBER',
        status: previousStatus
      }
    });

    const invitation = await createInvitation(
      fixture.community.id,
      fixture.invitee.id,
      fixture.owner.id
    );

    const result = await acceptCommunityInvitation(invitation.id, fixture.invitee.id);

    expect(result.success).toBe(true);

    const membership = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId: fixture.invitee.id,
          communityId: fixture.community.id
        }
      }
    });

    expect(membership?.status).toBe('ACTIVE');
    expect(membership?.role).toBe('MEMBER');

    const persistedInvitation = await prisma.communityInvitation.findUnique({
      where: { id: invitation.id }
    });

    expect(persistedInvitation?.status).toBe('ACCEPTED');
  }
);

it('does not allow another user to accept an invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  const result = await acceptCommunityInvitation(invitation.id, fixture.outsider.id);

  expect(result).toEqual({
    success: false,
    reason: 'INVITATION_NOT_FOUND'
  });

  const persistedInvitation = await prisma.communityInvitation.findUnique({
    where: { id: invitation.id }
  });

  expect(persistedInvitation?.status).toBe('PENDING');
});

it('rejects acceptance of a nonexistent invitation', async () => {
  const fixture = await createFixture();

  const result = await acceptCommunityInvitation('nonexistent-invitation-id', fixture.invitee.id);

  expect(result).toEqual({
    success: false,
    reason: 'INVITATION_NOT_FOUND'
  });
});

it('does not allow accepting an expired invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  await prisma.communityInvitation.update({
    where: { id: invitation.id },
    data: {
      expiresAt: new Date(Date.now() - 1000)
    }
  });

  const result = await acceptCommunityInvitation(invitation.id, fixture.invitee.id);

  expect(result).toEqual({
    success: false,
    reason: 'INVITATION_EXPIRED'
  });

  const persistedInvitation = await prisma.communityInvitation.findUnique({
    where: { id: invitation.id }
  });

  expect(persistedInvitation?.status).toBe('PENDING');

  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: fixture.invitee.id,
        communityId: fixture.community.id
      }
    }
  });

  expect(membership).toBeNull();
});

it('does not allow accepting a revoked invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  await prisma.communityInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'REVOKED'
    }
  });

  const result = await acceptCommunityInvitation(invitation.id, fixture.invitee.id);

  expect(result).toEqual({
    success: false,
    reason: 'INVITATION_NOT_PENDING'
  });
});

it('does not allow accepting an invitation when already an active member', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  await prisma.communityMembership.create({
    data: {
      userId: fixture.invitee.id,
      communityId: fixture.community.id,
      status: 'ACTIVE'
    }
  });

  const result = await acceptCommunityInvitation(invitation.id, fixture.invitee.id);

  expect(result).toEqual({
    success: false,
    reason: 'ALREADY_MEMBER'
  });

  const persistedInvitation = await prisma.communityInvitation.findUnique({
    where: { id: invitation.id }
  });

  expect(persistedInvitation?.status).toBe('PENDING');
});

it('handles concurrent acceptance of the same invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  const results = await Promise.all([
    acceptCommunityInvitation(invitation.id, fixture.invitee.id),
    acceptCommunityInvitation(invitation.id, fixture.invitee.id)
  ]);

  expect(results.filter((result) => result.success)).toHaveLength(1);

  const failures = results.filter((result) => !result.success);

  expect(failures).toHaveLength(1);
  expect(['INVITATION_NOT_PENDING', 'CONFLICT']).toContain(failures[0].reason);

  const persistedInvitation = await prisma.communityInvitation.findUnique({
    where: { id: invitation.id }
  });

  expect(persistedInvitation?.status).toBe('ACCEPTED');

  const memberships = await prisma.communityMembership.findMany({
    where: {
      userId: fixture.invitee.id,
      communityId: fixture.community.id
    }
  });

  expect(memberships).toHaveLength(1);
  expect(memberships[0].status).toBe('ACTIVE');
  expect(memberships[0].role).toBe('MEMBER');
});

// -----------------------------------------------------------------------------
// rejectCommunityInvitation
// -----------------------------------------------------------------------------

it('allows the invited user to reject an invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  const result = await rejectCommunityInvitation(invitation.id, fixture.invitee.id);

  expect(result).toEqual({ success: true });

  const persistedInvitation = await prisma.communityInvitation.findUnique({
    where: { id: invitation.id }
  });

  expect(persistedInvitation?.status).toBe('REJECTED');
});

it('does not allow another user to reject an invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  const result = await rejectCommunityInvitation(invitation.id, fixture.outsider.id);

  expect(result).toEqual({
    success: false,
    reason: 'INVITATION_NOT_FOUND'
  });

  const persistedInvitation = await prisma.communityInvitation.findUnique({
    where: { id: invitation.id }
  });

  expect(persistedInvitation?.status).toBe('PENDING');
});

it('allows rejecting an expired pending invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  await prisma.communityInvitation.update({
    where: { id: invitation.id },
    data: {
      expiresAt: new Date(Date.now() - 1000)
    }
  });

  const result = await rejectCommunityInvitation(invitation.id, fixture.invitee.id);

  expect(result).toEqual({ success: true });

  const persistedInvitation = await prisma.communityInvitation.findUnique({
    where: { id: invitation.id }
  });

  expect(persistedInvitation?.status).toBe('REJECTED');
});

it('does not allow rejecting an already accepted invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  await prisma.communityInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'ACCEPTED'
    }
  });

  const result = await rejectCommunityInvitation(invitation.id, fixture.invitee.id);

  expect(result).toEqual({
    success: false,
    reason: 'INVITATION_NOT_PENDING'
  });
});

// -----------------------------------------------------------------------------
// revokeCommunityInvitation
// -----------------------------------------------------------------------------

it.each(['OWNER', 'ADMIN'] as const)(
  'allows an active %s to revoke an invitation',
  async (role) => {
    const fixture = await createFixture();

    const actorId = role === 'OWNER' ? fixture.owner.id : fixture.admin.id;

    const invitation = await createInvitation(
      fixture.community.id,
      fixture.invitee.id,
      fixture.owner.id
    );

    const result = await revokeCommunityInvitation(invitation.id, actorId);

    expect(result).toEqual({ success: true });

    const persistedInvitation = await prisma.communityInvitation.findUnique({
      where: { id: invitation.id }
    });

    expect(persistedInvitation?.status).toBe('REVOKED');
  }
);

it('does not allow a regular member to revoke an invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  const result = await revokeCommunityInvitation(invitation.id, fixture.member.id);

  expect(result).toEqual({
    success: false,
    reason: 'FORBIDDEN'
  });

  const persistedInvitation = await prisma.communityInvitation.findUnique({
    where: { id: invitation.id }
  });

  expect(persistedInvitation?.status).toBe('PENDING');
});

it('does not allow a user outside the community to revoke an invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  const result = await revokeCommunityInvitation(invitation.id, fixture.outsider.id);

  expect(result).toEqual({
    success: false,
    reason: 'FORBIDDEN'
  });
});

it('returns an error when revoking a nonexistent invitation', async () => {
  const fixture = await createFixture();

  const result = await revokeCommunityInvitation('nonexistent-invitation-id', fixture.owner.id);

  expect(result).toEqual({
    success: false,
    reason: 'INVITATION_NOT_FOUND'
  });
});

it('does not allow revoking an already accepted invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  await prisma.communityInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'ACCEPTED'
    }
  });

  const result = await revokeCommunityInvitation(invitation.id, fixture.owner.id);

  expect(result).toEqual({
    success: false,
    reason: 'INVITATION_NOT_PENDING'
  });
});

it('allows revoking an expired pending invitation', async () => {
  const fixture = await createFixture();

  const invitation = await createInvitation(
    fixture.community.id,
    fixture.invitee.id,
    fixture.owner.id
  );

  await prisma.communityInvitation.update({
    where: { id: invitation.id },
    data: {
      expiresAt: new Date(Date.now() - 1000)
    }
  });

  const result = await revokeCommunityInvitation(invitation.id, fixture.owner.id);

  expect(result).toEqual({ success: true });

  const persistedInvitation = await prisma.communityInvitation.findUnique({
    where: { id: invitation.id }
  });

  expect(persistedInvitation?.status).toBe('REVOKED');
});
