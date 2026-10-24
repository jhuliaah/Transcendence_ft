<script lang="ts">
  import type { PageProps } from './$types';

  let { form }: PageProps = $props();
</script>

<svelte:head>
  <title>Cadastro</title>
  <meta name="description" content="Create your account." />
</svelte:head>

<main class="mx-auto max-w-md p-6">
  <h1 class="mb-6 text-3xl font-bold">Create account</h1>

  {#if form?.success}
    <div class="mb-4 rounded border border-green-500 p-3 text-green-700" role="status">
      {form.message}
    </div>
  {:else}
    {#if form?.message}
      <div class="mb-4 rounded border border-red-500 p-3 text-red-700" role="alert">
        {form.message}
      </div>
    {/if}

    <form method="POST" class="space-y-4">
      <div>
        <label for="name" class="mb-1 block font-medium"> Name (optional) </label>

        <input
          id="name"
          name="name"
          type="text"
          autocomplete="name"
          maxlength="100"
          value={form?.values?.name ?? ''}
          class="w-full rounded border p-2"
          aria-invalid={Boolean(form?.errors?.name?.length)}
        />

        {#if form?.errors?.name?.[0]}
          <p class="mt-1 text-sm text-red-600">
            {form.errors.name[0]}
          </p>
        {/if}
      </div>

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
          aria-invalid={Boolean(form?.errors?.email?.length)}
        />

        {#if form?.errors?.email?.[0]}
          <p class="mt-1 text-sm text-red-600">
            {form.errors.email[0]}
          </p>
        {/if}
      </div>

      <div>
        <label for="password" class="mb-1 block font-medium"> Password </label>

        <input
          id="password"
          name="password"
          type="password"
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
          class="w-full rounded border p-2"
          aria-invalid={Boolean(form?.errors?.password?.length)}
        />

        {#if form?.errors?.password?.[0]}
          <p class="mt-1 text-sm text-red-600">
            {form.errors.password[0]}
          </p>
        {/if}

        <p class="mt-1 text-sm text-gray-600">Use at least 8 characters.</p>
      </div>

      <button
        type="submit"
        class="w-full rounded bg-blue-600 p-3 font-medium text-white hover:bg-blue-700"
      >
        Create account
      </button>
    </form>
  {/if}
</main>
