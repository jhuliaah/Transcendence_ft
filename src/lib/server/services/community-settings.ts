import { Prisma } from '../generated/prisma/client';
import { getPrisma } from '../db';
import { updateCommunitySettingsSchema } from '../../schemas/community';

export type CommunitySettings = {
  id: string;
  name: string;
  description: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  joinPolicy: 'OPEN' | 'APPROVAL';
};

const settingsSelect = {
  id: true,
  name: true,
  description: true,
  visibility: true,
  joinPolicy: true
} as const;

export type UpdateCommunitySettingsResult =
  | { success: true; community: CommunitySettings }
  | { success: false; reason: 'INVALID_INPUT' | 'COMMUNITY_NOT_FOUND' };

export async function getCommunitySettings(communityId: string): Promise<CommunitySettings | null> {
  return getPrisma().community.findUnique({
    where: { id: communityId },
    select: settingsSelect
  });
}

// Authorization is NOT done here: callers must check `community:edit_settings`
// (see requireCommunityPermission) before calling this function.
export async function updateCommunitySettings(
  communityId: string,
  input: unknown
): Promise<UpdateCommunitySettingsResult> {
  const parsed = updateCommunitySettingsSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, reason: 'INVALID_INPUT' };
  }

  try {
    const community = await getPrisma().community.update({
      where: { id: communityId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        visibility: parsed.data.visibility,
        joinPolicy: parsed.data.joinPolicy
      },
      select: settingsSelect
    });

    return { success: true, community };
  } catch (error) {
    // P2025: the community was deleted between the permission check and the update.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, reason: 'COMMUNITY_NOT_FOUND' };
    }

    throw error;
  }
}
