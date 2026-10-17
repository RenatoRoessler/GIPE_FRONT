# Tech Spec: Melhoria do fluxo de saída de veículos

**Status:** Rascunho
**Data:** 2026-10-17
**PRD:** [./prd.md](./prd.md) · **Design:** [./design.md](./design.md)

Segue as convenções do projeto (Next 16 App Router, styled-components, TanStack Query, zod, vitest), como aplicadas em `docs/specs/saida-veiculos/` e `docs/specs/melhoria-fluxo-entrada/`. Vale `AGENTS.md`/`CLAUDE.md`. Esta etapa é só especificação, sem código.

## 1. Visão técnica

O modal **Registrar saída** (`SaidaVeiculoModal`) deixa de ser um wizard de 4 etapas e vira uma **tela única** com três blocos que conversam por um estado central:

1. **Identificação**: leitor de QR (câmera) ou busca manual (placa, ticket, sequencial), ambos resultam em um `SaidaBusca` (`{ tipo, valor }`), o mesmo contrato que `consultarSaida` já recebe.
2. **Resumo**: dados do veículo e valor a cobrar, atualizados em intervalo.
3. **Pagamento**: Dinheiro, Crédito, Débito e Pix, valor recebido e troco; **Confirmar Saída** reconsulta o valor e registra.

O recibo (`ReciboSaidaStep`) é mantido e continua sendo a "tela 2" do modal.

### Descoberta que muda o desenho do QR
O cupom de entrada gera o link `` `${origin}/comprovante/${token}` `` (`ReciboEntradaStep.tsx:51`). Portanto o QR lido na saída contém **uma URL `/comprovante/<token>`**, e não `GIPE-SAIDA:XXXXXX` nem `/c/XXXXXX` como na referência HTML. O extrator de token aceita:
- URL cujo path termine em `/comprovante/<token>` (qualquer origem, para funcionar em hml/produção/localhost);
- o token solto, `^[A-Za-z0-9]{4,32}$` (mesma validação da página pública).

### Descoberta que muda o desenho da busca por token
`GET /Patio/saida` aceita só `placa`, `codigoTicket` ou `sequencial`; não há `token`. Já `GET /Patio/comprovante/cliente?token=` é **público e devolve `placa` e `sequencial`** da entrada. Decisão: **resolver o token pelo comprovante e consultar a saída pela placa**. Não depende de mudança no back-end.

```
QR → extrairToken → consultarComprovante(token) → { placa, sequencial }
   → consultarSaida({ tipo: "placa", valor: placa }) → SaidaConsulta
```

O custo é uma chamada a mais por leitura. Se o back passar a aceitar `token` em `/Patio/saida`, basta trocar `resolverBuscaPorToken` (função única, §4). Ponto em aberto, mantido do PRD.

## 2. Design

Referência completa em [./design.md](./design.md); aqui só o mapeamento técnico.

- **Telas/estados**: tela única do modal + recibo; estados do visor (ocioso, abrindo, lendo, lido, QR inválido, sem permissão), da busca (buscando, não encontrado, encontrado), do envio (enviando, valor mudou, erro), conforme o design.
- **Reaproveitados** (`src/components/ui`): `Modal`, `Button`, `Input`, `ErrorBanner`, `ConfirmDialog`, `Skeleton`, `PlateDisplay` (já existe), `OptionGroup` e `Saida.styles` (`ValuePanel`, `ValueLabel`, `ValueAmount`, `OldValue`, `Notice`, `TrocoLine`, `VisuallyHidden`).
- **Novos**: `PaymentTileGroup` em `ui` (ver §5). De feature: `LeitorQrSaida`, `ResumoSaida`, `PagamentoSaida`.
- **Tokens**: nenhum novo. `colors.warn` (mira, varredura), `success`/`danger` (estados do visor), `primary`/`onPrimary` (selecionado), `typography.display*` (valor, token).

## 3. Arquitetura da solução

### Estrutura de arquivos

```
src/
├── components/
│   ├── ui/
│   │   └── PaymentTileGroup/                    # novo (Client)
│   │       ├── PaymentTileGroup.tsx
│   │       ├── PaymentTileGroup.styles.ts
│   │       ├── PaymentTileGroup.test.tsx
│   │       └── index.ts
│   └── veiculos/
│       ├── SaidaVeiculoModal/
│       │   ├── SaidaVeiculoModal.tsx            # reescrito: tela única + recibo
│       │   ├── SaidaVeiculoModal.styles.ts      # novo: layout em colunas
│       │   ├── useSaidaFlow.ts                  # novo: estado, mutações, intervalo
│       │   ├── useSaidaFlow.test.tsx
│       │   └── SaidaVeiculoModal.test.tsx       # novo/atualizado
│       ├── LeitorQrSaida/                       # novo (Client)
│       │   ├── LeitorQrSaida.tsx
│       │   ├── LeitorQrSaida.styles.ts
│       │   ├── useLeitorQr.ts                   # câmera + detecção
│       │   ├── LeitorQrSaida.test.tsx
│       │   └── index.ts
│       ├── ResumoSaida/                         # novo
│       │   ├── ResumoSaida.tsx
│       │   ├── ResumoSaida.test.tsx
│       │   └── index.ts
│       ├── PagamentoSaida/                      # novo (substitui PagamentoSaidaStep)
│       │   ├── PagamentoSaida.tsx
│       │   ├── PagamentoSaida.test.tsx
│       │   └── index.ts
│       ├── BuscaManualSaida/                    # novo (extraído de ConsultaSaidaStep)
│       │   ├── BuscaManualSaida.tsx
│       │   └── index.ts
│       ├── ConsultaSaidaStep/                   # REMOVIDO
│       ├── ConferirSaidaStep/                   # REMOVIDO
│       ├── PagamentoSaidaStep/                  # REMOVIDO (lógica migra para PagamentoSaida)
│       ├── ReciboSaidaStep/                     # mantido
│       ├── Saida.styles.ts                      # mantido (remove StepForm/StepDescription se ficarem sem uso)
│       └── saida.ts                             # + extrairTokenSaida, FORMAS_SAIDA
├── lib/
│   ├── api/services/patio.ts                    # + resolverBuscaPorToken()
│   └── qr.ts                                    # novo: extrairTokenComprovante()
└── types/
    └── saida.ts                                 # + SaidaOrigem
```

A pasta `ConferirSaidaStep` é removida porque o resumo passa a ser o `ResumoSaida`; a lógica de `getPagamentoStatus` e `FORMA_DINHEIRO` migra para `PagamentoSaida.tsx` e é re-exportada para o modal e os testes (ou movida para `saida.ts`, decidir na task, sem duplicar). Nada fora do fluxo de saída importa esses três componentes (a conferir com `grep` na task de remoção).

### Server vs Client
Tudo Client Component (`"use client"`): usa câmera, estado e TanStack Query. A rota e os atalhos (`RegistrarSaidaButton`, `app/(app)/veiculos/saida/page.tsx`) não mudam.

### Dependência nova
- **`jsqr` 1.4.0**: fallback de decodificação quando o navegador não tem `BarcodeDetector` (Safari/iOS e Firefox). Mesma biblioteca e versão da referência. Carregada **sob demanda** com `import("jsqr")` dentro de `useLeitorQr`, só quando o detector nativo não existe, para não entrar no bundle do modal.
- Ver §9 e riscos §10. Não adicionar outra lib de câmera.

## 4. Tipos e contratos

```ts
// src/types/saida.ts
export type SaidaOrigem = "qr" | "manual";   // define quais campos da busca manual ficam desabilitados
```

`SaidaBusca`, `SaidaConsulta`, `SaidaPayload` e `SaidaRegistrada` ficam como estão.

```ts
// src/lib/qr.ts
// Aceita a URL do cupom (.../comprovante/<token>) ou o token solto.
const TOKEN = /^[A-Za-z0-9]{4,32}$/;
export function extrairTokenComprovante(texto: string): string | null;
```
- `trim`; se casar com `TOKEN`, devolve em maiúsculas? **Não**: o token é opaco e pode ser case-sensitive; devolver como lido.
- Se parecer URL (`new URL` com fallback em `try/catch`), pegar o último segmento do pathname quando o penúltimo for `comprovante`; validar com `TOKEN`.
- Qualquer outra coisa → `null`.

```ts
// src/lib/api/services/patio.ts
// Resolve o token do cupom em uma busca aceita por GET /Patio/saida.
// [A CONFIRMAR] Se o back aceitar `token` em /Patio/saida, trocar o corpo por { tipo: "token", valor: token }.
export async function resolverBuscaPorToken(token: string): Promise<SaidaBusca> {
  const comprovante = await consultarComprovante(token);   // 404/400 já viram not_found
  return { tipo: "placa", valor: comprovante.placa };
}
```
- Token inexistente → `ApiError` `not_found` com a mensagem "Nenhum ticket aberto com este token." (a mensagem de `consultarComprovante` é reescrita aqui, no próprio serviço, via `try/catch`).
- O comprovante é do **momento da entrada** (`valorAtual` etc.), mas só `placa` é usada; o valor sempre vem de `consultarSaida`.

```ts
// src/components/veiculos/saida.ts
import { FORMA_PAGAMENTO } from "@/types/caixa";

// Formas oferecidas na saída (as demais ficam fora desta tela, ver PRD).
export const FORMAS_SAIDA = [
  { value: FORMA_PAGAMENTO.Dinheiro,       label: "Dinheiro" },
  { value: FORMA_PAGAMENTO.CartaoCredito,  label: "Crédito" },
  { value: FORMA_PAGAMENTO.CartaoDebito,   label: "Débito" },
  { value: FORMA_PAGAMENTO.Pix,            label: "Pix" },
] as const;
export const FORMA_PADRAO = String(FORMA_PAGAMENTO.Dinheiro);
```

`FORMA_PAGAMENTO_OPTIONS` (6 opções) segue intacta para o módulo de caixa; só a tela de saída usa `FORMAS_SAIDA`. Os rótulos "Crédito"/"Débito" são curtos de propósito (tiles); o recibo continua usando `formaPagamentoLabel` ("Cartão de crédito").

### Contratos de API consumidos (nenhum novo)
- `GET /Patio/comprovante/cliente?token=` (público): só para resolver o token.
- `GET /Patio/saida?placa|codigoTicket|sequencial=`: consulta e cálculo.
- `POST /Patio/{patioId}/saida` com `{ valor, formaPagamento }`: registro.

## 5. Componentes

### `PaymentTileGroup` (novo, `src/components/ui`)
Mesma técnica do `OptionGroup`: `<fieldset>`/`<legend>`, radios nativos escondidos visualmente, `useId` no `name`.
```ts
export interface PaymentTileOption { value: string; label: string; icon: ReactNode }
export interface PaymentTileGroupProps {
  legend: string;
  options: PaymentTileOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}
```
- Grade de 4 colunas, altura mínima 64px; selecionado em `primary`/`onPrimary`; foco visível. O ícone é decorativo (`aria-hidden`); o rótulo é o nome acessível.
- **Alternativa avaliada**: estender `OptionGroup` com prop `icon`. Rejeitada por enquanto: o `OptionGroup` renderiza chips de largura variável, e tiles em grade exigem outro layout; evita acoplar. Reavaliar na task se o ganho de reuso for claro.
- Os ícones das formas (dinheiro, cartão, débito, pix) ficam em `components/veiculos/saidaIcons.tsx`, no mesmo estilo de `categoriaIcons.tsx` (SVG inline, `currentColor`).

### `LeitorQrSaida` (novo)
```ts
export interface LeitorQrSaidaProps {
  onToken: (token: string) => void;      // token válido extraído
  onInvalido: () => void;                // QR que não é de ticket GIPE
  disabled?: boolean;                    // true enquanto busca/envia
  lido: boolean;                         // exibe o estado "lido" e para a câmera
  mensagemLido?: string;                 // "Ticket encontrado" | "Token lido"
  token: string;
  onLimpar: () => void;
}
```
Responsabilidades: renderizar visor, token e botão Limpar; delega câmera e decodificação ao hook.

### `useLeitorQr` (hook)
```ts
type Estado = "ocioso" | "abrindo" | "lendo" | "negada" | "indisponivel";
function useLeitorQr(opts: { ativo: boolean; onTexto: (t: string) => void }): {
  videoRef: RefObject<HTMLVideoElement | null>;
  estado: Estado;
  iniciar: () => void;     // chamado no toque do visor
};
```
- `getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })`. Sem `mediaDevices` → `indisponivel`; `NotAllowedError` → `negada`; outros erros → `ocioso` com mensagem "toque para tentar".
- Tenta abrir ao montar quando `ativo`; se o navegador barrar sem gesto, o toque no visor chama `iniciar`.
- Detecção em `requestAnimationFrame` com guarda `ocupado` (não empilhar leituras). `BarcodeDetector` (`formats: ["qr_code"]`) quando existir; senão `jsqr` (import dinâmico) sobre um canvas 480×480 recortado no centro, com `willReadFrequently`.
- **Limpeza obrigatória**: parar `getTracks()`, zerar `srcObject` e cancelar o `requestAnimationFrame` no `ativo → false`, no `onTexto` bem-sucedido e no unmount. Teste cobre isso (a câmera ficar ligada com o modal fechado é o defeito mais grave deste fluxo).
- `prefers-reduced-motion`: tratado em CSS (varredura estática).
- Debounce do mesmo texto inválido (ignorar o mesmo `rawValue` por ~1,5 s) para não disparar `onInvalido` a cada frame.

### `BuscaManualSaida` (novo, extraído de `ConsultaSaidaStep`)
Mantém `LABELS`, `normalizePlaca`, regras de bloqueio mútuo e dicas. Novidade: prop `bloqueadoPorQr: boolean` desabilita os três campos com a dica "Leitura por QR ativa. Toque em Limpar para digitar." Sem `<form>`/submit próprio: o modal dispara a consulta (ver abaixo).

**Quando a busca manual consulta**: ao preencher o campo e o valor ser válido (placa completa e válida, ticket/sequencial não vazios), com **debounce de 400 ms** e também no `Enter`. Sem botão "Consultar valor" (a referência consulta ao completar o campo). Validação continua no `saidaBuscaSchema`; erros aparecem na dica.

### `ResumoSaida` (novo)
```ts
export interface ResumoSaidaProps {
  consulta: SaidaConsulta | null;
  carregando: boolean;
  valorAnterior: number | null;
  minutos: number;                // permanência derivada, atualizada pelo intervalo
  valor: number;
}
```
Sem consulta mostra "—" nas linhas e o valor desabilitado; carregando mostra `Skeleton`. `PlateDisplay sm`, `ValuePanel`, `OldValue` e `Notice` quando `valorAnterior !== null`. Categoria via `getCategoriaVeiculoLabel`. Permanência via `formatMinutos` (`components/precos/format`, já usado hoje).

### `PagamentoSaida` (novo; substitui `PagamentoSaidaStep`)
Props: `consulta | null`, `forma`, `recebido`, `onFormaChange`, `onRecebidoChange`, `disabled`. Usa `PaymentTileGroup` com `FORMAS_SAIDA`, `Input` de valor recebido (só em Dinheiro, **sem** `autoFocus` para não roubar o foco do visor/busca) e `TrocoLine` em `aria-live="polite"`. Exporta `getPagamentoStatus` com a mesma regra de hoje (centavos, `parseMoney`).

### `SaidaVeiculoModal` e `useSaidaFlow`
Layout: modal `md`, `closeOnBackdrop={false}`, grade em duas colunas a partir de `md` (visor + busca | resumo + pagamento), coluna única abaixo. Rodapé: **Cancelar** e **Confirmar Saída · R$ x**.

`useSaidaFlow` concentra a lógica para o componente ficar só de apresentação:

```ts
type Fase = "identificar" | "recibo";
interface State {
  fase: Fase;
  origem: SaidaOrigem | null;       // "qr" bloqueia a busca manual
  token: string;                    // exibido no visor
  mensagemLido: string | null;
  buscaValues: SaidaBuscaValues;    // campos manuais
  busca: SaidaBusca | null;         // identificador da consulta vigente
  consulta: SaidaConsulta | null;
  valorAnterior: number | null;
  forma: string;                    // padrão FORMA_PADRAO
  recebido: string;
  resultado: SaidaResultado | null;
}
```
- **`consultarPorQr(token)`**: `resolverBuscaPorToken` → `consultarSaida` (uma `useMutation` encadeada). Em sucesso: preenche `busca`, `consulta`, mostra os campos manuais com placa/ticket/sequencial **apenas como leitura** (como a referência, que preenche placa e ticket), `origem = "qr"`.
- **`consultarManual(values)`**: valida com `saidaBuscaSchema`; `consultarSaida(toSaidaBusca(values))`.
- **Atualização ao vivo**: `useQuery` com `queryKey: ["saida-consulta", busca]`, `enabled: !!busca && fase === "identificar"`, `refetchInterval: 30_000`, `refetchOnWindowFocus: false`, `gcTime: 0`. Cada refetch recalcula `dataHoraSaida`, `minutosPermanencia` e `valor` no servidor, então o relógio local não precisa calcular tarifa (a referência calcula no cliente; **aqui a fonte da verdade é o servidor**, PRD). Se o valor do refetch diferir do exibido, atualiza `consulta` e **marca `valorAnterior`** (mesmo aviso do RF9) sem registrar nada. Erros do refetch em segundo plano **não** limpam o resumo: mostram aviso discreto e mantêm o último valor.
- **Confirmar** (`confirmMutation`): igual à regra atual: `consultarSaida(busca)`; se `valoresIguais` falhar → `{ tipo: "mudou", nova }` e **não registra**; senão `registrarSaida(patioId, { valor, formaPagamento })` e monta `SaidaResultado` (recebido/troco). Preserva a proteção contra duplo envio (`isPending` bloqueia botões, fechar e novas leituras).
- **Limpar**: zera `busca/consulta/valorAnterior/token/origem/buscaValues/recebido`, `forma = FORMA_PADRAO`, reativa a câmera.
- **Fechar**: `ConfirmDialog` quando houver progresso (`consulta !== null` ou campos preenchidos) e `fase === "identificar"`; a câmera é parada no unmount do modal.
- Após o registro: `fase = "recibo"`, o hook `useQuery` de empresa é mantido (`enabled: consulta !== null`, para o recibo já nascer completo) e a atualização ao vivo é desligada.

Foco: após leitura, o foco vai para o botão **Confirmar Saída** quando habilitado; após **Limpar**, volta ao visor. O resultado da leitura é anunciado por uma região `aria-live="polite"` única (evita anunciar tick de permanência).

### Alterados sem mudança de contrato
- `RegistrarSaidaButton`, `app/(app)/veiculos/saida/page.tsx`: continuam abrindo `SaidaVeiculoModal` com `onClose`/`onSuccess`.
- `ReciboSaidaStep`: sem mudança (título do modal passa a "Saída registrada" na fase `recibo`).

## 6. Gerenciamento de estado

- Local ao modal (`useSaidaFlow` com `useReducer` ou `useState` agrupado): sem Zustand nem Context novo.
- Cache do TanStack Query para a consulta viva (`["saida-consulta", busca]`) e para a empresa (`EMPRESA_QUERY_KEY`, existente).
- A câmera é estado de efeito (ref + hook), nunca persistido.

## 7. Fluxo de dados

```
Visor ── QR ──► extrairTokenComprovante ──► resolverBuscaPorToken ──► SaidaBusca{placa}
Manual ─ campos ─► saidaBuscaSchema ─► toSaidaBusca ─────────────────► SaidaBusca
                                                  │
                         useQuery(["saida-consulta", busca], 30s) ──► SaidaConsulta
                                                  │
              ResumoSaida / PagamentoSaida ── Confirmar ──► consultarSaida (reconsulta)
                          ├─ valor mudou ─► valorAnterior + nova consulta (não registra)
                          └─ igual ───────► registrarSaida ─► ReciboSaidaStep
```

## 8. Decisões técnicas e trade-offs

| Decisão | Alternativas | Motivo |
| --- | --- | --- |
| Resolver o token via `consultarComprovante` e consultar por **placa** | pedir `token` ao back em `/Patio/saida` | Funciona hoje, sem depender do back; troca isolada em `resolverBuscaPorToken` quando o back suportar |
| Extrator aceita `.../comprovante/<token>` e token solto | formato `GIPE-SAIDA:` / `/c/` da referência | O cupom real gera `/comprovante/<token>`; a referência é protótipo |
| Valor ao vivo vem de **refetch no servidor** a cada 30 s | calcular tarifa no cliente como a referência | Tarifa tem regras complexas (degraus, faixas, convênio, mensalista); duplicar no front gera divergência. O servidor segue como fonte da verdade (PRD) |
| Intervalo de 30 s | tempo real a cada segundo | Valor muda por hora/fração; 30 s basta e poupa a API. Constante `INTERVALO_SAIDA_MS`, ajustável |
| `jsqr` carregado sob demanda como fallback | só `BarcodeDetector` | iOS Safari e Firefox não têm `BarcodeDetector`; operadores usam iPhone e Android |
| Busca manual consulta ao completar (debounce) | botão "Consultar valor" | Alinha à referência e reduz toques; validação mantida |
| Remover as 3 etapas antigas | manter e esconder | Evita código morto e testes de fluxos que não existem mais |
| `PaymentTileGroup` novo em `ui` | estender `OptionGroup` | Layout de grade com ícone é outro padrão; fica reutilizável (caixa pode usá-lo) |
| 4 formas em `FORMAS_SAIDA`, sem mexer em `FORMA_PAGAMENTO` | filtrar `FORMA_PAGAMENTO_OPTIONS` | O caixa continua precisando das 6; a restrição é da tela, não do domínio |
| Dinheiro pré-selecionado | nenhuma pré-seleção (atual) | Pedido da referência e o caso mais comum; reduz um toque. O botão só habilita com valor recebido válido |
| Sem pesquisa externa nova | Context7/web | Sem biblioteca nova além do `jsqr` já conhecido; Next 16 e TanStack Query já usados nas specs vizinhas |

## 9. Estratégia de testes

Ferramenta: **vitest + Testing Library** (`src/test/render.tsx`, `src/test/setup.ts`). Câmera e `BarcodeDetector` são mockados (`navigator.mediaDevices.getUserMedia`, `window.BarcodeDetector`, `HTMLMediaElement.play`); `jsqr` é mockado.

| Camada | O que testar |
| --- | --- |
| Unitário | `extrairTokenComprovante` (URL de hml/prod/localhost, com barra final e query, token solto, texto aleatório, URL de outra rota, token curto/longo); `getPagamentoStatus` (Dinheiro vazio/menor/igual/maior, não-dinheiro); `valoresIguais`/`calcularTroco` (já existem, manter); `resolverBuscaPorToken` (200 → busca por placa; 404/400 → `not_found` com a mensagem de token; 500 propaga) |
| Hook `useLeitorQr` | abre a traseira; `negada`; `indisponivel`; chama `onTexto` com o texto; **para tracks ao desativar e ao desmontar**; debounce do QR inválido repetido; usa `jsqr` quando não há `BarcodeDetector` |
| Componente | `PaymentTileGroup` (seleção por clique e setas, `disabled`, rótulo acessível); `ResumoSaida` (vazio, skeleton, preenchido, valor zero "Nada a cobrar", aviso de valor mudou com valor antigo riscado); `PagamentoSaida` (troco `success`, "Faltam" `danger`, sem campo fora de Dinheiro); `BuscaManualSaida` (bloqueio mútuo, bloqueio por QR, dicas) |
| Integração (`SaidaVeiculoModal`) | QR válido → resumo e botão com valor; QR inválido → "QR Code não é um ticket GIPE" e leitura continua; token inexistente → mensagem e botão desabilitado; busca manual por placa/ticket/sequencial; veículo fora do pátio; Dinheiro padrão e botão desabilitado até valor recebido ≥ valor; Pix sem troco; **valor mudou → não registra e pede nova confirmação**; erro de registro mantém dados; duplo clique registra uma vez; fechar com progresso pede confirmação e **desliga a câmera**; recibo com Imprimir/Concluir; atualização ao vivo muda valor e mostra aviso (fake timers) |
| Manual | celular real (Android e iPhone) lendo o QR do cupom emitido na própria entrada; negar permissão da câmera; HTTPS obrigatório para `getUserMedia` (hml/produção); ambiente `http://IP-local` não abre a câmera; impressão do recibo |

Rodar `npm run lint` e `npm run build` ao final (convenção do projeto).

## 10. Riscos / pontos de atenção

| Risco | Prob. | Mitigação |
| --- | --- | --- |
| `getUserMedia` exige contexto seguro; `http` em rede local não abre a câmera | Alta em dev | Estado "câmera indisponível" com a busca manual em destaque; testar em hml/HTTPS ou `localhost` |
| iOS Safari sem `BarcodeDetector` e `getUserMedia` só após gesto | Média | Fallback `jsqr`; toque no visor inicia a câmera; `playsinline muted` no `<video>` |
| Câmera continua ligada após fechar/concluir | Média | Limpeza centralizada no hook + teste dedicado |
| Resolver token por comprovante adiciona latência e depende do endpoint público | Média | Mostrar estado "Buscando…"; ponto único de troca para `token` direto; se o comprovante estiver indisponível, a busca manual segue funcionando |
| Cupom antigo (QR por `patioId+placa`, rota que nunca existiu) | Baixa | Cai em "QR Code não é um ticket GIPE"; operador usa a busca manual |
| Refetch de 30 s altera o valor sob os olhos do operador | Média | Aviso `Notice` com valor antigo riscado; reconsulta obrigatória antes de registrar (mantida) |
| Valor/tempo anunciados a cada refetch incomodam leitor de tela | Média | `aria-live` só para leitura, erro e mudança de valor; tick de permanência sem anúncio |
| Busca manual automática dispara consultas demais | Baixa | Debounce de 400 ms e só com valor válido; `AbortSignal` do TanStack na troca de `busca` |
| Fluxo mensalista (valor 0) | Baixa | Mantém o comportamento atual: "Nada a cobrar" e confirmação normal (ponto [A DEFINIR] do PRD anterior segue em aberto) |
| Remover `Boleto`/`Transferência` da saída | Baixa | Só na tela; domínio e caixa preservados. Confirmar com o negócio (PRD) |
| Regressão em testes que importam as 3 etapas antigas | Média | `grep` na task de remoção; migrar os testes para os componentes novos |

## 11. Fora de escopo técnico

- Cálculo de tarifa no cliente, ou qualquer mudança em regra de preço/tolerância.
- Mudança de contrato no back-end (aceitar `token` em `/Patio/saida`); fica como otimização futura.
- Leitura de código de barras ou outros formatos além de QR; leitura por imagem enviada (galeria).
- Lanterna/zoom da câmera, escolha entre câmeras, e leitor via hardware (pistola) além do teclado.
- Redesenho do recibo e novas formas de pagamento (Boleto, Transferência) nesta tela.
- Persistência da última forma de pagamento escolhida por operador.
- Timer de inatividade que limpa a leitura.

## 12. Pontos a confirmar antes de implementar

1. Se `/Patio/saida` pode passar a aceitar `token` (remove a chamada extra ao comprovante).
2. Que o QR do cupom em produção é `https://<host>/comprovante/<token>` (lido de `ReciboEntradaStep`; confirmar com um cupom real).
3. Que `GET /Patio/comprovante/cliente` devolve a entrada **em aberto** e responde erro (404/400) quando o veículo já saiu; caso contrário, o fluxo cairia em `consultarSaida` com "Nenhum veículo no pátio…", que também é um desfecho aceitável.
4. Frequência do refetch (30 s) e se o back limita chamadas por operador.
5. Ícones das 4 formas de pagamento: reaproveitar os da referência (SVG inline) ou os já existentes no projeto.
