import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireCommunityPermission, getCommunitySettings, updateCommunitySettings } = vi.hoisted(
  () => ({
    requireCommunityPermission: vi.fn(),
    getCommunitySettings: vi.fn(),
    updateCommunitySettings: vi.fn()
  })
);

vi.mock('../../../../lib/server/http/community-guard', () => ({ requireCommunityPermission }));
vi.mock('../../../../lib/server/services/community-settings', () => ({
  getCommunitySettings,
  updateCommunitySettings
}));

import { actions, load } from './+page.server';

const user = { id: 'user-1', email: 'owner@example.com', name: 'Owner' };

function loadEvent(locals: { user: typeof user | null } = { user }) {
  return { params: { id: 'c1' }, locals } as unknown as Parameters<typeof load>[0];
}

function actionEvent(
  data: Record<string, string>,
  locals: { user: typeof user | null } = { user }
) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) formData.set(key, value);

  return {
    params: { id: 'c1' },
    locals,
    request: new Request('http://localhost/communities/c1/settings', {
      method: 'POST',
      body: formData
    })
  } as unknown as Parameters<typeof actions.default>[0];
}

const validData = {
  name: 'My Community',
  description: 'About us',
  visibility: 'PUBLIC',
  joinPolicy: 'OPEN'
};

beforeEach(() => {
  vi.clearAllMocks();
  requireCommunityPermission.mockResolvedValue({ allowed: true, role: 'OWNER' });
});

describe('settings load', () => {
  it('redirects anonymous visitors to the login page', async () => {
    await expect(load(loadEvent({ user: null }))).rejects.toMatchObject({
      status: 303,
      location: '/login'
    });
    expect(requireCommunityPermission).not.toHaveBeenCalled();
  });

  it('checks the community:edit_settings permission', async () => {
    getCommunitySettings.mockResolvedValueOnce({ id: 'c1', name: 'A' });

    await load(loadEvent());

    expect(requireCommunityPermission).toHaveBeenCalledWith({
      userId: 'user-1',
      communityId: 'c1',
      action: 'community:edit_settings'
    });
  });

  it('propagates the 403 raised by the guard for non-owners', async () => {
    requireCommunityPermission.mockRejectedValueOnce({ status: 403 });

    await expect(load(loadEvent())).rejects.toMatchObject({ status: 403 });
    expect(getCommunitySettings).not.toHaveBeenCalled();
  });

  it('returns 404 when the community cannot be loaded', async () => {
    getCommunitySettings.mockResolvedValueOnce(null);

    await expect(load(loadEvent())).rejects.toMatchObject({ status: 404 });
  });

  it('returns the community settings', async () => {
    const community = { id: 'c1', name: 'A' };
    getCommunitySettings.mockResolvedValueOnce(community);

    expect(await load(loadEvent())).toEqual({ community });
  });
});

describe('settings action', () => {
  it('redirects anonymous visitors to the login page', async () => {
    await expect(actions.default(actionEvent(validData, { user: null }))).rejects.toMatchObject({
      status: 303
    });
    expect(updateCommunitySettings).not.toHaveBeenCalled();
  });

  it('does not update when the guard denies the action', async () => {
    requireCommunityPermission.mockRejectedValueOnce({ status: 403 });

    await expect(actions.default(actionEvent(validData))).rejects.toMatchObject({ status: 403 });
    expect(updateCommunitySettings).not.toHaveBeenCalled();
  });

  it('returns 400 with field errors for invalid input', async () => {
    const result = await actions.default(actionEvent({ ...validData, name: '' }));

    expect(result).toMatchObject({ status: 400 });
    expect(updateCommunitySettings).not.toHaveBeenCalled();
  });

  it('saves valid settings', async () => {
    const community = { id: 'c1', ...validData };
    updateCommunitySettings.mockResolvedValueOnce({ success: true, community });

    const result = await actions.default(actionEvent(validData));

    expect(updateCommunitySettings).toHaveBeenCalledWith('c1', validData);
    expect(result).toEqual({ success: true, values: community });
  });

  it('returns 500 when the service throws', async () => {
    updateCommunitySettings.mockRejectedValueOnce(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await actions.default(actionEvent(validData));

    expect(result).toMatchObject({ status: 500 });
  });
});
