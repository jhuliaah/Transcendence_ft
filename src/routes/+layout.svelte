<script lang="ts">
  import { resolve } from '$app/paths';
  import favicon from '#lib/assets/favicon.svg';
  import logo from '#lib/assets/arenium_logo.png';
  import '@fontsource-variable/nunito-sans';
  import '../app.css';
  import type { LayoutProps } from './$types';

  let { children, data }: LayoutProps = $props();

  const focusRing =
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<header class="bg-navy-900 px-5 py-3 md:px-6">
  <nav aria-label="Principal" class="mx-auto flex max-w-5xl items-center justify-between gap-4">
    <a href={resolve('/')} class="flex items-center gap-2.5 rounded-[10px] {focusRing}">
      <img src={logo} alt="" class="h-9 w-auto" />
      <span class="text-[21px] leading-tight font-extrabold text-white">Arenium</span>
    </a>

    {#if data.user}
      <div class="flex items-center gap-4">
        <a href={resolve('/perfil')} class="text-sm text-blue-200 transition hover:text-white">
          {data.user.name || data.user.email}
        </a>

        <form method="POST" action="/logout">
          <button
            type="submit"
            class="rounded-full border-[1.5px] border-blue-200 px-4 py-2 text-sm font-bold text-blue-200 transition hover:bg-navy-800 hover:text-white {focusRing}"
          >
            Sair
          </button>
        </form>
      </div>
    {:else}
      <div class="flex items-center gap-4">
        <a
          href={resolve('/login')}
          class="rounded-full text-sm font-bold text-blue-200 transition hover:text-white {focusRing}"
        >
          Entrar
        </a>
        <a
          href={resolve('/cadastro')}
          class="rounded-full bg-white px-4 py-2 text-sm font-bold text-navy-900 transition hover:bg-blue-50 {focusRing}"
        >
          Criar conta
        </a>
      </div>
    {/if}
  </nav>
</header>

{@render children()}
