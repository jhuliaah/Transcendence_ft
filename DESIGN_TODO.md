# Design — To-do

Checklist para implementar o design do Arenium Lite em SvelteKit 5 + Tailwind 4.

**Referência:** `Arenium Moon Remix (standalone)(2).html`, um protótipo mobile de 412×892 com todas as telas do fluxo. Os valores abaixo (cores, tamanhos, raios) foram extraídos dele.

**Regras gerais**

- Nenhum hex solto em componente: sempre token do `@theme`.
- Primitivos em `src/lib/components/ui/`, componentes de domínio em `src/lib/components/arenium/`.
- Componentes aceitam `class` extra e repassam `...rest` para o elemento nativo.
- O protótipo é mobile: cada tela precisa de uma versão responsiva para desktop.

---

## 0. Decisões pendentes

- [ ] **Fonte:** o Moon Remix usa **DM Sans** (400–800), mas o documento de contexto cita **Nunito Sans**. Escolher uma.
- [ ] **Botões de voto:** o Moon Remix usa `SIM` / `NÃO` em caixa alta, mas o documento de contexto pede `Sim` / `Não`. Escolher um.
- [ ] **Layout desktop:** decidir entre duas colunas estilo WhatsApp Web (lista de comunidades + chat) ou coluna central com largura máxima.
- [ ] **Fundo da página:** o Moon Remix usa `#EDEAE3` atrás do "celular" e `#FFFFFF` nas telas. Definir se o desktop usa um fundo creme/bege em volta do conteúdo branco.
- [ ] **Modo escuro:** entra no escopo ou não.

---

## 1. Fundação (`src/app.css` + `src/app.html`)

### 1.1 Tokens de cor (`@theme`)

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
  - `gold-50` `#FFF8E8`, `#FFF4E3`, `#FEF6E8`, `#FDF8ED`: fundos de alerta e triagem
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
- [ ] **Paleta de cor das propostas e avatares:** `#3D78D9`, `#148A63`, `#8E6207`, `#B32E16`, `#6B3FA0`, `#227C9D`, `#F0473E`. Exportar também como array em TS (`#lib/design/palette.ts`).
- [ ] **Overlay:** `rgba(0, 26, 50, 0.45)`, o navy com alpha.

### 1.2 Tipografia

- [ ] Carregar a fonte escolhida (pesos 400, 500, 600, 700, 800) e definir `--font-sans`.
- [ ] Mudar `lang="en"` para `lang="pt-BR"` em `src/app.html`.
- [ ] Escala tipográfica:
  - Título de tela: 29px / 800 (login) e 25px / 800 (passos)
  - Header: 21px / 800
  - Título de card: 14.5–15px / 800
  - Corpo: 14.5–15px
  - Label: 13px / 700
  - Meta: 11.5–12px
  - Micro (badges): 9.5–11px / 800
- [ ] Usar `line-height` 1.15 nos títulos e 1.35–1.4 no corpo.

### 1.3 Raios, sombras e espaçamento

- [ ] Raios:
  - `rounded-full` (100px): botões, pills, busca
  - `16px`: inputs, botões de voto
  - `20px`: cards, topo do bottom sheet
  - `14px`: sub-cards
  - `10px`: itens de lista internos
- [ ] Borda padrão: `1.5px`. Criar a utility `border-1.5` ou o token `--default-border-width`.
- [ ] Sombra do FAB: `0 8px 20px rgba(143, 98, 7, 0.35)`.
- [ ] Padding de tela: 20–24px horizontal; gap de formulário: 13–14px.

### 1.4 Base

- [ ] `body`: fundo, fonte e cor `ink`.
- [ ] Links: `blue-500`, com hover `blue-800` e sem sublinhado.
- [ ] `input`, `textarea`, `select` e `button` herdam a fonte.
- [ ] Anel de foco visível e consistente, que hoje falta no protótipo. Usar `blue-500` ou `gold-500`.
- [ ] Logo: extrair `Logo.png` do HTML ou dos anexos para `src/lib/assets/` e trocar o favicon.

---

## 2. Primitivos (`src/lib/components/ui/`)

- [ ] **Button**
  - [ ] `primary`: fundo `navy-900`, texto branco, 800
  - [ ] `secondary` (outline): fundo branco, borda `line` 1.5px, texto `ink`, 700
  - [ ] `success`: fundo `green-500`, como "Transformar em proposta"
  - [ ] `ghost` / `link`: só texto `blue-500`, 800
  - [ ] `danger-outline`: como "Abrir entrave", texto `red-900`
  - [ ] Tamanhos: `lg` 54px (CTA de auth), `md` 52px (formulários), `sm` 44–48px, `xs` (pill 8×14px, como "Participar")
  - [ ] Largura total opcional (`block`)
  - [ ] Ícone opcional à esquerda (por exemplo o logo do Google em "Continuar com Google")
  - [ ] Estados: hover, active, focus-visible, disabled, loading
- [ ] **IconButton** circular: 40–42px (enviar ➤, anexar +, reportar).
- [ ] **FAB**: 58px, `gold-500`, com sombra dourada e posição fixa no canto inferior direito.
- [ ] **TextField** (label + input)
  - [ ] Label 13px / 700 / `navy-800`
  - [ ] Input de 48–50px, raio 16px, borda `line`
  - [ ] Fundo branco (auth) ou `surface` (formulários de perfil)
  - [ ] Estados de erro, desabilitado e texto de ajuda
- [ ] **TextArea**: mesmo estilo do TextField, com `rows` configurável.
- [ ] **SearchInput**: pill de 44px, fundo `surface-1`.
- [ ] **Select**: para Gênero e UF.
- [ ] **SegmentedControl**: trilho `surface-2` com pill ativa, nas abas Minhas/Descobrir e Chat/Projetos/Reportes.
- [ ] **FilterChip**: pill com borda `line`, com variantes ativa e inativa (filtros de projetos, reportes, busca).
- [ ] **Badge / StatusPill**: pill micro com `bg` e `color` por status (veja a seção 3.6).
- [ ] **CountBadge**: contador de não lidas, `green-500`, com no mínimo 20px.
- [ ] **Avatar**: círculo com iniciais e cor de fundo. Tamanhos 34, 40, 48, 52, 76 e 84px.
- [ ] **Divider "Ou use"**: linha `line` com texto no meio.
- [ ] **ProgressBar**: altura 6–8px, raio 4px, com trilho e cor configuráveis.
- [ ] **VoteBar**: barra dupla Sim (verde) / Não (vermelho) sobre o trilho `red-50`.
- [ ] **Toggle / Switch**: 44×26px.
- [ ] **Card**: raio 20px, borda 1.5px, padding 16px, com snippets `header` e `footer`.
- [ ] **AccentCard**: card com `border-left` de 5–8px colorido e fundo tingido (`bgTint`).
- [ ] **BottomSheet / Modal**
  - [ ] Overlay navy 45%
  - [ ] Folha branca com topo arredondado em 20px e alça de 40×4px
  - [ ] Botão de fechar ✕
  - [ ] Fecha com Esc e com clique no overlay, com foco preso (focus trap) enquanto aberta
  - [ ] No desktop vira modal centralizado
- [ ] **TopBar**: fundo `navy-900`, com voltar ←, avatar, título e subtítulo `blue-200`.
- [ ] **StepHeader**: voltar ← e indicador "1 de 2".
- [ ] **VerticalStepper**: bolinhas de 14px ligadas por linha, com estados feito, atual e futuro.
- [ ] **EmptyState**: texto centralizado `gray-500`, como "Nada encontrado por aqui."

---

## 3. Componentes de domínio (`src/lib/components/arenium/`)

### 3.1 Comunidades

- [ ] **CommunityListItem**: avatar de 52px, nome, horário, última linha e CountBadge (negrito quando há não lidas).
- [ ] **DiscoverCommunityCard**: card com avatar, nome, número de participantes, blurb e botão "Participar" ou badge "Participando".

### 3.2 Chat

- [ ] **MessageBubble (recebida)**: fundo `surface`, canto superior esquerdo de 4px, autor clicável em `blue-800` e horário em `gray-400`.
- [ ] **MessageBubble (minha)**: fundo `blue-800`, texto branco, canto superior direito de 4px e horário em `blue-200`.
- [ ] **TagIndicator**: bolinha e título da proposta acima da mensagem, quando ela é comentário de uma proposta.
- [ ] **SystemMessage**: pill central `surface` com texto `gray-500`.
- [ ] **ChatComposer**: botão + de anexo, botão de reporte, input "Mensagem" e botão de enviar navy.
- [ ] **AttachMenu**: popover simples.
- [ ] **CommentingBar**: faixa "comentando em …" acima do composer.

### 3.3 Propostas

- [ ] **ProposalMessageCard**: AccentCard com a cor da proposta, título, autor e data, VoteBar, arrecadação (barra dourada), VoteButtons e "💬 Comentar".
- [ ] **VoteButtons**: Sim e Não, cada um nos estados votado (preenchido com ✓/✕) e não votado (outline).
- [ ] **ProposalCard — Votação**: badge de prazo (⏰, `red-900`), VoteBar e contador de comentários.
- [ ] **ProposalCard — Execução**: link da ferramenta (board), progresso da execução, área tracejada "Vincular ferramenta", entraves e botão "Abrir entrave".
- [ ] **EntraveCard**: fundo `gold-50`, borda `gold-300`, título ⚠️ `gold-700` e ação "Apoiar".
- [ ] **ProposalCard — Concluído**: borda `green-200`, total gasto, meta e histórico de recursos.
- [ ] **ProposalCard — Negado**: borda `red-200`, VoteBar e lista "Por que foi negada".
- [ ] **ColorPicker**: escolha da cor da proposta com a paleta da seção 1.1.

### 3.4 Reportes

- [ ] **ReportCard (lista)**: borda esquerda na cor da categoria, contador de apoios, categoria, StatusPill, descrição e "#rank na fila".
- [ ] **ReportMessageCard (no chat)**: borda tracejada na cor da categoria, área de foto, localização 📌 e botão "Apoiar" (alterna entre outline e preenchido).
- [ ] **ReportDetail**: VerticalStepper de status e ações (avançar, descartar, transformar em proposta).

### 3.5 Perfil

- [ ] **GroupProfileHeader**: avatar de 76px, nome, "Sobre" expansível e saldo em destaque (24px / 800).
- [ ] **NavRowButton**: botão pill de 52px com label e seta, para Reportes e Diretrizes.
- [ ] **UserProfile**: avatar de 84px, cidade, comunidades, campos visíveis conforme privacidade e resumo de votos.
- [ ] **GuidelineItem**: regra da comunidade com ação "Propor mudança".

### 3.6 Mapas de status (`#lib/design/status.ts`)

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

---

## 4. Telas (`src/routes/`)

- [ ] **Login**: logo de 150px, "Vamos lá", email e senha, "Esqueci a senha", CTA, divisor "Ou use", Google e link "Cadastre-se".
- [ ] **Cadastro**: igual ao login, com o campo "Confirmar senha".
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
- [ ] **Sheets**: nova proposta (compose), anexo, vincular board, entrave, novo reporte e proposta estrutural.
- [ ] **Política de Privacidade** e **Termos de Serviço** (exigidos pelo subject), com o mesmo estilo tipográfico.
- [ ] **404 / erro** (`+error.svelte`)

---

## 5. Layout e responsividade

- [ ] `+layout.svelte` raiz com o fundo e o container.
- [ ] Layout autenticado (grupo `(app)`) com navegação.
- [ ] Breakpoints: mobile (protótipo) → tablet → desktop (duas colunas ou largura máxima, conforme a seção 0).
- [ ] Rolagem interna nas listas e na timeline, com header e composer fixos.
- [ ] Bottom sheets viram modais no desktop.

---

## 6. Acessibilidade e polimento

- [ ] Contraste AA em todas as combinações de texto e fundo; checar principalmente `gray-500` sobre branco e `blue-200` sobre navy.
- [ ] `aria-pressed` nos botões de voto e filtros; `role="tablist"` no SegmentedControl.
- [ ] Elementos clicáveis são `<button>` ou `<a>`, não `<div>`/`<span>` como no protótipo.
- [ ] Toque duplo para comentar → oferecer também um botão explícito.
- [ ] Emojis decorativos com `aria-hidden`, ou trocados por ícones SVG.
- [ ] Transições suaves (abrir sheet, trocar aba), respeitando `prefers-reduced-motion`.
- [ ] Estados de loading (skeleton) para listas e chat.

---

## 7. Vitrine e validação

- [ ] Rota `/design` com todos os primitivos e variantes, a paleta e a tipografia.
- [ ] Comparar cada tela com o Moon Remix lado a lado.
- [ ] Testes de componente (`@testing-library/svelte`) para Button, VoteButtons e BottomSheet.
- [ ] Substituir a `+page.svelte` atual (`slate`/`blue` genéricos) pelos novos componentes.
