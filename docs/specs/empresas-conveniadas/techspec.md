# Tech Spec: Empresas Conveniadas

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-29  
**PRD:** ./prd.md  
**Design:** ./design.md

> Convenções: segue o `CLAUDE.md` e os padrões já usados em Mensalistas e Usuários (tipos em `src/types`, serviços e mappers em `src/lib/api/services`, schemas em `src/lib/schemas`, componentes em `src/components/<feature>`). Contrato das APIs em `docs/specs/input.md`.

## Referências
- PRD: ./prd.md
- Design: ./design.md (esta spec referencia, não redefine)

## Design
- **Telas/estados:** listagem (`/empresas-conveniadas`) e cadastro (`/empresas-conveniadas/nova`), com os estados do `design.md`.
- **Componentes do design system reaproveitados:** `Table`, `StatusBadge`, `Skeleton`, `OptionGroup`, `Button`, `Input`, `Select`, `Card`, `Text`, `ErrorBanner`, `Toast`, `ConfirmDialog`.
- **Componentes novos de `ui`:** nenhum. O `EmptyState` tracejado hoje mora em `components/mensalistas/Mensalistas.styles.ts`; as demais peças de lista (`Page`, `Header`, `TableArea`, `SkeletonRows`, `ErrorArea`, `SubText`, `Primary`) também. Decisão na task 1: promover o que for idêntico para `src/components/ui/ListPage` (sem mudança visual em Mensalistas) ou, se a extração mexer em estilo, replicar o mínimo em `Conveniadas.styles.ts`.
- **Tokens de tema:** só os existentes (`surface`, `border`, `textMuted`, `danger`, `success`, `primary`, `focus`, `space`, `radii`, `breakpoints`). Nenhum token novo.

## Arquitetura da solução

### Estrutura de pastas

```
src/
├── app/(app)/empresas-conveniadas/
│   ├── page.tsx                          # Server Component: metadata + <ConveniadasPage /> em Suspense
│   └── nova/
│       └── page.tsx                      # Server Component: metadata + <NovaConveniada />
├── components/conveniadas/
│   ├── ConveniadasPage/
│   │   ├── ConveniadasPage.tsx           # Client: cabeçalho, filtro, lista, toast
│   │   └── index.ts
│   ├── ConveniadasList/
│   │   ├── ConveniadasList.tsx           # Client: Table + estados (carregando, vazio, erro, 403)
│   │   └── index.ts
│   ├── NovaConveniada/
│   │   ├── NovaConveniada.tsx            # Client: formulário em página, mutation, descarte
│   │   └── index.ts
│   ├── ConveniadaEmpresaFields.tsx       # seção "Empresa" (withForm)
│   ├── ConveniadaResponsavelFields.tsx   # seção "Responsável" (withForm)
│   ├── Conveniadas.styles.ts
│   ├── situacao.ts                       # parse/serialização do filtro <-> ?situacao=
│   ├── mensagens.ts                      # texto do Toast a partir da resposta do POST
│   ├── format.ts                         # nome exibido, endereço resumido
│   ├── conveniadasKeys.ts                # query keys
│   ├── useConveniadas.ts                 # useQuery da lista por filtro
│   └── useCadastrarConveniada.ts         # useMutation + invalidação da lista
├── lib/
│   ├── api/services/
│   │   ├── conveniada.ts                 # GET e POST /Empresa/conveniada
│   │   └── conveniada.mapper.ts          # DTO <-> tipos, payload
│   ├── schemas/conveniada.ts             # schema Zod do formulário
│   ├── permissoes.ts                     # + AREA.Conveniadas, padrão e rota
│   └── nav.ts                            # + item "Empresas conveniadas"
├── components/layout/NavSign/NavIcons.tsx  # ícone novo ou reaproveitado (ver decisões)
└── types/conveniada.ts
```

Arquivos de teste acompanham cada módulo (`*.test.ts(x)`), como no resto do projeto.

### Tipos e dados (`src/types/conveniada.ts`)

```ts
// Item da listagem: GET /Empresa/conveniada (uma linha por convênio)
export type Conveniada = {
  empresaConvenioId: number;
  empresaConveniadaId: number;
  empresaGuid: string;
  razaoSocial: string;
  nomeFantasia: string;           // "" quando ausente
  cnpj: string;                   // só dígitos
  telefone: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  ativo: boolean;                 // situação do convênio
  dataCriacao: string;            // ISO, cadastro do convênio
};
```

> **[A CONFIRMAR]** O `input.md` diz "endereço (logradouro, numero, bairro, cidade, estado, cep)" sem dizer se vem aninhado em `endereco` ou plano. O mapper aceita os dois formatos (`dto.endereco ?? dto`), como o mapper de empresa trata o dado.

```ts
export type SituacaoFiltro = "todos" | "ativos" | "encerrados";

// Corpo do POST /Empresa/conveniada. Sem tipoEmpresa: o back grava sempre 5 (Conveniada).
export type ConveniadaPayload = {
  empresa: {
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;                 // só dígitos (o back aceita com ou sem máscara)
    telefone: string;
    endereco: EnderecoPayload;    // reaproveita o tipo de adesao.mapper
  };
  usuario: { nome: string; cpf: string; email: string; celular: string };
};

// Resposta do POST
export type ConveniadaResultado = {
  empresaConveniadaId: number;
  empresaGuid: string;
  novaEmpresa: boolean;
  usuarioId: number;
  novoUsuario: boolean;
};

// Valores do formulário (strings, com máscara na tela)
export type ConveniadaFormValues = {
  cnpj: string; telefone: string; razaoSocial: string; nomeFantasia: string;
  cep: string; logradouro: string; numero: string; bairro: string; cidade: string; estado: string;
  usuarioNome: string; usuarioCpf: string; usuarioEmail: string; usuarioCelular: string;
};
export const EMPTY_CONVENIADA_FORM: ConveniadaFormValues = { /* todos "" */ };
```

### Serviço (`conveniada.ts`)

```ts
listConveniadas(situacao: SituacaoFiltro): Promise<Conveniada[]>
// GET /Empresa/conveniada ; "ativos" -> params { ativo: true }, "encerrados" -> { ativo: false }, "todos" -> sem parâmetro.
// O back devolve a lista inteira, sem paginação.

cadastrarConveniada(values: ConveniadaFormValues): Promise<ConveniadaResultado>
// POST /Empresa/conveniada com toConveniadaPayload(values). Erros sobem como ApiError (client.ts).
```

O mapper (`conveniada.mapper.ts`) faz `fromConveniadaResponse` (tolerante a campos ausentes, CNPJ/telefone só dígitos) e `toConveniadaPayload` (trim, `onlyDigits` em CNPJ/CPF/celular, `formatCEP` no CEP, mesmo critério do `toEnderecoPayload` de adesão, que recebe `CompanyData`; aqui monta o endereço a partir dos campos do formulário sem depender desse tipo).

### Schema (`lib/schemas/conveniada.ts`)

Zod, mensagens no padrão de `adesao.ts` e `usuario.ts`:
- `cnpj`: obrigatório, `isValidCNPJ`; `razaoSocial`: obrigatória; `nomeFantasia`: opcional (`trim`, sem `min`); `telefone`: obrigatório, `isValidPhone`.
- Endereço: `cep` (`isValidCEP`), `logradouro`, `numero`, `bairro`, `cidade` obrigatórios; `estado` em `SIGLAS_ESTADOS`.
- Responsável: `usuarioNome` obrigatório (máx. `USUARIO_NOME_MAX`), `usuarioCpf` com `isValidCPF`, `usuarioEmail` com `isValidEmail` (máx. `USUARIO_EMAIL_MAX`), `usuarioCelular` com `isValidCelular`.

Os schemas de `adesao.ts` não servem direto (exigem `tipoEmpresa`, vagas e nome fantasia obrigatório), então este é novo e importa só os validadores de `lib/*`.

### Server vs Client

| Peça | Tipo | Motivo |
|------|------|--------|
| `app/.../page.tsx` (lista e nova) | Server | Só `metadata` e composição; a lista usa `<Suspense>` por causa de `useSearchParams`. |
| `ConveniadasPage`, `ConveniadasList` | Client | TanStack Query, URL (`useSearchParams`), estado de toast. |
| `NovaConveniada` e seções de campos | Client | `useAppForm`, `useCepLookup`, `useRouter`. |
| `situacao.ts`, `mensagens.ts`, `format.ts`, mapper, schema | Módulos puros | Testáveis sem React. |

### Fluxo de dados

- **Lista:** `useConveniadas(situacao)` com `queryKey: ["conveniadas", situacao]`, `refetchOnWindowFocus: false`. O filtro vem de `?situacao=` (`parseSituacao`; valor desconhecido vira `todos`); trocar o filtro faz `router.replace` e mantém os dados anteriores (`placeholderData: keepPreviousData`) para o estado "atualizando" do design.
- **Cadastro:** `useCadastrarConveniada` chama `cadastrarConveniada`; em `onSuccess` invalida `["conveniadas"]`, guarda a mensagem e faz `router.push("/empresas-conveniadas")`. Para o toast sobreviver à navegação, a mensagem vai por `sessionStorage` (com try/catch) lida e apagada pela `ConveniadasPage` na montagem. Alternativa mais simples, preferida se não houver precedente no projeto: `?cadastro=<novaEmpresa>-<novoUsuario>` na URL de retorno, lido uma vez e limpo com `router.replace`. A task 3 escolhe conforme o padrão de redirecionamento com toast já usado em `NovaEmpresa`/`EmpresaCriada`.
- **Formulário:** `useAppForm` (TanStack Form) com validação pelo schema Zod, no mesmo padrão de `useEmpresaForms`. Seções `withForm` reaproveitam `Input`, `formatCNPJ`, `formatPhone`, `formatCEP`, `formatCPF`, `ESTADOS` e o grid de `components/form/FormGrid.styles`.
- **CEP:** `useCepLookup` com a mesma regra do `CompanyStepFields` (campos que a consulta não trouxe mantêm o digitado; número nunca preenchido; dicas de estado). A lógica de `cepHint` e do preenchimento é pequena; **não** refatorar `CompanyStepFields` nesta entrega. Duplicar o mínimo em `ConveniadaEmpresaFields` e registrar a extração para um `EnderecoFields` compartilhado como melhoria futura.
- **Erros do POST:** o back devolve a mensagem de regra de negócio (400) e o client a coloca em `ApiError.message` (ordem `message` → `detail` → `errors[0]`). A tela mostra essa mensagem no `ErrorBanner`, como `NovoUsuarioModal`, sem inventar texto próprio, **exceto** quando o formato permitir identificar com segurança o caso (ver riscos). Dados do formulário são preservados porque a navegação só ocorre no sucesso.
- **Descarte:** `ConfirmDialog` quando `form.state.isDirty` e o usuário aciona "Cancelar"/"Voltar"; `beforeunload` não entra (fora do padrão atual).

### Permissões e navegação

- `permissoes.ts`: `AREA.Conveniadas = "conveniadas"`; `PERMISSOES_PADRAO[AREA.Conveniadas] = [Administrador]` (conforme `input.md`); `AREA_POR_ROTA` ganha `["/empresas-conveniadas", AREA.Conveniadas]`. Atualizar `permissoes.test.ts`.
- `nav.ts`: item `{ label: "Empresas conveniadas", shortLabel: "Conveniadas", href: "/empresas-conveniadas", icon: ..., area: AREA.Conveniadas }`, após "Mensalistas". Atualizar `nav.test.ts` e `BottomNav.test.tsx` se dependerem da contagem de itens.
- `Record<Area, ...>` torna o TypeScript obrigatório em apontar todo lugar que precisa tratar a área nova; rodar `tsc`/`lint` para achar.
- A enforcement da rota é a mesma das demais (`areaDaRota` no layout `(app)`); não há guarda nova. A permissão do back (403) continua tratada na lista com `ErroSemPermissao`.

## Decisões técnicas e trade-offs

1. **Formulário em página, não modal** (decisão do usuário no PRD): rota própria `nova`, como `/minha-empresa/nova`. O custo é a mensagem de sucesso atravessar a navegação (ver fluxo).
2. **Sem paginação nem busca:** o back devolve a lista inteira e o PRD deixa a paginação como `[A DEFINIR]`; fica igual a `Usuarios` e `Tipos`. Se o volume crescer, filtrar no cliente primeiro; paginação depende do back.
3. **Filtro no servidor** (`ativo=true|false`) em vez de filtrar no cliente: o contrato oferece o parâmetro e a chave de cache por filtro evita trazer tudo quando não precisa. Com `keepPreviousData` a troca não pisca.
4. **Schema próprio** em vez de reaproveitar `companySchema`/`adminUserSchema`: os de adesão carregam campos que não existem aqui (tipo de empresa, vagas, senha). Compartilham-se só os validadores de `lib/`.
5. **Mensagem do back no erro, sem mapeamento por texto:** inferir o caso (CNPJ de outro tipo, convênio ativo, e-mail) a partir do texto exige confiar em strings do back. O design prevê textos próprios; a spec adota o texto do back por padrão e só troca por texto próprio se o back passar a devolver um código estável (`errors[].code`). O erro do e-mail aparece no `ErrorBanner` até haver esse código.
6. **Toast com duas frases** montado por `mensagens.ts` a partir de `novaEmpresa` e `novoUsuario`, função pura e testável.
7. **Duplicação mínima do CEP** em vez de refatorar adesão, para não ampliar o escopo nem arriscar regressão no onboarding.
8. **Ícone do menu:** reaproveitar o ícone `company` se não houver um melhor; criar um novo (`NavIconId`) só se a barra inferior ficar ambígua entre "Empresa" e "Conveniadas". Decisão visual na task de navegação.

## Riscos / pontos de atenção

- **RF-08 "convênio reativado":** a resposta do POST (`empresaConveniadaId`, `empresaGuid`, `novaEmpresa`, `usuarioId`, `novoUsuario`) **não informa** se o convênio foi reativado nem se foi criado agora. A tela não consegue distingui-lo. Opções: (a) pedir ao back um campo (`convenioReativado`); (b) aceitar a mensagem genérica "Convênio registrado." nesta entrega. **Recomendação:** (b) agora e abrir pedido ao back; o critério do PRD correspondente fica parcialmente atendido até lá. Precisa de decisão do produto.
- **Formato do endereço no GET** (aninhado ou plano) e do `dataCriacao`: [A CONFIRMAR]; mapper tolerante e testado com os dois formatos.
- **Códigos de erro estáveis:** sem eles, o design de mensagens por caso (item 2 do `design.md`) não é garantido; ver decisão 5.
- **Permissão por módulo:** a tela de permissões depende de a nova `Area` existir no back; se o back não conhecer `conveniadas`, a sobrescrita não terá efeito e vale o padrão (Administrador). Confirmar o identificador do módulo com o back.
- **Perfil `AdministradorConveniada`** (5) recebe o acesso ao cadastrar: ele não deve ver esta tela, e o padrão (`[Administrador]`) já o exclui. Cobrir em teste de permissões.
- **Dados pessoais:** CPF, e-mail e celular não podem ir para log, URL nem `sessionStorage`; só a mensagem do toast (sem dados) atravessa a navegação.
- **Duplo envio:** botão desabilitado durante a mutation; o back rejeita convênio já ativo com 400, o que cobre a corrida.
- **Reuso de estilos de lista:** extrair de Mensalistas pode alterar a tela existente; mitigação: só extrair o idêntico e rodar os testes de Mensalistas.

## Fora de escopo técnico
- Editar conveniada ou responsável; encerrar/reativar convênio por ação própria (sem endpoint no `input.md`).
- Paginação e busca textual na lista.
- Refatorar `CompanyStepFields`/adesão para extrair `EnderecoFields`.
- Uso do convênio na operação do pátio (desconto, cobrança).
- Novo componente de design system ou novos tokens de tema.
- Mock/serviço fake: a integração é direta com a API real.

## Testes previstos
- **Unitários (Vitest):** `conveniada.mapper` (DTO com endereço aninhado/plano, payload só dígitos), `schemas/conveniada` (CNPJ/CPF inválidos, nome fantasia opcional), `situacao` (parse e serialização), `mensagens` (4 combinações de `novaEmpresa`/`novoUsuario`), `format`, `permissoes` e `nav` (Administrador sim; Gerente, Caixa e AdministradorConveniada não).
- **Serviço:** `conveniada.ts` com o client mockado (parâmetro `ativo` por filtro, payload do POST, propagação de `ApiError`).
- **Componentes (Testing Library):** `ConveniadasList` (carregando, lista, vazio com e sem filtro, erro com retry, 403), `NovaConveniada` (validação, envio, erro mantendo dados, descarte com confirmação, preenchimento por CEP).
- Antes de concluir: `npm run lint` e `npm run build`.
