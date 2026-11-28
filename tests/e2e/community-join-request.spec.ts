import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

import { getPrisma } from '../../src/lib/server/db';
import { createTestUser, registerUser, loginUser } from './helpers/auth';

async function createTestCommunity(joinPolicy: 'OPEN' | 'APPROVAL') {
  const prisma = getPrisma();

  const owner = await prisma.user.create({
    data: {
      email: `owner-${randomUUID()}@example.com`,
      name: 'E2E Community Owner'
    },
    select: { id: true }
  });

  return prisma.community.create({
    data: {
      name: `E2E Community ${randomUUID()}`,
      visibility: 'PUBLIC',
      joinPolicy,
      memberships: {
        create: {
          userId: owner.id,
          role: 'OWNER',
          status: 'ACTIVE'
        }
      }
    },
    select: { id: true, name: true }
  });
}

test.describe('Community Join Requests E2E', () => {
  const requestOptions = {
    headers: {
      Origin: 'http://127.0.0.1:4173'
    }
  };

  test('allows an authenticated user to request access to an approval community', async ({
    page
  }) => {
    const user = createTestUser();
    const community = await createTestCommunity('APPROVAL');

    await registerUser(page, user);
    await loginUser(page, user);

    const response = await page.request.post(
      `/communities/${community.id}/join-request`,
      requestOptions
    );

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.request.status).toBe('PENDING');

    const getResponse = await page.request.get(`/communities/${community.id}/join-request`);

    expect(getResponse.status()).toBe(200);

    const getBody = await getResponse.json();
    expect(getBody.request.status).toBe('PENDING');
  });

  test('rejects duplicate join requests', async ({ page }) => {
    const user = createTestUser();
    const community = await createTestCommunity('APPROVAL');

    await registerUser(page, user);
    await loginUser(page, user);

    const firstResponse = await page.request.post(
      `/communities/${community.id}/join-request`,
      requestOptions
    );

    expect(firstResponse.status()).toBe(201);

    const secondResponse = await page.request.post(
      `/communities/${community.id}/join-request`,
      requestOptions
    );

    expect(secondResponse.status()).toBe(409);

    const body = await secondResponse.json();
    expect(body.error).toBe('ALREADY_PENDING');
  });

  test('rejects join requests for open communities', async ({ page }) => {
    const user = createTestUser();
    const community = await createTestCommunity('OPEN');

    await registerUser(page, user);
    await loginUser(page, user);

    const response = await page.request.post(
      `/communities/${community.id}/join-request`,
      requestOptions
    );

    expect(response.status()).toBe(409);

    const body = await response.json();
    expect(body.error).toBe('OPEN_COMMUNITY');
  });

  test('allows a user to cancel a pending join request', async ({ page }) => {
    const user = createTestUser();
    const community = await createTestCommunity('APPROVAL');

    await registerUser(page, user);
    await loginUser(page, user);

    const createResponse = await page.request.post(
      `/communities/${community.id}/join-request`,
      requestOptions
    );

    expect(createResponse.status()).toBe(201);

    const deleteResponse = await page.request.delete(
      `/communities/${community.id}/join-request`,
      requestOptions
    );

    expect(deleteResponse.status()).toBe(204);

    const getResponse = await page.request.get(`/communities/${community.id}/join-request`);

    expect(getResponse.status()).toBe(200);

    const body = await getResponse.json();
    expect(body.request).toBeNull();
  });

  test('rejects unauthenticated requests', async ({ page }) => {
    const community = await createTestCommunity('APPROVAL');

    const postResponse = await page.request.post(
      `/communities/${community.id}/join-request`,
      requestOptions
    );

    expect(postResponse.status()).toBe(401);

    const getResponse = await page.request.get(`/communities/${community.id}/join-request`);

    expect(getResponse.status()).toBe(401);

    const deleteResponse = await page.request.delete(
      `/communities/${community.id}/join-request`,
      requestOptions
    );

    expect(deleteResponse.status()).toBe(401);
  });
});
