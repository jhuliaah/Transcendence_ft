// Ensina ao TypeScript o formato de `locals`, para o editor conhecer `locals.user`
// no hooks.server.ts e nas actions. Este arquivo só tem tipos, não roda nada.
declare global {
  namespace App {
    interface Locals {
      // Os dados do usuário logado, ou null se ninguém estiver logado.
      user: {
        id: string;
        email: string;
        name: string | null;
      } | null;
    }
  }
}

// Sem isto, o TypeScript não aceitaria o `declare global` acima neste arquivo.
export {};
