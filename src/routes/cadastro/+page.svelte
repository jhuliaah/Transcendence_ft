<!--
  TELA DE CADASTRO (rota /cadastro)
  Este arquivo é só o que aparece no navegador. Quem processa o envio é o +page.server.ts,
  que fica na mesma pasta. O caminho completo de um cadastro é:
    1. a pessoa preenche este formulário e clica no botão;
    2. o navegador envia os dados por POST para /cadastro;
    3. a action do +page.server.ts valida os dados e tenta criar o usuário;
    4. o retorno da action chega aqui na variável `form` e a página é desenhada de novo.
-->
<script lang="ts">
  // PageProps é um tipo gerado pelo SvelteKit, a partir dos arquivos desta pasta.
  // É por causa dele que o editor sabe quais campos existem dentro de `form`.
  import type { PageProps } from './$types';

  // $props() é a forma do Svelte 5 de receber dados de fora do componente.
  // `form` guarda o retorno da action. Antes do primeiro envio ele é vazio (null),
  // e por isso o código abaixo sempre usa `form?.` (o ?. não dá erro se for vazio).
  let { form }: PageProps = $props();
</script>

<!-- Tudo aqui dentro vai para o <head> da página: título da aba e descrição para buscadores. -->
<svelte:head>
  <title>Cadastro</title>
  <meta name="description" content="Create your account." />
</svelte:head>

<!-- As classes são do Tailwind. mx-auto centraliza, max-w-md limita a largura, p-6 dá 24px de respiro. -->
<main class="mx-auto max-w-md p-6">
  <h1 class="mb-6 text-3xl font-bold">Create account</h1>

  <!-- Deu certo: mostra só a mensagem de sucesso e esconde o formulário. -->
  {#if form?.success}
    <!-- role="status" avisa o leitor de tela que apareceu uma mensagem. O teste E2E também procura por ele. -->
    <div class="mb-4 rounded border border-green-500 p-3 text-green-700" role="status">
      {form.message}
    </div>
  {:else}
    <!-- Erro geral, que não é de um campo só (ex.: e-mail já cadastrado). role="alert" é o aviso urgente. -->
    {#if form?.message}
      <div class="mb-4 rounded border border-red-500 p-3 text-red-700" role="alert">
        {form.message}
      </div>
    {/if}

    <!--
      method="POST" sem `action`: envia para a própria rota /cadastro, e o SvelteKit
      chama a action `default` do +page.server.ts. Como não há `use:enhance`, é um envio
      comum de formulário: a página recarrega e funciona mesmo sem JavaScript.
    -->
    <form method="POST" class="space-y-4">
      <!-- CAMPO NOME (opcional) -->
      <div>
        <!-- O `for` do label precisa ser igual ao `id` do input: é o que liga os dois. -->
        <label for="name" class="mb-1 block font-medium"> Name (optional) </label>

        <!--
          name: é a chave que o servidor lê com formData.get('name').
          autocomplete: deixa o navegador sugerir o valor.
          maxlength: limite no navegador. O limite que vale de verdade está no schema (zod).
          value: se o envio falhar, o que a pessoa digitou volta para o campo.
          aria-invalid: avisa o leitor de tela que este campo está com erro.
        -->
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

        <!-- `errors.name` é uma lista de mensagens do zod. Mostramos só a primeira. -->
        {#if form?.errors?.name?.[0]}
          <p class="mt-1 text-sm text-red-600">
            {form.errors.name[0]}
          </p>
        {/if}
      </div>

      <!-- CAMPO E-MAIL: mesma estrutura do nome, mas obrigatório (required). -->
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

      <!-- CAMPO SENHA -->
      <div>
        <label for="password" class="mb-1 block font-medium"> Password </label>

        <!--
          Este é o único campo sem `value`: de propósito, a senha nunca volta do servidor.
          autocomplete="new-password" faz o gerenciador de senhas sugerir uma senha nova.
        -->
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

      <!-- type="submit": clicar aqui envia o formulário. -->
      <button
        type="submit"
        class="w-full rounded bg-blue-600 p-3 font-medium text-white hover:bg-blue-700"
      >
        Create account
      </button>
    </form>
  {/if}
</main>
