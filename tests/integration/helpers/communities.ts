import { getPrisma } from '../../../src/lib/server/db';

const prisma = getPrisma();

type CreateTestCommunityInput = {
  name: string;
  description?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  joinPolicy?: 'OPEN' | 'APPROVAL';
};

type CreateTestMembershipInput = {
  userId: string;
  communityId: string;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
  status?: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED';
};

export async function createTestCommunity(input: CreateTestCommunityInput) {
  return prisma.community.create({
    data: {
      name: input.name,
      ...(input.description !== undefined && { description: input.description }),
      ...(input.visibility !== undefined && { visibility: input.visibility }),
      ...(input.joinPolicy !== undefined && { joinPolicy: input.joinPolicy })
    }
  });
}

export async function createTestMembership(input: CreateTestMembershipInput) {
  return prisma.communityMembership.create({
    data: {
      userId: input.userId,
      communityId: input.communityId,
      ...(input.role !== undefined && { role: input.role }),
      ...(input.status !== undefined && { status: input.status })
    }
  });
}
