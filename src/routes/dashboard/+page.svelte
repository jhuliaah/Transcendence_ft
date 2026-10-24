<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>Dashboard | Transcendence</title>
  <meta name="description" content="Área privada do usuário." />
</svelte:head>

<main class="mx-auto max-w-5xl p-8">
  <section class="rounded-2xl border border-slate-800 bg-slate-900 p-8">
    <h1 class="text-3xl font-bold text-white">Dashboard</h1>

    <p class="mt-4 text-slate-300">
      Bem-vindo, {data.user.name || data.user.email}!
    </p>

    <p class="mt-2 text-slate-400">Esta página só pode ser acessada por usuários autenticados.</p>
  </section>
</main>
