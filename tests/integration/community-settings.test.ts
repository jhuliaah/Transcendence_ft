// @vitest-environment node

import { afterAll, beforeEach, expect, it } from 'vitest';
import { getPrisma } from '../../src/lib/server/db';
import { authorizeCommunityAction } from '../../src/lib/server/services/community-access';
import {
  getCommunitySettings,
  updateCommunitySettings
} from '../../src/lib/server/services/community-settings';

const prisma = getPrisma();

const emails = ['settings-owner@example.com', 'settings-admin@example.com'];
const extraEmails = ['settings-pending@example.com'];
const names = ['Settings Community', 'Settings Community Renamed'];

async function cleanup() {
  await prisma.community.deleteMany({ where: { name: { in: names } } });
  await prisma.user.deleteMany({ where: { email: { in: [...emails, ...extraEmails] } } });
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function seed() {
  const [owner, admin] = await Promise.all(
    emails.map((email) => prisma.user.create({ data: { email } }))
  );

  const community = await prisma.community.create({
    data: {
      name: 'Settings Community',
      memberships: {
        create: [
          { userId: owner.id, role: 'OWNER', status: 'ACTIVE' },
          { userId: admin.id, role: 'ADMIN', status: 'ACTIVE' }
        ]
      }
    }
  });

  return { owner, admin, community };
}

it('lets only the owner edit settings and persists the change', async () => {
  const { owner, admin, community } = await seed();
  const action = 'community:edit_settings' as const;

  expect(
    await authorizeCommunityAction({ userId: admin.id, communityId: community.id, action })
  ).toEqual({ allowed: false, reason: 'FORBIDDEN' });

  expect(
    await authorizeCommunityAction({ userId: owner.id, communityId: community.id, action })
  ).toEqual({ allowed: true, role: 'OWNER' });

  const result = await updateCommunitySettings(community.id, {
    name: 'Settings Community Renamed',
    description: 'Now with a description',
    visibility: 'PRIVATE',
    joinPolicy: 'APPROVAL'
  });

  expect(result.success).toBe(true);

  expect(await getCommunitySettings(community.id)).toEqual({
    id: community.id,
    name: 'Settings Community Renamed',
    description: 'Now with a description',
    visibility: 'PRIVATE',
    joinPolicy: 'APPROVAL'
  });
});

it('does not change pending requests when the join policy changes', async () => {
  const { community } = await seed();
  const pending = await prisma.user.create({ data: { email: 'settings-pending@example.com' } });

  await prisma.communityMembership.create({
    data: { userId: pending.id, communityId: community.id, status: 'PENDING' }
  });

  for (const joinPolicy of ['APPROVAL', 'OPEN'] as const) {
    await updateCommunitySettings(community.id, {
      name: 'Settings Community',
      visibility: 'PUBLIC',
      joinPolicy
    });
  }

  const membership = await prisma.communityMembership.findUnique({
    where: { userId_communityId: { userId: pending.id, communityId: community.id } }
  });

  expect(membership?.status).toBe('PENDING');
});

it('reports a missing community', async () => {
  expect(
    await updateCommunitySettings('does-not-exist', {
      name: 'X',
      visibility: 'PUBLIC',
      joinPolicy: 'OPEN'
    })
  ).toEqual({ success: false, reason: 'COMMUNITY_NOT_FOUND' });
});
