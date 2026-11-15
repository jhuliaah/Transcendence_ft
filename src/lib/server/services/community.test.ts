import { beforeEach, describe, expect, it, vi } from 'vitest';

const { communityCreate } = vi.hoisted(() => ({
  communityCreate: vi.fn()
}));

vi.mock('../db', () => ({
  getPrisma: () => ({
    community: {
      create: communityCreate
    }
  })
}));

import { createCommunity } from './community';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createCommunity', () => {
  it('creates a community with the creator as an active owner', async () => {
    communityCreate.mockResolvedValue({
      id: 'community-1',
      name: 'My Community'
    });

    const result = await createCommunity(
      {
        name: 'My Community',
        description: 'A community description.',
        visibility: 'PUBLIC',
        joinPolicy: 'OPEN'
      },
      'user-1'
    );

    expect(result).toEqual({
      success: true,
      community: {
        id: 'community-1',
        name: 'My Community'
      }
    });

    expect(communityCreate).toHaveBeenCalledWith({
      data: {
        name: 'My Community',
        description: 'A community description.',
        visibility: 'PUBLIC',
        joinPolicy: 'OPEN',
        memberships: {
          create: {
            userId: 'user-1',
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
  });

  it('stores an empty description as null', async () => {
    communityCreate.mockResolvedValue({
      id: 'community-1',
      name: 'My Community'
    });

    await createCommunity(
      {
        name: 'My Community',
        description: '',
        visibility: 'PUBLIC',
        joinPolicy: 'OPEN'
      },
      'user-1'
    );

    expect(communityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: null
        })
      })
    );
  });

  it('rejects invalid input without accessing the database', async () => {
    const result = await createCommunity(
      {
        name: '',
        visibility: 'INVALID',
        joinPolicy: 'OPEN'
      },
      'user-1'
    );

    expect(result).toEqual({
      success: false,
      reason: 'INVALID_INPUT'
    });

    expect(communityCreate).not.toHaveBeenCalled();
  });
});
