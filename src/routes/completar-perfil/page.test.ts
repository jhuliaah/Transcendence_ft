import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Page from './+page.svelte';

type PageForm = Parameters<typeof render<typeof Page>>[1] extends infer P
  ? P extends { form: infer F }
    ? F
    : never
  : never;

function renderPage(form: PageForm = null) {
  render(Page, {
    params: {},
    form,
    data: {
      user: { id: 'user-1', email: 'julia@example.com', name: null }
    }
  });
}

describe('complete profile page', () => {
  it('asks for the name and shows the email as read-only', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Quase lá' })).toBeTruthy();
    expect(screen.getByText('Só falta como a galera vai te chamar.')).toBeTruthy();

    const name = screen.getByLabelText('Nome') as HTMLInputElement;
    const email = screen.getByLabelText('E-mail') as HTMLInputElement;

    expect(name.value).toBe('');
    expect(name.required).toBe(true);
    expect(email.value).toBe('julia@example.com');
    expect(email.readOnly).toBe(true);
    expect(email.name).toBe('');
    expect(screen.getByRole('button', { name: 'Avançar' })).toBeTruthy();
  });

  it('updates the avatar initial as the name is typed', async () => {
    renderPage();

    expect(screen.getByText('J')).toBeTruthy();

    await fireEvent.input(screen.getByLabelText('Nome'), { target: { value: 'Ana' } });

    expect(screen.getByText('A')).toBeTruthy();
  });

  it('shows the validation error returned by the server', () => {
    renderPage({
      success: false,
      errors: { name: ['Informe como você quer ser chamado.'] },
      values: { name: '' }
    });

    expect(screen.getByText('Informe como você quer ser chamado.')).toBeTruthy();
    expect(screen.getByLabelText('Nome').getAttribute('aria-invalid')).toBe('true');
  });
});
