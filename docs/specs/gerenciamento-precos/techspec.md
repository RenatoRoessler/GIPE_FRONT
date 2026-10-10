# Tech Spec: Gerenciamento de Preços

## Referências
- PRD: ./prd.md
- Design: ./design.md (via skill claude-design). A seção "Design" abaixo só resume o que vira código.
- Camada de comunicação: `docs/INTEGRACAO-BACKEND.md` (`src/lib/api`)
- Contratos recebidos: `docs/specs/input.md` (`GET /rotatividade` e `POST /rotatividade`)
- Padrões reaproveitados: wizard de `src/components/adesao/OnboardingWizard`, serviço/mapper de `src/lib/api/services/empresa*.ts`
- Spec antiga sobreposta: `docs/specs/gestao-precos/` (substituída por esta; ver Riscos)

## Design
- **Telas/estados**: listagem `/precos`; visualização `/precos/[id]`; cadastro `/precos/novo`; edição `/precos/[id]/editar`. Estados de carregamento, vazio, erro, salvando e sucesso conforme `design.md`.
- **Componentes do design system reaproveitados**: `Button`, `Input`, `Select`, `Switch`, `Stepper`, `Card` (com `maxWidth` ampliado), `Text`, `Skeleton`, `Toast`, `ErrorBanner`, `Link`; campos de formulário `TextField`/`SelectField`/`SwitchField` (`src/components/form`).
- **Componentes novos de design system** (`src/components/ui/`, padrão `X.tsx` + `X.styles.ts` + `index.ts`):
  - `Table` (`Table`, `TableHead`, `TableRow`, `TableCell`) e `StatusBadge`: previstos em `docs/specs/gestao-usuarios/design.md` e **ainda inexistentes**. Quem for implementado primeiro cria; `StatusBadge` já nasce com `tone` (`success | neutral | info | warn`).
  - `Pagination`: anterior/próxima, "Página X de Y", "Mostrando a–b de N".
- **Componentes da feature** (`src/components/precos/`): ver Arquitetura.
- **Tokens de tema**: nenhum obrigatório. Possível `colors.info`/`infoSoft` para "Agendada"; se necessário, adicionar nos **quatro** temas de `src/styles/theme.ts` (`lightTheme`, `darkTheme`, `signageLightTheme`, `signageDarkTheme`) e em `ThemeColors`. Alternativa sem token novo: `warn`/`onWarn` já existente.

## Arquitetura da solução

### Rotas (`src/app/(app)/precos/`)
```
page.tsx                 # Server Component → <PrecosList />
novo/page.tsx            # Server Component → <PrecoWizard />
[id]/page.tsx            # Server Component → <PrecoView id={...} />
[id]/editar/page.tsx     # Server Component → <PrecoWizard id={...} />
```
- Em Next 16 `params` é uma `Promise` (ver `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`): `export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; ... }`.
- Validar `id` numérico na página; inválido → `notFound()` (há `src/app/not-found.tsx`).
- As rotas ficam dentro de `(app)` e já são protegidas pelo `proxy.ts`. O item de menu "Gestão de Preços" (`/precos`) já existe em `src/lib/nav.ts` e fica ativo nas rotas filhas (`isNavItemActive`).
- A listagem guarda a página atual na query string (`/precos?pagina=2`), lida em Client Component com `useSearchParams` (em `Suspense`) para que voltar de uma edição preserve a página.

### Tipos e domínio (`src/types/preco.ts`)
- Enums como **objetos `as const`** + tipo união (sem `enum` do TypeScript, mais seguro com o bundler e tree-shaking):
```ts
export const TIPO_REGRA = { Padrao: 1, Convenio: 2, Promocional: 3, Evento: 4 } as const;
export const TIPO_CATEGORIA = { Moto: 1, CarroPequeno: 2, CarroMedio: 3, SuvPickUp: 4, Caminhonete: 5, Caminhao: 6, Todas: 99 } as const;
export type TipoRegra = (typeof TIPO_REGRA)[keyof typeof TIPO_REGRA];
export type TipoCategoria = (typeof TIPO_CATEGORIA)[keyof typeof TIPO_CATEGORIA];
```
- Rótulos em `TIPO_REGRA_OPTIONS` / `TIPO_CATEGORIA_OPTIONS` (`{ value, label }[]`), e `DIAS_SEMANA_PRECO` (1–7). Reaproveitar `DIAS_SEMANA` de `src/types/adesao.ts` **se** o código de dia for o mesmo (1 = domingo ou segunda, a confirmar); caso contrário, tabela própria. Esse código aparece no GET de preço (`diaSemana: 1..7`) e na adesão (`diaDaSemana`), e a equivalência precisa ser verificada antes de compartilhar.
- **Modelo de formulário** (strings para campos digitados, evita `NaN` e preserva máscara):
```ts
interface PrecoInfoValues { descricao; tipoRegra: string; inicioVigencia: string /* datetime-local */; fimVigencia: string; toleranciaEntradaMinutos: string; toleranciaAlteracaoFaixaMinutos: string; periodoDiaria: string; valorDiaria: string; valorAdicionalDiaria: string; ativo: boolean; empresaConveniadaId: null }
interface PrecoHorarioValues { diaSemana: string; horaInicio: string; horaFim: string; dataInicio: string; dataFim: string; ativo: boolean }
interface PrecoFaixaValues { minutosLimite: string; valor: string; percentualConveniada: string }
type PrecoCategoriaValues = TipoCategoria[]
interface PrecoFormValues { info; horarios: PrecoHorarioValues[]; faixas: PrecoFaixaValues[]; categorias: TipoCategoria[] }
```
- **Modelo de leitura** (`PrecoView`): resposta tipada do GET com datas como `string` ISO e números como `number`, mais campos derivados no mapper (`situacao`, `vigenciaLabel`).
- `EMPTY_PRECO_FORM_VALUES` com `tipoRegra: "1"`, `ativo: true`, tolerâncias `"0"`.

### Serviço e mapeamento (`src/lib/api/services/`)
```
preco.ts          # listPrecos, getPreco, createPreco, updatePreco
preco.mapper.ts   # DTOs + fromPrecoResponse, toPrecoPayload, toPrecoFormValues (funções puras)
```
- `baseURL` já inclui `/api/v1`; caminhos: `GET /rotatividade?pagina=&tamanhoPagina=`, `POST /rotatividade`. Token anexado pelo interceptor de `client.ts`; erros sobem como `ApiError` (nenhum `try/catch` no serviço).
```ts
listPrecos(params: { pagina: number; tamanhoPagina: number }): Promise<Paginado<PrecoView>>
getPreco(id: number): Promise<PrecoView>
createPreco(values: PrecoFormValues): Promise<void>
updatePreco(id: number, values: PrecoFormValues): Promise<void>
```
- `Paginado<T> = { items: T[]; page: number; pageSize: number; totalRecords: number; totalPages: number }` (formato confirmado no `input.md`; tipo genérico em `src/lib/api/types.ts`, pois será reutilizado por outras listagens).
- **Leitura**: `fromPrecoResponse(dto)` tolerante a campos ausentes (padrão de `fromEmpresaResponse`). Pontos específicos:
  - `tipoRegra` fora do enum (`0` na listagem de exemplo) → `null` (UI mostra "—"); não quebra a tela.
  - `regras[].horaInicio/horaFim` `null` → mantido `null`; UI interpreta como "Dia inteiro" **somente após confirmação** (ponto em aberto 4 do PRD).
  - `faixaValores` ordenado por `minutosLimite`; `regras` por `diaSemana`; ids da API (`rotatividadeRegraId` etc.) preservados no modelo de leitura, mas **não** vão para o formulário.
  - **Situação** derivada no mapper com uma função pura `getSituacao(ativo, inicio, fim, agora)` → `"vigente" | "agendada" | "encerrada" | "inativa"`. `agora` vem por parâmetro (testável; evita `Date.now()` dentro do mapper).
  - Datas sem fuso (`"2026-06-06T17:00:52.474"`) são interpretadas como horário local; formatadas com `Intl.DateTimeFormat("pt-BR")` (sem lib de data). **Não** usar `new Date(str)` com fuso implícito para comparar sem checar: strings ISO sem `Z` são locais, o que é o desejado aqui.
- **Escrita**: `toPrecoPayload(values)` monta o corpo do `POST` do `input.md`:
  - `rotatividade { empresaConveniadaId: null, descricao, inicioVigencia, fimVigencia, toleranciaEntradaMinutos, toleranciaAlteracaoFaixaMinutos, periodoDiaria, valorDiaria, valorAdicionalDiaria, tipoRegra }` (note: `ativo` e `empresaConveniadaId` seguem a premissa abaixo).
  - `regras[] { diaSemana, horaInicio, horaFim, dataInicio, dataFim, ativo }`, com `"HH:mm"` → `"HH:mm:00"` e string vazia → `null`.
  - `faixaValores[] { minutosLimite, valor, percentualConveniada }`; percentual vazio → `null`.
  - `categorias[] { tipoCategoria }`.
  - Números via `Number()` após validação; valores monetários aceitam vírgula (`"15,50"` → `15.5`) por helper em `src/lib/money.ts`.
  - `datetime-local` (`"2026-10-15T00:00"`) → `"2026-10-15T00:00:00"`; vazio → `null`.
- `toPrecoFormValues(view)` faz o caminho inverso para a edição (números → string, `"HH:mm:ss"` → `"HH:mm"`, ISO → `datetime-local`, remove ids).
- **Premissas de contrato a confirmar (bloqueiam a edição, não a listagem/criação):**
  1. **Edição:** assumido `PUT /rotatividade/{id}` com o mesmo corpo do `POST` e substituição completa de `regras`, `faixaValores` e `categorias`.
  2. **Detalhe:** assumido `GET /rotatividade/{id}` com o mesmo formato de um item da lista. Se não existir, o fallback é buscar a página da lista e filtrar (frágil), então é preciso confirmar com o backend.
  3. **`ativo`:** o `POST` do exemplo não envia `ativo` na `rotatividade` (só nas `regras`), embora o PRD peça o campo na etapa 1. Confirmar se o backend aceita `ativo` no corpo; se não, o `Switch` da etapa 1 sai (ou só aparece na edição).
  4. **Prioridade:** removida da interface e do corpo do `POST`; confirmar que o backend aceita a ausência (assume valor padrão). O `tipoRegra` segue dentro de `rotatividade`.

### Validação (`src/lib/schemas/preco.ts`, zod v4)
Quatro schemas, um por etapa, mais um `precoSchema` composto para revalidar tudo antes do envio:
- `precoInfoSchema`: `descricao` obrigatória (máx. a confirmar); `tipoRegra` ∈ enum; tolerâncias inteiros ≥ 0; `periodoDiaria` inteiro > 0; `valorDiaria`/`valorAdicionalDiaria` ≥ 0; `inicioVigencia` obrigatório; `fimVigencia` opcional e, se informado, **posterior** a `inicioVigencia` (`superRefine`, erro no campo `fimVigencia`).
- `precoHorariosSchema` (array, mín. 1): `diaSemana` 1–7, `horaFim` > `horaInicio` quando ambos informados (horário que atravessa a meia-noite fora de escopo), `dataFim` ≥ `dataInicio`, **sem linhas duplicadas** de mesmo dia + mesmo horário.
- `precoFaixasSchema` (array, mín. 1): `minutosLimite` inteiro > 0 e **único**, `valor` ≥ 0, `percentualConveniada` 0–100 se informado; valores devem ser **não decrescentes** conforme os minutos aumentam (regra a confirmar com o negócio; começa como *aviso*, não bloqueio).
- `precoCategoriasSchema` (mín. 1): se contiver `99` (Todas), nenhuma outra categoria.
- Mensagens de erro em português, chaves de campo via `zodFieldErrors` (`horarios[2].horaFim` etc.), como na adesão.
- Regra do PRD aberta (ponto 5): mínimos e ordenações acima são **premissas** isoladas nos schemas; ajustar lá sem tocar nos componentes.

### Componentes da feature (`src/components/precos/`) — todos Client Components
```
PrecosList/        PrecosList.tsx, PrecosList.styles.ts, index.ts   # useQuery + Table + Pagination
PrecoView/         PrecoView.tsx, PrecoView.styles.ts, index.ts     # detalhe somente leitura
PrecoWizard/       PrecoWizard.tsx, PrecoWizard.styles.ts, index.ts # container: carrega (edição) e monta o formulário
                   PrecoWizardForm.tsx                              # recebe initial por prop, orquestra os 4 passos
PrecoInfoStepFields/       # etapa 1 (withForm)
PrecoHorariosStepFields/   # etapa 2 (linhas repetíveis)
PrecoFaixasStepFields/     # etapa 3 (linhas repetíveis + FaixasPreview)
PrecoCategoriasStepFields/ # etapa 4 (chips + resumo)
FaixasPreview/     # "placa tarifária", reutilizada na etapa 3, etapa 4 e PrecoView
format.ts          # formatMinutos(90) → "1 h 30 min", formatBRL, formatVigencia, labels de enum
```
- **`PrecosList`**: `useQuery({ queryKey: ["precos", pagina], queryFn: () => listPrecos({ pagina, tamanhoPagina: 20 }), placeholderData: keepPreviousData })`. Com `keepPreviousData`, trocar de página mantém a tabela anterior com indicador de carregamento, sem "piscar" vazia. `tamanhoPagina` fixo em 20 (constante), igual ao exemplo.
  - Mudança de página: `router.replace(\`/precos?pagina=${n}\`, { scroll: false })` e foco no cabeçalho da tabela.
  - Se `pagina > totalPages` (ex.: após alteração de dados), redirecionar para a última página.
- **`PrecoView`**: `useQuery(["preco", id], () => getPreco(id))`; 404 (`ApiError.kind === "not_found"`) → estado "não encontrado".
- **`PrecoWizard`**:
  - Criação: renderiza `PrecoWizardForm` com `EMPTY_PRECO_FORM_VALUES`.
  - Edição: `useQuery(["preco", id])`; **só monta** `PrecoWizardForm` quando há dado, passando `toPrecoFormValues(data)` como `initial`. Os valores viram `defaultValues`, então um refetch não apaga edições (mesma decisão de `EmpresaForm`).
- **`PrecoWizardForm`** segue o `OnboardingWizard`: estado `step` (1–4), um `useAppForm` por etapa com `validators.onChange` via zod + `zodFieldErrors`, `Stepper`, foco na descrição da etapa ao trocar. Diferenças:
  - Etapas 2 e 3 usam `form.Field name="horarios" mode="array"` (`pushValue`, `removeValue`, `replaceValue`) com subcampos `horarios[i].diaSemana`, etc.
  - Etapa 4: `categorias` como campo array de números, com a regra "Todas" aplicada em `handleChange` (não só na validação).
  - Valor final = união dos quatro `state.values`; no último passo, `precoSchema.safeParse` completo antes de chamar a mutação. Se houver erro em etapa anterior (ex.: edição de data na etapa 1 invalida a regra de outra), volta à primeira etapa com erro.
  - `useMutation({ mutationFn })` chama `createPreco` ou `updatePreco(id, ...)`. `onSuccess`: `queryClient.invalidateQueries({ queryKey: ["precos"] })` (e `["preco", id]` na edição), `router.push("/precos")` e Toast "Tabela de preço criada/atualizada." (o Toast é exibido na listagem: passar por query string `?salvo=criado|atualizado`, lida uma vez e removida com `router.replace`, ou pelo contexto de toast se existir, para o aviso sobreviver à navegação).
  - `onError`: `ErrorBanner role="alert"` com `mutation.error.message`; dados preservados.
  - **Descarte**: botão "Cancelar" e navegação com formulário alterado pedem confirmação (`window.confirm` na v1, sem componente de diálogo novo) e `beforeunload` enquanto houver alteração. Isto **substitui** o diálogo do design.md por algo mais simples; se for importante, criar `ConfirmDialog` em `ui/` depois.
- **Tabela responsiva**: `TableCell` recebe `data-label` e o CSS em `breakpoints.sm` converte linha em cartão, como definido em `gestao-usuarios/design.md`. Valores numéricos com `font-variant-numeric: tabular-nums`.
- **Campos desabilitados**: `empresaConveniadaId` renderizado como `Select disabled` com uma opção "Nenhuma"; **não** é gravado no formulário nem enviado preenchido (payload fixo `null`).

### Server vs Client
- `page.tsx` das quatro rotas: Server Components (apenas `await params`, `notFound()` e composição).
- Todos os componentes de `src/components/precos/` e `Pagination`: Client Components (estado, hooks, query).
- `Table`, `StatusBadge`: podem ser componentes sem `"use client"` (puramente presentacionais), mas, como os demais `ui/`, seguir o padrão existente de cada um (alguns já são `"use client"` por usarem styled-components com tema).
- `preco.mapper.ts`, `schemas/preco.ts`, `format.ts`, `money.ts`: módulos puros.

### Estilo
- `styled-components` com transient props (`$variant`, `$tone`, `$open`), tokens de `theme` e **registro SSR** já existente (`src/lib/registry.tsx`), sem estilos soltos. Layout dos formulários via `FormGrid.styles.ts` (`src/components/adesao/shared`); se for reaproveitado, mover para `src/components/form/` em vez de importar entre features.

## Decisões técnicas e trade-offs
- **Rotas separadas (`/novo`, `/[id]`, `/[id]/editar`) em vez de modais/drawer:** URLs compartilháveis, voltar do navegador funciona, e o wizard de 4 etapas é pesado demais para modal. Custo: 4 `page.tsx` finas.
- **Um `useAppForm` por etapa** (padrão da adesão) em vez de um formulário único: reaproveita `withForm`, `zodFieldErrors` e o fluxo de "validar e avançar" já provados. Custo: o valor final é montado juntando os quatro estados.
- **Strings no modelo de formulário, números só no payload:** máscaras, vírgula decimal e campo vazio ficam sob controle; conversão e erro de `NaN` isolados no mapper/zod.
- **Enums como `as const`, não `enum`:** sem código gerado, tipo união inferido, compatível com a configuração do projeto.
- **`keepPreviousData` na paginação:** UX sem flicker; custo é mostrar dados "antigos" por instantes durante a troca.
- **Paginação por query string:** estado compartilhável e preservado ao voltar da edição; custo: `Suspense` por causa de `useSearchParams`.
- **`Table`/`StatusBadge` genéricos e compartilhados com Usuários:** evita duas implementações; custo é acoplar a ordem de implementação das duas features (resolvido: quem vier primeiro cria).
- **Sem biblioteca de datas, de máscara monetária ou de modal:** `Intl` + helper próprio de BRL; `window.confirm` na v1. Adicionar dependência só se aparecer necessidade real.
- **Sem testes automatizados:** o projeto ainda não tem runner (`vitest` aparece como skill, mas não está no `package.json`). Mapper, schemas e `getSituacao` ficam puros e prontos para teste.

## Verificação
- `npm run lint` e `npm run build` (obrigatórios antes de fechar).
- Manual no navegador, desktop e 375 px, tema claro e escuro:
  - Listagem com 0, 1 e >20 registros (paginação nos extremos), página inválida na URL, falha de rede.
  - Visualização de registro com horários nulos, com `tipoRegra: 0`, com várias faixas.
  - Cadastro: cada regra de validação, "Todas" vs. demais categorias, "Aplicar a todos os dias", voltar/avançar sem perder dados, clique duplo em Salvar, erro 4xx/5xx do backend.
  - Edição (quando o contrato for confirmado): campos pré-preenchidos, salvar, recarregar e conferir.
  - Conferir no Network o corpo do `POST` contra o exemplo do `input.md` (`HH:mm:ss`, `null` nos opcionais, `percentualConveniada: null`).
- **Atenção:** o `POST` cria dados reais no ambiente do token usado; usar ambiente de teste/homologação.

## Riscos / pontos de atenção
- **Edição e detalhe sem endpoint documentado** (bloqueio): sem `PUT /rotatividade/{id}` e `GET /rotatividade/{id}` o fluxo de edição/visualização não fecha. A entrega pode ser fatiada: listagem + cadastro primeiro; visualização/edição depois da confirmação do backend.
- **Semântica de `regras` na edição:** se o `PUT` exigir os ids (`rotatividadeRegraId`, `rotatividadeValorId`) para atualizar/excluir itens, o `PrecoFormValues` precisa carregá-los. A decisão de descartar ids vale apenas para substituição completa.
- **`ativo` da tabela:** o exemplo de `POST` não o envia (ver premissa 3); sem confirmação, não há como inativar uma tabela pela interface.
- **Enum divergente:** `tipoRegra: 0` na listagem; categorias do `input.md` (Moto, Carro pequeno/médio, SUV/Pick-up, Caminhonete, Caminhão, Todas) diferem da spec antiga `gestao-precos` (Carro, Moto, Caminhonete, SUV, Todas). Esta spec adota a do `input.md`; **arquivar a spec antiga** para não gerar tasks conflitantes.
- **Fuso e datas:** API devolve datas sem fuso. Qualquer conversão para `Date` + `toISOString()` deslocaria horários; manter strings locais de ponta a ponta e só formatar para exibição.
- **Código do dia da semana:** a equivalência entre `diaSemana` (preço) e `diaDaSemana` (adesão) deve ser confirmada antes de compartilhar a constante.
- **Componentes compartilhados ainda inexistentes** (`Table`, `StatusBadge`): atrasar a feature de Usuários ou esta se a ordem não for combinada.
- **Foco e leitores de tela** em linhas repetíveis (adicionar/remover): é o ponto mais provável de retrabalho de acessibilidade.
- **Token JWT real em `docs/specs/input.md`:** não commitar o arquivo como está; invalidar/remover o token e nunca copiá-lo para código, docs ou logs.
- **Desempenho:** a resposta da listagem já traz regras, faixas e categorias de cada item (payload grande por página). Com 20 itens é aceitável; reavaliar se `tamanhoPagina` aumentar.

## Fora de escopo técnico
- Vínculo e seleção de empresa conveniada (campo desabilitado; nenhum serviço de empresas conveniadas).
- Exclusão, duplicação e histórico/auditoria de tabelas de preço.
- Filtros, busca e ordenação interativa na listagem.
- Simulador de cobrança (cálculo de valor).
- Horários que atravessam a meia-noite e múltiplos intervalos por dia.
- Controle de acesso por perfil no front (depende de sessão real e da spec de permissões); o backend segue como barreira.
- Testes automatizados (sem runner configurado).
- Erros por campo vindos do backend (apenas `ApiError.message`).
