<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

  let { form }: PageProps = $props();
</script>

<svelte:head>
  <title>Login</title>
  <meta name="description" content="Sign in to your account." />
</svelte:head>

<main class="mx-auto max-w-md p-6">
  <h1 class="mb-6 text-3xl font-bold">Login</h1>

  {#if form?.message}
    <div class="mb-4 rounded border border-red-500 p-3 text-red-700" role="alert">
      {form.message}
    </div>
  {/if}

  <form method="POST" class="space-y-4">
    <div>
      <label for="email" class="mb-1 block font-medium"> Email </label>

      <input
        id="email"
        name="email"
        type="email"
        autocomplete="email"
        required
        maxlength="254"
        value={form?.values?.email ?? ''}
        class="w-full rounded border p-2"
      />
    </div>

    <div>
      <label for="password" class="mb-1 block font-medium"> Password </label>

      <input
        id="password"
        name="password"
        type="password"
        autocomplete="current-password"
        required
        class="w-full rounded border p-2"
      />
    </div>

    <button
      type="submit"
      class="w-full rounded bg-blue-600 p-3 font-medium text-white hover:bg-blue-700"
    >
      Sign in
    </button>
  </form>

  <p class="mt-4 text-sm">
    Don't have an account?
    <a href={resolve('/cadastro')} class="text-blue-600 underline"> Create one </a>
  </p>
</main>
