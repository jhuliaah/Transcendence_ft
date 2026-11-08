// @vitest-environment node

import { afterAll, beforeEach, expect, it } from 'vitest';
import { getPrisma } from '../../src/lib/server/db';

const prisma = getPrisma();

const testEmails = ['community-owner@example.com', 'community-member@example.com'];

const testCommunityNames = ['Integration Community', 'Default Community', 'Cascade Community'];

async function cleanup() {
  await prisma.community.deleteMany({
    where: {
      name: { in: testCommunityNames }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: { in: testEmails }
    }
  });
}

beforeEach(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

it('creates a community with an active owner', async () => {
  const user = await prisma.user.create({
    data: {
      email: testEmails[0],
      name: 'Community Owner'
    }
  });

  const community = await prisma.community.create({
    data: {
      name: 'Integration Community',
      description: 'Community integration test',
      visibility: 'PRIVATE',
      joinPolicy: 'APPROVAL',
      memberships: {
        create: {
          user: {
            connect: { id: user.id }
          },
          role: 'OWNER',
          status: 'ACTIVE'
        }
      }
    },
    include: {
      memberships: {
        include: {
          user: true
        }
      }
    }
  });

  expect(community.name).toBe('Integration Community');
  expect(community.visibility).toBe('PRIVATE');
  expect(community.joinPolicy).toBe('APPROVAL');

  expect(community.memberships).toHaveLength(1);
  expect(community.memberships[0].role).toBe('OWNER');
  expect(community.memberships[0].status).toBe('ACTIVE');
  expect(community.memberships[0].user.id).toBe(user.id);
});

it('uses the default values for community and membership', async () => {
  const user = await prisma.user.create({
    data: {
      email: testEmails[0]
    }
  });

  const community = await prisma.community.create({
    data: {
      name: 'Default Community',
      memberships: {
        create: {
          user: {
            connect: { id: user.id }
          }
        }
      }
    },
    include: {
      memberships: true
    }
  });

  expect(community.visibility).toBe('PUBLIC');
  expect(community.joinPolicy).toBe('OPEN');

  expect(community.memberships[0].role).toBe('MEMBER');
  expect(community.memberships[0].status).toBe('PENDING');
});

it('rejects duplicate memberships for the same user and community', async () => {
  const user = await prisma.user.create({
    data: {
      email: testEmails[0]
    }
  });

  const community = await prisma.community.create({
    data: {
      name: 'Integration Community'
    }
  });

  const membership = {
    userId: user.id,
    communityId: community.id
  };

  await prisma.communityMembership.create({
    data: membership
  });

  await expect(
    prisma.communityMembership.create({
      data: membership
    })
  ).rejects.toMatchObject({
    code: 'P2002'
  });
});

it('rejects memberships referencing a nonexistent user', async () => {
  const community = await prisma.community.create({
    data: {
      name: 'Integration Community'
    }
  });

  await expect(
    prisma.communityMembership.create({
      data: {
        userId: 'nonexistent-user-id',
        communityId: community.id
      }
    })
  ).rejects.toMatchObject({
    code: 'P2003'
  });
});

it('cascades membership deletion when a community is deleted', async () => {
  const user = await prisma.user.create({
    data: {
      email: testEmails[0]
    }
  });

  const community = await prisma.community.create({
    data: {
      name: 'Cascade Community',
      memberships: {
        create: {
          user: {
            connect: { id: user.id }
          }
        }
      }
    }
  });

  await prisma.community.delete({
    where: { id: community.id }
  });

  const memberships = await prisma.communityMembership.findMany({
    where: { communityId: community.id }
  });

  expect(memberships).toHaveLength(0);
});

it('prevents deleting a user who still has a membership', async () => {
  const user = await prisma.user.create({
    data: {
      email: testEmails[0]
    }
  });

  const community = await prisma.community.create({
    data: {
      name: 'Integration Community',
      memberships: {
        create: {
          user: {
            connect: { id: user.id }
          }
        }
      }
    }
  });

  await expect(
    prisma.user.delete({
      where: { id: user.id }
    })
  ).rejects.toMatchObject({
    code: 'P2003'
  });

  await expect(
    prisma.community.findUnique({
      where: { id: community.id }
    })
  ).resolves.not.toBeNull();
});
