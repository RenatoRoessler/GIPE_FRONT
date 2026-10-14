# Tech Spec: Tela de Caixa

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (via skill claude-design; não há `design.md` separado)
- Contrato recebido: `docs/specs/input.md` (endpoints `/api/v1/Caixa/*`)
- Padrões reaproveitados: `docs/specs/editar-preco/techspec.md` (serviço + mapper + TanStack Query), `MinhaEmpresa` (estados de carregamento/erro)

## Design
- **Telas/estados** (rota `/caixa`):
  - *Carregando*: esqueleto da página (`Skeleton`) em `role="status"`.
  - *Erro ao carregar* (qualquer erro diferente de 404): `ErrorBanner` + "Tentar novamente".
  - *Caixa fechado* (404 em `GET /Caixa`): painel vazio com mensagem "Caixa fechado" e o botão **Abrir caixa**.
  - *Caixa aberto*: cabeçalho com status e ações (**Retirada**, **Passar turno**, **Histórico de turnos**, **Fechar caixa**); faixa de 5 cards de saldo; painel "Turno atual" com tabela por forma de pagamento.
  - *Modais*: Abrir caixa, Retirada, Passar turno, Fechar caixa (com resumo do resultado) e Histórico. Cada um com estado de envio (botão desabilitado + "Enviando…") e erro inline (`ErrorBanner`, `role="alert"`) sem fechar o modal.
  - Sucesso: `Toast` ("Caixa aberto.", "Retirada registrada.", "Turno passado.", "Caixa fechado.").
- **Composição visual** (seguindo `PRODUCT.md`/impeccable: dado financeiro com clareza, sem ornamento): o saldo é o elemento dominante (card maior, números em `fontSizes.xl`, tabular-nums); entradas/saídas em `colors.success`/`colors.danger` apenas como reforço, sempre com sinal/texto. Diferenças ≠ 0 no histórico e no resumo de fechamento usam `StatusBadge` ("Sobra"/"Falta") + valor — nunca só cor.
- **Componentes do design system reaproveitados**: `Button`, `Card`, `Text`, `Skeleton`, `ErrorBanner`, `Toast`, `StatusBadge`, `Table`, `Input` (e `TextField` de `components/form` nos formulários).
- **Componente novo no design system**: `Modal` em `src/components/ui/Modal` — não existe hoje (só há `<dialog>` solto em `MobileNav`). Baseado no `<dialog>` nativo (`showModal()`: foco preso, `Esc` fecha, backdrop), com `title`, `onClose`, `children`, `footer` e `size` (`sm`|`lg`). Entra no design system porque será reutilizado.
- **Tokens de tema**: nenhum novo; usa `colors.success`, `danger`, `warn`/`onWarn`, `textMuted`, `surface`, `border`, `space`, `radii`. Valores monetários via `formatBRL`.
- **Responsividade**: cards de saldo em grade 5→2→1 colunas (`breakpoints.lg`/`md`); ações viram uma linha com quebra e o botão principal em largura total em `sm`; a tabela do turno vira lista empilhada em mobile; modais ocupam a largura toda (com margem `space[3]`) abaixo de `md`.

## Arquitetura da solução

### Rota e navegação
- `src/app/(app)/caixa/page.tsx` — Server Component que só renderiza `<CaixaPage />` (sem `useSearchParams`, sem `Suspense`). Já protegida pelo `proxy.ts` (cookie).
- `src/lib/nav.ts`: novo `NavIconId` `"cashier"` e item `{ label: "Caixa", href: "/caixa", icon: "cashier" }` após "Saída de Veículos"; novo ícone em `components/layout/NavSign/NavIcons.tsx` (e onde mais `NavIconId` for mapeado — conferir `MobileNav`/`NavSign`).
- **Controle por perfil:** hoje não existe perfil no cliente (`CurrentUser` é um mock com `id`/`name`) e a feature `permissoes` ainda é só PRD. Nesta entrega o item aparece para todos os logados e a restrição é imposta pela API (403, tratado em tela). Ver Riscos.

### Tipos (`src/types/caixa.ts`)
```ts
export type CaixaStatus = number;          // 0 = aberto (confirmado nos exemplos); demais valores [A DEFINIR]
export type Caixa = { caixaId: number; dataHoraAbertura: string; dataHoraFechamento: string | null;
  valorFundoCaixa: number; valorTotalEntrada: number | null; valorTotalSaida: number | null;
  valorTotalFechamento: number | null; status: CaixaStatus };
export type CaixaSaldo = { dataAbertura: string; fundoCaixa: number; totalEntrada: number; totalSaida: number; saldo: number };
export const FORMA_PAGAMENTO = { Dinheiro: 1, Pix: 2, CartaoDebito: 3, CartaoCredito: 4, Boleto: 5, TransferenciaBancaria: 6 } as const;
export type FormaPagamento = (typeof FORMA_PAGAMENTO)[keyof typeof FORMA_PAGAMENTO];  // + FORMA_PAGAMENTO_OPTIONS com os rótulos
export type FormaPagamentoId = number;  // código vindo da API; tolera valores novos
export type TurnoFormaPagamento = { formaPagamento: FormaPagamentoId; entradas: number; saidas: number;
  valorEsperado: number; valorInformado: number | null; diferenca: number | null };
export type Turno = { turnoId: number; caixaId: number; usuarioId: number; usuario: string;
  usuarioIdFechamento: number | null; dataHoraInicio: string; dataHoraFim: string | null; valorInicial: number;
  status: number; totalEsperado: number; totalInformado: number | null; totalDiferenca: number | null;
  observacao: string | null; trocoPadrao: number | null; disponivelSangria: number | null;
  formasPagamento: TurnoFormaPagamento[] };
export type Conferencia = { formaPagamento: FormaPagamentoId; valorInformado: number };
```
Os tipos espelham o JSON recebido; como no módulo de preços, o serviço usa um DTO tolerante (campos `Partial`) e normaliza `null`/ausente.

### Serviço (`src/lib/api/services/caixa.ts`)
```ts
getCaixa(): Promise<Caixa | null>            // GET /Caixa; 404 => null (caixa fechado)
getSaldo(): Promise<CaixaSaldo>              // GET /Caixa/saldo
getTurnoAtual(): Promise<Turno | null>       // GET /Caixa/turno; 404 => null
listTurnos(): Promise<Turno[]>               // GET /Caixa/turnos (mais antigo → mais recente)
abrirCaixa(fundoCaixa: number): Promise<void>            // POST /Caixa/abrir   (corpo [A DEFINIR])
registrarSangria(v: { valor: number; observacao: string }): Promise<void>  // POST /Caixa/sangria
passarTurno(v: { conferencias: Conferencia[]; valorInicial: number | null; observacao?: string }): Promise<void>  // POST /Caixa/turno/passagem
fecharCaixa(conferencias: Conferencia[]): Promise<Turno>  // endpoint e corpo [A DEFINIR]
```
- O 404 de "sem caixa/turno aberto" é **estado esperado, não erro**: `getCaixa`/`getTurnoAtual` capturam `ApiError` com `kind === "not_found"` e devolvem `null`. `getSaldo` e `listTurnos` só são consultados com caixa aberto (`enabled`).
- `abrirCaixa`: o `input.md` não traz o corpo do `POST /abrir`. Suposição: `{ "valorFundoCaixa": number }` (nome do campo em `GET /Caixa`). **Confirmar com o backend antes da task de implementação**; o ajuste fica num ponto (o serviço).
- `fecharCaixa`: endpoint ausente no `input.md`. Suposição de trabalho: `POST /Caixa/fechar` com `{ conferencias, observacao? }` e retorno do turno encerrado (o `input.md` diz "retorna o resumo do turno encerrado"). **Bloqueio para a task de fechamento** — as demais tarefas não dependem dele.
- Mensagens de erro vêm de `ApiError.message` (400 do backend já diz "valor acima do disponível", "sem turno aberto" etc.).

### Dados no cliente (TanStack Query)
- Chaves: `["caixa"]`, `["caixa","saldo"]`, `["caixa","turno"]`, `["caixa","turnos"]`.
- `useCaixa()` (hook em `src/components/caixa/useCaixa.ts`): `useQuery(["caixa"])`; `saldo`/`turno` com `enabled: caixa != null`; `turnos` com `enabled` só quando o modal de histórico está aberto. `refetchOnWindowFocus: true` nas consultas de saldo/turno (operação em balcão, dados mudam por outros usuários); `staleTime` padrão.
- Mutações (`useMutation`) invalidam `["caixa"]` por prefixo após sucesso (cobre caixa, saldo, turno e turnos), fecham o modal e disparam o `Toast`. Sem atualização otimista (valores financeiros: sempre refletir o servidor).
- Erros de mutação ficam no modal (não no `Toast`). 401 segue a regra do projeto (classificado em `ApiError`; sessão tratada na feature de login).

### Componentes (`src/components/caixa/`, todos Client Components)
| Componente | Responsabilidade |
|---|---|
| `CaixaPage` | Orquestra consultas/estados (carregando, erro, fechado, aberto), estado de qual modal está aberto, `useToast` |
| `CaixaFechado` | Estado vazio + botão Abrir caixa |
| `CaixaHeader` | Status, abertura, botões condicionais |
| `SaldoCards` | 5 cards de saldo |
| `TurnoAtual` | Resumo do turno + `Table` por forma de pagamento + troco padrão / disponível p/ sangria |
| `AbrirCaixaModal`, `SangriaModal`, `PassarTurnoModal`, `FecharCaixaModal`, `HistoricoTurnosModal` | Um modal por operação |
| `ConferenciaFields` | Campos de valor por forma de pagamento, reaproveitado por passagem e fechamento |
| `format.ts` | Rótulos de forma de pagamento, status do turno, formatação de data/hora e de diferença (sobra/falta) |

- Formulários com TanStack Form + Zod (padrão do projeto, `components/form`), schemas em `src/lib/schemas/caixa.ts`:
  - fundo: obrigatório, `parseMoney`, ≥ 0;
  - sangria: valor > 0 e ≤ `turno.disponivelSangria`; observação (motivo) `trim().min(1)`;
  - conferência: cada valor `parseMoney` ≥ 0; **campo vazio = 0**, com aviso visível "Formas sem valor serão contadas como zero" (RF-07/09);
  - passagem: `valorInicial` opcional; vazio ⇒ `null` (backend assume o dinheiro conferido) com texto de apoio.
- A validação do limite da sangria no cliente é conveniência; a regra autoritativa é a do backend (400).
- Formas de pagamento confirmadas: 1 Dinheiro, 2 Pix, 3 Cartão de débito, 4 Cartão de crédito, 5 Boleto, 6 Transferência bancária (enum `FORMA_PAGAMENTO` em `src/types/caixa.ts`). Código desconhecido cai no rótulo "Forma n".

### Server vs Client
- `page.tsx`: Server Component trivial. Tudo em `components/caixa/` e `ui/Modal`: Client Components (estado, `<dialog>`, queries).
- `format.ts`, schemas, tipos, serviço: módulos puros.

## Decisões técnicas e trade-offs
- **Novo `Modal` em `ui/` sobre `<dialog>` nativo** em vez de lib: acessibilidade (foco, Esc, `aria-modal`) vem do navegador, sem dependência; a feature precisa de 5 modais, então vale abstrair agora.
- **404 como valor (`null`)**: modela "caixa fechado" como estado normal, evitando espalhar `isError` com `kind` pela UI.
- **Sem estado local duplicado do caixa**: toda a verdade vem das queries; após cada mutação invalida-se por prefixo. Mais requisições, porém sem divergência de valores.
- **Fechamento e passagem em um passo (mesma conferência)**: reflete o contrato (operação única no backend); `ConferenciaFields` compartilhado evita duplicar.
- **Sem checagem de perfil no cliente nesta entrega**: não há perfil disponível no front nem sistema de permissões pronto; inventar uma checagem local duplicaria regra que é do backend.
- **Valores como `number`**: a API usa números decimais; a formatação é só de exibição (`formatBRL`). Soma/subtração no cliente é evitada — todos os totais vêm da API.
- **Sem polling**: atualização por foco da janela + após ações; polling pode ser adicionado depois se a operação exigir.

## Verificação
- `npm run lint` e `npm run build`.
- Manual (desktop e 375 px, claro e escuro), **em empresa de teste** — as operações alteram dados financeiros reais:
  - Caixa fechado: estado vazio, só "Abrir caixa". Abrir com fundo 0 e com valor; tentar abrir com caixa já aberto em outra aba (erro 400 no modal).
  - Caixa aberto: cards e turno batem com `GET /Caixa/saldo` e `/turno`; botões corretos.
  - Sangria: motivo vazio, valor acima do disponível, valor válido (saldo e turno atualizam).
  - Passagem de turno com outro usuário (login real): conferência, `valorInicial` vazio e preenchido; tentar passar para si mesmo (erro 400 exibido).
  - Fechamento (após contrato confirmado) e histórico (diferenças destacadas, ordem do mais antigo ao mais recente).
  - 403 com perfil sem permissão e falha de rede (dados preservados nos modais).
  - Teclado: `Esc` fecha o modal, foco volta ao botão que abriu; leitor de tela anuncia título do modal e erros.

## Riscos / pontos de atenção
- **Contrato incompleto (bloqueante parcial):** corpo do `POST /abrir`, endpoint de fechamento e significado dos códigos `formaPagamento` e `status` não estão no `input.md`. Confirmar com o backend antes das tasks correspondentes.
- **"Turno já é do usuário logado":** o front não conhece o `usuarioId` logado (usuário é mock), então não dá para ocultar "Passar turno" nesse caso; a prevenção fica por conta do 400 da API, exibido no modal.
- **Perfis sem controle no cliente:** qualquer logado vê o menu; quem não tem permissão recebe 403. Revisitar quando `permissoes` for implementada.
- **Concorrência:** dois operadores mexendo no mesmo turno; o servidor decide, o cliente mostra o erro e recarrega.
- **Dados financeiros reais em teste manual:** usar empresa de teste.
- **Token JWT em `docs/specs/input.md`:** não commitar o arquivo com os tokens Bearer; invalidar os que já foram expostos.
- **`hora` do servidor sem fuso** (`2026-10-13T19:10:06.34044`): tratar como horário local de Brasília na formatação; confirmar se é UTC.

## Fora de escopo técnico
- Lançamento de entradas (cobranças) e estornos.
- Configuração do troco padrão.
- Controle de acesso por perfil no cliente e decodificação do JWT.
- Impressão/exportação de comprovantes.
- Atualização em tempo real (polling/WebSocket).
- Testes automatizados (sem runner configurado).
