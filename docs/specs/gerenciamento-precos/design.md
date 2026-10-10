# Design Spec: Gerenciamento de Preços

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Cobre a tela de listagem em `/precos` (rota já reservada no pórtico), a visualização, e o fluxo de cadastro/edição em 4 etapas. Tudo dentro da área logada (`AppShell`, tema de sinalização viária).

## Direção

Modo **Operate** (mesma linha de `docs/specs/gestao-usuarios/design.md`): tela administrativa usada em desktop por quem define a política de cobrança. Prioridade: escaneabilidade da tabela, clareza das regras ativas (princípio 2 do `PRODUCT.md`: "entender exatamente que regra de cobrança está ativa") e wizard sem sobrecarga (princípio 5). Ousadia visual fica nos detalhes de sinalização já herdados do tema (tipografia `display`, placas), não em composição incomum — são dados financeiros.

Ideia de identidade para esta tela: a **faixa de valores** é apresentada como uma "placa tarifária" de estacionamento (lista de degraus tempo → valor), tanto na visualização quanto no resumo do wizard, reforçando a linguagem de sinalização sem custo de clareza.

## Componentes do design system

### Reaproveitados (existem em `src/components/ui`)
- **Button** — `primary` ("Novo preço", "Avançar", "Salvar"), `secondary` ("Voltar", "Editar", "Cancelar", "Adicionar horário/faixa"), tamanho `sm` nas ações de linha.
- **Input** — descrição, prioridade, tolerâncias, período e valores da diária, datas, horas, minutos limite, valor, percentual.
- **Select** — tipo de regra, dia da semana, empresa conveniada (desabilitado).
- **Stepper** — progresso das 4 etapas (`steps={["Informações","Horários","Faixas de valores","Categorias"]}`).
- **Switch** — "Ativo" na etapa 1 e em cada linha de horário.
- **Card** — contêiner do wizard e da visualização (com `maxWidth` ampliado, ex. `960px`, já que o padrão de 480px não comporta as linhas editáveis).
- **Text** — títulos, estados vazio/erro, textos auxiliares.
- **Skeleton** — carregamento da tabela e da visualização.
- **Toast** — confirmação de salvamento (RF12) e falha de rede.
- **ErrorBanner** — falha ao carregar a listagem ou ao salvar, com ação "Tentar novamente".

### Compartilhados com `gestao-usuarios` (ainda não existem no código; criar uma única vez)
- **Table** (`Table`, `TableHead`, `TableRow`, `TableCell`) — conforme definido em `docs/specs/gestao-usuarios/design.md`. Quem for implementado primeiro cria; o outro reaproveita. Nasce genérico e sem conhecer "vazio".
- **StatusBadge** — pílula Ativo/Inativo, conforme mesmo documento. Aqui ganha uso adicional: o status **Vigente / Agendada / Encerrada** (ver abaixo), então deve aceitar um `tone` (`success`, `neutral`, `info`) em vez de só ativo/inativo.

### Novos (a criar em `src/components/ui`, padrão `Component.tsx` + `Component.styles.ts` + `index.ts`)
- **Pagination** (`src/components/ui/Pagination`)
  - Rodapé da tabela: texto "Mostrando 1–20 de 134" à esquerda; botões anterior / próxima e indicador "Página 2 de 7" à direita. Botões são `Button secondary size sm`, desabilitados nos extremos. Navegação acessível (`nav` com `aria-label="Paginação"`, `aria-current` na página atual). Sem lista de números de página nesta versão (a API entrega `page`/`totalPages`; anterior/próxima basta).
- **FormSection / FieldRow** — não criar como componente de DS; é só composição de grid com `space` do tema dentro das etapas (fica no `.styles.ts` da feature).
- **RepeatableRows** — também feature-local (linhas editáveis de horários e faixas), pois só este fluxo usa; se surgir um segundo uso, extrair.

## Tokens usados

Nenhum token novo obrigatório. Usos:
- Cores: `colors.primary` (ação, etapa atual), `colors.success` / `colors.textMuted` (status), `colors.warn` + `colors.onWarn` (selo "Agendada"/avisos de vigência — mesmo amarelo de sinalização), `colors.danger` (erros), `colors.surface` (cabeçalho de tabela, linhas editáveis), `colors.border` (divisórias).
- Tipografia: `typography.display` / `displaySize` para o título da página (já aplicado pelo `Text variant="heading"`); `fontSizes.sm` para células; **valores monetários e minutos em fonte com algarismos tabulares** (`font-variant-numeric: tabular-nums`) para alinhar à direita e facilitar comparação.
- Espaçamento: escala `space`; gaps de formulário em `space[4]` (16), seções em `space[5]` (24).
- Raios/sombras: `radii.md` nas linhas editáveis, `shadows.sm` no Card.

Se faltar algo (ex.: cor suave de `info` para "Agendada"), adicionar a `theme.ts` em vez de valor solto.

## Telas e estados

### 1. Listagem (`/precos`)
- **Cabeçalho**: título "Gestão de Preços" e `Button primary` "Novo preço" alinhado à direita.
- **Padrão**: `Table` com colunas:
  | Coluna | Conteúdo |
  |---|---|
  | Descrição | texto principal (peso `medium`) |
  | Tipo | rótulo do enum (Padrão, Convênio, Promocional, Evento); valor fora do enum (ex. `0`) exibe "—" |
  | Prioridade | número, alinhado à direita |
  | Vigência | "06/06/2026 → sem fim" ou "15/10/2026 → 31/12/2026" |
  | Categorias | rótulos curtos; "Todas" quando `99`; mais de 2 vira "Moto +2" |
  | Situação | `StatusBadge`: **Vigente** (success), **Agendada** (início futuro, tom info/warn), **Encerrada** (fim passado, muted), **Inativa** (`ativo=false`, muted) |
  | Ações | "Ver" (`secondary sm`) e "Editar" (`secondary sm`) |
  - Linha inteira clicável abre a visualização; botões de ação interrompem a propagação.
  - Ordenação fixa por prioridade e depois vigência (definir no Tech Spec); sem ordenação interativa nesta versão.
- **Paginação**: `Pagination` abaixo da tabela. Trocar de página mantém o cabeçalho e mostra esqueleto nas linhas (sem layout shift), com foco devolvido ao topo da tabela.
- **Carregando**: 8 linhas de `Skeleton`, mesma contagem de colunas.
- **Vazio**: `Text variant="muted"` centralizado "Nenhuma tabela de preço cadastrada." + `Button primary` "Novo preço".
- **Erro**: `ErrorBanner` acima da tabela com "Não foi possível carregar os preços." e ação "Tentar novamente".

### 2. Visualização (`/precos/[id]`)
- Somente leitura, em `Card` largo, com cabeçalho: descrição, `StatusBadge`, botões "Editar" (`primary`) e "Voltar" (`secondary`).
- Quatro blocos em sequência, na mesma ordem das etapas do wizard (consistência mental com o cadastro):
  1. **Informações** — lista de pares rótulo/valor em grid de 2 colunas (1 em mobile); valores monetários formatados em BRL, tolerâncias como "15 min", vigência por extenso. Empresa conveniada oculta enquanto vazia.
  2. **Horários** — grade semanal compacta: 7 linhas (Seg–Dom) com faixa de horário; dia sem `horaInicio/horaFim` exibe "Dia inteiro" (a confirmar, ponto em aberto 4 do PRD); regras com data início/fim mostram um selo de período; inativas ficam esmaecidas com "Inativo".
  3. **Faixas de valores** — "placa tarifária": lista de degraus "Até 1 h → R$ 15,00", ordenada por minutos; minutos ≥ 60 formatados em horas ("2 h", "1 h 30 min"). Abaixo, linha de diária ("Diária de 12 h: R$ 35,00 · adicional R$ 1,00"). Coluna de % conveniada só aparece quando algum degrau tem valor.
  4. **Categorias** — chips com os nomes das categorias.
- **Carregando**: esqueleto dos quatro blocos. **Não encontrado**: "Tabela de preço não encontrada." + `Link` para voltar à listagem.

### 3. Cadastro (`/precos/novo`) e Edição (`/precos/[id]/editar`)
Mesmo componente de wizard; edição abre pré-preenchida. `Card` largo com `Stepper` no topo e rodapé fixo de ações dentro do card: **Voltar** (secondary, oculto na etapa 1 — ali é "Cancelar"), **Avançar** (primary) e, na última etapa, **Salvar**.

**Etapa 1 — Informações**
- Grid de 2 colunas (1 em mobile), agrupado em três blocos com subtítulo:
  - *Identificação*: Descrição (linha inteira), Tipo de regra (`Select`), Prioridade (`Input` numérico), Empresa conveniada (`Select` **disabled**, texto de apoio "Disponível em breve").
  - *Vigência e tolerâncias*: Início da vigência (data/hora), Fim da vigência (opcional, dica "Deixe em branco para vigência indeterminada"), Tolerância de entrada (min), Tolerância de alteração de faixa (min).
  - *Diária*: Período da diária (min, com dica de equivalência em horas, ex. "720 min = 12 h"), Valor da diária e Valor adicional (prefixo "R$").
  - `Switch` "Ativo" ao fim (padrão ligado).
- Validação inline por campo (`error` do `Input`/`Select`), ao tentar avançar; foco vai ao primeiro campo com erro.

**Etapa 2 — Horários**
- Lista de linhas editáveis (cada uma em bloco `colors.surface`, `radii.md`): Dia da semana (`Select`), Hora início, Hora fim, Data início, Data fim (opcionais, recolhidas em "Período específico" para não poluir), `Switch` Ativo e botão remover (ícone com `aria-label`).
- Atalhos para reduzir digitação, já que o caso comum é todos os dias com o mesmo horário: botão secundário "Aplicar a todos os dias" que gera 7 linhas a partir de um horário, e "Adicionar horário" para linha avulsa. (Decisão de UX a validar com o usuário; não altera o contrato da API.)
- Estado vazio: texto "Nenhum horário cadastrado" + ações acima. Mínimo de itens conforme PRD/Tech Spec.

**Etapa 3 — Faixas de valores**
- Linhas editáveis: Até (minutos) e Valor (R$), e % conveniada (opcional, **somente quando tipo de regra = Convênio**; nos demais fica oculto para reduzir ruído).
- Ao lado do input de minutos, equivalência legível em tempo ("= 1 h 30 min").
- Linhas mantidas ordenadas por minutos crescentes (reordenam ao sair do campo); erro inline em duplicados ou ordem de valor incoerente.
- Painel de pré-visualização "placa tarifária" ao lado (desktop) / abaixo (mobile), atualizado ao vivo: mostra exatamente como o cliente será cobrado, incluindo a diária.
- Botão "Adicionar faixa".

**Etapa 4 — Categorias**
- Grupo de **chips selecionáveis** (multi-seleção, `role="checkbox"` ou checkboxes visualmente estilizados): Moto, Carro pequeno, Carro médio, SUV/Pick-up, Caminhonete, Caminhão, **Todas**.
- Regra de interação: marcar "Todas" desmarca e desabilita as demais; marcar qualquer outra desmarca "Todas".
- Abaixo, **resumo final** da tabela (leitura rápida de tudo antes de salvar) reaproveitando os mesmos blocos da visualização.

**Estados do wizard**
- **Salvando**: botão com "Salvando..." e desabilitado; demais campos mantidos.
- **Sucesso**: redireciona para `/precos` com `Toast` "Tabela de preço criada/atualizada." e linha nova visível.
- **Erro ao salvar**: `ErrorBanner` acima do rodapé; dados preservados (critério de aceite do PRD).
- **Sair com alterações**: ao clicar em Cancelar/navegar com dados modificados, confirmar descarte (diálogo simples, ação destrutiva em `danger`).
- **Carregando dados (edição)**: esqueleto dos campos; **não encontrado**: mesmo tratamento da visualização.

## Acessibilidade
- Stepper com `aria-current="step"` (já existe); ao avançar, foco vai ao título da etapa e um `aria-live` anuncia "Etapa 2 de 4: Horários".
- Linhas repetíveis: cada controle com rótulo único ("Dia da semana — horário 2"); remover/adicionar anunciam via `aria-live`; foco vai ao primeiro campo da linha criada.
- Status nunca depende só de cor: texto no `StatusBadge`.
- Alvos de toque ≥ 44px em mobile; contraste conforme tokens do tema (claro e escuro).

## Responsividade
- Breakpoint principal: `breakpoints.md` (768px) para formulários e `breakpoints.sm` (480px) para tabela.
- **Tabela**: abaixo de `sm`, cada linha vira cartão empilhado (mesma estratégia do `gestao-usuarios`), mostrando Descrição, Situação, Vigência e as ações; Prioridade e Categorias ficam em linha secundária.
- **Wizard**: grids de 2 colunas viram 1; linhas de horário e faixa empilham seus campos; rodapé de ações com botões em largura total (Avançar acima de Voltar); `Stepper` abrevia para "Etapa 2 de 4 — Horários" quando os 4 rótulos não couberem.
- **Cabeçalho da listagem**: "Novo preço" empilha abaixo do título em mobile.
- Pré-visualização da placa tarifária desce para depois dos campos em mobile.

## Fora do escopo visual
- Filtros/busca, ordenação interativa e exclusão (alinhado ao PRD).
- Seleção de empresa conveniada (campo apenas desabilitado).
