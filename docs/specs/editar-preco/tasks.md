# Tasks: Edição de Preço

Referências: ./prd.md, ./design.md, ./techspec.md

Ordem pensada para entregar em fatias: **Fase A** (contrato e dados) → **Fase B** (diff e comparação) → **Fase C** (fluxo de edição) → **Fase D** (listagem e verificação). Rodar `npm run lint` ao fim de cada task que altera código; `npm run build` ao fim de cada fase.

Nota: o backend **não** tem `GET /rotatividade/{id}`; a edição usa os dados da listagem (decisão registrada no `techspec.md`). Ainda a confirmar com o backend: `percentualConveniada` `null` vs `0` e `ativo` no `POST` (pontos em aberto 2 e 3 do PRD).

## Fase A — Contrato e dados

- [x] T1 — Enviar `ativo` da tabela no corpo do `POST`/`PUT`
  - Arquivos: `src/lib/api/services/preco.mapper.ts`
  - Pronto quando: `PrecoPayload["rotatividade"]` tem `ativo: boolean`, preenchido com `info.ativo` em `toPrecoPayload`; o corpo gerado para o exemplo do `PUT` do `input.md` tem `ativo` dentro de `rotatividade`, não tem `prioridade` nem ids; `npm run lint` e `tsc` passam. Registrar no `techspec.md` do cadastro que o `POST` agora também envia `ativo` (confirmar com o backend).

- [x] T2 — Serviço: `getPreco` (pela listagem) e `updatePreco`
  - Arquivos: `src/lib/api/services/preco.ts`
  - Pronto quando: `getPreco(id)` faz `GET /rotatividade/{id}` e devolve `PrecoView` via `fromPrecoResponse`; `updatePreco(id, values)` faz `PUT /rotatividade/{id}` com `toPrecoPayload(values)`; ambos deixam o `ApiError` subir (sem `try/catch`) e não logam token nem payload.

- [x] T3 — Verificação do mapeamento de ida e volta
  - Arquivos: —
  - Pronto quando: conferido (script descartável fora do repositório ou inspeção no navegador) que `toPrecoPayload(toPrecoFormValues(view))` reproduz os dados do exemplo do `PUT` do `input.md` (mesmos horários, faixas e categorias, `HH:mm:ss`, `null` nos opcionais); nenhum arquivo de teste é deixado no projeto.

## Fase B — Comparação de alterações

- [x] T4 — Módulo `diff.ts` (funções puras)
  - Arquivos: `src/components/precos/diff.ts`
  - Pronto quando: `hasChanges(original, current)` é `false` para valores iguais, inclusive com listas na mesma ordem lógica, e volta a `false` ao reverter um valor; `diffPreco` devolve, para `info`, `{ campo, rotulo, antes, depois }` por campo alterado (valores formatados com `format.ts`) e, para horários, faixas e categorias, `{ adicionadas, removidas }` calculados por multiconjunto de linhas serializadas; sem dependência nova; `npm run lint` passa.

- [x] T5 — `PrecoResumo` com modo de comparação
  - Arquivos: `src/components/precos/PrecoResumo/PrecoResumo.tsx`, `PrecoResumo.styles.ts`
  - Pronto quando: a prop opcional `original` ativa o modo de comparação: campos alterados mostram "antes → depois" (valor anterior com `line-through` e `colors.textMuted`) e texto oculto "era X, agora Y" para leitores de tela; listas mostram os contadores ("2 faixas adicionadas · 1 removida") e a lista final; sem mudanças mostra "Nenhuma alteração em relação à tabela salva."; sem `original` o resumo do cadastro fica idêntico ao atual; só tokens do tema.

## Fase C — Fluxo de edição (⚠ depende do `GET /rotatividade/{id}`)

- [x] T6 — `PrecoInfoStepFields`: texto de apoio do "Ativo" na edição
  - Arquivos: `src/components/precos/PrecoInfoStepFields/PrecoInfoStepFields.tsx`
  - Pronto quando: nova prop opcional `mode` (`create` | `edit`); na edição o switch "Ativo" mostra "Desative para que esta tabela deixe de ser aplicada." e, desligado, "Esta tabela não será aplicada enquanto estiver inativa."; no cadastro nada muda; o período da diária fora de 6/12/24 horas continua aparecendo como opção extra selecionada.

- [x] T7 — `PrecoWizardForm`: modo edição
  - Arquivos: `src/components/precos/PrecoWizard/PrecoWizardForm.tsx`, `PrecoWizard.styles.ts`
  - Pronto quando: props `mode`, `nome` e `situacao`; snapshot `original` em `useState(initial)`; título "Editar preço" com nome da tabela e `StatusBadge` da situação salva; "Alterações não salvas" em `aria-live="polite"` quando `hasChanges`; na edição, `hasChanges` (e não `isDirty`) controla `beforeunload` e a confirmação do "Cancelar"; botão final "Salvar alterações", desabilitado sem mudanças com o texto "Nenhuma alteração para salvar."; a etapa 4 passa `original` ao `PrecoResumo`; passa `mode` ao `PrecoInfoStepFields`; no cadastro o comportamento atual permanece idêntico. Constante `SHOW_VIGENTE_WARNING = false` reservada para o aviso de vigência (não exibido).

- [x] T8 — `PrecoWizard`: carregar a tabela por id
  - Arquivos: `src/components/precos/PrecoWizard/PrecoWizard.tsx`
  - Pronto quando: com `id`, usa `useQuery(["preco", id])` com `refetchOnWindowFocus: false`; carregando mostra esqueleto do `Card` (título, `Stepper`, blocos de `Skeleton`) em `role="status"` com `aria-label="Carregando tabela de preço"`; `ApiError` com `kind === "not_found"` mostra "Tabela de preço não encontrada." + `Link` para `/precos`; outros erros mostram `ErrorBanner` + "Tentar novamente" (`refetch`) + `Link` de volta; com dado, monta `PrecoWizardForm` em modo `edit` com `toPrecoFormValues(data)`, `onSave` chamando `updatePreco(id, ...)`, `savedFlag="atualizado"` e `invalidateKeys=[["preco", id]]`; sem `id` o cadastro continua como hoje.

- [x] T9 — Rota `/precos/[id]/editar`
  - Arquivos: `src/app/(app)/precos/[id]/editar/page.tsx`
  - Pronto quando: Server Component com `await params`; id não numérico chama `notFound()`; renderiza `<PrecoWizard id={Number(id)} />`; `npm run build` lista a rota.

- [x] T10 — Build da Fase C
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam sem erros.

## Fase D — Listagem e verificação

- [x] T11 — Clique na linha da listagem leva à edição (temporário)
  - Arquivos: `src/components/precos/PrecosList/PrecosList.tsx`
  - Pronto quando: constante isolada `ROW_CLICK_TARGET` faz o clique na linha navegar para `/precos/{id}/editar` enquanto a visualização não existe; "Ver" continua apontando para `/precos/{id}`; "Editar" continua apontando para a rota nova; comentário curto indica que deve voltar ao detalhe quando a visualização for implementada.

- [ ] T12 — Verificação manual da edição
  - Arquivos: —
  - Pronto quando: conferido em tabela de teste (a do `input.md` é a 11, "Tabela padrão - teste 2"), em desktop e 375 px, claro e escuro: abrir pela ação "Editar" e pelo clique na linha com as 4 etapas preenchidas; alterar valor de faixa; remover e adicionar horário, faixa e categoria; salvar, reabrir e conferir; inativar e reativar (selo na listagem); id inexistente e id inválido; falha de rede ao carregar e ao salvar (dados preservados); cancelar com e sem alterações; reverter um valor e ver "Salvar alterações" desabilitar de novo; período da diária fora de 6/12/24 horas; horários sem hora; corpo do `PUT` no Network igual ao exemplo do `input.md`.

- [ ] T13 — Fechamento da feature
  - Arquivos: `docs/specs/editar-preco/tasks.md`, `docs/specs/gerenciamento-precos/tasks.md`
  - Pronto quando: `npm run lint` e `npm run build` passam; critérios de aceite do `prd.md` marcados; tasks T22 (serviço de detalhe/atualização), T24 (rota de edição) e T25 (modo edição) de `gerenciamento-precos/tasks.md` marcadas como cobertas por esta feature, ficando pendentes só a visualização (T23) e a verificação final (T26); `docs/specs/input.md` sem o JWT real antes de qualquer commit.
