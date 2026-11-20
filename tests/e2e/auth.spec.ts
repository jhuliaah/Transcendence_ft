import { test, expect } from '@playwright/test';
import { createTestUser, registerUser, loginUser } from './helpers/auth';

test.describe('Authentication E2E', () => {
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

    await page.getByLabel('Name (optional)').fill(user.name);
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
    await loginUser(page, user);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText(`Bem-vindo, ${user.name}!`)).toBeVisible();
  });

  test('rejects login with an incorrect password', async ({ page }) => {
    const user = createTestUser();

    await registerUser(page, user);

    await page.goto('/login');

    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill('incorrect-password-123');

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
    await loginUser(page, user);

    await expect(page).toHaveURL(/\/dashboard$/);

    await page.reload();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(`Bem-vindo, ${user.name}!`)).toBeVisible();
  });

  test('revokes the session after logout', async ({ page }) => {
    const user = createTestUser();

    await registerUser(page, user);
    await loginUser(page, user);

    await expect(page).toHaveURL(/\/dashboard$/);

    // Submit the actual logout form through the browser.
    await page.getByRole('button', { name: 'Sign out' }).click();

    // The endpoint redirects to the home page.
    await expect(page).toHaveURL('/');

    // The revoked session must no longer grant access.
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('redirects unauthenticated visitors away from the profile', async ({ page }) => {
    await page.goto('/perfil');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('allows an authenticated user to access the profile', async ({ page }) => {
    const user = createTestUser();

    await registerUser(page, user);
    await loginUser(page, user);

    await page.goto('/perfil');

    await expect(page).toHaveURL(/\/perfil$/);
    await expect(page.getByRole('heading', { name: 'Seu perfil' })).toBeVisible();
    await expect(page.getByRole('heading', { name: user.name })).toBeVisible();
    await expect(page.getByText(user.email)).toBeVisible();
    await expect(page.getByText('Você ainda não participa de nenhuma comunidade.')).toBeVisible();
  });
});
