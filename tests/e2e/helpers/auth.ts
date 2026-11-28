import { randomUUID } from 'node:crypto';
import { expect, type Page } from '@playwright/test';

export type TestUser = {
  name: string;
  email: string;
  password: string;
};

export function createTestUser(): TestUser {
  return {
    name: 'E2E Test User',
    email: `e2e-${randomUUID()}@example.com`,
    password: 'e2e-password-123'
  };
}

export async function registerUser(page: Page, user: TestUser) {
  await page.goto('/cadastro');

  await page.getByLabel('Name (optional)').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);

  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('status')).toContainText('Account created successfully');
}

export async function loginUser(page: Page, user: TestUser) {
  await page.goto('/login');

  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);

  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
}
