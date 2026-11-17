import { getPrisma } from '../db';
import { createCommunitySchema } from '../../schemas/community';

export type CreateCommunityResult =
  | {
      success: true;
      community: {
        id: string;
        name: string;
      };
    }
  | {
      success: false;
      reason: 'INVALID_INPUT';
    };

export async function createCommunity(
  input: unknown,
  creatorId: string
): Promise<CreateCommunityResult> {
  const parsed = createCommunitySchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, reason: 'INVALID_INPUT' };
  }

  const community = await getPrisma().community.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      visibility: parsed.data.visibility,
      joinPolicy: parsed.data.joinPolicy,
      memberships: {
        create: {
          userId: creatorId,
          role: 'OWNER',
          status: 'ACTIVE'
        }
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  return {
    success: true,
    community
  };
}
