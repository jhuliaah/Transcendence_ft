// @vitest-environment node

import { afterAll, beforeEach, expect, it } from 'vitest';
import { getPrisma } from '../../src/lib/server/db';
import { authorizeCommunityAction } from '../../src/lib/server/services/community-access';

const prisma = getPrisma();

const emails = [
  'access-owner@example.com',
  'access-admin@example.com',
  'access-member@example.com',
  'access-pending@example.com'
];
const communityName = 'Access Integration Community';

async function cleanup() {
  await prisma.community.deleteMany({ where: { name: communityName } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function seed() {
  const [owner, admin, member, pending] = await Promise.all(
    emails.map((email) => prisma.user.create({ data: { email } }))
  );

  const community = await prisma.community.create({
    data: {
      name: communityName,
      memberships: {
        create: [
          { userId: owner.id, role: 'OWNER', status: 'ACTIVE' },
          { userId: admin.id, role: 'ADMIN', status: 'ACTIVE' },
          { userId: member.id, role: 'MEMBER', status: 'ACTIVE' },
          { userId: pending.id, role: 'MEMBER', status: 'PENDING' }
        ]
      }
    }
  });

  return { owner, admin, member, pending, community };
}

it('enforces the permission matrix against real memberships', async () => {
  const { owner, admin, member, pending, community } = await seed();
  const communityId = community.id;

  expect(
    await authorizeCommunityAction({ userId: pending.id, communityId, action: 'message:send' })
  ).toEqual({ allowed: false, reason: 'NOT_MEMBER' });

  expect(
    await authorizeCommunityAction({
      userId: member.id,
      communityId,
      action: 'join_request:review'
    })
  ).toEqual({ allowed: false, reason: 'FORBIDDEN' });

  expect(
    await authorizeCommunityAction({
      userId: admin.id,
      communityId,
      action: 'member:remove',
      targetUserId: owner.id
    })
  ).toEqual({ allowed: false, reason: 'TARGET_PROTECTED' });

  expect(
    await authorizeCommunityAction({
      userId: admin.id,
      communityId,
      action: 'member:remove',
      targetUserId: member.id
    })
  ).toEqual({ allowed: true, role: 'ADMIN' });
});
