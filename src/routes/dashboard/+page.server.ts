import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/login');
  }

  // Primeira entrada sem nome: passa antes pela tela de completar perfil.
  if (!locals.user.name) {
    redirect(303, '/completar-perfil');
  }

  return {
    user: locals.user
  };
};
