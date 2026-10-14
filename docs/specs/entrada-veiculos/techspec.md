# Tech Spec: Registrar Entrada de Veículo

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (via skill claude-design; não há `design.md` separado)
- Layout de referência: `docs/design/layouts/modelo-b-sinalizacao.html` (botão `.disc`)
- Contrato recebido: `docs/specs/input.md` (`GET /Veiculo/{placa}`, `GET /Veiculo/modelos?nome=`, `POST /Patio/entrada`)
- Padrões reaproveitados: `docs/specs/caixa/techspec.md` (serviço + `Modal` + TanStack Form), `useCepLookup` (consulta cancelável)

## Design
- **Telas/estados**
  - *Gatilho*: botão **Registrar entrada** na Home (`/dashboard`) e em `/veiculos/entrada`. Mesma peça, mesmo modal.
  - *Modal "Registrar entrada"* (tamanho `sm`): Placa → Categoria → Modelo → Cor → Código do ticket → Mensalista. Estados: inicial; consultando placa (hint "Consultando placa…"); veículo encontrado (hint "Dados do cadastro preenchidos"); não encontrado (nada é exibido); falha na consulta (hint não bloqueante); enviando (campos e botões desabilitados, "Registrando…"); erro ao registrar (`ErrorBanner`, `role="alert"`, dados preservados); sucesso (modal fecha + `Toast` "Entrada registrada.").
- **Componentes do design system reaproveitados**: `Modal`, `Button`, `Input`, `Select`, `Switch`, `ErrorBanner`, `Toast`; `TextField`/`SelectField`/`SwitchField` de `components/form`.
- **Componente novo no design system**: `DiscButton` em `src/components/ui/DiscButton` — botão pílula do modelo B: selo circular com a letra (`E`) e rótulo em caixa alta. Vai para `ui/` porque "Registrar saída" usará o mesmo padrão.
- **Tokens de tema**: nenhum novo. Selo com `colors.primary`, borda `colors.signEdge`, fundo `colors.surface`, borda do botão `colors.border` (hover `colors.primary`), tipografia `typography.display`/`displayTransform`/`displayTracking`, foco com `colors.warn` como nos botões do `Gantry`/`MobileNav`.
- **Responsividade**: modal já ocupa a largura com margem abaixo de `md`; Placa e Categoria em duas colunas a partir de `sm`, demais campos em coluna única; o botão-disco quebra de linha e ocupa a largura toda em `sm`.
- **Acessibilidade**: placa com `autoComplete="off"`, `autoCapitalize="characters"`, `inputMode` padrão; campo de ticket desabilitado com rótulo e valor legíveis; mensagem de consulta em `role="status"` (já provido pelo `hint` do `Input`); `Esc` fecha (comportamento do `Modal`).

## Arquitetura da solução

### Rotas e gatilho
- `src/app/(app)/dashboard/page.tsx` (Server Component): mantém o card de boas-vindas e acrescenta `<RegistrarEntradaButton />` numa linha de ações (`flex-wrap`).
- `src/app/(app)/veiculos/entrada/page.tsx` (Server Component): troca o texto "será implementada" por título + `<RegistrarEntradaButton />`.
- `src/components/veiculos/RegistrarEntradaButton/RegistrarEntradaButton.tsx` (Client): guarda `open`, renderiza `DiscButton` e, quando aberto, `<EntradaVeiculoModal />`; dono do `useToast`/`Toast` (o modal só chama `onSuccess(message)`).

### Tipos (`src/types/veiculo.ts`)
```ts
export const CATEGORIA_VEICULO = { Moto: 1, CarroPequeno: 2, CarroMedio: 3, SuvPickUp: 4, Caminhonete: 5, Caminhao: 6, CarroGrande: 7 } as const;
export type CategoriaVeiculo = (typeof CATEGORIA_VEICULO)[keyof typeof CATEGORIA_VEICULO];
export const CATEGORIA_VEICULO_OPTIONS: { value: CategoriaVeiculo; label: string }[]; // Moto, Carro pequeno, Carro médio, SUV/Pick-up, Caminhonete, Caminhão, Carro grande (sem "Todas")
export type PlacaConsulta = { placa: string; encontrado: boolean; origem: string | null; modelo: string | null; cor: string | null; categoria: number | null };
export type ModeloVeiculo = { modeloId: number; nome: string; categoria: number };
export type EntradaPayload = { placa: string; categoria: number; codigoTicket: number; mensalista: boolean; modelo: string; cor: string };
export type EntradaRegistrada = { patioId: number; placa: string; codigoTicket: number; dataHoraEntrada: string; /* demais campos do retorno */ };
```
- `99 = Todas` existe só no enum de preço e não entra nas opções (RF5). Obs.: o `TIPO_CATEGORIA` de `types/preco.ts` não tem `CarroGrande = 7`; fica fora desta entrega (ver Riscos).

### Utilitários
- `src/lib/placa.ts`: `normalizePlaca(value)` (maiúsculas, só A–Z/0–9, máx. 7) e `isValidPlaca(value)` com `^[A-Z]{3}[0-9]{4}$` (antigo) ou `^[A-Z]{3}[0-9][A-Z][0-9]{2}$` (Mercosul). `PLACA_INVALIDA_MESSAGE = "Placa inválida. Informe no padrão antigo (ABC1234) ou Mercosul (ABC1D23)"`.
- `src/lib/ticket.ts`: `gerarCodigoTicket(now = new Date()): number` → inteiro dentro do **Int16** do contrato (`codigoTicket` é `Nullable<Int16>`, máx. 32767): `minutoDoDia * 20 + floor(segundos / 3)`, máx. 28799. `proximoCodigoTicket(atual)` devolve um código diferente do atual. Funções puras; recebem o relógio para facilitar conferência.

### Serviços
- `src/lib/api/services/veiculo.ts`
```ts
consultarPlaca(placa: string, signal?: AbortSignal): Promise<PlacaConsulta>   // GET /Veiculo/{placa}
listModelos(nome: string, signal?: AbortSignal): Promise<ModeloVeiculo[]>     // GET /Veiculo/modelos?nome=
```
- `src/lib/api/services/patio.ts`
```ts
registrarEntrada(payload: EntradaPayload): Promise<EntradaRegistrada>          // POST /Patio/entrada (200/201)
```
- Erros sobem como `ApiError` (mensagem do backend em 400: sem caixa aberto, veículo já no pátio, ticket em uso). Sem log de token nem payload.

### Hooks
- `src/components/veiculos/usePlacaLookup.ts`: mesmo desenho de `useCepLookup` (status `idle | loading | found | not_found | error`, `AbortController` cancelando consulta anterior). `lookup(placa)` resolve com `PlacaConsulta | null` (null se não encontrado, falha ou cancelada).
- `src/components/veiculos/useModelos.ts`: `useQuery(["veiculo","modelos",termo], listModelos, { enabled: termo.length >= 2, staleTime: 5 min, placeholderData: keepPreviousData, refetchOnWindowFocus: false })`. O `termo` vem de um valor com debounce de 250 ms (`useDebouncedValue` local ao módulo; sem lib nova — `es-toolkit` não está instalado).

### Schema (`src/lib/schemas/veiculo.ts`)
```ts
entradaVeiculoSchema = z.object({
  placa: z.string().trim().min(1, "Informe a placa").refine(isValidPlaca, PLACA_INVALIDA_MESSAGE),
  categoria: z.string().refine(v => CATEGORIAS.includes(v), "Selecione a categoria"),
  modelo: z.string().trim().max(60),
  cor: z.string().trim().max(30),
  mensalista: z.boolean(),
});
```
- `codigoTicket` não faz parte do formulário validável: é estado gerado (abaixo). Categoria como string para o `<select>`; convertida com `Number` no payload.

### Modal (`src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx`, Client)
- Montado só quando aberto (estado novo a cada abertura), no padrão de `AbrirCaixaModal`: `Modal` + `<form id>` + botão submit no rodapé (`form={formId}`).
- `useAppForm` com `defaultValues { placa: "", categoria: "", modelo: "", cor: "", mensalista: false }` e validação `onChange` via `zodFieldErrors`.
- **Ticket**: `const [ticket, setTicket] = useState(() => gerarCodigoTicket())`; exibido em `Input` desabilitado (`value={String(ticket)}`).
- **Placa**: `format` do `TextField` chama `normalizePlaca`. No `onBlur`, se `isValidPlaca`, chama `lookup(placa)`; ao resolver, **só aplica se a placa atual do formulário ainda for a consultada** (descarta resposta atrasada) e preenche `modelo`, `cor` e `categoria` com os campos não nulos retornados (sobrescreve o que estava digitado, pois a placa é o primeiro campo). `categoria` só é aplicada se existir em `CATEGORIA_VEICULO_OPTIONS`. Mudar a placa depois de uma consulta cancela a consulta em andamento e limpa o hint.
- **Modelo**: `Input` com `list={datalistId}` e `<datalist>` alimentado por `useModelos(debounced)`. Quando o valor digitado coincide (sem diferenciar caixa) com o nome de uma sugestão carregada, preenche `categoria` com a categoria dela (editável). Texto livre continua válido.
- **Mensalista**: `SwitchField` com rótulo dinâmico "Mensalista: Sim/Não" (padrão Não).
- **Envio** (`useMutation` em volta de `registrarEntrada`):
  1. valida; monta `EntradaPayload` (`placa`, `Number(categoria)`, `codigoTicket: ticket`, `mensalista`, `modelo.trim()`, `cor.trim()`);
  2. se falhar com `ApiError` `kind === "validation"` e `/ticket/i.test(message)`, gera novo código (`setTicket`), reenvia automaticamente, no máximo 2 novas tentativas; esgotadas, mostra a mensagem do backend;
  3. sucesso → `onSuccess("Entrada registrada.")` e `onClose()`.
- Enquanto `isPending`, campos e botões ficam desabilitados e **o modal não pode ser fechado**: `Cancelar` desabilitado e `onClose` ignora `Esc`/backdrop/"×" nesse intervalo, para não perder o resultado de um registro em curso.
- Não há invalidação de queries (nenhuma consulta de pátio existe ainda).

### Server vs Client
- `page.tsx` (dashboard e entrada): Server Components. `RegistrarEntradaButton`, `EntradaVeiculoModal`, `DiscButton`, hooks: Client Components. `placa.ts`, `ticket.ts`, schema, tipos: módulos puros.

## Decisões técnicas e trade-offs
- **`<datalist>` em vez de combobox próprio**: acessível e sem componente novo; o custo é pouco controle visual e a detecção de "sugestão escolhida" ser feita por igualdade de texto (também dispara se o usuário digitar o nome exato — o que é desejável).
- **Consulta da placa no `blur`** (não a cada tecla): evita requisições com placa incompleta e atende "após o usuário digitar". Validação local antes de consultar poupa chamadas que dariam 400.
- **Ticket gerado ao abrir o modal, regenerado só em colisão**: o campo mostra sempre o valor que será enviado. Gerar no envio faria o valor visível divergir do enviado.
- **Ticket numérico (minuto do dia x 20 + blocos de 3 s)**: o contrato é Int16, então o código precisa caber em 32767; a resolução é de 3 segundos, e colisões (mesmo bloco, ou o mesmo horário em outro dia) são cobertas pela regra de nova tentativa.
- **Detecção de "ticket em uso" por texto da mensagem**: o backend responde 400 genérico para vários motivos; não há código de erro estruturado. É heurística isolada num ponto (`EntradaVeiculoModal`) e pode virar checagem por código quando existir.
- **Placa sobrescreve campos do formulário na consulta**: simples e previsível; a alternativa (preencher só vazios) deixaria dados antigos de outra placa.
- **Modelo/cor enviados como string (possivelmente vazia)**: o PRD não os torna obrigatórios; assumido que o backend aceita vazio.
- **`DiscButton` em `ui/`** em vez de dentro da feature: já há segundo uso previsto (saída).

## Verificação
- `npm run lint` e `npm run build`.
- Manual (desktop e 375 px, claro e escuro), **em empresa de teste** (o `POST` cria entrada real e exige caixa aberto):
  - Botão visível na Home e em `/veiculos/entrada`, abrindo o mesmo modal.
  - Placa: `ABC1234`, `abc1d23` (normaliza), `AB12345`, `ABCD123`, vazia → mensagens corretas; só consulta quando válida.
  - Placa cadastrada preenche modelo/cor/categoria; não cadastrada não mostra erro; trocar de placa durante a consulta não aplica resposta antiga; falha de rede na consulta não bloqueia o registro.
  - Modelo: 0–1 caractere sem sugestões; 2+ mostram opções; escolher uma preenche categoria; texto fora da lista é aceito.
  - Ticket desabilitado e preenchido; forçar colisão (registrar duas entradas no mesmo instante ou reenviar o mesmo código) e conferir nova tentativa automática.
  - Registrar com caixa fechado, com veículo já no pátio, sem categoria; erro aparece no modal e os dados ficam.
  - Duplo clique em "Registrar" gera um único `POST`; `Esc` durante o envio não fecha.
  - Conferir no Network o corpo do `POST`: `placa` maiúscula, `categoria` numérica, `codigoTicket` inteiro, `mensalista` booleano.
  - Teclado e leitor de tela: foco inicial na placa, foco devolvido ao botão ao fechar.

## Riscos / pontos de atenção
- **"Ticket em uso" sem código estruturado**: a nova tentativa depende de a mensagem do backend conter "ticket"; se mudar, o usuário verá o erro e poderá reenviar (novo código só é gerado ao reabrir). Pedir ao backend um código de erro ou um endpoint de próximo ticket.
- **Colisão entre operadores**: ticket baseado em hora não é único por natureza; a unicidade real é do backend.
- **Modelo/cor vazios**: se o backend os exigir, o 400 mostrará a mensagem; ajustar o schema (tornar obrigatórios) é mudança de um ponto.
- **Categoria divergente** entre cadastro do veículo e sugestão do modelo (ponto em aberto do PRD): prevalece o último preenchimento feito pelo usuário/consulta; a consulta de placa roda antes de o usuário escolher modelo, então na prática vale a escolha manual.
- **`TIPO_CATEGORIA` de preços sem `CarroGrande = 7`**: tabelas de preço não conseguem tratar essa categoria; revisar na feature de preços (fora desta entrega).
- **Sem caixa aberto não há registro**: a tela não consulta o caixa; o aviso vem do 400. Se for desejável bloquear o botão, reaproveitar `useCaixa` em outra spec.
- **Token JWT em `docs/specs/input.md`**: não commitar o arquivo com os tokens; invalidar os já expostos.

## Fora de escopo técnico
- Registro de saída, cobrança e impressão/ticket físico.
- Listagem do pátio e invalidação de consultas de pátio.
- Combobox customizado (apenas `<datalist>`).
- Geração de ticket pelo backend ou alfanumérico.
- Controle de acesso por perfil no cliente (a API devolve 403, exibido no modal).
- Testes automatizados (sem runner configurado).
