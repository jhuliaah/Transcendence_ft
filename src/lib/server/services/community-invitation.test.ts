import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acceptCommunityInvitation,
  createCommunityInvitation,
  getCommunityInvitation,
  rejectCommunityInvitation,
  revokeCommunityInvitation
} from './community-invitation';

const {
  communityFindUnique,
  membershipFindUnique,
  userFindUnique,
  invitationFindFirst,
  invitationFindUnique,
  invitationCreate,
  invitationUpdateMany,
  membershipUpdateMany,
  membershipCreate,
  transaction
} = vi.hoisted(() => ({
  communityFindUnique: vi.fn(),
  membershipFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
  invitationFindFirst: vi.fn(),
  invitationFindUnique: vi.fn(),
  invitationCreate: vi.fn(),
  invitationUpdateMany: vi.fn(),
  membershipUpdateMany: vi.fn(),
  membershipCreate: vi.fn(),
  transaction: vi.fn()
}));

vi.mock('../db', () => ({
  getPrisma: () => ({
    community: { findUnique: communityFindUnique },
    communityMembership: { findUnique: membershipFindUnique },
    user: { findUnique: userFindUnique },
    communityInvitation: {
      findFirst: invitationFindFirst,
      findUnique: invitationFindUnique,
      create: invitationCreate,
      updateMany: invitationUpdateMany
    },
    $transaction: transaction
  })
}));

const transactionClient = {
  communityInvitation: {
    findFirst: invitationFindFirst,
    updateMany: invitationUpdateMany
  },
  communityMembership: {
    findUnique: membershipFindUnique,
    updateMany: membershipUpdateMany,
    create: membershipCreate
  }
};

beforeEach(() => {
  vi.clearAllMocks();

  transaction.mockImplementation(async (callback) => callback(transactionClient));

  invitationUpdateMany.mockResolvedValue({ count: 1 });
  membershipUpdateMany.mockResolvedValue({ count: 1 });
  membershipCreate.mockResolvedValue({});

  communityFindUnique.mockResolvedValue({ id: 'community-1' });
  membershipFindUnique
    .mockResolvedValueOnce({ role: 'OWNER', status: 'ACTIVE' })
    .mockResolvedValueOnce(null);
  userFindUnique.mockResolvedValue({ id: 'user-2' });
  invitationFindFirst.mockResolvedValue(null);
  invitationCreate.mockResolvedValue({
    id: 'invitation-1',
    status: 'PENDING',
    createdAt: new Date('2026-11-21T12:00:00.000Z'),
    expiresAt: new Date('2026-11-28T12:00:00.000Z')
  });
});

describe('createCommunityInvitation', () => {
  it('creates an invitation when the actor is an active owner', async () => {
    const result = await createCommunityInvitation('community-1', 'user-2', 'user-1');

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.invitation.id).toBe('invitation-1');
      expect(result.invitation.status).toBe('PENDING');
    }

    expect(invitationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        communityId: 'community-1',
        invitedById: 'user-1',
        invitedUserId: 'user-2',
        expiresAt: expect.any(Date)
      }),
      select: {
        id: true,
        status: true,
        createdAt: true,
        expiresAt: true
      }
    });

    const createData = invitationCreate.mock.calls[0][0].data;
    const validity = createData.expiresAt.getTime() - Date.now();

    expect(validity).toBeGreaterThan(6.99 * 24 * 60 * 60 * 1000);
    expect(validity).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000);
  });

  it('allows active admins to create invitations', async () => {
    membershipFindUnique
      .mockReset()
      .mockResolvedValueOnce({ role: 'ADMIN', status: 'ACTIVE' })
      .mockResolvedValueOnce(null);

    const result = await createCommunityInvitation('community-1', 'user-2', 'user-1');

    expect(result.success).toBe(true);
    expect(invitationCreate).toHaveBeenCalledOnce();
  });

  it('rejects invitations from regular members', async () => {
    membershipFindUnique.mockReset().mockResolvedValue({
      role: 'MEMBER',
      status: 'ACTIVE'
    });

    const result = await createCommunityInvitation('community-1', 'user-2', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'FORBIDDEN'
    });

    expect(userFindUnique).not.toHaveBeenCalled();
    expect(invitationCreate).not.toHaveBeenCalled();
  });

  it('rejects invitations from inactive owners', async () => {
    membershipFindUnique.mockReset().mockResolvedValue({
      role: 'OWNER',
      status: 'REMOVED'
    });

    const result = await createCommunityInvitation('community-1', 'user-2', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'FORBIDDEN'
    });

    expect(invitationCreate).not.toHaveBeenCalled();
  });

  it('rejects invitations when the actor has no membership', async () => {
    membershipFindUnique.mockReset().mockResolvedValue(null);

    const result = await createCommunityInvitation('community-1', 'user-2', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'FORBIDDEN'
    });

    expect(invitationCreate).not.toHaveBeenCalled();
  });

  it('rejects invitations to nonexistent communities', async () => {
    communityFindUnique.mockResolvedValue(null);

    const result = await createCommunityInvitation('community-1', 'user-2', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'COMMUNITY_NOT_FOUND'
    });

    expect(membershipFindUnique).not.toHaveBeenCalled();
    expect(invitationCreate).not.toHaveBeenCalled();
  });

  it('rejects invitations to nonexistent users', async () => {
    userFindUnique.mockResolvedValue(null);

    const result = await createCommunityInvitation('community-1', 'user-2', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'USER_NOT_FOUND'
    });

    expect(invitationCreate).not.toHaveBeenCalled();
  });

  it('rejects invitations to active members', async () => {
    membershipFindUnique
      .mockReset()
      .mockResolvedValueOnce({ role: 'OWNER', status: 'ACTIVE' })
      .mockResolvedValueOnce({ status: 'ACTIVE' });

    const result = await createCommunityInvitation('community-1', 'user-2', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'ALREADY_MEMBER'
    });

    expect(invitationCreate).not.toHaveBeenCalled();
  });

  it('rejects duplicate pending invitations that have not expired', async () => {
    invitationFindFirst.mockResolvedValue({
      id: 'invitation-existing',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const result = await createCommunityInvitation('community-1', 'user-2', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'ALREADY_PENDING'
    });

    expect(invitationCreate).not.toHaveBeenCalled();
    expect(invitationUpdateMany).not.toHaveBeenCalled();
  });

  it('revokes expired invitations before creating a new one', async () => {
    invitationFindFirst.mockResolvedValue({
      id: 'invitation-expired',
      expiresAt: new Date(Date.now() - 1000)
    });

    invitationUpdateMany.mockResolvedValue({ count: 1 });

    const result = await createCommunityInvitation('community-1', 'user-2', 'user-1');

    expect(result.success).toBe(true);

    expect(invitationUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'invitation-expired',
        status: 'PENDING',
        expiresAt: {
          lte: expect.any(Date)
        }
      },
      data: {
        status: 'REVOKED'
      }
    });

    expect(invitationCreate).toHaveBeenCalledOnce();
  });

  it('returns ALREADY_PENDING when a concurrent request violates the unique index', async () => {
    const { Prisma } = await import('../generated/prisma/client');

    invitationCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.1'
      })
    );

    const result = await createCommunityInvitation('community-1', 'user-2', 'user-1');

    expect(result).toEqual({
      success: false,
      reason: 'ALREADY_PENDING'
    });
  });
});

describe('getCommunityInvitation', () => {
  it('returns an invitation belonging to the authenticated user', async () => {
    const invitation = {
      id: 'invitation-1',
      status: 'PENDING',
      createdAt: new Date('2026-11-21T12:00:00.000Z'),
      expiresAt: new Date('2026-11-28T12:00:00.000Z'),
      community: {
        id: 'community-1',
        name: 'Community'
      }
    };

    invitationFindFirst.mockResolvedValue(invitation);

    const result = await getCommunityInvitation('invitation-1', 'user-2');

    expect(result).toEqual({
      success: true,
      invitation
    });

    expect(invitationFindFirst).toHaveBeenCalledWith({
      where: {
        id: 'invitation-1',
        invitedUserId: 'user-2'
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
  });

  it('does not expose invitations belonging to another user', async () => {
    invitationFindFirst.mockResolvedValue(null);

    const result = await getCommunityInvitation('invitation-1', 'user-3');

    expect(result).toEqual({
      success: false,
      reason: 'INVITATION_NOT_FOUND'
    });

    expect(invitationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'invitation-1',
          invitedUserId: 'user-3'
        }
      })
    );
  });

  it('returns not found when the invitation does not exist', async () => {
    invitationFindFirst.mockResolvedValue(null);

    const result = await getCommunityInvitation('nonexistent', 'user-2');

    expect(result).toEqual({
      success: false,
      reason: 'INVITATION_NOT_FOUND'
    });
  });
});

describe('acceptCommunityInvitation', () => {
  const invitation = {
    id: 'invitation-1',
    communityId: 'community-1',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 86_400_000)
  };

  beforeEach(() => {
    invitationFindFirst.mockReset();
    invitationFindFirst.mockResolvedValue(invitation);

    membershipFindUnique.mockReset();
    membershipFindUnique.mockResolvedValue(null);
  });

  it('accepts an invitation and creates an active membership', async () => {
    const result = await acceptCommunityInvitation('invitation-1', 'user-2');

    expect(result).toEqual({
      success: true,
      membership: {
        communityId: 'community-1',
        userId: 'user-2',
        role: 'MEMBER',
        status: 'ACTIVE'
      }
    });

    expect(transaction).toHaveBeenCalledOnce();

    expect(invitationUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'invitation-1',
        invitedUserId: 'user-2',
        status: 'PENDING',
        expiresAt: expect.objectContaining({ gt: expect.any(Date) })
      },
      data: { status: 'ACCEPTED' }
    });

    expect(membershipCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-2',
        communityId: 'community-1',
        role: 'MEMBER',
        status: 'ACTIVE'
      }
    });
  });

  it('returns not found when the invitation does not belong to the user', async () => {
    invitationFindFirst.mockResolvedValue(null);

    const result = await acceptCommunityInvitation('invitation-1', 'user-2');

    expect(result).toEqual({
      success: false,
      reason: 'INVITATION_NOT_FOUND'
    });

    expect(invitationUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects invitations that are not pending', async () => {
    invitationFindFirst.mockResolvedValue({
      ...invitation,
      status: 'REVOKED'
    });

    const result = await acceptCommunityInvitation('invitation-1', 'user-2');

    expect(result).toEqual({
      success: false,
      reason: 'INVITATION_NOT_PENDING'
    });

    expect(invitationUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects expired invitations', async () => {
    invitationFindFirst.mockResolvedValue({
      ...invitation,
      expiresAt: new Date(Date.now() - 86_400_000)
    });

    const result = await acceptCommunityInvitation('invitation-1', 'user-2');

    expect(result).toEqual({
      success: false,
      reason: 'INVITATION_EXPIRED'
    });

    expect(invitationUpdateMany).not.toHaveBeenCalled();
  });

  it('does not accept invitations for existing active members', async () => {
    membershipFindUnique.mockResolvedValue({
      id: 'membership-1',
      status: 'ACTIVE'
    });

    const result = await acceptCommunityInvitation('invitation-1', 'user-2');

    expect(result).toEqual({
      success: false,
      reason: 'ALREADY_MEMBER'
    });

    expect(invitationUpdateMany).not.toHaveBeenCalled();
  });

  it('reactivates an existing inactive membership', async () => {
    membershipFindUnique.mockResolvedValue({
      id: 'membership-1',
      status: 'REMOVED'
    });

    const result = await acceptCommunityInvitation('invitation-1', 'user-2');

    expect(result.success).toBe(true);

    expect(membershipUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'membership-1',
        status: { in: ['PENDING', 'REJECTED', 'REMOVED'] }
      },
      data: {
        role: 'MEMBER',
        status: 'ACTIVE'
      }
    });

    expect(membershipCreate).not.toHaveBeenCalled();
  });

  it('returns conflict when another request accepts the invitation first', async () => {
    invitationUpdateMany.mockResolvedValue({ count: 0 });

    const result = await acceptCommunityInvitation('invitation-1', 'user-2');

    expect(result).toEqual({
      success: false,
      reason: 'CONFLICT'
    });

    expect(membershipCreate).not.toHaveBeenCalled();
  });

  it('rolls back when the membership cannot be reactivated', async () => {
    membershipFindUnique.mockResolvedValue({
      id: 'membership-1',
      status: 'REMOVED'
    });

    membershipUpdateMany.mockResolvedValue({ count: 0 });

    const result = await acceptCommunityInvitation('invitation-1', 'user-2');

    expect(result).toEqual({
      success: false,
      reason: 'CONFLICT'
    });
  });
});

describe('rejectCommunityInvitation', () => {
  const invitation = {
    id: 'invitation-1',
    status: 'PENDING'
  };

  beforeEach(() => {
    invitationFindFirst.mockReset();
    invitationFindFirst.mockResolvedValue(invitation);

    invitationUpdateMany.mockReset();
    invitationUpdateMany.mockResolvedValue({ count: 1 });
  });

  it('rejects an invitation belonging to the authenticated user', async () => {
    const result = await rejectCommunityInvitation('invitation-1', 'user-2');

    expect(result).toEqual({ success: true });

    expect(invitationFindFirst).toHaveBeenCalledWith({
      where: {
        id: 'invitation-1',
        invitedUserId: 'user-2'
      },
      select: {
        id: true,
        status: true
      }
    });

    expect(invitationUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'invitation-1',
        invitedUserId: 'user-2',
        status: 'PENDING'
      },
      data: {
        status: 'REJECTED'
      }
    });
  });

  it('does not expose invitations belonging to another user', async () => {
    invitationFindFirst.mockResolvedValue(null);

    const result = await rejectCommunityInvitation('invitation-1', 'user-3');

    expect(result).toEqual({
      success: false,
      reason: 'INVITATION_NOT_FOUND'
    });

    expect(invitationUpdateMany).not.toHaveBeenCalled();
  });

  it('does not reject invitations that are no longer pending', async () => {
    invitationFindFirst.mockResolvedValue({
      ...invitation,
      status: 'ACCEPTED'
    });

    const result = await rejectCommunityInvitation('invitation-1', 'user-2');

    expect(result).toEqual({
      success: false,
      reason: 'INVITATION_NOT_PENDING'
    });

    expect(invitationUpdateMany).not.toHaveBeenCalled();
  });

  it('allows rejecting expired pending invitations', async () => {
    const result = await rejectCommunityInvitation('invitation-1', 'user-2');

    expect(result).toEqual({ success: true });
    expect(invitationUpdateMany).toHaveBeenCalledOnce();
  });

  it('returns conflict when another operation changes the invitation first', async () => {
    invitationUpdateMany.mockResolvedValue({ count: 0 });

    const result = await rejectCommunityInvitation('invitation-1', 'user-2');

    expect(result).toEqual({
      success: false,
      reason: 'CONFLICT'
    });
  });
});

describe('revokeCommunityInvitation', () => {
  const invitation = {
    id: 'invitation-1',
    communityId: 'community-1',
    status: 'PENDING'
  };

  beforeEach(() => {
    invitationFindUnique.mockReset();
    invitationFindUnique.mockResolvedValue(invitation);

    membershipFindUnique.mockReset();
    membershipFindUnique.mockResolvedValue({
      role: 'OWNER',
      status: 'ACTIVE'
    });

    invitationUpdateMany.mockReset();
    invitationUpdateMany.mockResolvedValue({ count: 1 });
  });

  it('allows an active owner to revoke an invitation', async () => {
    const result = await revokeCommunityInvitation('invitation-1', 'owner-1');

    expect(result).toEqual({ success: true });

    expect(membershipFindUnique).toHaveBeenCalledWith({
      where: {
        userId_communityId: {
          userId: 'owner-1',
          communityId: 'community-1'
        }
      },
      select: {
        role: true,
        status: true
      }
    });

    expect(invitationUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'invitation-1',
        status: 'PENDING'
      },
      data: {
        status: 'REVOKED'
      }
    });
  });

  it('allows active admins to revoke invitations', async () => {
    membershipFindUnique.mockResolvedValue({
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    const result = await revokeCommunityInvitation('invitation-1', 'admin-1');

    expect(result).toEqual({ success: true });
  });

  it('rejects regular members', async () => {
    membershipFindUnique.mockResolvedValue({
      role: 'MEMBER',
      status: 'ACTIVE'
    });

    const result = await revokeCommunityInvitation('invitation-1', 'member-1');

    expect(result).toEqual({
      success: false,
      reason: 'FORBIDDEN'
    });

    expect(invitationUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects inactive admins', async () => {
    membershipFindUnique.mockResolvedValue({
      role: 'ADMIN',
      status: 'REMOVED'
    });

    const result = await revokeCommunityInvitation('invitation-1', 'admin-1');

    expect(result).toEqual({
      success: false,
      reason: 'FORBIDDEN'
    });

    expect(invitationUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects actors without community membership', async () => {
    membershipFindUnique.mockResolvedValue(null);

    const result = await revokeCommunityInvitation('invitation-1', 'outsider-1');

    expect(result).toEqual({
      success: false,
      reason: 'FORBIDDEN'
    });

    expect(invitationUpdateMany).not.toHaveBeenCalled();
  });

  it('returns not found for nonexistent invitations', async () => {
    invitationFindUnique.mockResolvedValue(null);

    const result = await revokeCommunityInvitation('unknown-invitation', 'owner-1');

    expect(result).toEqual({
      success: false,
      reason: 'INVITATION_NOT_FOUND'
    });

    expect(membershipFindUnique).not.toHaveBeenCalled();
  });

  it('does not revoke invitations that are no longer pending', async () => {
    invitationFindUnique.mockResolvedValue({
      ...invitation,
      status: 'ACCEPTED'
    });

    const result = await revokeCommunityInvitation('invitation-1', 'owner-1');

    expect(result).toEqual({
      success: false,
      reason: 'INVITATION_NOT_PENDING'
    });

    expect(invitationUpdateMany).not.toHaveBeenCalled();
  });

  it('allows revoking expired pending invitations', async () => {
    const result = await revokeCommunityInvitation('invitation-1', 'owner-1');

    expect(result).toEqual({ success: true });
    expect(invitationUpdateMany).toHaveBeenCalledOnce();
  });

  it('returns conflict when another operation changes the invitation first', async () => {
    invitationUpdateMany.mockResolvedValue({ count: 0 });

    const result = await revokeCommunityInvitation('invitation-1', 'owner-1');

    expect(result).toEqual({
      success: false,
      reason: 'CONFLICT'
    });
  });
});
