# Tasks: Gerenciamento de Preços

Referências: ./prd.md, ./techspec.md, ./design.md

Ordem pensada para entregar em fatias: **Fase A** (base) → **Fase B** (listagem) → **Fase C** (cadastro) → **Fase D** (visualização e edição, dependem da confirmação de `GET/PUT /rotatividade/{id}` pelo backend). Rodar `npm run lint` ao fim de cada task que altera código; `npm run build` ao fim de cada fase.

## Fase A — Base (tipos, utilitários, API, design system)

- [x] T1 — Tipos e enums do domínio de preço
  - Arquivos: `src/types/preco.ts`
  - Pronto quando: existem `TIPO_REGRA` e `TIPO_CATEGORIA` (`as const`) com tipos união, listas de opções com rótulos (`TIPO_REGRA_OPTIONS`, `TIPO_CATEGORIA_OPTIONS`), constante de dias da semana, interfaces `PrecoView`, `PrecoFormValues` (info, horários, faixas, categorias) e `EMPTY_PRECO_FORM_VALUES` (`tipoRegra: "1"`, `ativo: true`, tolerâncias `"0"`); `npm run lint` passa.

- [x] T2 — Utilitários de formatação e dinheiro
  - Arquivos: `src/lib/money.ts`, `src/components/precos/format.ts`
  - Pronto quando: `parseMoney("15,50") === 15.5`, `formatBRL(35) === "R$ 35,00"`, `formatMinutos(90) === "1 h 30 min"` e `formatMinutos(30) === "30 min"`, `formatVigencia` com e sem fim ("sem fim"); datas formatadas por `Intl` sem usar `toISOString()`; rótulos de enum com `null` retornando "—".

- [x] T3 — Tipo genérico de paginação
  - Arquivos: `src/lib/api/types.ts`, `src/lib/api/index.ts`
  - Pronto quando: `Paginado<T>` (`items`, `page`, `pageSize`, `totalRecords`, `totalPages`) exportado e importável de `@/lib/api`.

- [x] T4 — Mapper de preço (DTO ↔ view ↔ formulário ↔ payload)
  - Arquivos: `src/lib/api/services/preco.mapper.ts`
  - Pronto quando: `fromPrecoResponse` tolera campos ausentes e `tipoRegra` fora do enum (vira `null`), ordena `regras` por `diaSemana` e `faixaValores` por `minutosLimite`; `getSituacao(ativo, inicio, fim, agora)` retorna `vigente | agendada | encerrada | inativa` com `agora` por parâmetro; `toPrecoPayload` gera exatamente o corpo do `POST` do `input.md` (`HH:mm` → `HH:mm:00`, `datetime-local` → `...:00`, vazios → `null`, `percentualConveniada: null`, `empresaConveniadaId: null`); `toPrecoFormValues` faz o caminho inverso sem ids. Nenhuma conversão de data via `Date`/`toISOString`.

- [x] T5 — Serviço de preço (listagem e criação)
  - Arquivos: `src/lib/api/services/preco.ts`
  - Pronto quando: `listPrecos({ pagina, tamanhoPagina })` chama `GET /rotatividade` e devolve `Paginado<PrecoView>`; `createPreco(values)` chama `POST /rotatividade`; erros sobem como `ApiError` (sem `try/catch`); nada loga token ou payload.

- [x] T6 — Componente `Table` do design system (se ainda não existir)
  - Arquivos: `src/components/ui/Table/Table.tsx`, `Table.styles.ts`, `index.ts`
  - Pronto quando: `Table`, `TableHead`, `TableRow`, `TableCell` usam só tokens do tema (`border`, `surface`, `space`, `fontSizes`); `TableCell` aceita `data-label`; abaixo de `breakpoints.sm` cada linha vira cartão empilhado exibindo o `data-label`; suporta alinhamento numérico (`tabular-nums`). Antes de começar, conferir se a gestão de usuários já o criou e, se sim, só reaproveitar.

- [x] T7 — Componente `StatusBadge` do design system (se ainda não existir)
  - Arquivos: `src/components/ui/StatusBadge/StatusBadge.tsx`, `StatusBadge.styles.ts`, `index.ts`
  - Pronto quando: aceita `tone` (`success | neutral | info | warn`) e texto como filho; status nunca depende só de cor; usa apenas tokens (se faltar tom `info`, adicionar `info`/`infoSoft` nos quatro temas e em `ThemeColors` em `src/styles/theme.ts`).

- [x] T8 — Componente `Pagination` do design system
  - Arquivos: `src/components/ui/Pagination/Pagination.tsx`, `Pagination.styles.ts`, `index.ts`
  - Pronto quando: recebe `page`, `totalPages`, `totalRecords`, `pageSize`, `onPageChange`; mostra "Mostrando a–b de N" e "Página X de Y"; botões anterior/próxima (`Button secondary sm`) desabilitados nos extremos; `nav` com `aria-label="Paginação"`.

- [x] T9 — Build da Fase A
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam sem erros.

## Fase B — Listagem

- [x] T10 — `PrecosList`: consulta, tabela e estados
  - Arquivos: `src/components/precos/PrecosList/PrecosList.tsx`, `PrecosList.styles.ts`, `index.ts`
  - Pronto quando: lê `pagina` da query string (padrão 1, inválido → 1); `useQuery(["precos", pagina])` com `keepPreviousData` e `tamanhoPagina = 20`; colunas Descrição, Tipo, Vigência, Categorias, Situação (`StatusBadge`) e Ações ("Ver"/"Editar" como links); estados de carregamento (8 linhas `Skeleton`), vazio (mensagem + "Novo preço"), erro (`ErrorBanner` com "Tentar novamente"); `Pagination` abaixo; página maior que `totalPages` redireciona para a última; botão "Novo preço" no topo.

- [x] T11 — Rota `/precos` usando a listagem
  - Arquivos: `src/app/(app)/precos/page.tsx`
  - Pronto quando: a página (Server Component) renderiza `PrecosList` dentro de `Suspense` (por `useSearchParams`) e o título "Gestão de Preços"; o texto "será implementada em uma spec futura" é removido; item do menu continua ativo em `/precos/*`.

- [ ] T12 — Verificação manual da listagem
  - Arquivos: —
  - Pronto quando: conferido no navegador (desktop e 375 px, claro e escuro) com dados reais: carregamento, vazio (se possível), erro de rede, troca de página mantendo `?pagina=` ao voltar; `npm run lint` e `npm run build` passam.

## Fase C — Cadastro

- [x] T13 — Schemas zod das quatro etapas
  - Arquivos: `src/lib/schemas/preco.ts`
  - Pronto quando: existem `precoInfoSchema`, `precoHorariosSchema`, `precoFaixasSchema`, `precoCategoriasSchema` e `precoSchema` composto, com as regras do tech spec (`fimVigencia` > `inicioVigencia`; `horaFim` > `horaInicio`; `dataFim` ≥ `dataInicio`; horários duplicados; `minutosLimite` único e inteiro > 0; percentual 0–100; "Todas" exclusivo; mínimo 1 item em horários, faixas e categorias), mensagens em português e caminhos compatíveis com `zodFieldErrors` (`horarios[2].horaFim`).

- [x] T14 — Etapa 1: campos de Informações
  - Arquivos: `src/components/precos/PrecoInfoStepFields/PrecoInfoStepFields.tsx`, `index.ts`
  - Pronto quando: `withForm` com os campos do `design.md` agrupados em Identificação, Vigência e tolerâncias, Diária; `empresaConveniadaId` aparece como `Select disabled` ("Nenhuma", "Disponível em breve") e nunca vai ao formulário; dica "720 min = 12 h" no período da diária; `Switch` "Ativo"; grid de 2 colunas que vira 1 em mobile; erros inline por campo.

- [x] T15 — Etapa 2: campos de Horários (linhas repetíveis)
  - Arquivos: `src/components/precos/PrecoHorariosStepFields/PrecoHorariosStepFields.tsx`, `index.ts`
  - Pronto quando: campo array com adicionar/remover linha; cada linha tem dia (`Select`), hora início/fim, "Período específico" (datas opcionais) e `Switch` ativo; botão "Aplicar a todos os dias" gera as 7 linhas a partir de um horário; estado vazio com ações; rótulos únicos por linha para leitores de tela; foco vai ao primeiro campo da linha criada; `aria-live` anuncia adição/remoção.

- [x] T16 — `FaixasPreview` ("placa tarifária") e etapa 3: Faixas de valores
  - Arquivos: `src/components/precos/FaixasPreview/FaixasPreview.tsx`, `FaixasPreview.styles.ts`, `index.ts`; `src/components/precos/PrecoFaixasStepFields/PrecoFaixasStepFields.tsx`, `index.ts`
  - Pronto quando: `FaixasPreview` lista degraus "Até 1 h → R$ 15,00" mais linha de diária, aceita lista vazia e valores parciais sem quebrar; etapa 3 tem linhas editáveis (minutos, valor, % conveniada **só quando tipo = Convênio**), equivalência legível ao lado dos minutos ("= 1 h 30 min"), reordenação por minutos ao sair do campo, botão "Adicionar faixa" e pré-visualização ao vivo (ao lado no desktop, abaixo no mobile).

- [x] T17 — Etapa 4: campos de Categorias
  - Arquivos: `src/components/precos/PrecoCategoriasStepFields/PrecoCategoriasStepFields.tsx`, `index.ts`
  - Pronto quando: chips multisseleção acessíveis (teclado, `aria-checked`) para as 7 categorias; marcar "Todas" desmarca e desabilita as demais, e marcar outra desmarca "Todas" (aplicado no `handleChange`, não só na validação); resumo final com os mesmos blocos da visualização (reaproveitando `FaixasPreview`).

- [x] T18 — `PrecoWizardForm`: orquestração das 4 etapas
  - Arquivos: `src/components/precos/PrecoWizard/PrecoWizardForm.tsx`, `PrecoWizard.styles.ts`
  - Pronto quando: `Card` largo com `Stepper` (Informações, Horários, Faixas de valores, Categorias); um `useAppForm` por etapa com validação zod e `zodFieldErrors`; avançar só com etapa válida; voltar preserva os dados; foco na descrição da etapa ao trocar e anúncio "Etapa X de 4"; no último passo revalida `precoSchema` e, havendo erro em etapa anterior, volta à primeira etapa com erro; `useMutation` com `createPreco`; botão "Salvando..." e controles desabilitados durante o envio; `ErrorBanner` com a mensagem do `ApiError` preservando os dados.

- [x] T19 — Sucesso do cadastro, descarte e aviso de saída
  - Arquivos: `src/components/precos/PrecoWizard/PrecoWizardForm.tsx`, `src/components/precos/PrecosList/PrecosList.tsx`
  - Pronto quando: `onSuccess` invalida `["precos"]`, navega para `/precos?salvo=criado` e a listagem exibe `Toast` "Tabela de preço criada." uma única vez, limpando o parâmetro com `router.replace`; "Cancelar" com formulário alterado pede confirmação (`window.confirm`); `beforeunload` ativo apenas enquanto houver alteração.

- [x] T20 — Container `PrecoWizard` e rota `/precos/novo`
  - Arquivos: `src/components/precos/PrecoWizard/PrecoWizard.tsx`, `index.ts`; `src/app/(app)/precos/novo/page.tsx`
  - Pronto quando: `/precos/novo` renderiza o wizard com `EMPTY_PRECO_FORM_VALUES`; o botão "Novo preço" da listagem leva até ele.

- [ ] T21 — Verificação manual do cadastro
  - Arquivos: —
  - Pronto quando: cadastro completo conferido em homologação: cada regra de validação, "Todas" vs demais categorias, "Aplicar a todos os dias", voltar/avançar sem perder dados, clique duplo em Salvar, erro do backend; corpo do `POST` no Network idêntico ao exemplo do `input.md`; novo registro aparece na listagem; desktop e 375 px, claro e escuro; `npm run lint` e `npm run build` passam.

## Fase D — Visualização e edição (⚠ depende de confirmação do backend: `GET /rotatividade/{id}` e `PUT /rotatividade/{id}`, e se o corpo aceita `ativo`)

- [x] T22 — Serviço: detalhe e atualização (feito em `docs/specs/editar-preco`)
  - Arquivos: `src/lib/api/services/preco.ts`
  - Pronto quando: `getPreco(id)` e `updatePreco(id, values)` implementados conforme o contrato **confirmado** (ajustar mapper se o `PUT` exigir ids de regras/faixas); premissas do tech spec atualizadas com o contrato real.

- [ ] T23 — `PrecoView`: visualização somente leitura
  - Arquivos: `src/components/precos/PrecoView/PrecoView.tsx`, `PrecoView.styles.ts`, `index.ts`
  - Pronto quando: cabeçalho com descrição, `StatusBadge` e botões "Editar"/"Voltar"; quatro blocos (Informações, Horários em grade semanal, Faixas em `FaixasPreview` com diária, Categorias em chips); horários nulos exibidos conforme definição confirmada; esqueleto ao carregar; "Tabela de preço não encontrada." para `not_found`; empresa conveniada oculta quando vazia.

- [ ] T24 — Rotas `/precos/[id]` e `/precos/[id]/editar` (a rota `/editar` foi feita em `docs/specs/editar-preco`; falta `/precos/[id]`)
  - Arquivos: `src/app/(app)/precos/[id]/page.tsx`, `src/app/(app)/precos/[id]/editar/page.tsx`
  - Pronto quando: ambas fazem `await params`, validam `id` numérico (inválido → `notFound()`) e renderizam `PrecoView` e `PrecoWizard` com `id`; links "Ver"/"Editar" da listagem e linha clicável funcionam.

- [x] T25 — Modo edição no wizard (feito em `docs/specs/editar-preco`)
  - Arquivos: `src/components/precos/PrecoWizard/PrecoWizard.tsx`, `PrecoWizardForm.tsx`
  - Pronto quando: com `id`, `PrecoWizard` busca o preço e só monta `PrecoWizardForm` com `toPrecoFormValues(data)` como valores iniciais (refetch não apaga edição); título e botão final refletem edição; mutação usa `updatePreco`; sucesso invalida `["precos"]` e `["preco", id]`, volta à listagem com `Toast` "Tabela de preço atualizada."; carregando e não encontrado tratados.

- [ ] T26 — Verificação final da feature
  - Arquivos: `docs/specs/gerenciamento-precos/tasks.md`
  - Pronto quando: visualização e edição conferidas com dados reais (campos pré-preenchidos, salvar, recarregar); todos os critérios de aceite do `prd.md` marcados; `npm run lint` e `npm run build` passam; `docs/specs/gestao-precos/` arquivada ou marcada como substituída; `docs/specs/input.md` sem o JWT real antes de qualquer commit.
