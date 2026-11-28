import { getPrisma } from '../../../src/lib/server/db';

const prisma = getPrisma();

type CleanupTestDataInput = {
  userEmails?: string[];
  communityNames?: string[];
};

export async function cleanupTestData({
  userEmails = [],
  communityNames = []
}: CleanupTestDataInput) {
  if (communityNames.length > 0) {
    await prisma.community.deleteMany({
      where: {
        name: { in: communityNames }
      }
    });
  }

  if (userEmails.length > 0) {
    await prisma.user.deleteMany({
      where: {
        email: { in: userEmails }
      }
    });
  }
}
