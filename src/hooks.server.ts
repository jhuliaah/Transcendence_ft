// HOOK DO SERVIDOR
// `handle` roda em TODA requisição, antes de qualquer página ou action.
// Aqui ele descobre quem está logado e deixa isso disponível para o resto do app.
import type { Handle } from '@sveltejs/kit/hooks';
import { validateSession } from './lib/server/services/auth';

export const handle: Handle = async ({ event, resolve }) => {
  // Lê o cookie `session`, que guarda o token criado no login.
  const sessionToken = event.cookies.get('session');

  // `locals` é uma "mochila" que acompanha esta requisição. Começa como "ninguém logado".
  event.locals.user = null;

  if (sessionToken) {
    try {
      const session = await validateSession(sessionToken);

      if (session) {
        // Sessão válida: as pages e actions podem ler o usuário em locals.user.
        event.locals.user = session.user;
      } else {
        // Token inválido ou vencido: limpa o cookie do navegador.
        event.cookies.delete('session', { path: '/' });
      }
    } catch (error) {
      // Se o banco falhar, a pessoa segue como não logada e o site continua no ar.
      // O cookie não é apagado, porque a sessão pode voltar a funcionar depois.
      console.error('Session validation failed:', error);
    }
  }

  // Segue para a página ou action que foi pedida.
  return resolve(event);
};
