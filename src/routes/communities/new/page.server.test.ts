import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createCommunity } = vi.hoisted(() => ({
  createCommunity: vi.fn()
}));

vi.mock('../../../lib/server/services/community', () => ({
  createCommunity
}));

import { actions } from './+page.server';

function createRequest(data: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value);
  }

  return new Request('http://localhost/communities/new', {
    method: 'POST',
    body: formData
  });
}

const authenticatedUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User'
};

function createEvent(
  data: Record<string, string>,
  user: typeof authenticatedUser | null = authenticatedUser
) {
  return {
    request: createRequest(data),
    locals: { user }
  };
}

const validCommunityData = {
  name: 'My Community',
  description: 'A community description.',
  visibility: 'PUBLIC',
  joinPolicy: 'OPEN'
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('community creation action', () => {
  it('redirects unauthenticated users to login', async () => {
    await expect(
      actions.default({
        ...createEvent(validCommunityData, null)
      } as never)
    ).rejects.toMatchObject({
      status: 303,
      location: '/login'
    });

    expect(createCommunity).not.toHaveBeenCalled();
  });

  it('rejects invalid form data', async () => {
    const result = await actions.default({
      ...createEvent({
        ...validCommunityData,
        name: ''
      })
    } as never);

    expect(result).toMatchObject({
      status: 400,
      data: {
        success: false
      }
    });

    expect(createCommunity).not.toHaveBeenCalled();
  });

  it('creates a community using the authenticated user', async () => {
    createCommunity.mockResolvedValue({
      success: true,
      community: {
        id: 'community-1',
        name: 'My Community'
      }
    });

    await expect(
      actions.default({
        ...createEvent(validCommunityData)
      } as never)
    ).rejects.toMatchObject({
      status: 303,
      location: '/communities/community-1'
    });

    expect(createCommunity).toHaveBeenCalledWith(
      {
        name: 'My Community',
        description: 'A community description.',
        visibility: 'PUBLIC',
        joinPolicy: 'OPEN'
      },
      'user-1'
    );
  });

  it('returns an error when community creation fails', async () => {
    createCommunity.mockRejectedValue(new Error('Database error'));

    const result = await actions.default({
      ...createEvent(validCommunityData)
    } as never);

    expect(result).toMatchObject({
      status: 500,
      data: {
        success: false,
        message: 'An unexpected error occurred. Please try again.'
      }
    });
  });
});
