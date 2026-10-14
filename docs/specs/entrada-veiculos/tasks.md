# Tasks: Registrar Entrada de Veículo

Referências: ./prd.md, ./techspec.md

Ordem pensada para entregar em fatias: **Fase A** (base: tipos, utilitários, serviços, schema, `DiscButton`) → **Fase B** (hooks e modal) → **Fase C** (gatilho nas telas) → **Fase D** (verificação). Rodar `npm run lint` ao fim de cada task que altera código; `npm run build` ao fim de cada fase.

Pontos a confirmar com o backend (concentrados em um lugar cada): mensagem do 400 de "ticket em uso" (T9), aceitação de `modelo`/`cor` vazios (T9).

## Fase A — Base

- [x] T1 — Tipos e enum de categoria de veículo
  - Arquivos: `src/types/veiculo.ts`
  - Pronto quando: exporta `CATEGORIA_VEICULO` (1 a 7, sem `Todas`), `CategoriaVeiculo`, `CATEGORIA_VEICULO_OPTIONS` (Moto, Carro pequeno, Carro médio, SUV/Pick-up, Caminhonete, Caminhão, Carro grande), `PlacaConsulta`, `ModeloVeiculo`, `EntradaPayload` e `EntradaRegistrada` conforme o `techspec.md`; `npm run lint` passa.

- [x] T2 — Utilitários de placa
  - Arquivos: `src/lib/placa.ts`
  - Pronto quando: `normalizePlaca` devolve maiúsculas, só A–Z/0–9 e no máximo 7 caracteres; `isValidPlaca` aceita `ABC1234` e `ABC1D23` (e minúsculas após normalizar) e rejeita `AB12345`, `ABCD123` e vazio; `PLACA_INVALIDA_MESSAGE` é exatamente "Placa inválida. Informe no padrão antigo (ABC1234) ou Mercosul (ABC1D23)"; funções puras; `npm run lint` passa.

- [x] T3 — Geração do código de ticket
  - Arquivos: `src/lib/ticket.ts`
  - Pronto quando: `gerarCodigoTicket(now = new Date())` devolve inteiro de no máximo 32767 (o contrato é Int16): minuto do dia x 20 + blocos de 3 s; `proximoCodigoTicket` devolve um código diferente do atual; para um `Date` fixo o resultado é o esperado (conferido manualmente ou por script descartável fora do repositório); `npm run lint` passa.

- [x] T4 — Serviços de veículo e de pátio
  - Arquivos: `src/lib/api/services/veiculo.ts`, `src/lib/api/services/patio.ts`
  - Pronto quando: `consultarPlaca(placa, signal?)` (`GET /Veiculo/{placa}`), `listModelos(nome, signal?)` (`GET /Veiculo/modelos?nome=`, lista vazia quando nenhum) e `registrarEntrada(payload)` (`POST /Patio/entrada`, aceita 200 e 201) implementados; a placa vai codificada na URL; `ApiError` sobe sem `try/catch`; sem log de token nem payload; `npm run lint` passa.

- [x] T5 — Schema Zod do formulário de entrada
  - Arquivos: `src/lib/schemas/veiculo.ts`
  - Pronto quando: `entradaVeiculoSchema` valida `placa` (obrigatória, com `isValidPlaca` e a mensagem de T2), `categoria` (string entre as opções, "Selecione a categoria"), `modelo` (≤ 60), `cor` (≤ 30) e `mensalista` (boolean); mensagens em português seguindo `schemas/caixa.ts`; `npm run lint` passa.

- [x] T6 — Componente `DiscButton` no design system
  - Arquivos: `src/components/ui/DiscButton/DiscButton.tsx`, `DiscButton.styles.ts`, `index.ts`
  - Pronto quando: botão pílula do modelo B (`.disc`): selo circular com a letra (prop `badge`) e rótulo (children) em caixa alta com `typography.display`; fundo `colors.surface`, borda `colors.border` (hover `colors.primary`), selo `colors.primary` com borda `colors.signEdge`; foco visível com `colors.warn`; alvo de toque ≥ 44 px; ocupa a largura toda abaixo de `breakpoints.sm`; aceita as props de `<button>`; só tokens do tema; `npm run lint` passa.

- [x] T7 — Build da Fase A
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam sem erros.

## Fase B — Hooks e modal

- [x] T8 — Hooks `usePlacaLookup` e `useModelos`
  - Arquivos: `src/components/veiculos/usePlacaLookup.ts`, `src/components/veiculos/useModelos.ts`
  - Pronto quando: `usePlacaLookup` expõe `status` (`idle | loading | found | not_found | error`) e `lookup(placa)`, que cancela a consulta anterior (`AbortController`) e resolve com `PlacaConsulta | null` (null se não encontrado, falha ou cancelada), além de uma função para cancelar/limpar; `useModelos(termo)` usa debounce de 250 ms e `useQuery(["veiculo","modelos",termo])` habilitada só com 2+ caracteres, `staleTime` de 5 min, `keepPreviousData`, sem `refetchOnWindowFocus`; sem dependência nova; `npm run lint` passa.

- [x] T9 — `EntradaVeiculoModal`
  - Arquivos: `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx`, `EntradaVeiculoModal.styles.ts`, `index.ts`
  - Pronto quando: usa `Modal` (montado só quando aberto) com `useAppForm` e `entradaVeiculoSchema`; campos Placa (normalizada, `autoFocus`, `autoCapitalize="characters"`), Categoria (`SelectField` com as opções de T1), Modelo (`Input` com `<datalist>` alimentado por `useModelos`; ao coincidir com uma sugestão preenche a categoria), Cor, Código do ticket (desabilitado, `gerarCodigoTicket` ao abrir) e Mensalista (`SwitchField`, "Mensalista: Sim/Não", padrão Não); Placa e Categoria lado a lado a partir de `sm`. Ao sair da Placa válida chama `lookup`, aplica Modelo/Cor/Categoria não nulos só se a placa atual ainda for a consultada, e mostra hint "Consultando placa…" / "Dados do cadastro preenchidos" / hint não bloqueante em caso de falha; mudar a placa cancela a consulta anterior. Envio via `useMutation(registrarEntrada)` com payload `{ placa, categoria: Number, codigoTicket, mensalista, modelo, cor }`; falha de validação cuja mensagem contém "ticket" gera novo código e reenvia (máx. 2 novas tentativas); sucesso chama `onSuccess("Entrada registrada.")` e `onClose()`; erro aparece em `ErrorBanner` (`role="alert"`) com os dados preservados. Durante o envio campos/botões ficam desabilitados e `Esc`/backdrop/"×" não fecham. As suposições (mensagem do ticket, modelo/cor vazios) estão em comentário curto.

- [x] T10 — Build da Fase B
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam.

## Fase C — Gatilho nas telas

- [x] T11 — `RegistrarEntradaButton`
  - Arquivos: `src/components/veiculos/RegistrarEntradaButton/RegistrarEntradaButton.tsx`, `index.ts`
  - Pronto quando: Client Component que guarda `open`, renderiza `DiscButton` (selo "E", rótulo "Registrar entrada", `aria-haspopup="dialog"`), abre o `EntradaVeiculoModal` e é dono do `useToast`/`Toast` que exibe a mensagem de sucesso; fechar o modal devolve o foco ao botão.

- [x] T12 — Botão na Home e em Entrada de Veículos
  - Arquivos: `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/veiculos/entrada/page.tsx`
  - Pronto quando: a Home mantém o card de boas-vindas e ganha uma linha de ações (`flex-wrap`) com `RegistrarEntradaButton`; `/veiculos/entrada` troca o texto "será implementada em uma spec futura" por título e o mesmo botão; as duas `page.tsx` continuam Server Components; `npm run lint` passa.

- [x] T13 — Build da Fase C
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam; o botão abre o modal nas duas rotas.

## Fase D — Verificação e fechamento

- [ ] T14 — Verificação manual
  - Arquivos: —
  - Pronto quando: conferido em **empresa de teste** com caixa aberto, em desktop e 375 px, claro e escuro: botão na Home e em `/veiculos/entrada`; placas `ABC1234`, `abc1d23`, `AB12345`, `ABCD123` e vazia; placa cadastrada preenche modelo/cor/categoria, não cadastrada não mostra erro, trocar de placa durante a consulta não aplica resposta antiga, falha na consulta não bloqueia o registro; modelo sem sugestões com 0–1 caractere e com sugestões a partir de 2, escolher uma preenche a categoria, texto fora da lista é aceito; ticket desabilitado e preenchido, colisão força nova tentativa; erros (caixa fechado, veículo já no pátio, categoria vazia) aparecem no modal com dados preservados; duplo clique gera um único `POST` e `Esc` durante o envio não fecha; corpo do `POST` no Network com `placa` maiúscula, `categoria` numérica, `codigoTicket` inteiro e `mensalista` booleano; teclado (foco inicial na placa, foco devolvido ao botão) e leitor de tela.

- [ ] T15 — Fechamento da feature
  - Arquivos: `docs/specs/entrada-veiculos/tasks.md`, `docs/specs/entrada-veiculos/prd.md`, `docs/specs/entrada-veiculos/techspec.md`
  - Pronto quando: `npm run lint` e `npm run build` passam; critérios de aceite do `prd.md` marcados; pontos em aberto (ticket em uso, modelo/cor vazios, categoria divergente) resolvidos ou mantidos com a decisão registrada; `docs/specs/input.md` sem os tokens Bearer reais antes de qualquer commit.
