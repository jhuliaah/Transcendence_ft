import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

function renderProfile(name: string | null = 'Test User') {
  render(Page, {
    params: {},
    form: undefined,
    data: {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name
      },
      communities: []
    }
  });
}

describe('profile page', () => {
  it('shows the authenticated user name and email', () => {
    renderProfile();

    expect(screen.getByRole('heading', { name: 'Seu perfil' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Test User' })).toBeTruthy();
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('falls back to the email and shows the empty communities state', () => {
    renderProfile(null);

    expect(screen.getByRole('heading', { name: 'test@example.com' })).toBeTruthy();
    expect(screen.getByText('Você ainda não participa de nenhuma comunidade.')).toBeTruthy();
  });

  it('renders the notification toggle with an enabled initial state', () => {
    renderProfile();

    expect(
      screen.getByRole('button', { name: 'Avisos por e-mail' }).getAttribute('aria-pressed')
    ).toBe('true');
  });
});
