import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

import { getPrisma } from '../../src/lib/server/db';
import { createTestUser, registerUser, loginUser } from './helpers/auth';
import type { TestUser } from './helpers/auth';

const prisma = getPrisma();

async function createInvitationFixture(actor: TestUser, actorRole: 'OWNER' | 'ADMIN' | 'MEMBER') {
  const actorRecord = await prisma.user.findUniqueOrThrow({
    where: { email: actor.email },
    select: { id: true }
  });

  const owner =
    actorRole === 'OWNER'
      ? actorRecord
      : await prisma.user.create({
          data: {
            email: `owner-${randomUUID()}@example.com`,
            name: 'E2E Community Owner'
          },
          select: { id: true }
        });

  const invitee = await prisma.user.create({
    data: {
      email: `invitee-${randomUUID()}@example.com`,
      name: 'E2E Invitee'
    },
    select: { id: true }
  });

  const community = await prisma.community.create({
    data: {
      name: `E2E Invitation Community ${randomUUID()}`,
      visibility: 'PUBLIC',
      joinPolicy: 'APPROVAL',
      memberships: {
        create: [
          {
            userId: owner.id,
            role: 'OWNER',
            status: 'ACTIVE'
          },
          ...(actorRole !== 'OWNER'
            ? [
                {
                  userId: actorRecord.id,
                  role: actorRole,
                  status: 'ACTIVE'
                } as const
              ]
            : [])
        ]
      }
    },
    select: { id: true, name: true }
  });

  return {
    actorId: actorRecord.id,
    invitee,
    community
  };
}

async function createPendingInvitation(invitedUserId: string) {
  const owner = await prisma.user.create({
    data: {
      email: `invitation-owner-${randomUUID()}@example.com`,
      name: 'E2E Invitation Owner'
    },
    select: { id: true }
  });

  const community = await prisma.community.create({
    data: {
      name: `E2E GET Invitation Community ${randomUUID()}`,
      visibility: 'PUBLIC',
      joinPolicy: 'APPROVAL',
      memberships: {
        create: {
          userId: owner.id,
          role: 'OWNER',
          status: 'ACTIVE'
        }
      }
    },
    select: { id: true, name: true }
  });

  const invitation = await prisma.communityInvitation.create({
    data: {
      communityId: community.id,
      invitedById: owner.id,
      invitedUserId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    select: { id: true, status: true }
  });

  return { community, invitation };
}

async function createPendingInvitationForCommunity(
  communityId: string,
  invitedById: string,
  invitedUserId: string
) {
  return prisma.communityInvitation.create({
    data: {
      communityId,
      invitedById,
      invitedUserId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    select: {
      id: true,
      status: true
    }
  });
}

test.describe('Community Invitations E2E', () => {
  const requestOptions = {
    headers: {
      Origin: 'http://127.0.0.1:4173'
    }
  };

  test('allows an owner to create an invitation', async ({ page }) => {
    const actor = createTestUser();

    await registerUser(page, actor);
    await loginUser(page, actor);

    const fixture = await createInvitationFixture(actor, 'OWNER');

    const response = await page.request.post(`/communities/${fixture.community.id}/invitations`, {
      ...requestOptions,
      data: {
        invitedUserId: fixture.invitee.id
      }
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    expect(body.invitation.status).toBe('PENDING');
    expect(body.invitation.id).toBeTruthy();
    expect(body.invitation.createdAt).toBeTruthy();
    expect(body.invitation.expiresAt).toBeTruthy();

    const persistedInvitation = await prisma.communityInvitation.findUnique({
      where: { id: body.invitation.id }
    });

    expect(persistedInvitation?.communityId).toBe(fixture.community.id);
    expect(persistedInvitation?.invitedById).toBe(fixture.actorId);
    expect(persistedInvitation?.invitedUserId).toBe(fixture.invitee.id);
    expect(persistedInvitation?.status).toBe('PENDING');
  });

  test('allows an admin to create an invitation', async ({ page }) => {
    const actor = createTestUser();

    await registerUser(page, actor);
    await loginUser(page, actor);

    const fixture = await createInvitationFixture(actor, 'ADMIN');

    const response = await page.request.post(`/communities/${fixture.community.id}/invitations`, {
      ...requestOptions,
      data: {
        invitedUserId: fixture.invitee.id
      }
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    expect(body.invitation.status).toBe('PENDING');
  });

  test('rejects invitation creation by a regular member', async ({ page }) => {
    const actor = createTestUser();

    await registerUser(page, actor);
    await loginUser(page, actor);

    const fixture = await createInvitationFixture(actor, 'MEMBER');

    const response = await page.request.post(`/communities/${fixture.community.id}/invitations`, {
      ...requestOptions,
      data: {
        invitedUserId: fixture.invitee.id
      }
    });

    expect(response.status()).toBe(403);

    const body = await response.json();

    expect(body.error).toBe('FORBIDDEN');
  });

  test('rejects unauthenticated invitation creation', async ({ page }) => {
    const actor = createTestUser();

    await prisma.user.create({
      data: {
        email: actor.email,
        name: actor.name
      }
    });

    const fixture = await createInvitationFixture(actor, 'OWNER');

    const response = await page.request.post(`/communities/${fixture.community.id}/invitations`, {
      ...requestOptions,
      data: {
        invitedUserId: fixture.invitee.id
      }
    });

    expect(response.status()).toBe(401);

    const body = await response.json();

    expect(body.error).toBe('UNAUTHENTICATED');
  });

  test('rejects invitations for nonexistent users', async ({ page }) => {
    const actor = createTestUser();

    await registerUser(page, actor);
    await loginUser(page, actor);

    const fixture = await createInvitationFixture(actor, 'OWNER');

    const response = await page.request.post(`/communities/${fixture.community.id}/invitations`, {
      ...requestOptions,
      data: {
        invitedUserId: 'nonexistent-user-id'
      }
    });

    expect(response.status()).toBe(404);

    const body = await response.json();

    expect(body.error).toBe('USER_NOT_FOUND');
  });

  test('rejects duplicate pending invitations', async ({ page }) => {
    const actor = createTestUser();

    await registerUser(page, actor);
    await loginUser(page, actor);

    const fixture = await createInvitationFixture(actor, 'OWNER');

    const firstResponse = await page.request.post(
      `/communities/${fixture.community.id}/invitations`,
      {
        ...requestOptions,
        data: {
          invitedUserId: fixture.invitee.id
        }
      }
    );

    expect(firstResponse.status()).toBe(201);

    const secondResponse = await page.request.post(
      `/communities/${fixture.community.id}/invitations`,
      {
        ...requestOptions,
        data: {
          invitedUserId: fixture.invitee.id
        }
      }
    );

    expect(secondResponse.status()).toBe(409);

    const body = await secondResponse.json();

    expect(body.error).toBe('ALREADY_PENDING');
  });

  test('rejects invalid request bodies', async ({ page }) => {
    const actor = createTestUser();

    await registerUser(page, actor);
    await loginUser(page, actor);

    const fixture = await createInvitationFixture(actor, 'OWNER');

    const response = await page.request.post(`/communities/${fixture.community.id}/invitations`, {
      ...requestOptions,
      data: {}
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body.error).toBe('VALIDATION_ERROR');
  });

  test('allows the invited user to retrieve their invitation', async ({ page }) => {
    const recipient = createTestUser();

    await registerUser(page, recipient);
    await loginUser(page, recipient);

    const recipientRecord = await prisma.user.findUniqueOrThrow({
      where: { email: recipient.email },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(recipientRecord.id);

    const response = await page.request.get(
      `/communities/invitations/${fixture.invitation.id}`,
      requestOptions
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.invitation.id).toBe(fixture.invitation.id);
    expect(body.invitation.status).toBe('PENDING');
    expect(body.invitation.community.id).toBe(fixture.community.id);
    expect(body.invitation.community.name).toBe(fixture.community.name);
  });

  test('does not allow another user to retrieve an invitation', async ({ page }) => {
    const stranger = createTestUser();

    await registerUser(page, stranger);
    await loginUser(page, stranger);

    const invitee = await prisma.user.create({
      data: {
        email: `invitation-invitee-${randomUUID()}@example.com`,
        name: 'E2E Invitation Invitee'
      },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(invitee.id);

    const response = await page.request.get(
      `/communities/invitations/${fixture.invitation.id}`,
      requestOptions
    );

    expect(response.status()).toBe(404);

    const body = await response.json();

    expect(body.error).toBe('INVITATION_NOT_FOUND');
  });

  test('returns 404 for a nonexistent invitation', async ({ page }) => {
    const recipient = createTestUser();

    await registerUser(page, recipient);
    await loginUser(page, recipient);

    const response = await page.request.get(
      `/communities/invitations/${randomUUID()}`,
      requestOptions
    );

    expect(response.status()).toBe(404);

    const body = await response.json();

    expect(body.error).toBe('INVITATION_NOT_FOUND');
  });

  test('rejects unauthenticated invitation retrieval', async ({ page }) => {
    const recipient = await prisma.user.create({
      data: {
        email: `invitation-recipient-${randomUUID()}@example.com`,
        name: 'E2E Invitation Recipient'
      },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(recipient.id);

    const response = await page.request.get(
      `/communities/invitations/${fixture.invitation.id}`,
      requestOptions
    );

    expect(response.status()).toBe(401);

    const body = await response.json();

    expect(body.error).toBe('UNAUTHENTICATED');
  });

  test('allows the invited user to accept an invitation', async ({ page }) => {
    const recipient = createTestUser();

    await registerUser(page, recipient);
    await loginUser(page, recipient);

    const recipientRecord = await prisma.user.findUniqueOrThrow({
      where: { email: recipient.email },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(recipientRecord.id);

    const response = await page.request.post(
      `/communities/invitations/${fixture.invitation.id}/accept`,
      requestOptions
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.membership).toEqual({
      communityId: fixture.community.id,
      userId: recipientRecord.id,
      role: 'MEMBER',
      status: 'ACTIVE'
    });

    const invitation = await prisma.communityInvitation.findUniqueOrThrow({
      where: { id: fixture.invitation.id },
      select: { status: true }
    });

    expect(invitation.status).toBe('ACCEPTED');

    const membership = await prisma.communityMembership.findUniqueOrThrow({
      where: {
        userId_communityId: {
          userId: recipientRecord.id,
          communityId: fixture.community.id
        }
      }
    });

    expect(membership.role).toBe('MEMBER');
    expect(membership.status).toBe('ACTIVE');
  });

  test('does not allow another user to accept an invitation', async ({ page }) => {
    const stranger = createTestUser();

    await registerUser(page, stranger);
    await loginUser(page, stranger);

    const invitee = await prisma.user.create({
      data: {
        email: `invitation-invitee-${randomUUID()}@example.com`,
        name: 'E2E Invitation Invitee'
      },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(invitee.id);

    const response = await page.request.post(
      `/communities/invitations/${fixture.invitation.id}/accept`,
      requestOptions
    );

    expect(response.status()).toBe(404);

    const body = await response.json();

    expect(body.error).toBe('INVITATION_NOT_FOUND');
  });

  test('rejects unauthenticated invitation acceptance', async ({ page }) => {
    const recipient = await prisma.user.create({
      data: {
        email: `invitation-recipient-${randomUUID()}@example.com`,
        name: 'E2E Invitation Recipient'
      },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(recipient.id);

    const response = await page.request.post(
      `/communities/invitations/${fixture.invitation.id}/accept`,
      requestOptions
    );

    expect(response.status()).toBe(401);

    const body = await response.json();

    expect(body.error).toBe('UNAUTHENTICATED');
  });

  test('does not allow accepting an expired invitation', async ({ page }) => {
    const recipient = createTestUser();

    await registerUser(page, recipient);
    await loginUser(page, recipient);

    const recipientRecord = await prisma.user.findUniqueOrThrow({
      where: { email: recipient.email },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(recipientRecord.id);

    await prisma.communityInvitation.update({
      where: { id: fixture.invitation.id },
      data: { expiresAt: new Date(Date.now() - 1000) }
    });

    const response = await page.request.post(
      `/communities/invitations/${fixture.invitation.id}/accept`,
      requestOptions
    );

    expect(response.status()).toBe(409);

    const body = await response.json();

    expect(body.error).toBe('INVITATION_EXPIRED');
  });

  test('does not allow accepting a revoked invitation', async ({ page }) => {
    const recipient = createTestUser();

    await registerUser(page, recipient);
    await loginUser(page, recipient);

    const recipientRecord = await prisma.user.findUniqueOrThrow({
      where: { email: recipient.email },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(recipientRecord.id);

    await prisma.communityInvitation.update({
      where: { id: fixture.invitation.id },
      data: { status: 'REVOKED' }
    });

    const response = await page.request.post(
      `/communities/invitations/${fixture.invitation.id}/accept`,
      requestOptions
    );

    expect(response.status()).toBe(409);

    const body = await response.json();

    expect(body.error).toBe('INVITATION_NOT_PENDING');
  });

  test('allows the invited user to reject an invitation', async ({ page }) => {
    const recipient = createTestUser();

    await registerUser(page, recipient);
    await loginUser(page, recipient);

    const recipientRecord = await prisma.user.findUniqueOrThrow({
      where: { email: recipient.email },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(recipientRecord.id);

    const response = await page.request.post(
      `/communities/invitations/${fixture.invitation.id}/reject`,
      requestOptions
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.success).toBe(true);

    const invitation = await prisma.communityInvitation.findUniqueOrThrow({
      where: { id: fixture.invitation.id },
      select: { status: true }
    });

    expect(invitation.status).toBe('REJECTED');

    const membership = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId: recipientRecord.id,
          communityId: fixture.community.id
        }
      }
    });

    expect(membership).toBeNull();
  });

  test('does not allow another user to reject an invitation', async ({ page }) => {
    const stranger = createTestUser();

    await registerUser(page, stranger);
    await loginUser(page, stranger);

    const invitee = await prisma.user.create({
      data: {
        email: `invitation-invitee-${randomUUID()}@example.com`,
        name: 'E2E Invitation Invitee'
      },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(invitee.id);

    const response = await page.request.post(
      `/communities/invitations/${fixture.invitation.id}/reject`,
      requestOptions
    );

    expect(response.status()).toBe(404);

    const body = await response.json();

    expect(body.error).toBe('INVITATION_NOT_FOUND');

    const invitation = await prisma.communityInvitation.findUniqueOrThrow({
      where: { id: fixture.invitation.id },
      select: { status: true }
    });

    expect(invitation.status).toBe('PENDING');
  });

  test('rejects unauthenticated invitation rejection', async ({ page }) => {
    const recipient = await prisma.user.create({
      data: {
        email: `invitation-recipient-${randomUUID()}@example.com`,
        name: 'E2E Invitation Recipient'
      },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(recipient.id);

    const response = await page.request.post(
      `/communities/invitations/${fixture.invitation.id}/reject`,
      requestOptions
    );

    expect(response.status()).toBe(401);

    const body = await response.json();

    expect(body.error).toBe('UNAUTHENTICATED');
  });

  test('does not allow rejecting an accepted invitation', async ({ page }) => {
    const recipient = createTestUser();

    await registerUser(page, recipient);
    await loginUser(page, recipient);

    const recipientRecord = await prisma.user.findUniqueOrThrow({
      where: { email: recipient.email },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(recipientRecord.id);

    await prisma.communityInvitation.update({
      where: { id: fixture.invitation.id },
      data: { status: 'ACCEPTED' }
    });

    const response = await page.request.post(
      `/communities/invitations/${fixture.invitation.id}/reject`,
      requestOptions
    );

    expect(response.status()).toBe(409);

    const body = await response.json();

    expect(body.error).toBe('INVITATION_NOT_PENDING');
  });

  test('returns 404 when rejecting a nonexistent invitation', async ({ page }) => {
    const recipient = createTestUser();

    await registerUser(page, recipient);
    await loginUser(page, recipient);

    const response = await page.request.post(
      `/communities/invitations/${randomUUID()}/reject`,
      requestOptions
    );

    expect(response.status()).toBe(404);

    const body = await response.json();

    expect(body.error).toBe('INVITATION_NOT_FOUND');
  });

  test('allows the owner to revoke an invitation', async ({ page }) => {
    const actor = createTestUser();

    await registerUser(page, actor);
    await loginUser(page, actor);

    const fixture = await createInvitationFixture(actor, 'OWNER');

    const invitation = await createPendingInvitationForCommunity(
      fixture.community.id,
      fixture.actorId,
      fixture.invitee.id
    );

    const response = await page.request.post(
      `/communities/invitations/${invitation.id}/revoke`,
      requestOptions
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.success).toBe(true);

    const updatedInvitation = await prisma.communityInvitation.findUniqueOrThrow({
      where: { id: invitation.id },
      select: { status: true }
    });

    expect(updatedInvitation.status).toBe('REVOKED');
  });

  test('allows an admin to revoke an invitation', async ({ page }) => {
    const actor = createTestUser();

    await registerUser(page, actor);
    await loginUser(page, actor);

    const fixture = await createInvitationFixture(actor, 'ADMIN');

    const invitation = await createPendingInvitationForCommunity(
      fixture.community.id,
      fixture.actorId,
      fixture.invitee.id
    );

    const response = await page.request.post(
      `/communities/invitations/${invitation.id}/revoke`,
      requestOptions
    );

    expect(response.status()).toBe(200);

    const updatedInvitation = await prisma.communityInvitation.findUniqueOrThrow({
      where: { id: invitation.id },
      select: { status: true }
    });

    expect(updatedInvitation.status).toBe('REVOKED');
  });

  test('does not allow a member to revoke an invitation', async ({ page }) => {
    const actor = createTestUser();

    await registerUser(page, actor);
    await loginUser(page, actor);

    const fixture = await createInvitationFixture(actor, 'MEMBER');

    const invitation = await createPendingInvitationForCommunity(
      fixture.community.id,
      fixture.actorId,
      fixture.invitee.id
    );

    const response = await page.request.post(
      `/communities/invitations/${invitation.id}/revoke`,
      requestOptions
    );

    expect(response.status()).toBe(403);

    const body = await response.json();

    expect(body.error).toBe('FORBIDDEN');
  });

  test('does not allow an outsider to revoke an invitation', async ({ page }) => {
    const stranger = createTestUser();

    await registerUser(page, stranger);
    await loginUser(page, stranger);

    const invitee = await prisma.user.create({
      data: {
        email: `invitation-invitee-${randomUUID()}@example.com`,
        name: 'E2E Invitation Invitee'
      },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(invitee.id);

    const response = await page.request.post(
      `/communities/invitations/${fixture.invitation.id}/revoke`,
      requestOptions
    );

    expect(response.status()).toBe(403);

    const body = await response.json();

    expect(body.error).toBe('FORBIDDEN');
  });

  test('rejects unauthenticated invitation revocation', async ({ page }) => {
    const invitee = await prisma.user.create({
      data: {
        email: `invitation-invitee-${randomUUID()}@example.com`,
        name: 'E2E Invitation Invitee'
      },
      select: { id: true }
    });

    const fixture = await createPendingInvitation(invitee.id);

    const response = await page.request.post(
      `/communities/invitations/${fixture.invitation.id}/revoke`,
      requestOptions
    );

    expect(response.status()).toBe(401);

    const body = await response.json();

    expect(body.error).toBe('UNAUTHENTICATED');
  });

  test('does not allow revoking an accepted invitation', async ({ page }) => {
    const actor = createTestUser();

    await registerUser(page, actor);
    await loginUser(page, actor);

    const fixture = await createInvitationFixture(actor, 'OWNER');

    const invitation = await createPendingInvitationForCommunity(
      fixture.community.id,
      fixture.actorId,
      fixture.invitee.id
    );

    await prisma.communityInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' }
    });

    const response = await page.request.post(
      `/communities/invitations/${invitation.id}/revoke`,
      requestOptions
    );

    expect(response.status()).toBe(409);

    const body = await response.json();

    expect(body.error).toBe('INVITATION_NOT_PENDING');
  });

  test('returns 404 when revoking a nonexistent invitation', async ({ page }) => {
    const actor = createTestUser();

    await registerUser(page, actor);
    await loginUser(page, actor);

    const response = await page.request.post(
      `/communities/invitations/${randomUUID()}/revoke`,
      requestOptions
    );

    expect(response.status()).toBe(404);

    const body = await response.json();

    expect(body.error).toBe('INVITATION_NOT_FOUND');
  });
});
