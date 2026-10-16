# Tech Spec: Gestão de Mensalistas

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-15  
**PRD:** ./prd.md  
**Design:** ./design.md

> Convenções: este repositório segue o `CLAUDE.md` (Next.js App Router + TypeScript + styled-components; tipos em `src/types`, serviços em `src/lib/api/services`, componentes em `src/components/<feature>`). O template da skill sugere `src/features/` e prefixo `I` nas interfaces, o que **não** é o padrão daqui; seguimos o padrão do projeto. Não há `GUIDELINE.md`. A consulta ao Context7 não estava disponível, então as decisões abaixo se apoiam no código existente (padrão `PrecosList`, `useModelos`, `useAppForm`) e no contrato do `docs/specs/input.md`.

## 1. Visão Técnica

Uma rota `/mensalistas` com duas abas (mensalistas e tipos). Dados via TanStack Query (já usado em Preços e Caixa), formulários em modal via `useAppForm` + Zod (padrão da entrada de veículos), UI com os componentes de `src/components/ui`. Estado de servidor fica no cache do React Query; estado de UI (aba, página, busca, modal aberto) fica local e, quando faz sentido compartilhar por link, na URL (`aba`, `pagina`). Sem Zustand/Context novos.

Pontos centrais:
- **Aba e página na URL** (`?aba=tipos&pagina=2`), como `PrecosList` faz com `pagina`.
- **Busca por documento** é estado local com debounce (o documento não vai para a URL, por privacidade).
- **Mapeamento de valores** (máscaras, só dígitos, número do tipo) fica em funções puras testáveis, separadas dos componentes.
- **Novo componente de design system `Tabs`**; todo o resto reaproveita o que existe.
- **Bloqueio na edição**: tipo de pessoa e documento ficam desabilitados e são reenviados com o valor atual (decisão do usuário), porque o `PUT` exige todos os campos.

## 2. Estrutura de Pastas

```
src/
├── app/(app)/mensalistas/
│   └── page.tsx                         # Server Component: metadata + <MensalistasPage />
├── components/
│   ├── ui/Tabs/
│   │   ├── Tabs.tsx
│   │   ├── Tabs.styles.ts
│   │   └── index.ts
│   ├── layout/NavSign/NavIcons.tsx      # + ícone "members"
│   └── mensalistas/
│       ├── MensalistasPage/
│       │   ├── MensalistasPage.tsx      # cabeçalho, abas, toast, modais
│       │   └── index.ts
│       ├── MensalistasList/             # aba Mensalistas (busca + tabela + paginação)
│       │   ├── MensalistasList.tsx
│       │   └── index.ts
│       ├── TiposList/                   # aba Tipos de mensalidade
│       │   ├── TiposList.tsx
│       │   └── index.ts
│       ├── MensalistaModal/             # criar/editar mensalista
│       │   ├── MensalistaModal.tsx
│       │   ├── MensalistaModal.styles.ts
│       │   └── index.ts
│       ├── TipoModal/                   # criar/editar tipo
│       │   ├── TipoModal.tsx
│       │   └── index.ts
│       ├── Mensalistas.styles.ts        # Page, Header, Toolbar, EmptyState, ErrorArea, TableArea, SubText
│       ├── format.ts                    # labels: categoria, horário, vencimento, documento mascarado
│       ├── useMensalistas.ts            # useQuery da lista + debounce da busca
│       └── useTiposMensalidade.ts       # useQuery + helpers (tipos ativos)
├── lib/
│   ├── api/services/
│   │   ├── mensalista.ts                # chamadas HTTP
│   │   └── mensalista.mapper.ts         # form values ⇄ payload/DTO
│   ├── documento.ts                     # máscara/validação CPF-CNPJ (inclui CNPJ alfanumérico)
│   └── schemas/mensalista.ts            # schemas Zod de mensalista e tipo
├── types/
│   └── mensalista.ts
└── lib/nav.ts                           # + item "Mensalistas"
```

Os estilos de lista (`Page`, `Header`, `EmptyState`, `ErrorArea`, `TableArea`) existem hoje em `PrecosList.styles.ts`. Para não acoplar as features, extrair o que for idêntico para um módulo compartilhado (ex.: `src/components/ui/ListPage.styles.ts`) e fazer `PrecosList` e `Mensalistas` importarem dele **apenas se** a extração for mecânica e sem mudança visual; caso contrário, `Mensalistas.styles.ts` replica o necessário (decisão na task).

## 3. Interfaces e Tipos

`src/types/mensalista.ts` (sem prefixo `I`, como o resto do projeto):

```ts
export const TIPO_PESSOA = { Fisica: 1, Juridica: 2 } as const;
export type TipoPessoa = (typeof TIPO_PESSOA)[keyof typeof TIPO_PESSOA];

// Valor 99 = todas as categorias (ECategoria do back); reutiliza TIPO_CATEGORIA de Preços.
export type CategoriaMensalidade = TipoCategoria;

// Item da listagem: GET /Mensalista
export type Mensalista = {
  mensalistaId: number;
  mensalistaTipoId: number;
  tipoMensal: string;
  categoria: CategoriaMensalidade;
  valorMensalidade: number;
  tipoPessoa: TipoPessoa;
  documento: string;            // [A CONFIRMAR] vem só dígitos ou mascarado
  nome: string;
  email: string;
  celular: string;
  diaVencimento: number;
  ativo: boolean;
  // [A CONFIRMAR] nomes exatos dos campos de auditoria devolvidos pelo back
  cadastradoPor?: string | null;
  alteradoPor?: string | null;
};

// Corpo do POST e do PUT /Mensalista (PUT exige todos os campos)
export type MensalistaPayload = {
  mensalistaTipoId: number;
  tipoPessoa: TipoPessoa;
  documento: string;            // só dígitos/letras, sem máscara
  nome: string;
  email: string;
  celular: string;              // só dígitos (DDD + 9 dígitos)
  diaVencimento: number;
  ativo: boolean;
};

// GET /Mensalista/tipo
export type MensalistaTipo = {
  mensalistaTipoId: number;
  tipoMensal: string;
  categoria: CategoriaMensalidade;
  valorMensalidade: number;
  horarioEntrada: string | null;  // "HH:mm" ou "HH:mm:ss" [A CONFIRMAR]
  horarioSaida: string | null;
  ativo: boolean;
  criadoPor?: string | null;
  alteradoPor?: string | null;
};

// Corpo do POST e do PUT /Mensalista/tipo
export type MensalistaTipoPayload = {
  tipoMensal: string;
  categoria: CategoriaMensalidade;
  valorMensalidade: number;
  horarioEntrada: string | null;
  horarioSaida: string | null;
  ativo: boolean;
};

// Valores dos formulários (strings, como os campos de texto)
export type MensalistaFormValues = {
  mensalistaTipoId: string;
  tipoPessoa: string;           // "1" | "2"
  documento: string;            // mascarado na tela
  nome: string;
  email: string;
  celular: string;              // mascarado na tela
  diaVencimento: string;
  ativo: boolean;
};

export type TipoFormValues = {
  tipoMensal: string;
  categoria: string;
  valorMensalidade: string;     // texto monetário ("280,00")
  horarioEntrada: string;       // "" ou "HH:mm"
  horarioSaida: string;
  ativo: boolean;
};
```

`Paginado<T>` já existe em `src/lib/api/types.ts`.

## 4. Contratos de API

Base: `api` de `src/lib/api/client.ts` (baseURL `.../api/v1`, token no header). Erros viram `ApiError` (`validation` para 400, `forbidden` para 403, `unauthorized` para 401).

### GET `/Mensalista`
**Query:** `documento?: string` (início do CPF/CNPJ; enviar só dígitos/letras, sem máscara), `pagina` (padrão 1), `tamanhoPagina` (20; máx. 100).  
**Response 200:** `Paginado<Mensalista>`. Ordem do back: ativos primeiro, depois nome.  
**Erros:** 401, 403.

### POST `/Mensalista`
**Request:** `MensalistaPayload` (a tela sempre envia `ativo: true`).  
**Response 200/201:** `{ mensalistaId: number }`.  
**Erros:** 400 (dados inválidos, tipo inexistente ou inativo), 401, 403.

### PUT `/Mensalista/{id}`
**Request:** `MensalistaPayload` completo (a tela reenvia `tipoPessoa` e `documento` atuais).  
**Response 200.** **Erros:** 400 (não existe, dados inválidos, tipo inativo), 401, 403.  
Regra do back: trocar para um tipo inativo não é permitido; manter o tipo atual é.

### GET `/Mensalista/tipo`
**Response 200:** `MensalistaTipo[]` (ativos e inativos; ativos primeiro, depois nome e categoria). Sem paginação.

### POST `/Mensalista/tipo`
**Request:** `MensalistaTipoPayload` (`ativo: true`). **Response 200/201:** `{ mensalistaTipoId }`. **Erros:** 400 (inválido ou duplicado nome+categoria ativos).

### PUT `/Mensalista/tipo/{id}`
**Request:** `MensalistaTipoPayload` completo. **Erros:** 400, 401, 403.

Os campos de resposta que o contrato não detalha (auditoria, formato de `documento` e dos horários) estão marcados `[A CONFIRMAR]`; o mapper deve ser tolerante (`?? null`, `Partial`), como `preco.mapper.ts`.

### Serviço (`src/lib/api/services/mensalista.ts`)

```ts
listMensalistas(params: { pagina: number; tamanhoPagina: number; documento?: string }): Promise<Paginado<Mensalista>>
createMensalista(values: MensalistaFormValues): Promise<{ mensalistaId: number }>
updateMensalista(id: number, values: MensalistaFormValues): Promise<void>
listTiposMensalidade(): Promise<MensalistaTipo[]>
createTipoMensalidade(values: TipoFormValues): Promise<{ mensalistaTipoId: number }>
updateTipoMensalidade(id: number, values: TipoFormValues): Promise<void>
```

Edição precisa dos dados do item: não há `GET /Mensalista/{id}`, então o modal recebe o `Mensalista` da própria linha (já na lista). Sem busca por id (evita o laço de páginas do `getPreco`).

## 5. Componentes

| Componente | Tipo | Responsabilidade |
|---|---|---|
| `app/(app)/mensalistas/page.tsx` | Server | `metadata` ("Mensalistas — GIPE") e renderiza `MensalistasPage`. |
| `MensalistasPage` | Client | Lê `aba` da URL (`useSearchParams`), renderiza `Tabs`, cabeçalho, `Toast`; controla qual modal está aberto (`{ tipo: "mensalista" \| "tipo"; item?: ... }`). |
| `Tabs` (`ui`) | Client | Abas acessíveis; ver props abaixo. |
| `MensalistasList` | Client | Busca, tabela, paginação, estados (loading/vazio/erro/403), botão "Novo mensalista", ação editar por linha. |
| `TiposList` | Client | Tabela de tipos, estados, botão "Novo tipo", ação editar. |
| `MensalistaModal` | Client | Formulário `useAppForm`; `mode: "create" \| "edit"`; mutation; erro do servidor; confirmação ao descartar. |
| `TipoModal` | Client | Idem para tipos. |

Props principais:

```ts
// ui/Tabs
export interface TabsProps {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  "aria-label": string;
  children: ReactNode;          // conteúdo do painel ativo
}

export interface MensalistaModalProps {
  mensalista?: Mensalista;      // presente => edição
  onClose: () => void;
  onSuccess: (message: string) => void;
  onGoToTipos?: () => void;     // quando não há tipos ativos
}

export interface TipoModalProps {
  tipo?: MensalistaTipo;
  onClose: () => void;
  onSuccess: (message: string) => void;
}
```

`Tabs`: `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`/`id` derivados com `useId`, roving `tabIndex`, setas esquerda/direita, Home/End; aba ativa com sublinhado `2px` em `colors.primary`; rolagem horizontal no celular.

Campos do `MensalistaModal`: `SelectField` de tipo, `OptionGroup` de pessoa (controlado por `form.setFieldValue`), `TextField` com `format` para documento e celular, `TextField` numérico para vencimento, `SwitchField` "ativo" só na edição. Na edição, `tipoPessoa` e `documento` ficam `disabled`.

## 6. Gerenciamento de Estado

**Estratégia:** servidor no React Query; UI local. Sem Zustand/Context.

- Chaves: `["mensalistas", { pagina, documento }]` e `["mensalistas-tipos"]`.
- Lista: `useQuery` com `placeholderData: keepPreviousData` (mantém a tabela ao trocar página/busca).
- Tipos: a mesma query alimenta a aba de tipos e o `SelectField` do `MensalistaModal` (filtra `ativo`, mais o tipo atual na edição).
- Mutations: `useMutation`; em `onSuccess`, `invalidateQueries` da lista (`["mensalistas"]`) ou de tipos (`["mensalistas-tipos"]`; criar/editar tipo também invalida `["mensalistas"]`, pois a lista traz nome/categoria/valor do tipo).
- Busca: `useState` do termo + `useDebouncedValue` (250 ms; a função hoje é privada em `useModelos.ts`, então extrair para `src/hooks/useDebouncedValue.ts` e reutilizar nos dois). Mudou a busca → volta para `pagina=1`.
- Página fora do intervalo: mesmo `useEffect` da `PrecosList` (volta à última página existente).

## 7. Fluxo de Dados

```
Listar:   Page(URL: aba, pagina) → MensalistasList → useMensalistas(pagina, termo debounced)
          → listMensalistas → GET /Mensalista → Tabela / estados
Cadastrar: Botão → MensalistaModal → useAppForm + mensalistaSchema.safeParse
          → toMensalistaPayload (somente dígitos, números) → POST /Mensalista
          → invalidate ["mensalistas"] → Toast + fecha modal
Editar:   Linha → MensalistaModal(mensalista) → valores iniciais via fromMensalista
          → PUT /Mensalista/{id} (reenvia pessoa+documento atuais) → invalidate → Toast
Tipos:    Aba → TiposList → useTiposMensalidade → GET /Mensalista/tipo
          TipoModal → toTipoPayload → POST/PUT /Mensalista/tipo → invalidate
```

### Regras de mapeamento e validação (`lib/documento.ts`, `lib/schemas/mensalista.ts`, `mensalista.mapper.ts`)

- **Documento**: normalizar removendo máscara (`[^0-9A-Za-z]`, maiúsculas). Pessoa física: 11 dígitos + `isValidCPF`. Jurídica: 14 caracteres, **alfanuméricos nas 12 primeiras posições** e dígitos nas 2 últimas; validação do dígito verificador conforme a regra do CNPJ alfanumérico (valor de cada caractere = código ASCII − 48). Máscara de CNPJ própria que aceita letras (`formatDocumento(valor, tipoPessoa)`). Não alterar `lib/cnpj.ts` (usado na adesão).
- **Celular**: `isValidCelular` (já existe) + `formatPhone`; enviar só dígitos.
- **Dia de vencimento**: inteiro de 1 a 31.
- **Nome**: obrigatório, até um limite razoável (assumir 150, `[A CONFIRMAR]`); **E-mail**: formato válido (helper `lib/email.ts` existente).
- **Tipo**: obrigatório; para o `payload`, `Number()`.
- **Valor** (tipo): `parseMoney` de `lib/money.ts`; maior que zero; enviar número com 2 casas.
- **Horário**: ambos vazios ou ambos preenchidos (`HH:mm`); saída menor que a entrada é válido. [A CONFIRMAR] se o back espera `"HH:mm"` ou `"HH:mm:ss"` (o contrato mostra `string`); o mapper envia `HH:mm:ss` caso necessário e a leitura tolera os dois.
- **Nome do tipo**: 1 a 100 caracteres. Duplicidade nome+categoria: validada pelo back (400); a mensagem é exibida no campo nome quando o texto da resposta citar o tipo ("já existe"), senão no `ErrorBanner` do modal (mesma heurística de mensagem usada em `EntradaVeiculoModal`, marcada `[A CONFIRMAR]` até existir código de erro estruturado).

### Navegação e ícone
- `src/lib/nav.ts`: acrescentar `{ label: "Mensalistas", href: "/mensalistas", icon: "members" }` após "Gestão de Usuários" e `"members"` ao `NavIconId`.
- `NavIcons.tsx`: novo `MembersIcon` e entrada no mapa de ícones.
- O menu continua sem filtro por perfil; o 403 do back vira a mensagem "Você não tem permissão para acessar esta página." (`ApiError.kind === "forbidden"`).

## 8. Estratégia de Testes

O repositório **não tem runner de testes configurado** (sem Vitest/Jest no `package.json`). Estratégia proposta, a decidir na task de testes:

| Camada | Ferramenta | O que testar |
|---|---|---|
| Unitário (puro) | Vitest (skill `vitest` do projeto) | `documento.ts` (CPF, CNPJ numérico e alfanumérico, máscara), schemas Zod, `mensalista.mapper.ts` (form ⇄ payload), `format.ts` |
| Componente | Vitest + Testing Library | `Tabs` (setas, aria), `MensalistaModal` (validação, bloqueio na edição, erro do servidor) |
| Validação manual | Navegador | Fluxos 1–3 do PRD, abas, URL, responsividade, 403 |

Se a decisão for não adicionar runner agora, a validação mínima é `npm run lint` + `npm run build` + roteiro manual dos critérios de aceite do PRD.

## 9. Dependências

Nenhuma dependência nova obrigatória (React Query, TanStack Form, Zod, styled-components já existem). Vitest/Testing Library só se a estratégia de testes acima for aprovada.

## 10. Riscos Técnicos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Formato real de `documento`, horários e campos de auditoria diferente do suposto | Média | Mapper tolerante; marcar `[A CONFIRMAR]`; validar com uma resposta real antes de fechar a UI |
| CNPJ alfanumérico: máscara e dígito verificador novos | Média | Implementar em `lib/documento.ts` com testes de unidade; não tocar em `lib/cnpj.ts` |
| Sem `GET /Mensalista/{id}`: edição depende do item da lista | Baixa | Modal recebe o item; após salvar, invalidar a lista; se o item sumir do cache, fechar o modal e recarregar |
| Busca por documento mascarado/parcial | Média | Enviar sempre sem máscara; testar início do CPF e CNPJ e documento completo |
| Lista de tipos sem paginação cresce | Baixa | Volume pequeno esperado; reavaliar se necessário |
| Mensagens do back para duplicidade/tipo inativo são genéricas (400) | Média | Exibir a mensagem do back no `ErrorBanner`; heurística por texto só para posicionar no campo |
| Duplicar estilos entre Preços e Mensalistas | Baixa | Extrair módulo compartilhado se mecânico; senão replicar e registrar |
| Dados pessoais (documento, e-mail, celular) | Alta | Termo de busca fora da URL; não logar payloads; token nunca copiado para código ou specs |
| Token real exposto no `docs/specs/input.md` | Alta | Revogar/rotacionar o token e não commitar o arquivo com ele |

## 11. Decisões de Arquitetura

| Decisão | Alternativas Consideradas | Motivo da Escolha |
|---|---|---|
| Uma rota `/mensalistas` com abas e `?aba=` na URL | Duas rotas; abas só em estado local | Um item de menu (decisão do produto); link direto e botão voltar funcionam |
| Modais para criar/editar | Páginas `/mensalistas/novo` e `/[id]/editar` (como Preços) | Formulários curtos; evita a busca por id que o back não oferece; mantém o contexto da lista |
| `Tabs` no design system | Botões soltos na feature | Padrão reutilizável e acessível para outras telas |
| React Query + estado local | Zustand/Context | Dados são de servidor; o projeto já usa o padrão em Preços e Caixa |
| Documento/pessoa bloqueados na edição | Editáveis | Decisão do produto; evita trocar a identidade do cliente por engano |
| Validação de CNPJ alfanumérico em módulo próprio | Alterar `lib/cnpj.ts` | A adesão usa o CNPJ numérico; evitar regressão |
| Reaproveitar `TIPO_CATEGORIA` de Preços para a categoria | Criar enum novo | Mesmo `ECategoria` do back (inclui 99 = todas) |
| Menu sem filtro por perfil; 403 tratado na página | Esconder o item por perfil | Igual às telas atuais; regra de permissão de menu no front ainda não existe |
| Extrair `useDebouncedValue` para `src/hooks` | Copiar para o novo hook | Evita duplicar; mudança mecânica em `useModelos` |
