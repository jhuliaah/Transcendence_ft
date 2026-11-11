<!-- LAYOUT RAIZ: a "moldura" que envolve todas as páginas do site. -->
<script lang="ts">
  // resolve() monta o link da rota e avisa se a rota não existir.
  import { resolve } from '$app/paths';
  import favicon from '#lib/assets/favicon.svg';
  // O CSS global (com o Tailwind) entra aqui, por isso vale para o site inteiro.
  import '../app.css';
  import type { LayoutProps } from './$types';

  // children: a página atual. data: o que veio do +layout.server.ts (o usuário logado).
  let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<!-- Cabeçalho que aparece em todas as páginas, inclusive em /cadastro. -->
<header class="border-b border-slate-800 bg-slate-900 px-6 py-4">
  <nav class="mx-auto flex max-w-5xl items-center justify-between">
    <a href={resolve('/')} class="font-bold text-white">Transcendence</a>

    <!-- Logado: mostra o nome (ou o e-mail, se não tiver nome) e o botão Sair. -->
    {#if data.user}
      <div class="flex items-center gap-4">
        <span class="text-sm text-slate-300">
          {data.user.name || data.user.email}
        </span>

        <!-- Logout é um POST, não um link, para que outro site não consiga deslogar a pessoa com um simples link. -->
        <form method="POST" action="/logout">
          <button
            type="submit"
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Sair
          </button>
        </form>
      </div>
    {:else}
      <!-- Não logado: links para entrar e para criar conta. -->
      <div class="flex items-center gap-4">
        <a href={resolve('/login')} class="text-sm text-slate-300 transition hover:text-white">
          Entrar
        </a>
        <a
          href={resolve('/cadastro')}
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          Criar conta
        </a>
      </div>
    {/if}
  </nav>
</header>

<!-- A página atual (por exemplo, a de cadastro) é desenhada aqui. -->
{@render children()}
