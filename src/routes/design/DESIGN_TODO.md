 # Design — To-do e guia de estudo

Checklist para implementar o design do Arenium Lite em **SvelteKit + Svelte 5 + Tailwind CSS 4**. Ele também serve de roteiro para aprender Svelte: cada seção diz o que fazer, o que estudar para conseguir fazer e como saber que ficou pronto.

**Referência visual:** `Arenium Moon Remix (standalone)(2).html`, um protótipo mobile de 412×892 com todas as telas do fluxo. Os valores abaixo (cores, tamanhos, raios) foram extraídos dele. Abra o arquivo no navegador e use o DevTools (F12 → selecionar elemento) para medir qualquer coisa que não esteja aqui.

**Como usar este arquivo**

- Siga as seções **na ordem**: cada uma usa o que a anterior criou.
- 📚 **Estude** lista os conceitos e links da documentação oficial.
- 🛠️ **Como fazer** dá o caminho e a sintaxe, sem a solução pronta.
- ✅ **Pronto quando** diz como conferir o resultado.
- Marque `[x]` à medida que terminar.

---

## Antes de começar

### Ferramentas do projeto

| Comando          | Para quê                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| `npm run dev`    | Servidor de desenvolvimento em `http://localhost:5173`, com hot reload |
| `npm run check`  | Checagem de tipos do Svelte/TypeScript (`svelte-check`)                |
| `npm run lint`   | ESLint                                                                 |
| `npm run format` | Formata tudo com Prettier                                              |
| `npm test`       | Testes de unidade (Vitest)                                             |

**Hooks do git:**

- O **pre-commit** roda Prettier, lint e `check`. Se qualquer arquivo do projeto tiver erro, até um que não está no commit, o commit trava.
- O **pre-push** roda os testes e os testes de integração, que precisam do Docker rodando.
- As mensagens de commit seguem o **Conventional Commits** (commitlint): `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`. Exemplo: `feat(ui): add Button component`.

**Extensões do VS Code:** _Svelte for VS Code_ e _Tailwind CSS IntelliSense_. A segunda faz autocomplete das suas cores personalizadas.

### Armadilhas deste projeto

- **Sem SCSS:** o `sass` não está instalado, então `<style lang="scss">` quebra o build. Use `<style>` puro ou só classes do Tailwind.
- **`<svelte:body>` não aceita conteúdo.** Ele só adiciona eventos ao `<body>`. Para envolver a página, use `<main>` ou `<div>`.
- **Alias de importação:** é `#lib/...` (definido em `package.json` → `imports`), não `$lib`. Exemplo: `import Button from '#lib/components/ui/Button.svelte';`.
- **Runes ligadas no projeto inteiro** (`vite.config.ts`): use a sintaxe do Svelte 5 (`$props`, `$state`, `onclick`). A antiga (`export let`, `on:click`, `<slot>`) não funciona aqui.

### Svelte 5 em uma página

📚 Faça primeiro o **tutorial interativo**: https://svelte.dev/tutorial/svelte/welcome-to-svelte. As partes _Basic Svelte_ e _Advanced Svelte → Snippets_ cobrem quase tudo deste checklist. Documentação: https://svelte.dev/docs/svelte

Um arquivo `.svelte` tem três partes, todas opcionais:

```svelte
<script lang="ts">
  // lógica: props, estado, funções
</script>

<!-- marcação: HTML + blocos do Svelte -->

<style>
  /* CSS que só vale para ESTE componente (escopado) */
</style>
```

| Conceito                 | Sintaxe                                                                                                | Para que serve aqui                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **Props**                | `let { titulo, tamanho = 'md' } = $props();`                                                           | Receber dados de quem usa o componente. Valor padrão com `=`   |
| **Tipar props**          | `interface Props { titulo: string; tamanho?: 'sm' \| 'md' }` e depois `let { ... }: Props = $props();` | O VS Code avisa se alguém passar errado                        |
| **Estado**               | `let aberto = $state(false);`                                                                          | Valor que, ao mudar, atualiza a tela (sheet aberta, aba ativa) |
| **Derivado**             | `let pct = $derived(sim / total * 100);`                                                               | Valor calculado a partir de outros (porcentagem da VoteBar)    |
| **Efeito**               | `$effect(() => { ... });`                                                                              | Rodar código quando algo muda (raro em UI pura; evite se der)  |
| **Evento**               | `<button onclick={fechar}>`                                                                            | Atributo comum, sem `on:`                                      |
| **Condicional**          | `{#if aberto} ... {:else} ... {/if}`                                                                   | Mostrar/esconder                                               |
| **Lista**                | `{#each itens as item (item.id)} ... {/each}`                                                          | Renderizar listas (comunidades, mensagens)                     |
| **Conteúdo filho**       | prop `children` + `{@render children?.()}`                                                             | O que vai entre `<Button>` e `</Button>`                       |
| **Áreas nomeadas**       | `{#snippet header()} ... {/snippet}` + prop `header`                                                   | Card com cabeçalho e rodapé opcionais                          |
| **Ligação de valor**     | `<input bind:value={nome}>`                                                                            | Input controlado                                               |
| **Prop bindable**        | `let { value = $bindable() } = $props();`                                                              | Permite `bind:value` no **seu** componente (TextField)         |
| **Repassar atributos**   | `let { a, ...rest } = $props();` + `<button {...rest}>`                                                | Seu componente aceita `type`, `disabled`, `aria-*` etc.        |
| **Classe extra**         | `let { class: className } = $props();`                                                                 | Quem usa pode acrescentar classes                              |
| **Classes condicionais** | `class={['base', ativo && 'bg-navy-900', className]}`                                                  | Array/objeto direto no `class` (Svelte 5.16+, como o `clsx`)   |
| **Tipos de HTML**        | `import type { HTMLButtonAttributes } from 'svelte/elements';`                                         | Estender as props com os atributos nativos                     |
| **Tipo de snippet**      | `import type { Snippet } from 'svelte';`                                                               | Tipar `children`, `header` etc.                                |

### SvelteKit (rotas) em uma página

📚 https://svelte.dev/docs/kit/routing

- `src/routes/+page.svelte` é a página `/`, e `src/routes/login/+page.svelte` é a `/login`.
- `+layout.svelte` envolve todas as páginas da pasta e das subpastas. Ele renderiza a página com `{@render children()}`.
- Uma pasta entre parênteses, como `(app)`, é um **grupo**: ela compartilha o layout, mas não aparece na URL.
- `+error.svelte` é a página de erro e 404.
- Componentes reutilizáveis ficam em `src/lib/components/`, nunca em `routes/`.

### Tailwind CSS 4 em uma página

📚 https://tailwindcss.com/docs/theme · https://tailwindcss.com/docs/adding-custom-styles

- **Não existe `tailwind.config.js`.** A configuração fica no CSS, em `src/app.css`.
- **`@theme { --color-navy-900: #001a32; }`** cria as classes `bg-navy-900`, `text-navy-900`, `border-navy-900` etc.
- Cada prefixo de variável gera uma família de classes:

  | Prefixo      | Classes geradas   |
  | ------------ | ----------------- |
  | `--color-*`  | cores             |
  | `--font-*`   | `font-*`          |
  | `--text-*`   | tamanhos de fonte |
  | `--radius-*` | `rounded-*`       |
  | `--shadow-*` | `shadow-*`        |

- ⚠️ Se você criar `--color-green-500`, ele **substitui** o `green-500` padrão do Tailwind, e as outras tonalidades padrão continuam existindo. Para usar **só** a sua paleta, comece o `@theme` com `--color-*: initial;`.
- **Valor arbitrário:** `h-[54px]`, `border-[1.5px]`, `bg-[#fff]`. Hex solto só para testar; no código final use tokens.
- **Opacidade:** `bg-navy-900/45` aplica a cor com 45% de alpha.
- **Variantes:** `hover:`, `focus-visible:`, `active:`, `disabled:`, `md:` (≥768px), `lg:` (≥1024px).
- **`@layer base { ... }`** guarda estilos globais de elementos (`body`, `a`).
- **`@utility nome { ... }`** cria uma classe própria.
- **Evite `@apply` em excesso:** se você está criando `.btn-primary`, aquilo deveria ser um componente Svelte.

### Regras gerais do design

- Nenhum hex solto em componente: sempre token do `@theme`.
- Primitivos genéricos em `src/lib/components/ui/`, componentes do produto em `src/lib/components/arenium/`.
- Componentes aceitam `class` extra e repassam `...rest` para o elemento nativo.
- O protótipo é mobile: cada tela precisa de uma versão responsiva para desktop.
- Tudo que é clicável é `<button>` ou `<a>`. O protótipo usa `<div>` e `<span>`, mas não copie isso.

---

## 0. Decisões

- [x] **Fonte:** **Nunito Sans** (pesos 400–800), seguindo o documento de contexto. O Moon Remix usa DM Sans; os tamanhos e pesos dele continuam valendo.
- [x] **Botões de voto:** **`Sim` / `Não`**, sem caixa alta, seguindo o documento de contexto. O Moon Remix usa `SIM` / `NÃO`.
- [ ] **Layout desktop:** decidir entre duas colunas estilo WhatsApp Web (lista de comunidades + chat) ou coluna central com largura máxima.
- [ ] **Fundo da página:** o Moon Remix usa `#EDEAE3` atrás do "celular" e `#FFFFFF` nas telas. Definir se o desktop usa um fundo creme/bege em volta do conteúdo branco.
- [ ] **Modo escuro:** entra no escopo ou não. Se entrar, planeje os tokens agora (veja a nota em 1.1).

---

## 1. Fundação (`src/app.css` + `src/app.html`)

📚 **Estude:** Tailwind → _Theme variables_, _Adding custom styles_ e _Functions and directives_ (`@theme`, `@layer`, `@utility`).

### 1.1 Tokens de cor (`@theme`)

🛠️ **Como fazer**

- Em `src/app.css`, logo depois de `@import 'tailwindcss';`, abra um bloco `@theme { }`.
- Para cada cor abaixo, crie `--color-<nome>: <hex>;`. Por exemplo, `navy-900` vira `--color-navy-900`, e `ink` vira `--color-ink`.
- Os quatro tons de `gold-50` são parecidos. Escolha um como `gold-50` e, se precisar dos outros, crie `gold-25` e `gold-75`, ou use só um.
- **Paleta em TypeScript:** os componentes recebem a cor da proposta como dado, por exemplo `color="#3D78D9"`, e não como classe.
  - Crie `src/lib/design/palette.ts` exportando um array `as const`.
  - No componente, a cor dinâmica vai em `style="--accent: {cor}"`, e as classes usam `border-[var(--accent)]`.
  - O Tailwind não gera classes montadas em tempo de execução, como `` `bg-${cor}` ``.
- **Modo escuro (se entrar):** nomeie tokens por **função** (`surface`, `ink`, `line`), não só por cor. Assim, no escuro, você redefine as variáveis e os componentes não mudam.

- [ ] **Marca / navy**
  - `navy-900` `#001A32`: header, botão primário, títulos
  - `navy-800` `#092E4C`: labels de formulário
  - `blue-800` `#224484`: bolha da minha mensagem, nome do autor, hover de link
  - `blue-500` `#3D78D9`: links, ações de texto ("Esqueci a senha", "Cadastre-se")
  - `blue-200` `#BCD9FC`: texto secundário sobre navy
  - `blue-50` `#E8F1FD`: badge "Priorizado"
- [ ] **Dourado**
  - `gold-500` `#CF9612`: FAB, barra de arrecadação, "Apoiar"
  - `gold-700` `#8E6207`: texto de alerta e entrave
  - `gold-900` `#231600`
  - `gold-300` `#F0D488`: borda do card de entrave
  - `gold-50` `#FFF8E8` (variações no protótipo: `#FFF4E3`, `#FEF6E8`, `#FDF8ED`): fundos de alerta e triagem
- [ ] **Verde (Sim / sucesso)**
  - `green-500` `#148A63`: voto Sim, badge de não lidas
  - `green-700` `#0B523D`: texto de sucesso
  - `green-200` `#C8E9DA`: borda do card concluído
  - `green-50` `#E8FBF2`: badge "Participando" e "Aprovado"
- [ ] **Vermelho (Não / perigo)**
  - `red-500` `#E13717`: voto Não
  - `red-600` `#F0473E`: cor de proposta estrutural
  - `red-700` `#B32E16`: borda do Não
  - `red-900` `#761709`: texto do Não, badge de prazo, "Abrir entrave"
  - `red-200` `#F6CCC4`: borda do card negado
  - `red-50` `#FFF4F1`: trilho da barra de votos
- [ ] **Neutros**
  - `ink` `#181818`: texto principal
  - `gray-600` `#515151`: texto secundário
  - `gray-500` `#8A8A8A`: meta, placeholder
  - `gray-400` `#ADADAD`: horário da mensagem, passo inativo
  - `line` `#DCE3EC`: bordas de input e botão secundário
  - `surface-2` `#EDF1F7`: trilho de segmented control, barras
  - `surface-1` `#F4F7FB`: input de busca
  - `surface` `#F6F6F6`: input de formulário, bolha recebida, divisórias
  - `page` `#EDEAE3`: fundo externo
- [ ] **Paleta de cor das propostas e avatares:** `#3D78D9`, `#148A63`, `#8E6207`, `#B32E16`, `#6B3FA0`, `#227C9D`, `#F0473E`, exportada em `src/lib/design/palette.ts`.
- [ ] **Overlay:** `rgba(0, 26, 50, 0.45)`, o navy com alpha. Com o token, isso é `bg-navy-900/45`, sem criar outra cor.

✅ **Pronto quando:** você digita `bg-navy` no VS Code e o IntelliSense sugere `bg-navy-900` com a amostra de cor.

### 1.2 Tipografia

📚 **Estude:** Tailwind → _font-family_, _font-size_ (inclusive como definir `--text-*` com `line-height` junto) e https://fontsource.org/fonts/nunito-sans/install

🛠️ **Como fazer — carregar a Nunito Sans (self-hosted, recomendado)**

1. Instale: `npm install @fontsource-variable/nunito-sans`.
2. No `src/routes/+layout.svelte`, dentro do `<script>`, importe `'@fontsource-variable/nunito-sans'` **antes** do `'../app.css'`.
3. No `@theme`, defina `--font-sans: 'Nunito Sans Variable', ui-sans-serif, system-ui, sans-serif;`. O nome tem que ser exatamente esse: é o que o pacote registra.
4. Por que self-hosted e não Google Fonts: funciona offline e dentro do Docker, não chama servidores de terceiros (o que conta na Política de Privacidade) e a versão variável traz todos os pesos num arquivo só.

🛠️ **Como fazer — escala tipográfica**

- Crie tokens `--text-<nome>: <tamanho>;` e, se quiser, `--text-<nome>--line-height: <valor>;`. Exemplo: `--text-title` gera a classe `text-title`.
- Use nomes por função (`title`, `heading`, `body`, `label`, `meta`, `micro`), não por tamanho.

- [ ] Carregar a **Nunito Sans** (pesos 400, 500, 600, 700, 800) e definir `--font-sans`.
- [ ] Mudar `lang="en"` para `lang="pt-BR"` em `src/app.html`. Isso corrige a hifenização, o leitor de tela e o corretor ortográfico.
- [ ] Escala tipográfica:
  - Título de tela: 29px / 800 (login) e 25px / 800 (passos)
  - Header: 21px / 800
  - Título de card: 14.5–15px / 800
  - Corpo: 14.5–15px
  - Label: 13px / 700
  - Meta: 11.5–12px
  - Micro (badges): 9.5–11px / 800
- [ ] Usar `line-height` 1.15 nos títulos e 1.35–1.4 no corpo.

✅ **Pronto quando:** no DevTools → aba _Computed_ → _Rendered Fonts_ aparece **Nunito Sans**, não uma fonte do sistema.

### 1.3 Raios, sombras e espaçamentoclass

🛠️ **Como fazer**

- **Raios:** `--radius-card: 20px;` gera `rounded-card`. Faça o mesmo para `input` (16px), `sub` (14px) e `item` (10px). Botões e pills usam `rounded-full`, que já existe.
- **Borda de 1.5px:** o Tailwind não tem essa largura. Use `border-[1.5px]` ou crie `@utility border-thin { border-width: 1.5px; }`.
- **Sombra:** `--shadow-fab: 0 8px 20px rgb(143 98 7 / 0.35);` gera `shadow-fab`.
- **Espaçamento:** a escala do Tailwind 4 é dinâmica, e cada unidade vale 4px (`p-5` = 20px, `h-13` = 52px). Você raramente vai precisar de valores arbitrários.

- [ ] Raios:
  - `rounded-full` (100px): botões, pills, busca
  - `16px`: inputs, botões de voto
  - `20px`: cards, topo do bottom sheet
  - `14px`: sub-cards
  - `10px`: itens de lista internos
- [ ] Borda padrão de `1.5px`.
- [ ] Sombra do FAB: `0 8px 20px rgba(143, 98, 7, 0.35)`.
- [ ] Padding de tela: 20–24px na horizontal (`px-5`/`px-6`); gap de formulário: 13–14px (`gap-3.5`).

### 1.4 Base

🛠️ **Como fazer:** dentro de `@layer base { }` no `app.css`, estilize `body`, `a` e os campos de formulário. Pode usar `@apply` com seus tokens, por exemplo `@apply bg-page text-ink font-sans;`.

- [ ] `body`: fundo, fonte e cor `ink`.
- [ ] Links: `blue-500`, com hover `blue-800` e sem sublinhado.
- [ ] `input`, `textarea`, `select` e `button` herdam a fonte (`font: inherit`).
- [ ] Anel de foco visível e consistente, que hoje falta no protótipo: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500`.
- [ ] **Logo:**
  - O arquivo oficial é `Logo.png`, nos anexos do Arenium. Também está embutido no HTML do Moon Remix.
  - Coloque em `src/lib/assets/` e importe como o `favicon.svg` já é importado no layout.
  - Troque o favicon.

✅ **Pronto quando:** a página inicial atual já aparece com a fonte Nunito e o fundo novo, sem você ter mexido nela.

---

## 2. Primitivos (`src/lib/components/ui/`)

📚 **Estude:**

- Tutorial → _Props_, _Spread props_, _Snippets_, _Events_, _Bindings_.
- Docs → `$props`, `$bindable`, `{@render}`, `class` (arrays/objetos).
- Elemento nativo `<dialog>` (MDN), para o BottomSheet.

🛠️ **Receita para todo primitivo**

1. Crie o arquivo `NomeDoComponente.svelte` (PascalCase).
2. Defina `interface Props` estendendo os atributos do elemento nativo (`HTMLButtonAttributes`, `HTMLInputAttributes`…).
3. Desestruture com valores padrão: `variant = 'primary'`, `class: className`, `children`, `...rest`.
4. Monte as variantes como um objeto `Record<Variant, string>` que mapeia nome para classes. O TypeScript avisa se faltar alguma.
5. Junte tudo no atributo `class={[base, variantes[variant], tamanhos[size], className]}` e espalhe `{...rest}` no elemento.
6. Coloque o componente na página `/design` (seção 7) com **todas** as variantes lado a lado.

- [ ] **Button**
  - [ ] `primary`: fundo `navy-900`, texto branco, peso 800
  - [ ] `secondary` (outline): fundo branco, borda `line` 1.5px, texto `ink`, peso 700
  - [ ] `success`: fundo `green-500`, como "Transformar em proposta"
  - [ ] `ghost` / `link`: só texto `blue-500`, peso 800
  - [ ] `danger-outline`: como "Abrir entrave", texto `red-900`
  - [ ] Tamanhos: `lg` 54px (CTA de auth), `md` 52px (formulários), `sm` 44–48px, `xs` (pill com padding 8×14px, como "Participar")
  - [ ] Largura total opcional (prop `block` → `w-full`)
  - [ ] Ícone opcional à esquerda, como snippet `icon` (por exemplo o logo do Google em "Continuar com Google")
  - [ ] Estados: hover, active, focus-visible, disabled, loading (prop `loading` desabilita o botão e mostra um spinner)
  - 💡 Se o botão precisar virar link (`<a>`), use uma prop `href` e `<svelte:element this={href ? 'a' : 'button'}>`.
- [ ] **IconButton** circular: 40–42px (enviar ➤, anexar +, reportar). **Exige `aria-label`**, porque não tem texto.
- [ ] **FAB**: 58px, `gold-500`, `shadow-fab`, posição `fixed` no canto inferior direito.
- [ ] **TextField** (label + input)
  - [ ] Label 13px / 700 / `navy-800`, ligada ao input por `for`/`id`. Gere o id com `$props.id()`.
  - [ ] Input de 48–50px, raio 16px, borda `line`
  - [ ] Fundo branco (auth) ou `surface` (formulários de perfil), via prop
  - [ ] Estados de erro (borda `red-700` e mensagem abaixo, ligada com `aria-describedby`), desabilitado e texto de ajuda
  - [ ] `value` com `$bindable()`, para quem usa poder fazer `bind:value`
- [ ] **TextArea**: mesmo estilo do TextField, com `rows` configurável.
- [ ] **SearchInput**: pill de 44px, fundo `surface-1`, `type="search"`.
- [ ] **Select**: para Gênero e UF. Comece com o `<select>` nativo estilizado.
- [ ] **SegmentedControl**: trilho `surface-2` com pill ativa, nas abas Minhas/Descobrir e Chat/Projetos/Reportes.
  - Props: lista de opções e `value` bindable.
  - Use `role="tablist"` no trilho e `role="tab"` com `aria-selected` em cada opção.
- [ ] **FilterChip**: pill com borda `line`, com variantes ativa e inativa (filtros de projetos, reportes, busca). Use `aria-pressed`.
- [ ] **Badge / StatusPill**: pill micro com fundo e cor por status (veja a seção 3.6).
- [ ] **CountBadge**: contador de não lidas, `green-500`, com no mínimo 20px.
- [ ] **Avatar**: círculo com iniciais e cor de fundo. Tamanhos 34, 40, 48, 52, 76 e 84px.
  - A cor vem como dado (veja a dica de `--accent` em 1.1).
  - Calcule as iniciais com `$derived` a partir do nome.
- [ ] **Divider "Ou use"**: linha `line` com texto no meio (flex com dois `<span class="flex-1 h-px">`).
- [ ] **ProgressBar**: altura 6–8px, raio 4px, com trilho e cor configuráveis.
  - Prop `value` de 0 a 100, aplicada com `style="width: {value}%"`.
  - Use `role="progressbar"` com `aria-valuenow`.
- [ ] **VoteBar**: barra dupla Sim (verde) / Não (vermelho) sobre o trilho `red-50`. As porcentagens vêm de `$derived`.
- [ ] **Toggle / Switch**: 44×26px. Use `<button role="switch" aria-checked>` ou um `<input type="checkbox">` estilizado.
- [ ] **Card**: raio 20px, borda 1.5px, padding 16px, com snippets opcionais `header` e `footer` (renderize com `{#if header}{@render header()}{/if}`).
- [ ] **AccentCard**: card com `border-left` de 5–8px colorido e fundo tingido. A cor vem por prop, via variável CSS.
- [ ] **BottomSheet / Modal**
  - 💡 Use o elemento nativo **`<dialog>`** com `showModal()`. Ele já traz Esc para fechar, foco preso dentro e o backdrop (estilize com `::backdrop`), sem biblioteca.
  - [ ] Overlay navy 45%
  - [ ] Folha branca com topo arredondado em 20px e alça de 40×4px
  - [ ] Botão de fechar ✕ (IconButton com `aria-label="Fechar"`)
  - [ ] Fecha com Esc e com clique no overlay
  - [ ] No desktop (`md:`) vira modal centralizado
  - [ ] Prop `open` bindable; use `$effect` para chamar `showModal()`/`close()` quando ela mudar. Esse é um dos poucos lugares em que `$effect` faz sentido.
- [ ] **TopBar**: fundo `navy-900`, com voltar ←, avatar, título e subtítulo `blue-200`. Snippets para as áreas esquerda e direita.
- [ ] **StepHeader**: voltar ← e indicador "1 de 2".
- [ ] **VerticalStepper**: bolinhas de 14px ligadas por linha, com estados feito, atual e futuro. Renderize com `{#each steps as step, i}`.
- [ ] **EmptyState**: texto centralizado `gray-500`, como "Nada encontrado por aqui."

✅ **Pronto quando:** a página `/design` mostra todos os primitivos e variantes, `npm run check` passa sem erros e você consegue navegar por todos os botões só com Tab, vendo o anel de foco.

---

## 3. Componentes de domínio (`src/lib/components/arenium/`)

📚 **Estude:** Tutorial → _Each blocks_ (com chave), _Derived state_, _Component events_ (passar funções como props, por exemplo `onvote`).

🛠️ **Como fazer**

- Componentes de domínio **montam primitivos**: eles importam `Button`, `Avatar`, `Card`… e quase não têm classes próprias.
- Defina os tipos dos dados em `src/lib/types.ts` (`Community`, `Message`, `Proposal`, `Report`), olhando o `prisma/schema.prisma` e o documento de contexto.
- Para ações, receba **funções como props**: `onvote: (voto: 'sim' | 'nao') => void`. O componente não sabe o que acontece depois; só avisa.
- Por enquanto use **dados falsos** (mock) em `src/lib/mocks/`. Os nomes do Moon Remix servem: Gomo Coop, Garoa Hacker Clube, "Trocar a caixa d'água"…

### 3.1 Comunidades

- [ ] **CommunityListItem**: avatar de 52px, nome, horário, última linha e CountBadge. Nome e última linha ficam em negrito quando há não lidas. Texto longo é cortado com `truncate`.
- [ ] **DiscoverCommunityCard**: card com avatar, nome, número de participantes, blurb e botão "Participar" ou badge "Participando".

### 3.2 Chat

- [ ] **MessageBubble (recebida)**: fundo `surface`, canto superior esquerdo de 4px (`rounded-tl-sm`), autor clicável em `blue-800` e horário em `gray-400`.
- [ ] **MessageBubble (minha)**: fundo `blue-800`, texto branco, canto superior direito de 4px e horário em `blue-200`, alinhada à direita (`self-end`).
  - 💡 Faça **um** componente com a prop `mine` em vez de dois.
- [ ] **TagIndicator**: bolinha e título da proposta acima da mensagem, quando ela é comentário de uma proposta.
- [ ] **SystemMessage**: pill central `surface` com texto `gray-500`.
- [ ] **ChatComposer**:
  - Botão + de anexo, botão de reporte, input "Mensagem" e botão de enviar navy.
  - Use `<form onsubmit>` para Enter enviar.
  - Chame `preventDefault()` no evento e limpe o input depois de enviar.
- [ ] **AttachMenu**: popover simples, que abre e fecha com `$state`.
- [ ] **CommentingBar**: faixa "comentando em …" acima do composer, com botão de cancelar.

### 3.3 Propostas

- [ ] **ProposalMessageCard**: AccentCard com a cor da proposta, título, autor e data, VoteBar, arrecadação (barra dourada), VoteButtons e "💬 Comentar".
- [ ] **VoteButtons**:
  - Sim e Não, cada um nos estados votado (preenchido, com ✓/✕) e não votado (outline).
  - Texto `Sim` / `Não`, **sem** `uppercase`.
  - Props: `voto: 'sim' | 'nao' | null` e `onvote`. Use `aria-pressed` em cada botão.
  - Cores:

    | Botão | Votado            | Não votado                           |
    | ----- | ----------------- | ------------------------------------ |
    | Sim   | fundo `green-500` | borda `green-500`, texto `green-700` |
    | Não   | fundo `red-500`   | borda `red-700`, texto `red-900`     |

  - Altura 44px, raio 16px.
- [ ] **ProposalCard — Votação**: badge de prazo (⏰, fundo `red-900`), VoteBar e contador de comentários.
- [ ] **ProposalCard — Execução**: link da ferramenta (board), progresso da execução, área tracejada "Vincular ferramenta" (`border-dashed`), entraves e botão "Abrir entrave".
- [ ] **EntraveCard**: fundo `gold-50`, borda `gold-300`, título ⚠️ em `gold-700` e ação "Apoiar".
- [ ] **ProposalCard — Concluído**: borda `green-200`, total gasto, meta e histórico de recursos.
- [ ] **ProposalCard — Negado**: borda `red-200`, VoteBar e lista "Por que foi negada".
  - 💡 Os quatro ProposalCards podem ser **um** componente com a prop `status`, usando `{#if}` para as partes que mudam. Avalie o que fica mais legível.
- [ ] **ColorPicker**: escolha da cor da proposta com a paleta de `palette.ts`. Use `{#each}`, `aria-label` com o nome da cor e `aria-checked`.

### 3.4 Reportes

- [ ] **ReportCard (lista)**: borda esquerda na cor da categoria, contador de apoios, categoria, StatusPill, descrição e "#rank na fila".
- [ ] **ReportMessageCard (no chat)**: borda tracejada na cor da categoria, área de foto, localização 📌 e botão "Apoiar" (alterna entre outline e preenchido em `navy-900`).
- [ ] **ReportDetail**: VerticalStepper de status e ações (avançar, descartar, transformar em proposta).

### 3.5 Perfil

- [ ] **GroupProfileHeader**: avatar de 76px, nome, "Sobre" expansível (`$state` + "Ver mais"/"Ver menos") e saldo em destaque (24px / 800).
- [ ] **NavRowButton**: botão pill de 52px com label e seta →, para Reportes (fundo `surface-1`) e Diretrizes (fundo `gold-50`).
- [ ] **UserProfile**: avatar de 84px, cidade, comunidades, campos visíveis conforme a privacidade e resumo de votos.
- [ ] **GuidelineItem**: regra da comunidade com ação "Propor mudança".

### 3.6 Mapas de status (`src/lib/design/status.ts`)

🛠️ **Como fazer:** exporte objetos que ligam o status às **classes** do Tailwind, por exemplo `triagem: { label: 'Triagem', classes: 'bg-gold-50 text-gold-700' }`. Escreva as classes **inteiras** no arquivo. O Tailwind só gera classes que encontra escritas por extenso no código, então montar `'bg-' + cor` não funciona.

- [ ] Status de reporte:
  - Reportado: fundo `surface-2`, texto `gray-600`
  - Triagem: fundo `gold-50`, texto `gold-700`
  - Priorizado: fundo `blue-50`, texto `blue-800`
  - Aprovado / Virou proposta: fundo `green-50`, texto `green-700`
  - Descartado: fundo `surface`, texto `gray-500`
- [ ] Categorias de reporte:
  - 🧱 Infraestrutura: `red-700`
  - 🧹 Limpeza: `green-500`
  - 🛡️ Segurança: `blue-800`
  - 🌳 Lazer: `gold-700`
- [ ] Arrecadação: completa com fundo `green-50` e texto `green-700`; em andamento com fundo `gold-50` e texto `gold-700`.

✅ **Pronto quando:** cada componente aparece na `/design` com dados mock em todos os estados (votado e não votado, com e sem não lidas, cada status).

---

## 4. Telas (`src/routes/`)

📚 **Estude:**

- SvelteKit → _Routing_, _Layouts_, _Advanced routing_ (grupos `(app)`), _Errors_.
- Navegação com `<a href>` e com `goto` (de `$app/navigation`).
- Formulários com _Form actions_, quando ligar ao backend.

🛠️ **Como fazer**

- Cada tela é um `+page.svelte` que **só monta componentes** das seções 2 e 3. Se uma página tiver muitas classes, algo deveria ter virado componente.
- Telas de auth (login, cadastro, completar perfil) ficam fora do grupo `(app)`. As telas internas ficam dentro, com o layout de navegação.
- Fluxos de vários passos (perfil 1/2 e 2/2, criar comunidade) podem ser rotas separadas (`/perfil/1`, `/perfil/2`) ou uma página com `$state` de passo. Rotas separadas deixam o "voltar" do navegador funcionar.
- Sugestão de rotas:

  | Rota                           | Tela                    |
  | ------------------------------ | ----------------------- |
  | `/login`                       | Login                   |
  | `/cadastro`                    | Cadastro                |
  | `/perfil/completar`            | Completar perfil        |
  | `/(app)/comunidades`           | Lista de comunidades    |
  | `/(app)/comunidades/nova`      | Criar comunidade        |
  | `/(app)/c/[id]`                | Chat da comunidade      |
  | `/(app)/c/[id]/projetos`       | Projetos                |
  | `/(app)/c/[id]/reportes`       | Reportes                |
  | `/(app)/c/[id]/reportes/[rid]` | Detalhe do reporte      |
  | `/(app)/c/[id]/sobre`          | Perfil do grupo         |
  | `/(app)/c/[id]/diretrizes`     | Diretrizes              |
  | `/(app)/u/[id]`                | Perfil de usuário       |
  | `/privacidade`                 | Política de Privacidade |
  | `/termos`                      | Termos de Serviço       |

- `[id]` na pasta é um **parâmetro**. Leia com `page.params.id`, importando `page` de `$app/state`.

- [ ] **Login**: logo de 150px, "Vamos lá", email e senha, "Esqueci a senha", CTA "Próximo passo →", divisor "Ou use", "Continuar com Google" e link "Cadastre-se".
- [ ] **Cadastro**: igual ao login, com o campo "Confirmar senha" e o link "Entrar".
- [ ] **Completar perfil 1/2**: Nome e CPF, com os botões Voltar e Próximo.
- [ ] **Completar perfil 2/2**: nascimento, gênero, CEP, número, logradouro, complemento, cidade e UF, com o botão Finalizar.
- [ ] **Comunidades**: TopBar, busca, SegmentedControl Minhas/Descobrir, listas, FAB e sheet "Crie sua comunidade".
- [ ] **Criar comunidade** (multi-step):
  - [ ] Nome
  - [ ] Descrição
  - [ ] Regras: entrada, saída, votação, permanência e taxas
  - [ ] Convites por e-mail
- [ ] **Chat da comunidade**: TopBar, busca com escopos, SegmentedControl Chat/Projetos/Reportes, timeline e composer.
- [ ] **Projetos**: chips Votação/Execução/Concluído/Negado, cada um com sua lista de cards.
- [ ] **Reportes**: filtros de status e de categoria, lista e botão "📍 Novo reporte".
- [ ] **Detalhe do reporte**
- [ ] **Perfil do grupo**
- [ ] **Diretrizes**: lista de regras e sheet "Proposta estrutural".
- [ ] **Perfil de usuário**
- [ ] **Sheets** (todas usam o BottomSheet): nova proposta (compose), anexo, vincular board, entrave, novo reporte e proposta estrutural.
- [ ] **Política de Privacidade** e **Termos de Serviço** (exigidos pelo subject), com o mesmo estilo tipográfico e acessíveis sem login.
- [ ] **404 / erro** (`src/routes/+error.svelte`, que mostra `page.status` e `page.error.message`).
- [ ] Substituir a `src/routes/+page.svelte` atual (`slate`/`blue` genéricos) por um redirecionamento para `/login` ou `/comunidades`.

✅ **Pronto quando:** dá para clicar pelo fluxo inteiro (login → comunidades → chat → proposta → votar) só com mocks.

---

## 5. Layout e responsividade

📚 **Estude:** Tailwind → _Responsive design_ (mobile-first: as classes sem prefixo valem para o celular; `md:` e `lg:` sobrescrevem nas telas maiores). Também _Flexbox_ e _Grid_.

- [ ] `src/routes/+layout.svelte` raiz com o fundo e o container.
- [ ] `src/routes/(app)/+layout.svelte` com a navegação das telas internas.
- [ ] Breakpoints: mobile (o protótipo) → tablet (`md:`) → desktop (`lg:`), com duas colunas ou largura máxima, conforme a decisão da seção 0.
- [ ] Rolagem interna nas listas e na timeline, com header e composer fixos.
  - O container é `h-dvh flex flex-col`, e a lista é `flex-1 overflow-y-auto`.
  - Use `dvh`, não `vh`: no celular, `vh` ignora a barra do navegador.
- [ ] Bottom sheets viram modais centralizados no desktop.

✅ **Pronto quando:** no DevTools → modo dispositivo (Ctrl+Shift+M), as telas funcionam em 375px, 768px e 1440px, sem rolagem horizontal.

---

## 6. Acessibilidade e polimento

📚 **Estude:** os avisos `a11y` do Svelte (aparecem no VS Code e no `npm run check`; leia cada um e entenda o porquê) e as transições do Svelte (tutorial → _Transitions_, `transition:fly`, `transition:fade`).

- [ ] Contraste AA (4,5:1) em todas as combinações de texto e fundo. Cheque com o DevTools (o seletor de cor mostra o contraste), principalmente `gray-500` sobre branco e `blue-200` sobre navy.
- [ ] `aria-pressed` nos botões de voto e filtros; `role="tablist"` no SegmentedControl.
- [ ] Elementos clicáveis são `<button>` ou `<a>`, não `<div>`/`<span>` como no protótipo.
- [ ] Toque duplo para comentar → oferecer também um botão explícito ("💬 Comentar").
- [ ] Emojis decorativos com `aria-hidden="true"`, ou trocados por ícones SVG.
- [ ] Transições suaves (abrir sheet, trocar aba), respeitando `prefers-reduced-motion` (no Tailwind, a variante `motion-safe:`).
- [ ] Estados de loading (skeleton com `animate-pulse`) para listas e chat.

✅ **Pronto quando:** `npm run check` não mostra avisos de a11y e dá para usar o app inteiro só com o teclado.

---

## 7. Vitrine e validação

📚 **Estude:** Testing Library → _Svelte_. O `src/routes/page.test.ts` já é um exemplo pronto de teste de componente neste projeto.

- [ ] **Rota `/design`** (`src/routes/design/+page.svelte`): todos os primitivos e variantes, a paleta (um quadrado por token) e a escala tipográfica. É o seu "Storybook caseiro": construa junto com a seção 2, não no final.
- [ ] Comparar cada tela com o Moon Remix lado a lado (as duas janelas do navegador na mesma largura).
- [ ] Testes de componente (`@testing-library/svelte` + Vitest) para Button, VoteButtons e BottomSheet. Cada teste:
  1. Renderiza o componente.
  2. Clica em algo.
  3. Confere o resultado: a função `onvote` foi chamada com `'sim'`? A sheet fechou com Esc?
- [ ] Antes de cada commit: `npm run format && npm run lint && npm run check && npm test`.

---

## Ordem sugerida de estudo e trabalho

1. Tutorial do Svelte, partes _Basic Svelte_ e _Snippets_ (umas 2–3 horas).
2. Seção 1 inteira (fundação), conferindo na página inicial atual.
3. Criar a rota `/design` vazia (com `<main>`, sem `<svelte:body>`).
4. `Button` → `TextField` → `Card` → `Avatar` → `Badge`, mostrando cada um na `/design`.
5. Tela de **Login** completa: é a primeira tela de verdade e usa só esses cinco.
6. Resto dos primitivos, depois os de domínio, sempre pela `/design`.
7. Telas na ordem do fluxo do usuário (seção 4).
8. Responsividade, acessibilidade e testes.
