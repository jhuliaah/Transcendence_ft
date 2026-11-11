// Roda no servidor antes das páginas. O que este `load` devolve chega em `data`
// no +layout.svelte e em todas as páginas abaixo dele.
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    // locals.user foi preenchido no hooks.server.ts. Passa o usuário para a parte visual.
    user: locals.user
  };
};
