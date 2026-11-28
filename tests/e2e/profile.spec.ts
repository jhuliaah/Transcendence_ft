import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

const password = 'e2e-password-123';

async function register(page: Page, email: string, name?: string) {
  await page.goto('/cadastro');

  if (name) {
    await page.getByLabel('Name (optional)').fill(name);
  }

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('status')).toContainText('Account created successfully');
}

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test.describe('Complete profile E2E', () => {
  test('asks a user without a name to complete the profile after login', async ({ page }) => {
    const email = `e2e-complete-${randomUUID()}@example.com`;

    await register(page, email);
    await login(page, email);

    await expect(page).toHaveURL(/\/completar-perfil$/);
    await expect(page.getByRole('heading', { name: 'Quase lá' })).toBeVisible();
    await expect(page.getByLabel('E-mail')).toHaveValue(email);
    await expect(page.getByLabel('E-mail')).not.toBeEditable();

    await page.getByLabel('Nome').fill('Júlia Almeida');
    await page.getByRole('button', { name: 'Avançar' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);

    // The name is saved, so the step does not appear again.
    await page.goto('/perfil');
    await expect(page.getByRole('heading', { name: 'Júlia Almeida' })).toBeVisible();

    await page.goto('/completar-perfil');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('keeps the user on the step when the name is empty', async ({ page }) => {
    const email = `e2e-complete-${randomUUID()}@example.com`;

    await register(page, email);
    await login(page, email);
    await expect(page).toHaveURL(/\/completar-perfil$/);

    // Bypass the browser validation to exercise the server-side check.
    await page.locator('main form').evaluate((form) => {
      (form as HTMLFormElement).noValidate = true;
    });
    await page.getByLabel('Nome').fill('   ');
    await page.getByRole('button', { name: 'Avançar' }).click();

    await expect(page.getByText('Informe como você quer ser chamado.')).toBeVisible();
    await expect(page).toHaveURL(/\/completar-perfil$/);
  });

  test('skips the step for users who already have a name', async ({ page }) => {
    const email = `e2e-complete-${randomUUID()}@example.com`;

    await register(page, email, 'Named User');
    await login(page, email);

    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
