<script lang="ts">
  import { resolve } from '$app/paths';
  import favicon from '#lib/assets/favicon.svg';
  import '../app.css';
  import type { LayoutProps } from './$types';

  let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<header class="border-b border-slate-800 bg-slate-900 px-6 py-4">
  <nav class="mx-auto flex max-w-5xl items-center justify-between">
    <a href={resolve('/')} class="font-bold text-white">Transcendence</a>

    {#if data.user}
      <div class="flex items-center gap-4">
        <span class="text-sm text-slate-300">
          {data.user.name || data.user.email}
        </span>

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

{@render children()}
