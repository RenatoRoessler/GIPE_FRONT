# Design Spec: Gestão de Usuários

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Cobre 3 telas: listagem, cadastro e edição de usuário — todas dentro da área logada (`AppShell`), na rota já reservada pelo menu lateral (`/usuarios`).

## Direção

Modo **Operate** (mesma linha de `docs/specs/estrutura-projeto-logado/design.md`): tela administrativa, usada por quem gerencia o sistema, não pelo operador de portão — prioriza escaneabilidade da tabela e clareza do status (ativo/inativo) sobre qualquer floreio visual.

## Componentes do design system

### Reaproveitados
- **Button** — variantes `primary` (ações principais: "Novo usuário", "Salvar") e `secondary` (ex.: "Cancelar" na edição).
- **Input** — CPF, nome, sobrenome (mesmo padrão de máscara/validação já usado em `AdminUserStepFields`).
- **Select** — campo função (Admin/Caixa/Manobrista/Gerente), mesmo padrão do `tipoEmpresa` em `CompanyStepFields`.
- **Text** — títulos de tela e mensagens de estado vazio/erro.
- **Card** — envolve o formulário de cadastro/edição.

### Novos (a criar em `src/components/ui`, seguindo o padrão `Component.tsx` + `Component.styles.ts` + `index.ts`)

- **Table** (`src/components/ui/Table`)
  - Primeiro componente de tabela do design system — vai ser reaproveitado por outras listagens futuras (preços, veículos, relatórios), então nasce genérico: `Table`, `TableHead`, `TableRow`, `TableCell` (como `styled.table`/`thead`/`tr`/`td`/`th`), usando `colors.border` para as divisórias, `colors.surface` no cabeçalho, `space`/`fontSizes` do tema — sem padding/cor soltos.
  - Estado vazio: quando não há usuários, a própria tela (não a `Table`) renderiza um `Text variant="muted"` centralizado no lugar da tabela — mantém `Table` simples e sem saber sobre "vazio".

- **StatusBadge** (`src/components/ui/StatusBadge`)
  - Pílula pequena (`radii.full`) indicando Ativo/Inativo: Ativo em `colors.success`/fundo suave equivalente, Inativo em `colors.textMuted`/fundo `colors.surface` — reaproveitável por outras listagens que tenham status (ex. preços, convênios).

- **Switch** (`src/components/ui/Switch`)
  - Toggle ativo/inativo dentro do formulário de edição, usando `colors.primary` no estado ligado e `colors.border`/`colors.surface` no desligado — padrão acessível (`role="switch"`, `aria-checked`).

## Telas e estados

### 1. Listagem (`/usuarios`)
- **Padrão**: `Table` com colunas Nome, CPF, Função, Status (`StatusBadge`), e uma coluna de ação com botão "Editar" (`Button` variant `secondary`, tamanho `sm`) por linha. Botão "Novo usuário" (`Button` primary) no topo, alinhado à direita do título da página.
- **Carregando**: linhas "esqueleto" (blocos `colors.surface` no lugar do texto) no lugar dos dados, mesma contagem de colunas — evita layout shift quando os dados mockados "chegam".
- **Vazio**: nenhum usuário cadastrado ainda → `Text variant="muted"` centralizado ("Nenhum usuário cadastrado.") + `Button` "Novo usuário" logo abaixo, no lugar da tabela.
- **Erro**: falha ao carregar a listagem (mesmo mockada) → `Text variant="error"` com opção de tentar novamente (`Button secondary` "Tentar novamente").

### 2. Cadastro (`/usuarios/novo`)
- **Padrão**: `Card` com título "Novo usuário", campos CPF, Nome, Sobrenome (`Input`), Função (`Select`) — status ativo já nasce "Ativo" por padrão, sem precisar do `Switch` nesta tela (só aparece na edição, ver RF5/RF6 do PRD: cadastro já cria disponível para login).
- **Validação**: mesmo padrão de erro inline por campo já usado em `AdminUserStepFields` (`Input`/`Select` com prop `error`).
- **Salvando**: botão "Salvar" com label "Salvando..." e desabilitado, mesmo padrão dos outros formulários do projeto.
- **Sucesso**: redireciona para `/usuarios` (a listagem já teria o novo usuário, dado mockado).
- **Erro ao salvar**: `Text variant="error"` acima do botão, formulário permanece preenchido.

### 3. Edição (`/usuarios/[id]/editar`)
- **Padrão**: mesmo layout do cadastro, campos pré-preenchidos, mais o `Switch` "Usuário ativo" — permite inativar/reativar (RF: inativar/reativar pela edição).
- **Carregando dados do usuário**: `Card` com esqueleto nos campos enquanto busca o usuário mockado pelo id da rota.
- **Não encontrado**: id inexistente → `Text variant="error"` ("Usuário não encontrado.") + `Link`/`Button` para voltar à listagem.
- **Salvando/Sucesso/Erro**: mesmo padrão do cadastro.

## Responsividade
- Breakpoint relevante: `breakpoints.sm` (480px). Abaixo dele, `Table` não faz scroll horizontal escondido — cada linha vira um "cartão" empilhado (label + valor por campo, usando `colors.border` como divisória entre cartões), reaproveitando a mesma `Table`/`TableRow` com CSS que muda de `display: table-row` para `display: block` no breakpoint, sem duplicar marcação.
- Formulários de cadastro/edição: mesmo padrão de largura do `Card`/`AuthCard` já usado no projeto (largura máxima confortável, full-width em mobile).
- Botão "Novo usuário" empilha acima da tabela em mobile (em vez de alinhado à direita do título), evitando aperto horizontal.
