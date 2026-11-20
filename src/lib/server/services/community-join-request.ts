import { Prisma } from '../generated/prisma/client';
import { getPrisma } from '../db';

type MembershipStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED';

type JoinRequest = {
  id: string;
  status: MembershipStatus;
};

export type RequestCommunityJoinResult =
  | {
      success: true;
      request: JoinRequest;
    }
  | {
      success: false;
      reason:
        | 'COMMUNITY_NOT_FOUND'
        | 'OPEN_COMMUNITY'
        | 'ALREADY_PENDING'
        | 'ALREADY_MEMBER'
        | 'CONFLICT';
    };

export type GetCommunityJoinRequestResult =
  | {
      success: true;
      request: {
        status: MembershipStatus;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    }
  | {
      success: false;
      reason: 'COMMUNITY_NOT_FOUND';
    };

export type CancelCommunityJoinRequestResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason: 'COMMUNITY_NOT_FOUND' | 'REQUEST_NOT_FOUND' | 'REQUEST_NOT_PENDING';
    };

function getExistingRequestResult(status: MembershipStatus): RequestCommunityJoinResult {
  switch (status) {
    case 'PENDING':
      return { success: false, reason: 'ALREADY_PENDING' };

    case 'ACTIVE':
      return { success: false, reason: 'ALREADY_MEMBER' };

    case 'REJECTED':
    case 'REMOVED':
      return { success: false, reason: 'CONFLICT' };
  }
}

export async function requestCommunityJoin(
  communityId: string,
  userId: string
): Promise<RequestCommunityJoinResult> {
  const prisma = getPrisma();

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { joinPolicy: true }
  });

  if (!community) {
    return { success: false, reason: 'COMMUNITY_NOT_FOUND' };
  }

  if (community.joinPolicy !== 'APPROVAL') {
    return { success: false, reason: 'OPEN_COMMUNITY' };
  }

  const existing = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: { userId, communityId }
    },
    select: {
      id: true,
      status: true
    }
  });

  if (existing) {
    if (existing.status === 'PENDING' || existing.status === 'ACTIVE') {
      return getExistingRequestResult(existing.status);
    }

    const updated = await prisma.communityMembership.updateMany({
      where: {
        id: existing.id,
        status: { in: ['REJECTED', 'REMOVED'] }
      },
      data: {
        status: 'PENDING'
      }
    });

    if (updated.count === 0) {
      const current = await prisma.communityMembership.findUnique({
        where: {
          userId_communityId: { userId, communityId }
        },
        select: { status: true }
      });

      if (current) {
        return getExistingRequestResult(current.status);
      }

      return { success: false, reason: 'CONFLICT' };
    }

    const membership = await prisma.communityMembership.findUniqueOrThrow({
      where: {
        userId_communityId: { userId, communityId }
      },
      select: {
        id: true,
        status: true
      }
    });

    return {
      success: true,
      request: membership
    };
  }

  try {
    const membership = await prisma.communityMembership.create({
      data: {
        userId,
        communityId,
        role: 'MEMBER',
        status: 'PENDING'
      },
      select: {
        id: true,
        status: true
      }
    });

    return {
      success: true,
      request: membership
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const current = await prisma.communityMembership.findUnique({
        where: {
          userId_communityId: { userId, communityId }
        },
        select: { status: true }
      });

      if (current) {
        return getExistingRequestResult(current.status);
      }

      return { success: false, reason: 'CONFLICT' };
    }

    throw error;
  }
}

export async function getCommunityJoinRequest(
  communityId: string,
  userId: string
): Promise<GetCommunityJoinRequestResult> {
  const prisma = getPrisma();

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true }
  });

  if (!community) {
    return { success: false, reason: 'COMMUNITY_NOT_FOUND' };
  }

  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: { userId, communityId }
    },
    select: {
      status: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return {
    success: true,
    request: membership
  };
}

export async function cancelCommunityJoinRequest(
  communityId: string,
  userId: string
): Promise<CancelCommunityJoinRequestResult> {
  const prisma = getPrisma();

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true }
  });

  if (!community) {
    return { success: false, reason: 'COMMUNITY_NOT_FOUND' };
  }

  const deleted = await prisma.communityMembership.deleteMany({
    where: {
      userId,
      communityId,
      status: 'PENDING'
    }
  });

  if (deleted.count === 1) {
    return { success: true };
  }

  const existing = await prisma.communityMembership.findUnique({
    where: {
      userId_communityId: { userId, communityId }
    },
    select: { status: true }
  });

  if (!existing) {
    return { success: false, reason: 'REQUEST_NOT_FOUND' };
  }

  return {
    success: false,
    reason: 'REQUEST_NOT_PENDING'
  };
}
