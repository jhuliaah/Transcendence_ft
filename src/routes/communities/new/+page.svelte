<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageProps } from './$types';

  let { form }: PageProps = $props();
</script>

<svelte:head>
  <title>Create Community</title>
  <meta name="description" content="Create a new community." />
</svelte:head>

<main class="mx-auto max-w-2xl p-6">
  <h1 class="mb-2 text-3xl font-bold">Create a community</h1>

  <p class="mb-6 text-gray-600">
    Create a space where people can organize, collaborate and make decisions together.
  </p>

  {#if form?.message}
    <div class="mb-4 rounded border border-red-500 p-3 text-red-700" role="alert">
      {form.message}
    </div>
  {/if}

  <form method="POST" class="space-y-6">
    <!-- Community name -->
    <div>
      <label for="name" class="mb-1 block font-medium"> Community name </label>

      <input
        id="name"
        name="name"
        type="text"
        required
        maxlength="100"
        value={form?.values?.name ?? ''}
        placeholder="e.g. Open Source Contributors"
        class="w-full rounded border p-2"
        aria-invalid={Boolean(form?.errors?.name?.length)}
      />

      {#if form?.errors?.name?.[0]}
        <p class="mt-1 text-sm text-red-600">
          {form.errors.name[0]}
        </p>
      {/if}
    </div>

    <!-- Description -->
    <div>
      <label for="description" class="mb-1 block font-medium"> Description </label>

      <textarea
        id="description"
        name="description"
        rows="4"
        maxlength="2000"
        placeholder="Describe the purpose of your community..."
        class="w-full resize-y rounded border p-2"
        aria-invalid={Boolean(form?.errors?.description?.length)}
        >{form?.values?.description ?? ''}</textarea
      >

      {#if form?.errors?.description?.[0]}
        <p class="mt-1 text-sm text-red-600">
          {form.errors.description[0]}
        </p>
      {/if}
    </div>

    <!-- Visibility -->
    <div>
      <label for="visibility" class="mb-1 block font-medium"> Visibility </label>

      <select
        id="visibility"
        name="visibility"
        value={form?.values?.visibility ?? 'PUBLIC'}
        class="w-full rounded border p-2"
        aria-invalid={Boolean(form?.errors?.visibility?.length)}
      >
        <option value="PUBLIC">Public</option>
        <option value="PRIVATE">Private</option>
      </select>

      <p class="mt-1 text-sm text-gray-600">
        Public communities can be discovered by users. Private communities are restricted to their
        members.
      </p>

      {#if form?.errors?.visibility?.[0]}
        <p class="mt-1 text-sm text-red-600">
          {form.errors.visibility[0]}
        </p>
      {/if}
    </div>

    <!-- Join policy -->
    <div>
      <label for="joinPolicy" class="mb-1 block font-medium"> Join policy </label>

      <select
        id="joinPolicy"
        name="joinPolicy"
        value={form?.values?.joinPolicy ?? 'OPEN'}
        class="w-full rounded border p-2"
        aria-invalid={Boolean(form?.errors?.joinPolicy?.length)}
      >
        <option value="OPEN">Open</option>
        <option value="APPROVAL">Approval required</option>
      </select>

      <p class="mt-1 text-sm text-gray-600">
        Open communities allow users to join directly. Approval-required communities need an
        administrator to approve membership requests.
      </p>

      {#if form?.errors?.joinPolicy?.[0]}
        <p class="mt-1 text-sm text-red-600">
          {form.errors.joinPolicy[0]}
        </p>
      {/if}
    </div>

    <div class="flex justify-end gap-3">
      <a
        href={resolve('/dashboard')}
        class="rounded border px-4 py-2 font-medium hover:bg-gray-100"
      >
        Cancel
      </a>

      <button
        type="submit"
        class="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Create community
      </button>
    </div>
  </form>
</main>
