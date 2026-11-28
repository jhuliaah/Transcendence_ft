import { Prisma } from '../generated/prisma/client';
import { getPrisma } from '../db';

const INVITATION_VALIDITY_DAYS = 7;

export type CommunityInvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REVOKED';

export type CreateCommunityInvitationResult =
  | {
      success: true;
      invitation: {
        id: string;
        status: CommunityInvitationStatus;
        createdAt: Date;
        expiresAt: Date;
      };
    }
  | {
      success: false;
      reason:
        | 'COMMUNITY_NOT_FOUND'
        | 'FORBIDDEN'
        | 'USER_NOT_FOUND'
        | 'ALREADY_MEMBER'
        | 'ALREADY_PENDING'
        | 'CONFLICT';
    };

export type GetCommunityInvitationResult =
  | {
      success: true;
      invitation: {
        id: string;
        status: CommunityInvitationStatus;
        createdAt: Date;
        expiresAt: Date;
        community: {
          id: string;
          name: string;
        };
      };
    }
  | {
      success: false;
      reason: 'INVITATION_NOT_FOUND';
    };

export type AcceptCommunityInvitationResult =
  | {
      success: true;
      membership: {
        communityId: string;
        userId: string;
        role: 'MEMBER';
        status: 'ACTIVE';
      };
    }
  | {
      success: false;
      reason:
        | 'INVITATION_NOT_FOUND'
        | 'INVITATION_NOT_PENDING'
        | 'INVITATION_EXPIRED'
        | 'ALREADY_MEMBER'
        | 'CONFLICT';
    };

export type RejectCommunityInvitationResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason: 'INVITATION_NOT_FOUND' | 'INVITATION_NOT_PENDING' | 'CONFLICT';
    };

export type RevokeCommunityInvitationResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason: 'INVITATION_NOT_FOUND' | 'FORBIDDEN' | 'INVITATION_NOT_PENDING' | 'CONFLICT';
    };

export async function createCommunityInvitation(
  communityId: string,
  invitedUserId: string,
  actorId: string
): Promise<CreateCommunityInvitationResult> {
  const prisma = getPrisma();

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true }
  });

  if (!community) {
    return { success: false, reason: 'COMMUNITY_NOT_FOUND' };
  }

  const actorMembership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: { userId: actorId, communityId }
    },
    select: {
      role: true,
      status: true
    }
  });

  if (
    !actorMembership ||
    actorMembership.status !== 'ACTIVE' ||
    !['OWNER', 'ADMIN'].includes(actorMembership.role)
  ) {
    return { success: false, reason: 'FORBIDDEN' };
  }

  const invitedUser = await prisma.user.findUnique({
    where: { id: invitedUserId },
    select: { id: true }
  });

  if (!invitedUser) {
    return { success: false, reason: 'USER_NOT_FOUND' };
  }

  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: invitedUserId,
        communityId
      }
    },
    select: { status: true }
  });

  if (membership?.status === 'ACTIVE') {
    return { success: false, reason: 'ALREADY_MEMBER' };
  }

  const existingInvitation = await prisma.communityInvitation.findFirst({
    where: {
      communityId,
      invitedUserId,
      status: 'PENDING'
    },
    select: {
      id: true,
      expiresAt: true
    }
  });

  const now = new Date();

  if (existingInvitation) {
    if (existingInvitation.expiresAt > now) {
      return { success: false, reason: 'ALREADY_PENDING' };
    }

    await prisma.communityInvitation.updateMany({
      where: {
        id: existingInvitation.id,
        status: 'PENDING',
        expiresAt: { lte: now }
      },
      data: { status: 'REVOKED' }
    });
  }

  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + INVITATION_VALIDITY_DAYS);

  try {
    const invitation = await prisma.communityInvitation.create({
      data: {
        communityId,
        invitedById: actorId,
        invitedUserId,
        expiresAt
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        expiresAt: true
      }
    });

    return {
      success: true,
      invitation
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, reason: 'ALREADY_PENDING' };
    }

    throw error;
  }
}

export async function getCommunityInvitation(
  invitationId: string,
  userId: string
): Promise<GetCommunityInvitationResult> {
  const prisma = getPrisma();

  const invitation = await prisma.communityInvitation.findFirst({
    where: {
      id: invitationId,
      invitedUserId: userId
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      community: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!invitation) {
    return {
      success: false,
      reason: 'INVITATION_NOT_FOUND'
    };
  }

  return {
    success: true,
    invitation
  };
}

export async function acceptCommunityInvitation(
  invitationId: string,
  userId: string
): Promise<AcceptCommunityInvitationResult> {
  const prisma = getPrisma();
  const now = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      const invitation = await tx.communityInvitation.findFirst({
        where: {
          id: invitationId,
          invitedUserId: userId
        },
        select: {
          id: true,
          communityId: true,
          status: true,
          expiresAt: true
        }
      });

      if (!invitation) {
        return {
          success: false,
          reason: 'INVITATION_NOT_FOUND'
        };
      }

      if (invitation.status !== 'PENDING') {
        return {
          success: false,
          reason: 'INVITATION_NOT_PENDING'
        };
      }

      if (invitation.expiresAt <= now) {
        return {
          success: false,
          reason: 'INVITATION_EXPIRED'
        };
      }

      const membership = await tx.communityMembership.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId: invitation.communityId
          }
        },
        select: {
          id: true,
          status: true
        }
      });

      if (membership?.status === 'ACTIVE') {
        return {
          success: false,
          reason: 'ALREADY_MEMBER'
        };
      }

      const claimedInvitation = await tx.communityInvitation.updateMany({
        where: {
          id: invitationId,
          invitedUserId: userId,
          status: 'PENDING',
          expiresAt: { gt: now }
        },
        data: {
          status: 'ACCEPTED'
        }
      });

      if (claimedInvitation.count !== 1) {
        return {
          success: false,
          reason: 'CONFLICT'
        };
      }

      if (membership) {
        const updatedMembership = await tx.communityMembership.updateMany({
          where: {
            id: membership.id,
            status: { in: ['PENDING', 'REJECTED', 'REMOVED'] }
          },
          data: {
            role: 'MEMBER',
            status: 'ACTIVE'
          }
        });

        if (updatedMembership.count !== 1) {
          throw new Error('MEMBERSHIP_UPDATE_CONFLICT');
        }
      } else {
        await tx.communityMembership.create({
          data: {
            userId,
            communityId: invitation.communityId,
            role: 'MEMBER',
            status: 'ACTIVE'
          }
        });
      }

      return {
        success: true,
        membership: {
          communityId: invitation.communityId,
          userId,
          role: 'MEMBER',
          status: 'ACTIVE'
        }
      };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return {
        success: false,
        reason: 'CONFLICT'
      };
    }

    if (error instanceof Error && error.message === 'MEMBERSHIP_UPDATE_CONFLICT') {
      return {
        success: false,
        reason: 'CONFLICT'
      };
    }

    throw error;
  }
}

export async function rejectCommunityInvitation(
  invitationId: string,
  userId: string
): Promise<RejectCommunityInvitationResult> {
  const prisma = getPrisma();

  const invitation = await prisma.communityInvitation.findFirst({
    where: {
      id: invitationId,
      invitedUserId: userId
    },
    select: {
      id: true,
      status: true
    }
  });

  if (!invitation) {
    return {
      success: false,
      reason: 'INVITATION_NOT_FOUND'
    };
  }

  if (invitation.status !== 'PENDING') {
    return {
      success: false,
      reason: 'INVITATION_NOT_PENDING'
    };
  }

  const result = await prisma.communityInvitation.updateMany({
    where: {
      id: invitationId,
      invitedUserId: userId,
      status: 'PENDING'
    },
    data: {
      status: 'REJECTED'
    }
  });

  if (result.count !== 1) {
    return {
      success: false,
      reason: 'CONFLICT'
    };
  }

  return { success: true };
}

export async function revokeCommunityInvitation(
  invitationId: string,
  actorId: string
): Promise<RevokeCommunityInvitationResult> {
  const prisma = getPrisma();

  const invitation = await prisma.communityInvitation.findUnique({
    where: { id: invitationId },
    select: {
      id: true,
      communityId: true,
      status: true
    }
  });

  if (!invitation) {
    return {
      success: false,
      reason: 'INVITATION_NOT_FOUND'
    };
  }

  const actorMembership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: {
        userId: actorId,
        communityId: invitation.communityId
      }
    },
    select: {
      role: true,
      status: true
    }
  });

  if (
    !actorMembership ||
    actorMembership.status !== 'ACTIVE' ||
    !['OWNER', 'ADMIN'].includes(actorMembership.role)
  ) {
    return {
      success: false,
      reason: 'FORBIDDEN'
    };
  }

  if (invitation.status !== 'PENDING') {
    return {
      success: false,
      reason: 'INVITATION_NOT_PENDING'
    };
  }

  const result = await prisma.communityInvitation.updateMany({
    where: {
      id: invitationId,
      status: 'PENDING'
    },
    data: {
      status: 'REVOKED'
    }
  });

  if (result.count !== 1) {
    return {
      success: false,
      reason: 'CONFLICT'
    };
  }

  return { success: true };
}
