<script lang="ts">
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(form?.values?.name ?? '');

  const initial = $derived((name.trim() || data.user.email).charAt(0).toUpperCase());
  const nameError = $derived(form?.errors?.name?.[0]);
</script>

<svelte:head>
  <title>Completar perfil | Arenium</title>
  <meta name="description" content="Conte como a galera vai te chamar." />
</svelte:head>

<main class="min-h-[calc(100vh-61px)] bg-[#f9edd7] text-navy-900">
  <div class="mx-auto flex max-w-md flex-col gap-6 px-6 py-12">
    <div class="flex gap-1.5" aria-hidden="true">
      <span class="h-1 flex-1 rounded-full bg-gold-500"></span>
      <span class="h-1 flex-1 rounded-full bg-gold-500"></span>
    </div>

    <div
      class="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-navy-900 text-[28px] font-extrabold text-gold-500"
      aria-hidden="true"
    >
      {initial}
    </div>

    <div>
      <h1 class="text-[32px] leading-tight font-extrabold">Quase lá</h1>
      <p class="mt-1 text-[#4a5c6e]">Só falta como a galera vai te chamar.</p>
    </div>

    {#if form?.message}
      <p class="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700" role="alert">
        {form.message}
      </p>
    {/if}

    <form method="POST" class="flex flex-col gap-5">
      <div class="flex flex-col gap-2">
        <label for="name" class="text-sm font-extrabold">Nome</label>
        <input
          id="name"
          name="name"
          type="text"
          autocomplete="name"
          required
          maxlength="100"
          bind:value={name}
          aria-invalid={nameError ? 'true' : undefined}
          aria-describedby={nameError ? 'name-error' : undefined}
          class="h-12 rounded-xl border-[1.5px] border-[#e3d6bd] bg-[#fffaf2] px-4 text-[15px] focus-visible:outline-2 focus-visible:outline-gold-500 aria-[invalid=true]:border-red-700"
        />
        {#if nameError}
          <p id="name-error" class="text-sm font-bold text-red-700">{nameError}</p>
        {/if}
      </div>

      <div class="flex flex-col gap-2">
        <label for="email" class="text-sm font-extrabold">E-mail</label>
        <input
          id="email"
          type="email"
          value={data.user.email}
          readonly
          aria-readonly="true"
          class="h-12 cursor-not-allowed rounded-xl border-[1.5px] border-[#e3d6bd] bg-[#ece1cf] px-4 text-[15px] text-[#6b7785]"
        />
      </div>

      <button
        type="submit"
        class="mt-1 h-12 rounded-xl bg-gold-500 text-[15px] font-extrabold text-navy-900 transition hover:bg-gold-700 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
      >
        Avançar
      </button>
    </form>
  </div>
</main>
