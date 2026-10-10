import { render, screen } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import Page from './+page.svelte';

it('renders the home page heading', () => {
	render(Page);

	expect(screen.getByRole('heading', { name: 'Welcome to SvelteKit' })).toBeTruthy();
});