# Tech Spec: Melhoria do fluxo de entrada de veículos

**Status:** Rascunho
**Data:** 2026-10-17
**PRD:** [./prd.md](./prd.md) · **Design:** [./design.md](./design.md)

Segue as convenções do projeto (Next 16 App Router, styled-components, TanStack Query/Form, zod, vitest), como já aplicadas em `docs/specs/qrcode-entrada/` e `docs/specs/saida-veiculos/`. Não há GUIDELINE.md no repositório; vale `AGENTS.md`/`CLAUDE.md`.

## 1. Visão técnica

Quatro mudanças sobre o que existe hoje:

1. **Cor vira enum** (`CorVeiculo`, 8 valores) no schema, no formulário e no payload da entrada.
2. **Formulário de entrada** (`EntradaVeiculoModal`) é remontado com `PlateDisplay`, `ColorSwatchGroup` (novo) e `OptionGroup` (existente) para categoria.
3. **Cupom** (`ReciboEntradaStep`/`ReciboEntradaConteudo`) ganha o novo layout e o QR passa a apontar para `/comprovante/<token>`, com `token` vindo da resposta de `POST /Patio/entrada`.
4. **Página pública** `src/app/comprovante/[token]/page.tsx`, sem login, que chama `GET /Patio/comprovante/cliente?token=…`.

Estado da base hoje: `ReciboEntradaStep` já gera o link `/comprovante/{patioId}/{placa}`, mas **a rota `/comprovante` não existe** no app (só estava na `qrcode-entrada/tasks.md`). Logo não há compatibilidade a manter com a rota antiga; o link é simplesmente substituído (resolve o ponto em aberto do PRD sobre o link antigo; cupons já impressos com ele hoje já não abrem nada).

## 2. Estrutura de pastas

```
src/
├── app/
│   └── comprovante/
│       ├── layout.tsx                       # novo: SignageThemeProvider + fontes, sem AppShell
│       └── [token]/
│           ├── page.tsx                     # novo: Server Component, valida token, metadata noindex
│           └── not-found.tsx                # opcional (ver §5)
├── proxy.ts                                 # + "/comprovante" em PUBLIC_PATHS
├── components/
│   ├── ui/
│   │   ├── ColorSwatchGroup/                # novo
│   │   │   ├── ColorSwatchGroup.tsx
│   │   │   ├── ColorSwatchGroup.styles.ts
│   │   │   ├── ColorSwatchGroup.test.tsx
│   │   │   └── index.ts
│   │   └── PlateDisplay/                    # novo
│   │       ├── PlateDisplay.tsx
│   │       ├── PlateDisplay.styles.ts
│   │       ├── PlateDisplay.test.tsx
│   │       └── index.ts
│   └── veiculos/
│       ├── EntradaVeiculoModal/             # alterado (form)
│       ├── ReciboEntradaStep/               # alterado (cupom + link por token)
│       └── ComprovantePublico/              # novo
│           ├── ComprovantePublico.tsx       # Client: useQuery + estados
│           ├── ComprovantePublico.styles.ts
│           ├── ComprovantePublico.test.tsx
│           ├── format.ts                    # formatPermanencia, parseDataHora
│           ├── format.test.ts
│           └── index.ts
├── lib/
│   ├── placa.ts                             # + getPlacaTipo()
│   ├── api/services/patio.ts                # + consultarComprovante()
│   └── schemas/veiculo.ts                   # cor: z.enum
└── types/
    └── veiculo.ts                           # + CorVeiculo, CORES_VEICULO, ComprovanteCliente; EntradaRegistrada.token
```

## 3. Interfaces e tipos

O projeto usa `type` sem prefixo `I` (ver `types/veiculo.ts`); mantemos o padrão do repositório.

```ts
// src/types/veiculo.ts

// Cores de pintura: dados do veículo, iguais nos dois temas (não são tokens de tema).
export const CORES_VEICULO = [
  { value: "BRANCO",   label: "Branco",   color: "#FFFFFF" },
  { value: "PRETO",    label: "Preto",    color: "#1A1A1A" },
  { value: "PRATA",    label: "Prata",    color: "#C3C7CC" },
  { value: "CINZA",    label: "Cinza",    color: "#6E747C" },
  { value: "VERMELHO", label: "Vermelho", color: "#B3261E" },
  { value: "AZUL",     label: "Azul",     color: "#1F4FD6" },
  { value: "VERDE",    label: "Verde",    color: "#2E7D4F" },
  { value: "BEGE",     label: "Bege",     color: "#D8C7A3" },
] as const;

export type CorVeiculo = (typeof CORES_VEICULO)[number]["value"];
export const COR_PADRAO: CorVeiculo = "PRATA";

// EntradaPayload.cor passa de string para CorVeiculo.
export type EntradaPayload = { /* ... */ cor: CorVeiculo };

// EntradaRegistrada ganha o token do comprovante público.
export type EntradaRegistrada = { /* ... */ token: string };

// GET /Patio/comprovante/cliente?token=...
export type ComprovanteCliente = {
  cnpj: string;
  razaoSocial: string;
  endereco: string | null;
  telefone: string | null;
  placa: string;
  modelo: string | null;
  cor: string | null;               // texto livre: entradas antigas não seguem o enum
  categoriaId: number;
  categoriaDescricao: string;
  dataHoraEntrada: string;          // ISO sem fuso, ex.: "2026-10-17T10:06:06.2094"
  dataHoraConsulta: string;         // ISO sem fuso, 7 casas decimais
  minutosPermanencia: number;
  permanencia: string;              // "0h 0min" (não usado: formatamos a partir de minutosPermanencia)
  sequencial: number;
  token: string;
  valorAtual: number;
};
```

```ts
// src/lib/schemas/veiculo.ts
const CORES = CORES_VEICULO.map((c) => c.value);
cor: z.enum(CORES as [CorVeiculo, ...CorVeiculo[]], { message: "Selecione a cor" }),
```

`EntradaVeiculoValues.cor` passa a `CorVeiculo`. `defaultValues.cor = COR_PADRAO`.

`CNPJ` vem na resposta mas **não é exibido** na página pública (decisão do design).

## 4. Contratos de API

### POST /Patio/entrada (alterado)
- **Request**: `EntradaPayload`, agora com `cor: CorVeiculo` (uma das 8 strings acima).
- **Response**: `EntradaRegistrada` + `token: string` (confirmado pelo produto).
- **[A CONFIRMAR com o back]**: se a API espera exatamente `"PRATA"` (caixa alta, sem acento), `"Prata"` ou um id numérico. O formato fica concentrado em `CORES_VEICULO.value`; se for outro, muda só essa tabela (e, se for numérico, um mapper no serviço).

### GET /Patio/comprovante/cliente?token={token} (novo, público)
- **Request**: query `token`. Sem `Authorization` necessário; o interceptor do `api` só o anexa se houver sessão e o endpoint o ignora.
- **Response**: `ComprovanteCliente` (JSON de exemplo no `input.md`).
- **Erros**: token inexistente deve responder 404 (ou 400). **[A CONFIRMAR]** qual código; o serviço trata `not_found` e `validation` como "não encontrado".

```ts
// src/lib/api/services/patio.ts
export async function consultarComprovante(token: string): Promise<ComprovanteCliente> {
  try {
    const { data } = await api.get<ComprovanteCliente>("/Patio/comprovante/cliente", { params: { token } });
    return data;
  } catch (error) {
    if (error instanceof ApiError && (error.kind === "not_found" || error.kind === "validation")) {
      throw new ApiError("not_found", "Comprovante não encontrado.", 404);
    }
    throw error;
  }
}
```

(Mesmo padrão de `consultarSaida`.) Remover a necessidade de `EntradaPublica` da spec `qrcode-entrada`: ela nunca foi implementada.

## 5. Componentes

### Novos em `src/components/ui`

**`ColorSwatchGroup`** (Client). Mesma técnica do `OptionGroup`: `<fieldset>` + `<legend>`, radios nativos escondidos visualmente, `useId` para o `name`.
```ts
export interface ColorSwatchOption { value: string; label: string; color: string }
export interface ColorSwatchGroupProps {
  legend: string;
  options: ColorSwatchOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}
```
- Mostra o rótulo da opção selecionada ao lado da legenda (`aria-live="polite"`).
- Amostra 28px visual dentro de alvo de 44px; borda `colors.border`; selecionada com anel duplo (`background` + `text`); `:focus-visible` com outline `primary`. Sem cores soltas além de `option.color`.

**`PlateDisplay`** (Client).
```ts
export interface PlateDisplayProps {
  value: string;                       // placa já normalizada ("ABC1D23" ou "ABC1234")
  variant?: "mercosul" | "antiga";     // padrão: derivado de getPlacaTipo(value)
  size?: "sm" | "md" | "lg";
  bandLabel?: string;                  // padrão "BRASIL"
  children?: ReactNode;                // lg: o input do formulário vai dentro
}
```
Mercosul: faixa `primary`/`onPrimary`, corpo branco. Antiga: corpo cinza, hífen após a 3ª letra (`ABC-1234`), faixa com borda. As cores da placa (branco, cinza) são do objeto físico e ficam como constantes no `.styles.ts`.

### `lib/placa.ts`
`getPlacaTipo(placa: string): "mercosul" | "antiga" | null`: 5º caractere dígito → `antiga`, letra → `mercosul`, <5 caracteres → `null` (usa `mercosul` na exibição). **Fora desta versão**: a tabela de UF por faixa de letras do HTML (`FAIXAS`), para mostrar a UF na faixa da placa antiga. A faixa mostra "BRASIL" nos dois padrões; `bandLabel` fica pronto para quando houver a tabela. (Desvio consciente do design, que previa a UF.)

### `EntradaVeiculoModal` (alterado)
- Modal passa a `size="md"` na etapa do formulário.
- Campo placa: `PlateDisplay lg` envolvendo o `TextField` (mantém `autoFocus`, `normalizePlaca`, `maxLength={7}` e o fluxo `handlePlacaBlur`/`usePlacaLookup`). Se o `TextField` não permitir estilizar de dentro do display, criar `field.PlateField` em `components/form` (decidir na task; não duplicar validação).
- **Cor**: `<form.AppField name="cor">` renderiza `ColorSwatchGroup` com `CORES_VEICULO`. Um `field.ColorField` fino em `components/form` (como `SelectField`) liga `field.state`/erros ao grupo.
- Preenchimento por cadastro (`handlePlacaBlur`): `cadastro.cor` é texto livre. Normalizar (maiúsculas, sem acento) e só aplicar se casar com um valor do enum; senão manter a seleção atual. Função pura `matchCor(texto): CorVeiculo | null` em `types/veiculo.ts` (ou `lib/`), testada.
- **Categoria**: troca o `SelectField` por `OptionGroup` com `CATEGORIA_VEICULO_OPTIONS`. **Observação**: o design falava em 6 categorias com ícones; o app tem **7** (inclui "SUV/Pick-up") e o `OptionGroup` não tem ícones. Decisão: usar `OptionGroup` como está, com as 7, sem ícones. Ícones por categoria ficam fora desta versão.
- `hasChanges`: `cor` deixa de contar (tem valor padrão); comparar contra `COR_PADRAO`.
- Mutação: `cor: values.cor` direto (sem `trim`).
- Botão "Registrar entrada" já usa `form` + `isSending`; adicionar `disabled` quando `!canSubmit` (placa inválida ou categoria vazia).

### `ReciboEntradaStep` / `ReciboEntradaConteudo` (alterados)
- Link: `` `${window.location.origin}/comprovante/${entrada.token}` ``. Se `entrada.token` vier vazio, não renderiza o QR e mostra o cupom sem ele (degrada sem quebrar).
- `ReciboEntradaData` ganha `token`/`link`, `operador`, `telefone` (da empresa, se `getEmpresa` trouxer; verificar o tipo em execução).
- Layout novo conforme o design: `PlateDisplay md`, ticket (`sequencial`) em fonte de display, grade 2×2, picote, QR 180px, link curto. Estilos reaproveitam `Recibo.styles.ts` e acrescentam o picote em `ReciboEntradaStep.styles.ts`; `@media print` simplifica o picote.
- O portal `#recibo-print-root` e `PrintStyles` ficam como estão.

### `ComprovantePublico` (novo, Client)
```ts
export interface ComprovantePublicoProps { token: string }
```
- `useQuery({ queryKey: ["comprovante", token], queryFn: () => consultarComprovante(token), refetchOnWindowFocus: false, staleTime: 0 })`. O `retry` global já ignora `not_found`/`validation` (`createQueryClient`).
- Estados: `isPending` → skeleton (`role="status"`, `aria-busy`); `error` com `kind === "not_found"` → "Comprovante não encontrado"; outro erro → "Não foi possível carregar" + **Tentar novamente** (`refetch`); sucesso → conteúdo do design.
- Reaproveita `PlateDisplay sm`, `Skeleton`, `Button`, `Text`.
- **Ligar**: `<a href={`tel:${digits}`}>` com `digits` só de dígitos; oculto sem telefone. Exibição com `formatPhone`.
- Valor via `formatCurrency` já existente (ver `lib/money.ts`; confirmar o nome da função em execução).

### `format.ts` (novo, junto do componente)
- `formatPermanencia(minutos: number): string` → `"0h 00min"`, `"1h 05min"`, `"26h 03min"` (horas sem teto). Usa `minutosPermanencia`, não parseia a string da API. Valores negativos/NaN viram `0h 00min`.
- `parseDataHora(iso: string): Date`: a API manda ISO **sem fuso** e **com 7 casas decimais** em `dataHoraConsulta`; cortar a fração para 3 dígitos antes do `new Date` (Safari é estrito com fração longa) e interpretar como horário local. Datas exibidas via `formatDateTime` de `components/caixa/format` quando aceitar `Date`/string tratada; senão formatar aqui com `Intl.DateTimeFormat("pt-BR")`.

### Rota `comprovante`
- `layout.tsx`: `SignageThemeProvider` (mesmo tema do cupom) e as fontes Barlow/Barlow Condensed (`next/font/google`, mesmas variáveis do `(app)/layout.tsx`), **sem** `AppShell` nem `CurrentUserProvider` em uso. `QueryClientProvider`, `ThemeModeProvider` e `StyledComponentsRegistry` já vêm do layout raiz, então não há provider novo. Se a duplicação das fontes incomodar, extrair `(app)/FontScope` + fontes para um módulo compartilhado na task, sem mudar o comportamento do `(app)`.
- `[token]/page.tsx` (**Server Component**): `params` é assíncrono no Next 16 (`const { token } = await params`); conferir `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` antes de implementar (aviso do `AGENTS.md`). Valida o token com `/^[A-Za-z0-9]{4,32}$/`; inválido → renderiza o estado "não encontrado" sem chamar a API. `export const metadata`/`generateMetadata`: título "Comprovante de entrada — GIPE", `robots: { index: false, follow: false }`.
- `proxy.ts`: adicionar `"/comprovante"` em `PUBLIC_PATHS`. Sem isso o cliente é redirecionado para `/login`. O matcher já cobre a rota, então basta a lista.

## 6. Gerenciamento de estado

Sem store global.
- Formulário: TanStack Form local (`useAppForm`), como hoje.
- Resultado do registro: `useState<EntradaRegistrada | null>` no modal, como hoje.
- Dados da página pública: cache do TanStack Query (`["comprovante", token]`).
- Zustand/Context novo: **não necessário**.

## 7. Fluxo de dados

```
Operador:  Form (zod: cor ∈ enum) → registrarEntrada (POST /Patio/entrada) → EntradaRegistrada{token}
           → ReciboEntradaStep → QR = origin/comprovante/{token}

Cliente:   QR → /comprovante/{token} (proxy público) → page.tsx (valida token)
           → ComprovantePublico → useQuery → consultarComprovante (GET .../comprovante/cliente)
           → ComprovanteCliente → formatPermanencia/parseDataHora → UI
```

## 8. Estratégia de testes

Ferramenta: **vitest + Testing Library** (`src/test/render.tsx`, `src/test/setup.ts`), como no restante do projeto (o template falava em Jest/Playwright; não se aplica aqui).

| Camada | O que testar |
| --- | --- |
| Unitário | `formatPermanencia` (0, 5, 65, 1500, negativo/NaN); `parseDataHora` (fração de 4 e 7 casas); `getPlacaTipo`; `matchCor` (caixa, acento, desconhecida); schema (`cor` fora do enum falha, vazio falha); `consultarComprovante` (200, 404→`not_found`, 400→`not_found`, 500 propaga) |
| Componente | `ColorSwatchGroup` (seleção por clique e setas, nome da cor visível, `disabled`, erro); `PlateDisplay` (variantes, hífen); `ComprovantePublico` (skeleton, sucesso com todos os campos, campos nulos sem `null` na tela, sem telefone oculta Ligar, não encontrado, erro + Tentar novamente refaz a chamada); `ReciboEntradaConteudo` (QR com o link do token, sem token não renderiza QR) |
| Integração | `EntradaVeiculoModal`: cor padrão Prata; trocar cor envia o valor do enum no payload; cadastro com cor desconhecida não altera a seleção; botão desabilitado sem placa/categoria; ao registrar mostra o cupom com o link do token |
| Manual (sem sessão) | abrir `/comprovante/<token real>` em janela anônima, verificar que não redireciona para `/login`; testar no celular pela rede local ou hml (QR emitido em `localhost` não abre no aparelho); imprimir o cupom em tema escuro |

Rodar `npm run lint` e `npm run build` ao final (convenção do projeto).

## 9. Dependências

Nenhuma nova. `qrcode.react` 4.2.0 e `QrCode` já existem.

## 10. Riscos técnicos

| Risco | Prob. | Mitigação |
| --- | --- | --- |
| API espera outro formato de `cor` (id numérico, `Prata`) | Média | Formato concentrado em `CORES_VEICULO.value`; confirmar com o back antes da task de payload |
| Token inexistente retorna código diferente de 404/400 (ex.: 200 vazio) | Média | Serviço trata 404 e 400; se vier 200 sem `token`, tratar como não encontrado em `consultarComprovante` |
| Esquecer `/comprovante` em `PUBLIC_PATHS` | Baixa | Teste manual sem sessão; teste unitário simples de `proxy` se já houver padrão |
| Datas ISO sem fuso / 7 casas quebram no Safari (iPhone é o caso típico do cliente) | Média | `parseDataHora` com corte de fração, coberta por teste |
| Dados pessoais acessíveis por quem tem o link | Baixa | Token não sequencial (melhora vs. patioId+placa); página `noindex`; CNPJ não exibido; rate limit é do back |
| Entradas antigas com cor em texto livre | Média | Página pública exibe `cor` como texto, sem exigir o enum; só o formulário novo restringe |
| QR em `localhost`/hml não abre no celular | Média | Link usa `window.location.origin`; testar na rede ou em hml |
| Impressão: QR e picote em tema escuro | Baixa | `PrintStyles` força preto sobre branco; validar manualmente |
| Mudança de `EntradaRegistrada` quebra mocks/testes existentes | Baixa | Atualizar fixtures de teste junto (`token`) |

## 11. Decisões de arquitetura

| Decisão | Alternativas | Motivo |
| --- | --- | --- |
| Rota `/comprovante/[token]` fora de `(app)` | rota dentro de `(app)` com exceção no proxy | `(app)` carrega `AppShell` e sessão; a página pública não deve herdar nada disso |
| Page como Server Component + `ComprovantePublico` Client com `useQuery` | fetch no servidor (RSC) | Reaproveita `api`, `ApiError`, `Skeleton`, "Tentar novamente"; validação do token no servidor evita requisição inútil (mesmo racional da `qrcode-entrada`) |
| Sem atualização automática na página pública | polling / refetch ao focar | Design define consulta única com horário no rodapé; fácil ligar `refetchOnWindowFocus` depois |
| Enum de cor como tabela única `CORES_VEICULO` em `types/veiculo.ts` | colocar em `theme.ts`; enum TS | São dados de domínio, iguais nos dois temas; uma fonte para schema, UI e payload |
| `ColorSwatchGroup` em `ui/` | dentro da feature | Padrão do projeto: componente reutilizável vai para o design system (como `OptionGroup`) |
| Categoria com `OptionGroup` (7 opções, sem ícones) | tiles novos com ícones | Reuso total; o design previa 6 categorias, o sistema tem 7; ícones ficam para depois |
| Placa antiga sem UF na faixa | embutir tabela `FAIXAS` do HTML | Tabela grande e frágil, sem requisito no PRD; `bandLabel` deixa o gancho |
| Tempo de permanência a partir de `minutosPermanencia` | usar a string `permanencia` | Formato controlado no front ("00min") e imune a mudança de texto da API |
| Remover o link `patioId+placa` sem compatibilidade | manter rota antiga | A rota nunca existiu no app; token substitui sem custo |
| Sem pesquisa externa (Context7/web) | fazer as 3 buscas da skill | Nenhuma biblioteca nova; Next 16 e TanStack já documentados nas specs vizinhas e em `node_modules/next/dist/docs` (a conferir ao implementar a rota) |

## 12. Pontos a confirmar antes de implementar

1. Formato exato de `cor` aceito pelo `POST /Patio/entrada`.
2. Código de erro do comprovante para token inexistente (404 ou 400).
3. Se o `GET /Patio/comprovante/cliente` realmente dispensa `Authorization` e CORS permite o domínio do front.
4. Se `getEmpresa` devolve telefone (para o cabeçalho do cupom); caso contrário o cupom omite a linha.
