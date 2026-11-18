import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type ProfileCommunity = {
  initial: string;
  name: string;
  role: string | null;
};

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/login');
  }

  const communities: ProfileCommunity[] = [];

  return {
    user: locals.user,
    communities
  };
};
