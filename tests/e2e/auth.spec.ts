import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
  function createTestUser() {
    return {
      name: 'E2E Test User',
      email: `e2e-${randomUUID()}@example.com`,
      password: 'e2e-password-123'
    };
  }

  async function registerUser(
    page: import('@playwright/test').Page,
    user: ReturnType<typeof createTestUser>
  ) {
    await page.goto('/cadastro');

    await page.getByLabel('Name (optional)').fill(user.name);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);

    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByRole('status')).toContainText('Account created successfully');
  }

  async function disableNativeValidation(page: import('@playwright/test').Page) {
    await page.locator('form').evaluate((form) => {
      (form as HTMLFormElement).noValidate = true;
    });
  }

  test('allows a visitor to register an account', async ({ page }) => {
    const user = createTestUser();

    await registerUser(page, user);
  });

  test('rejects registration with an existing email', async ({ page }) => {
    const user = createTestUser();

    await registerUser(page, user);

    await page.goto('/cadastro');

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);

    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByRole('alert')).toContainText(
      'An account with this email already exists.'
    );
  });

  test('rejects registration with an invalid email', async ({ page }) => {
    await page.goto('/cadastro');

    await disableNativeValidation(page);

    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').fill('valid-password-123');

    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Invalid email address')).toBeVisible();
  });

  test('rejects registration with a short password', async ({ page }) => {
    await page.goto('/cadastro');

    await disableNativeValidation(page);

    await page.getByLabel('Email').fill('short-password@example.com');
    await page.getByLabel('Password').fill('1234567');

    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Password must contain at least 8 characters')).toBeVisible();
  });

  test('allows a registered user to log in and access the dashboard', async ({ page }) => {
    const user = createTestUser();

    await registerUser(page, user);

    await page.goto('/login');

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText(`Bem-vindo, ${user.name}!`)).toBeVisible();
  });

  test('rejects login with an incorrect password', async ({ page }) => {
    const user = createTestUser();

    await registerUser(page, user);

    await page.goto('/login');

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill('incorrect-password');

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');
  });

  test('rejects login with a nonexistent email', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('nonexistent@example.com');
    await page.getByLabel('Password').fill('some-password-123');

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');
  });

  test('redirects unauthenticated visitors to login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('keeps the user authenticated after reloading the dashboard', async ({ page }) => {
    const user = createTestUser();

    await registerUser(page, user);

    await page.goto('/login');

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);

    await page.reload();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(`Bem-vindo, ${user.name}!`)).toBeVisible();
  });

  test('revokes the session after logout', async ({ page }) => {
    const user = createTestUser();

    await registerUser(page, user);

    await page.goto('/login');

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);

    // Submit the actual logout form through the browser.
    await page.getByRole('button', { name: 'Sign out' }).click();

    // The endpoint redirects to the home page.
    await expect(page).toHaveURL('/');

    // The revoked session must no longer grant access.
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
  });
});
