import { beforeEach, describe, expect, it, vi } from 'vitest';

const { update, findUnique } = vi.hoisted(() => ({
  update: vi.fn(),
  findUnique: vi.fn()
}));

vi.mock('../db', () => ({
  getPrisma: () => ({
    community: { update, findUnique }
  })
}));

import { Prisma } from '../generated/prisma/client';
import { getCommunitySettings, updateCommunitySettings } from './community-settings';

const valid = {
  name: '  New name  ',
  description: 'New description',
  visibility: 'PRIVATE',
  joinPolicy: 'APPROVAL'
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCommunitySettings', () => {
  it('returns the editable fields of a community', async () => {
    const settings = {
      id: 'c1',
      name: 'A',
      description: null,
      visibility: 'PUBLIC',
      joinPolicy: 'OPEN'
    };
    findUnique.mockResolvedValueOnce(settings);

    expect(await getCommunitySettings('c1')).toEqual(settings);
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'c1' } }));
  });

  it('returns null when the community does not exist', async () => {
    findUnique.mockResolvedValueOnce(null);

    expect(await getCommunitySettings('missing')).toBeNull();
  });
});

describe('updateCommunitySettings', () => {
  it('rejects invalid input without touching the database', async () => {
    const result = await updateCommunitySettings('c1', { ...valid, name: '   ' });

    expect(result).toEqual({ success: false, reason: 'INVALID_INPUT' });
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects unknown visibility or join policy values', async () => {
    expect(await updateCommunitySettings('c1', { ...valid, visibility: 'SECRET' })).toEqual({
      success: false,
      reason: 'INVALID_INPUT'
    });
    expect(await updateCommunitySettings('c1', { ...valid, joinPolicy: 'ANY' })).toEqual({
      success: false,
      reason: 'INVALID_INPUT'
    });
  });

  it('updates only the four editable fields, trimming the name', async () => {
    update.mockResolvedValueOnce({ id: 'c1', name: 'New name' });

    const result = await updateCommunitySettings('c1', valid);

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        data: {
          name: 'New name',
          description: 'New description',
          visibility: 'PRIVATE',
          joinPolicy: 'APPROVAL'
        }
      })
    );
  });

  it('stores an empty description as null', async () => {
    update.mockResolvedValueOnce({ id: 'c1' });

    await updateCommunitySettings('c1', { ...valid, description: '' });

    expect(update.mock.calls[0][0].data.description).toBeNull();
  });

  it('maps a missing community (P2025) to COMMUNITY_NOT_FOUND', async () => {
    update.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: 'test'
      })
    );

    expect(await updateCommunitySettings('c1', valid)).toEqual({
      success: false,
      reason: 'COMMUNITY_NOT_FOUND'
    });
  });

  it('rethrows unexpected errors', async () => {
    update.mockRejectedValueOnce(new Error('db down'));

    await expect(updateCommunitySettings('c1', valid)).rejects.toThrow('db down');
  });
});
