<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  // After a failed submit keep what the user typed; otherwise show the saved values.
  const current = $derived(form?.values ?? data.community);
</script>

<svelte:head>
  <title>Community settings</title>
  <meta name="description" content="Edit the settings of your community." />
</svelte:head>

<main class="mx-auto max-w-2xl p-6">
  <h1 class="mb-2 text-3xl font-bold">Community settings</h1>

  <p class="mb-6 text-gray-600">Only the owner of the community can change these settings.</p>

  {#if form?.success}
    <div class="mb-4 rounded border border-green-600 p-3 text-green-700" role="status">
      Settings saved.
    </div>
  {/if}

  {#if form?.message}
    <div class="mb-4 rounded border border-red-500 p-3 text-red-700" role="alert">
      {form.message}
    </div>
  {/if}

  <form method="POST" class="space-y-6">
    <div>
      <label for="name" class="mb-1 block font-medium">Community name</label>

      <input
        id="name"
        name="name"
        type="text"
        required
        maxlength="100"
        value={current.name}
        class="w-full rounded border p-2"
        aria-invalid={Boolean(form?.errors?.name?.length)}
      />

      {#if form?.errors?.name?.[0]}
        <p class="mt-1 text-sm text-red-600">{form.errors.name[0]}</p>
      {/if}
    </div>

    <div>
      <label for="description" class="mb-1 block font-medium">Description</label>

      <textarea
        id="description"
        name="description"
        rows="4"
        maxlength="2000"
        class="w-full resize-y rounded border p-2"
        aria-invalid={Boolean(form?.errors?.description?.length)}
        >{current.description ?? ''}</textarea
      >

      {#if form?.errors?.description?.[0]}
        <p class="mt-1 text-sm text-red-600">{form.errors.description[0]}</p>
      {/if}
    </div>

    <div>
      <label for="visibility" class="mb-1 block font-medium">Visibility</label>

      <select
        id="visibility"
        name="visibility"
        value={current.visibility}
        class="w-full rounded border p-2"
        aria-invalid={Boolean(form?.errors?.visibility?.length)}
      >
        <option value="PUBLIC">Public</option>
        <option value="PRIVATE">Private</option>
      </select>

      {#if form?.errors?.visibility?.[0]}
        <p class="mt-1 text-sm text-red-600">{form.errors.visibility[0]}</p>
      {/if}
    </div>

    <div>
      <label for="joinPolicy" class="mb-1 block font-medium">Join policy</label>

      <select
        id="joinPolicy"
        name="joinPolicy"
        value={current.joinPolicy}
        class="w-full rounded border p-2"
        aria-invalid={Boolean(form?.errors?.joinPolicy?.length)}
      >
        <option value="OPEN">Open</option>
        <option value="APPROVAL">Approval required</option>
      </select>

      <p class="mt-1 text-sm text-gray-600">
        Changing the policy does not affect requests that are already pending.
      </p>

      {#if form?.errors?.joinPolicy?.[0]}
        <p class="mt-1 text-sm text-red-600">{form.errors.joinPolicy[0]}</p>
      {/if}
    </div>

    <div class="flex justify-end gap-3">
      <a
        href={resolve('/dashboard')}
        class="rounded border px-4 py-2 font-medium hover:bg-gray-100"
      >
        Back
      </a>

      <button
        type="submit"
        class="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Save settings
      </button>
    </div>
  </form>
</main>
