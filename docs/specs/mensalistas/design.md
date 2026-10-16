# Design Spec: Gestão de Mensalistas

Insumo para o Tech Spec. Baseado em `prd.md` (RF-01 a RF-09). Segue o design system (`src/styles/theme.ts` + `src/components/ui`); nenhum valor visual solto.

**Direção (impeccable):** é uma tela administrativa de operação (*Operate*) dentro de um mundo visual já estabelecido (Gestão de Preços, Caixa). Por isso **herda** a composição da `PrecosList` (cabeçalho com ação primária, tabela, paginação, estado vazio) e dos modais de formulário existentes. Não há conceito visual novo nem torneio de direções: a ousadia aqui está na clareza (hierarquia, estados e erros bem resolvidos), não em uma identidade nova. O que muda de verdade é a **navegação por abas** (primeira vez no sistema) e os **formulários em modal**.

## 1. Telas e estados

Rota única `/mensalistas`, com a aba ativa refletida na URL (`?aba=tipos`) para permitir link direto e botão voltar.

```
┌ Mensalistas ───────────────────────────────────┐
│ [Mensalistas]  Tipos de mensalidade            │  ← abas
│ ────────────────────────────────────────────── │
│ [🔍 Buscar por CPF/CNPJ        ]  [Novo mensalista]
│                                                │
│ Nome        Documento     Tipo        Valor    Venc.  Situação  ✎
│ Maria S.    123.456.…     Diurno      R$ 280   dia 5  ● Ativo   ✎
│ ...                                            │
│                  ‹ 1 2 3 ›                     │
└────────────────────────────────────────────────┘
```

### Aba "Mensalistas"

| Estado | Comportamento visual |
|--------|----------------------|
| Carregando | `Skeleton` em linhas (8), dentro da área da tabela, `role="status"` com rótulo "Carregando mensalistas". |
| Lista | Tabela com colunas: Nome (com e-mail/celular em linha secundária `textMuted`), Documento (mascarado), Tipo (com categoria em linha secundária), Mensalidade (valor, alinhado à direita, numérico), Vencimento ("dia 5"), Situação (`StatusBadge`), Ações (editar). Ativos primeiro (ordem do back). |
| Atualizando (troca de página/busca) | Tabela mantém os dados anteriores com opacidade reduzida e `aria-busy`, como na `PrecosList`. |
| Vazio (sem nenhum mensalista) | `EmptyState` tracejado: "Nenhum mensalista cadastrado." + botão "Novo mensalista". Se não houver tipos ativos, o texto orienta: "Crie um tipo de mensalidade antes de cadastrar mensalistas." e o botão vira "Criar tipo" (leva à outra aba). |
| Vazio da busca | Mensagem "Nenhum mensalista com esse documento." + botão secundário "Limpar busca". Campo de busca permanece visível. |
| Erro de carregamento | `ErrorBanner role="alert"` + botão secundário "Tentar novamente" (padrão `ErrorArea`). |
| Sem permissão (403) | Mesmo bloco de erro com mensagem "Você não tem permissão para acessar esta página." sem botão de tentar de novo. |

**Busca (RF-03):** `Input` com ícone de lupa à esquerda e botão de limpar (×) quando preenchido. Aplica a máscara de CPF ou CNPJ conforme a quantidade de dígitos enquanto digita; filtra com atraso curto (debounce) e reinicia na página 1. Rótulo acessível "Buscar por CPF ou CNPJ".

### Aba "Tipos de mensalidade"

| Estado | Comportamento visual |
|--------|----------------------|
| Carregando / erro / sem permissão | Iguais aos da outra aba. |
| Lista | Tabela: Nome, Categoria ("Todas" quando for todas), Mensalidade (valor), Horário ("07:00 – 19:00", "—" sem horário; a saída menor que a entrada aparece como está, ex.: "19:00 – 07:00"), Situação (`StatusBadge`), Ações (editar). Sem paginação (o back devolve a lista completa). |
| Vazio | `EmptyState`: "Nenhum tipo de mensalidade cadastrado." + "Novo tipo". |

### Modal de mensalista (criar e editar)

Usa `Modal size="lg"` com formulário em duas colunas a partir de `breakpoints.sm` (uma coluna no celular).

| Campo | Componente | Observações |
|-------|------------|-------------|
| Tipo de mensalidade | `SelectField` | Mostra "Nome · Categoria · R$ valor". Só tipos ativos; na edição, mantém também o tipo atual mesmo se inativo (marcado "(inativo)"). |
| Tipo de pessoa | `OptionGroup` (Física / Jurídica) | Trocar limpa o documento e a máscara muda (CPF ↔ CNPJ). |
| Documento | `TextField` com `format` | Rótulo muda para "CPF" ou "CNPJ". |
| Nome | `TextField` | Rótulo "Nome" / "Razão social ou nome" conforme a pessoa. |
| E-mail | `TextField` | |
| Celular | `TextField` com máscara `(DD) 9XXXX-XXXX` | |
| Dia de vencimento | `TextField` numérico (1 a 31) | Dica: "Dia do mês em que a mensalidade vence." |
| Ativo | `SwitchField` | Só na edição ("Mensalista ativo"); no cadastro nasce ativo e o campo não aparece. |

Estados do modal: padrão; **enviando** (campos e botão desabilitados, rótulo "Salvando…"); **erro de campo** (mensagem sob o campo, `colors.danger`); **erro do servidor** (`ErrorBanner role="alert"` no topo do corpo, ex.: "tipo inativo ou inexistente"); **sucesso** (modal fecha e `Toast` "Mensalista cadastrado." / "Mensalista atualizado."). Fechar com dados preenchidos pede confirmação (`ConfirmDialog` "Descartar alterações?"), como na entrada de veículo.

### Modal de tipo de mensalidade (criar e editar)

`Modal size="sm"`, uma coluna.

| Campo | Componente | Observações |
|-------|------------|-------------|
| Nome | `TextField` (até 100) | Contador discreto a partir de 80 caracteres. |
| Categoria | `SelectField` | Categorias de veículo + "Todas as categorias". |
| Valor da mensalidade | `TextField` monetário (R$) | Maior que zero. |
| Horário de entrada / saída | dois `TextField` de hora, lado a lado | Opcionais, mas juntos. Dica sob os campos: "Saída menor que a entrada vale para turnos que viram a noite (ex.: 19:00 às 07:00)." |
| Ativo | `SwitchField` | Só na edição. Ao desativar, dica: "Deixa de ser oferecido em novos cadastros. Mensalistas atuais mantêm o tipo." |

Mesmos estados de enviar/erro/sucesso/descartar do modal de mensalista. Erro de duplicidade (nome + categoria ativos): mensagem no campo Nome.

## 2. Componentes

**Reaproveitados:** `Table`, `Pagination`, `Modal`, `ConfirmDialog`, `Button`, `Input`, `Select`, `Switch`, `OptionGroup`, `StatusBadge`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`, campos de formulário (`TextField`, `SelectField`, `SwitchField` via `useAppForm`), `IconLink` e estilos de lista da `PrecosList` (`Page`, `Header`, `EmptyState`, `ErrorArea`, `TableArea`).

**Novos no design system (`src/components/ui`):**
- `Tabs` (`Tabs.tsx`, `Tabs.styles.ts`, `index.ts`): lista de abas com `role="tablist"`, `role="tab"` e painel `role="tabpanel"`; navegação por setas, Home/End; aba ativa com `aria-selected`; faz parte do design system porque outras telas vão precisar. API proposta: `tabs: { id; label }[]`, `value`, `onChange`, painel via `children`.

**Novos da feature (em `src/components/mensalistas`):** `MensalistasPage`, `MensalistasList`, `MensalistaModal`, `TiposList`, `TipoModal` (nomes finais no Tech Spec). Reutilizar, em vez de duplicar, os estilos de lista da `PrecosList` (extrair para um módulo compartilhado se a duplicação passar de três blocos).

**Menu:** novo item "Mensalistas" em `src/lib/nav.ts`, logo após "Gestão de Usuários", com um ícone novo `members` (pessoas/cartão) no conjunto de ícones do menu.

## 3. Tokens usados

Nenhum token novo.
- Cores: `colors.text`, `textMuted` (linhas secundárias), `border`, `surface`, `primary` (aba ativa, foco), `danger` (erros), `success`/`neutral` via `StatusBadge` (Ativo / Inativo).
- Espaçamento: `space[2]`–`space[4]` entre blocos (mesma cadência da `PrecosList`), `space[6]` no estado vazio.
- Tipografia: `fontSizes.sm` (células e linhas secundárias), `md` (abas), `xl`/`typography.displaySize` no título via `Text variant="heading"`.
- Raios e bordas: `radii.md` na área da tabela e no estado vazio; aba ativa com sublinhado de `2px` em `colors.primary`.
- Foco: anel `outline: 3px solid colors.primary; outline-offset: 2px` (padrão dos demais componentes).

## 4. Responsividade e acessibilidade

- **Desktop (≥ `breakpoints.md`):** tabela completa; busca e "Novo mensalista" na mesma linha (busca à esquerda, ação à direita).
- **Celular:** abas com rolagem horizontal se não couberem; busca e ação empilhadas (ação em largura total); a tabela vira cartões com `data-label` (padrão atual do componente `Table`), mostrando Nome, Tipo, Valor e Situação em destaque, e o restante em linhas secundárias; editar fica como botão de ícone com área de toque de 44px.
- **Modais:** `size="lg"` ocupa a largura útil no celular, formulário em uma coluna, rodapé com botões empilhados (primário no topo) como no `Modal` atual.
- **Teclado/leitor de tela:** abas por setas; foco vai ao título do modal ao abrir e volta ao botão de origem ao fechar (já fornecido pelo `Modal`); erros ligados aos campos por `aria-describedby`; situação nunca depende só de cor (texto "Ativo"/"Inativo" no badge); ao trocar de página, foco na área da tabela (padrão da `PrecosList`).
- **Privacidade:** documento, e-mail e celular aparecem apenas na tela autenticada e não vão para a URL, exceto o termo de busca de documento, que fica só em estado local (não na query string).
- **Pontos a validar na implementação:** a máscara de CNPJ atual (`formatCNPJ`) aceita só dígitos, mas o back aceita CNPJ alfanumérico; resolver no Tech Spec (máscara e validação específicas para esta tela) sem alterar o comportamento da tela de adesão.
