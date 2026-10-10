# Tech Spec: Edição de Preço

## Referências
- PRD: ./prd.md
- Design: ./design.md (via skill claude-design)
- Base reaproveitada: `docs/specs/gerenciamento-precos/techspec.md` (serviço, mapper, schemas e wizard já implementados)
- Contrato recebido: `docs/specs/input.md` (`PUT /rotatividade/{id}`)

## Design
- **Telas/estados**: `/precos/[id]/editar`, com o mesmo wizard de 4 etapas do cadastro. Estados: carregando (esqueleto), erro ao carregar, não encontrada, editando, salvando, erro ao salvar e sucesso, conforme `design.md`.
- **Componentes do design system reaproveitados**: `Card`, `Stepper`, `Button`, `Switch`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`, `Link`, `StatusBadge`.
- **Componentes novos**: nenhum no design system. Na feature (`src/components/precos/`): `PrecoWizard` ganha modo edição, `PrecoWizardForm` ganha cabeçalho de edição e comparação, `PrecoResumo` ganha o modo de comparação, e entra `diff.ts` (funções puras).
- **Tokens de tema**: nenhum novo. `colors.textMuted` para o valor anterior riscado; `warn`/`onWarn` só se o aviso de vigência for confirmado pelo negócio.

## Arquitetura da solução

### Rota (`src/app/(app)/precos/[id]/editar/page.tsx`)
- Server Component. Em Next 16 `params` é uma `Promise` (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`):
```tsx
export default async function EditarPrecoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  return <PrecoWizard id={Number(id)} />;
}
```
- Já protegida pelo `proxy.ts`. `isNavItemActive` mantém "Gestão de Preços" ativo nas rotas filhas.

### Serviço (`src/lib/api/services/preco.ts`)
```ts
getPreco(id: number, paginaInicial?: number): Promise<PrecoView>   // localiza a tabela na listagem (GET /rotatividade?pagina&tamanhoPagina)
updatePreco(id: number, values: PrecoFormValues): Promise<void>   // PUT /rotatividade/{id}
```
- `getPreco` não usa endpoint próprio: **não existe consulta por id**. A listagem já devolve a tabela completa (horários, faixas e categorias), então `getPreco` busca `GET /rotatividade?pagina=n&tamanhoPagina=20` e procura o `rotatividadeId`. Começa pela página em cache que contém a tabela (se a listagem já foi aberta) ou pela 1; se não achar, percorre as demais. Sempre vem do servidor (dados atuais). Não achou em nenhuma página: `ApiError` `not_found`. O mapeamento reaproveita `fromPrecoResponse` (via `listPrecos`).
- `updatePreco` usa `toPrecoPayload(values)`; sem corpo de retorno esperado. Erros sobem como `ApiError`.
- **Contrato confirmado:** não há `GET /rotatividade/{id}`; a edição usa os dados da listagem. Custo: abrir uma tabela por link direto em uma página alta faz várias requisições. Quando o backend oferecer consulta por id, só `getPreco` muda.

### Mapper (`src/lib/api/services/preco.mapper.ts`)
O corpo do `PUT` é o mesmo do `POST`, com `ativo` dentro de `rotatividade`:
- `PrecoPayload["rotatividade"]` ganha `ativo: boolean`, preenchido com `info.ativo`. **Hoje o cadastro não envia esse campo**, então o switch "Ativo" da primeira etapa é ignorado ao criar. Proposta: enviar `ativo` nos dois casos (o `PUT` do `input.md` o exige; o `POST` provavelmente também o aceita). Se o backend rejeitar o campo na criação, o ajuste fica num só ponto (`toPrecoPayload`). Ponto em aberto 3 do PRD.
- `percentualConveniada`: o cadastro envia `null` quando vazio e o exemplo do `PUT` envia `0`. Mantém `null` até o backend dizer o contrário (ponto em aberto 2 do PRD); a leitura já transforma `0` em vazio (`faixa.percentualConveniada || null`).
- Os ids de `regras`, `faixaValores` e `categorias` **não** vão no corpo: o `PUT` do `input.md` não tem ids e substitui o conjunto completo (RF6 do PRD). `toPrecoFormValues` já os descarta.
- Horários vindos com `horaInicio`/`horaFim` nulos chegam ao formulário como string vazia; a validação existente (`horaInicio`/`horaFim` obrigatórias) obriga o usuário a preenchê-los antes de salvar. Se o negócio definir que nulo significa "dia inteiro", o schema e o mapper mudam juntos (ponto em aberto 5).

### Container (`src/components/precos/PrecoWizard/PrecoWizard.tsx`, Client Component)
```tsx
export function PrecoWizard({ id }: { id?: number })
```
- Sem `id` (cadastro): como hoje (`EMPTY_PRECO_FORM_VALUES`, `createPreco`, `savedFlag="criado"`).
- Com `id`: `useQuery({ queryKey: ["preco", id], queryFn: () => getPreco(id, paginaEmCache), refetchOnWindowFocus: false, gcTime: 0 })`. `gcTime: 0` evita reabrir a edição com dados antigos, já que o formulário lê os valores iniciais uma única vez.
  - `isPending`: esqueleto do `Card` (título, `Stepper` e blocos de `Skeleton`) em `role="status"`.
  - `isError` com `error.kind === "not_found"`: "Tabela de preço não encontrada." + `Link` para `/precos`.
  - `isError` (demais): `ErrorBanner` + "Tentar novamente" (`refetch`) + `Link` de volta.
  - Com dado: monta `<PrecoWizardForm mode="edit" ... />` com `initial = toPrecoFormValues(data)`; `onSave = (values) => updatePreco(id, values)`; `savedFlag="atualizado"`; `invalidateKeys=[["preco", id]]`.
- O formulário só monta com os dados prontos; os valores viram `defaultValues`. Um refetch posterior **não** sobrescreve a edição em andamento (mesma decisão do `EmpresaForm`).

### Wizard (`PrecoWizardForm.tsx`)
Novas props: `mode: "create" | "edit"` (padrão `create`) e, para a edição, `nome: string` e `situacao: SituacaoPreco` (para o cabeçalho).
- **Snapshot original**: `const [original] = useState(initial)`, base estável da comparação.
- **Detecção de alterações**: a flag `isDirty` do TanStack Form não serve para "tem mudança real" (ela fica verdadeira mesmo se o usuário reverter o valor). Nova função `hasChanges(original, current)` em `diff.ts` compara os valores atuais com `original` de forma estrutural (serialização estável: listas de linhas ordenadas por chave, strings já normalizadas). `hasChanges` alimenta:
  - o aviso `beforeunload` e a confirmação ao cancelar (substituindo `isDirty` na edição; no cadastro continua `isDirty`);
  - o texto "Alterações não salvas" no cabeçalho (`aria-live="polite"`);
  - o botão final "Salvar alterações" desabilitado sem mudanças, com o texto "Nenhuma alteração para salvar." visível.
- **Cabeçalho**: título "Editar preço" (cadastro: "Novo preço"), nome da tabela e `StatusBadge` da situação atual. A situação mostrada é a **salva** (não muda enquanto edita).
- **Rótulos**: botão final "Salvar alterações"; sucesso invalida `["precos"]` e `["preco", id]` (mecanismo `invalidateKeys` já existente) e navega para `/precos?salvo=atualizado`. O `Toast` "Tabela de preço atualizada." já está mapeado na listagem.
- **Switch "Ativo" na edição**: `PrecoInfoStepFields` recebe a prop `mode` e mostra o texto de apoio descrito no design (varia com o estado do switch).
- **Aviso de tabela vigente**: implementado atrás de uma constante (`SHOW_VIGENTE_WARNING = false`) até o negócio responder o ponto em aberto 4; sem a resposta, não aparece.

### Comparação "antes → depois" (`src/components/precos/diff.ts`, módulo puro)
```ts
diffPreco(original: PrecoFormValues, current: PrecoFormValues): PrecoDiff
hasChanges(original, current): boolean
```
- `PrecoDiff.info`: lista de `{ campo, rotulo, antes, depois }` para cada campo de `info` que mudou, com valores já formatados (reaproveita `formatBRL`, `formatMinutos`, `formatDataIso`, rótulos de enum de `format.ts`).
- `horarios`, `faixas` e `categorias`: `{ adicionadas: Linha[]; removidas: Linha[] }`. Sem ids, não há como saber qual linha "mudou": a comparação é por **multiconjunto de linhas serializadas**, então uma linha editada conta como uma removida e uma adicionada. Isso simplifica o texto do design ("alterada" vira "removida + adicionada"). Aceitável porque o resultado final enviado é o mesmo.
- `PrecoResumo` ganha `original?: PrecoFormValues`; com ele, renderiza "antes → depois" (valor anterior com `text-decoration: line-through` em `textMuted`, mais texto oculto para leitor de tela: "era X, agora Y"), os contadores por lista e "Nenhuma alteração em relação à tabela salva." Sem `original`, o resumo simples do cadastro permanece.

### Listagem (`PrecosList.tsx`)
- O clique na linha hoje navega para `/precos/{id}`, que ainda não existe. Enquanto a visualização (fase D de `gerenciamento-precos`) não for feita, navegar para `/precos/{id}/editar` (constante `ROW_CLICK_TARGET` isolada em um ponto para trocar depois). O link "Ver" continua levando a `/precos/{id}`.
- Os links "Editar" já apontam para a nova rota.

### Server vs Client
- `page.tsx`: Server Component (apenas `await params`, `notFound()` e composição).
- `PrecoWizard`, `PrecoWizardForm`, `PrecoResumo`, `PrecoInfoStepFields`: Client Components (já são).
- `diff.ts`, mapper, schemas: módulos puros.

## Decisões técnicas e trade-offs
- **Reutilizar o wizard em vez de criar um formulário de edição:** evita duplicar etapas e validações; o custo é o `PrecoWizardForm` ficar mais condicional (`mode`). Mantém-se aceitável porque as diferenças são poucas e localizadas.
- **Substituição completa das listas (sem ids):** simples e coerente com o `PUT` do `input.md`; o risco é o backend recriar linhas (ids novos) a cada salvamento. Se algum dado externo referenciar ids de regras/faixas, é preciso revisar com o backend.
- **`hasChanges` estrutural em vez de `isDirty`:** `isDirty` acusa mudança mesmo após reverter um valor, o que habilitaria "Salvar" à toa e mostraria "Alterações não salvas" indevidamente.
- **Diff por multiconjunto:** sem identificadores estáveis das linhas, é a forma honesta de contar mudanças; evita inventar "alterada" sem base.
- **Snapshot original em `useState`:** garante base estável mesmo se o `initial` for recalculado em re-render.
- **Sem `staleTime` customizado e sem atualização otimista:** uma única edição por vez; após salvar, invalidar basta.
- **Sem biblioteca de comparação:** o projeto não tem `es-toolkit` instalado; uma serialização estável pequena resolve.
- **Aviso de vigência desligado por padrão:** depende de regra de negócio não confirmada.

## Verificação
- `npm run lint` e `npm run build`.
- Manual no navegador (desktop e 375 px, claro e escuro), **sempre numa tabela de teste** (o `PUT` altera dados reais; o exemplo do `input.md` usa a tabela 11, "Tabela padrão - teste 2"):
  - Abrir a edição pela ação "Editar" e pelo clique na linha: dados preenchidos nas 4 etapas.
  - Alterar valor de faixa, remover e adicionar horário/faixa/categoria, salvar, reabrir e conferir.
  - Inativar e reativar; conferir o selo na listagem.
  - Id inexistente (`/precos/999999/editar`) e id inválido (`/precos/abc/editar`); falha de rede ao carregar e ao salvar (dados preservados).
  - Cancelar com e sem alterações; reverter um valor e ver o botão voltar a ficar desabilitado.
  - Tabela com período da diária fora de 6/12/24 horas e com horários sem hora.
  - Conferir no Network o corpo do `PUT` contra o exemplo do `input.md` (com `ativo`, sem `prioridade`, sem ids, `HH:mm:ss`, `null` nos opcionais).

## Riscos / pontos de atenção
- **Busca pela listagem:** tabelas em páginas altas exigem várias requisições para abrir por link direto; se o volume crescer, pedir o endpoint por id.
- **`percentualConveniada` `null` vs `0`:** pode ser rejeitado ou interpretado de forma diferente pelo backend.
- **`ativo` no `POST`:** hoje ignorado ao criar; enviar pode ser aceito ou rejeitado.
- **Edição de tabela em uso:** sem regra de negócio definida (ponto em aberto 4); risco de alterar preço vigente sem aviso.
- **Concorrência:** duas pessoas editando a mesma tabela; o último a salvar vence. Fora de escopo, mas vale registrar.
- **Horários com hora nula:** o formulário obriga a preencher; se o negócio disser que nulo é "dia inteiro", o fluxo muda.
- **Mudança no clique da linha da listagem:** temporária; lembrar de revertê-la quando a visualização existir.
- **Token JWT em `docs/specs/input.md`:** não commitar o arquivo com o token; invalidar o que já foi exposto.

## Fora de escopo técnico
- Visualização somente leitura (`/precos/[id]`).
- Exclusão, histórico/auditoria e detecção de edição concorrente.
- Vínculo com empresa conveniada.
- Erros por campo vindos do backend (apenas `ApiError.message`).
- Testes automatizados (sem runner configurado).
