# Tasks: Registrar Saída de Veículo

Referências: ./prd.md, ./design.md, ./techspec.md

Ordem pensada para entregar em fatias: **Fase A** (base: tipos, serviço, schemas, utilitários, `OptionGroup`, `Stepper`) → **Fase B** (etapas e modal) → **Fase C** (atalho nas telas) → **Fase D** (verificação). Rodar `npm run lint` ao fim de cada task que altera código; `npm run build` ao fim de cada fase.

Pontos a confirmar com o backend (concentrados em um lugar cada): nomes dos parâmetros `codigoTicket` e `sequencial` na consulta (T2); se o `POST` recusa valor divergente (T12); mensalista com valor zero pula o pagamento (PRD, ponto em aberto).

## Fase A — Base

- [x] T1 — Tipos da saída
  - Arquivos: `src/types/saida.ts`
  - Pronto quando: exporta `SaidaBuscaTipo`, `SaidaBusca`, `SaidaConsulta`, `SaidaPayload` e `SaidaRegistrada` conforme o `techspec.md`; `npm run lint` passa.

- [x] T2 — Serviço: consultar e registrar saída
  - Arquivos: `src/lib/api/services/patio.ts`
  - Pronto quando: `consultarSaida(busca)` faz `GET /Patio/saida` com **um único** parâmetro (`placa`, `codigoTicket` ou `sequencial`; mapeamento `tipo → parâmetro` isolado e comentado como a confirmar) e `registrarSaida(patioId, payload)` faz `POST /Patio/{patioId}/saida`; 404 sem mensagem do backend vira `ApiError("not_found")` com "Nenhum veículo no pátio com esse <placa|ticket|sequencial>." na consulta e "O veículo não está no pátio." no registro; demais erros sobem como `ApiError`; sem log de token nem payload; `registrarEntrada` existente intacta; `npm run lint` passa.

- [x] T3 — Schemas da busca e do valor recebido
  - Arquivos: `src/lib/schemas/saida.ts`
  - Pronto quando: `saidaBuscaSchema` exige **exatamente um** entre placa, ticket e sequencial ("Informe a placa, o ticket ou o sequencial"), valida a placa com `isValidPlaca`/`PLACA_INVALIDA_MESSAGE` e aceita só dígitos em ticket (≤ 32767) e sequencial; `toSaidaBusca(values)` devolve a busca normalizada; `createRecebidoSchema(valor)` exige valor recebido válido (`parseMoney`) e maior ou igual ao valor a cobrar; mensagens em português; `npm run lint` passa.

- [x] T4 — Utilitários da saída
  - Arquivos: `src/components/veiculos/saida.ts`
  - Pronto quando: funções puras `calcularTroco(recebido, valor)`, `valoresIguais(a, b)` (compara em centavos, `Math.round(v * 100)`), `getCategoriaVeiculoLabel(n)` e `getFormaPagamentoLabel(n)` (reusa `formaPagamentoLabel`); conferido que `valoresIguais(20, 20.0)` é verdadeiro e `valoresIguais(20, 20.01)` falso e que o troco de 50 para 20 é 30 (script descartável fora do repositório); `npm run lint` passa.

- [x] T5 — Componente `OptionGroup` no design system
  - Arquivos: `src/components/ui/OptionGroup/OptionGroup.tsx`, `OptionGroup.styles.ts`, `index.ts`
  - Pronto quando: `fieldset` com `legend`; opções como tiles com `<input type="radio">` nativos escondidos visualmente, navegáveis por setas, com foco visível e seleção indicada por borda/fundo **e** marca (não só cor); props `legend`, `options`, `value`, `onChange`, `disabled`, `error` (mensagem em `role="alert"`); grade 3×2 a partir de `md` e 2×3 abaixo; só tokens do tema; `npm run lint` passa.

- [x] T6 — `Stepper` com rótulo configurável
  - Arquivos: `src/components/ui/Stepper/Stepper.tsx`
  - Pronto quando: nova prop opcional `label` define o `aria-label` da lista; sem ela mantém "Progresso do cadastro", e as telas existentes (cadastro de preço, adesão) continuam idênticas; `npm run lint` passa.

- [x] T7 — Build da Fase A
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam sem erros.

## Fase B — Etapas e modal

- [x] T8 — `ConsultaSaidaStep` (etapa 1)
  - Arquivos: `src/components/veiculos/ConsultaSaidaStep/ConsultaSaidaStep.tsx`, `.styles.ts`, `index.ts`
  - Pronto quando: três `Input` controlados (Placa normalizada em maiúsculas com `autoFocus`; Código do ticket e Sequencial com `inputMode="numeric"`); ao preencher um, os outros dois ficam desabilitados com a dica "Limpe o campo X para usar outro" em texto visível, e liberam ao limpar; valida com `saidaBuscaSchema` ao consultar e mostra os erros nos campos; aceita `onConsultar`, estado `isPending` e `error` por props (campos desabilitados e botão "Consultando…" durante a consulta; `ErrorBanner` `role="alert"` com os campos preservados); três colunas a partir de `sm`.

- [x] T9 — `ConferirSaidaStep` (etapa 2)
  - Arquivos: `src/components/veiculos/ConferirSaidaStep/ConferirSaidaStep.tsx`, `.styles.ts`, `index.ts`
  - Pronto quando: somente leitura; placa em destaque (`fontSizes.xl`, bold) com `StatusBadge` "Mensalista" quando aplicável; `dl` em duas colunas com Modelo, Cor, Categoria, Código do ticket, Sequencial, Entrada, Saída, Permanência (`formatMinutos`) e Tabela de preço (datas com `formatDateTime`); painel "Valor a cobrar" em destaque (`surface` com borda `primary`, valor em `fontSizes.xl`); texto de apoio sobre a conferência antes do registro; coluna única abaixo de `md`.

- [x] T10 — `PagamentoSaidaStep` (etapa 3)
  - Arquivos: `src/components/veiculos/PagamentoSaidaStep/PagamentoSaidaStep.tsx`, `.styles.ts`, `index.ts`
  - Pronto quando: resumo com placa e valor a cobrar; `OptionGroup` com `FORMA_PAGAMENTO_OPTIONS` sem opção pré-selecionada ("Selecione a forma de pagamento" como erro de campo); em Dinheiro aparece "Valor recebido" (`autoFocus`) e a linha de troco em `aria-live="polite"` ("Troco: R$ x" em `success`, "Faltam R$ x" em `danger`, "Informe o valor recebido"); demais formas sem campo extra; quando há valor anterior, o painel mostra o valor antigo riscado (`line-through`, `textMuted`, com texto oculto "era R$ x, agora R$ y") e o aviso em tom `warn` do `design.md`; valor R$ 0,00 mostra "Nada a cobrar"; botão principal "Confirmar pagamento" (ou "Confirmar novo valor") desabilitado sem forma ou com recebido insuficiente, com o motivo em texto visível; `ErrorBanner` `role="alert"` para erro de registro; estado "Registrando…" com tudo desabilitado.

- [x] T11 — `ReciboConteudo`, `ReciboSaidaStep` e impressão (etapa 4)
  - Arquivos: `src/components/veiculos/ReciboSaidaStep/ReciboConteudo.tsx`, `ReciboSaidaStep.tsx`, `.styles.ts`, `index.ts`
  - Pronto quando: `ReciboConteudo` (puro) mostra empresa (nome/CNPJ quando existirem), emissão, placa, modelo/cor, categoria, ticket, entrada, saída, permanência, tabela, forma de pagamento, valor recebido e troco (só em dinheiro) e **Total pago** em destaque, em coluna estreita com linhas tracejadas e `dl`; `ReciboSaidaStep` mostra faixa "Saída registrada" (texto + ícone), o recibo e os botões **Imprimir** e **Concluir**; os dados da empresa vêm de `useQuery(EMPRESA_QUERY_KEY, getEmpresa)` (`staleTime` 5 min) e a falha não bloqueia (recibo sem o bloco da empresa); **Imprimir** chama `window.print()` com o recibo renderizado também em `#recibo-print-root` (`createPortal` no `body`, `display: none` na tela) e `createGlobalStyle` em `@media print` ocultando `body > *:not(#recibo-print-root)`, fundo `white`, texto `black`, sem sombras; ao imprimir aparece só o recibo, nos temas claro e escuro.

- [x] T12 — `SaidaVeiculoModal` (orquestração)
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/SaidaVeiculoModal.tsx`, `.styles.ts`, `index.ts`
  - Pronto quando: `Modal` `lg` com título "Registrar saída" e `Stepper` (`label="Progresso da saída"`, etapas Consultar, Conferir, Pagamento, Recibo); estado único (etapa, busca, consulta, valor anterior, forma, recebido, resultado) que preserva os dados ao **Voltar**; consulta via `useMutation(consultarSaida)` que guarda `busca` e `consulta` e avança; confirmação em `useMutation` única: reconsulta com a mesma `busca`, se `!valoresIguais` atualiza `consulta`, guarda o valor anterior e **não registra**, se igual chama `registrarSaida(patioId, { valor, formaPagamento })` e vai à etapa 4 com `recebido`/`troco` calculados, chamando `onSuccess("Saída registrada.")`; durante o envio botões e campos desabilitados e o modal não fecha (`Esc`, backdrop e "×" ignorados); cada troca de etapa foca o texto "Etapa N de 4: …"; na etapa 4 fechar equivale a **Concluir**; as suposições (parâmetros da busca e recusa por divergência de valor) ficam em comentário curto.

- [x] T13 — Build da Fase B
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam.

## Fase C — Atalho nas telas

- [x] T14 — `RegistrarSaidaButton`
  - Arquivos: `src/components/veiculos/RegistrarSaidaButton/RegistrarSaidaButton.tsx`, `index.ts`
  - Pronto quando: Client Component com `DiscButton badge="S"` "Registrar saída" (`aria-haspopup="dialog"`), dono do `useToast`/`Toast`, abre o `SaidaVeiculoModal`; fechar devolve o foco ao atalho.

- [x] T15 — Atalho na Home e na tela Saída de Veículos
  - Arquivos: `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/veiculos/saida/page.tsx`
  - Pronto quando: o `RegistrarSaidaButton` aparece na `ActionRow` ao lado do botão de entrada na Home; `/veiculos/saida` troca o texto de "spec futura" por título, texto de apoio e o atalho; as duas `page.tsx` continuam Server Components; `npm run lint` passa.

- [x] T16 — Build da Fase C
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam; o atalho abre o modal nas duas rotas.

## Fase D — Verificação e fechamento

- [ ] T17 — Verificação manual
  - Arquivos: —
  - Pronto quando: conferido em **empresa de teste** com caixa aberto (dar entrada de um veículo de teste antes), em desktop e 375 px, claro e escuro: atalho na Home e em `/veiculos/saida`; busca por placa, ticket e sequencial (campos exclusivos desabilitam e liberam), placa inválida, nenhum campo e veículo fora do pátio; etapa 2 com todos os dados e **Voltar** mantendo os campos; dinheiro com recebido menor, igual e maior, troco correto, demais formas sem campo de recebimento; valor mudando entre consulta e confirmação (aviso, valor antigo riscado, nada registrado antes da nova confirmação); sem caixa aberto, veículo que já saiu (duas abas), 403 e falha de rede com dados preservados; duplo clique gera um único `POST` e `Esc` durante o envio não fecha; corpo do `POST` com `valor` igual ao exibido e `patioId` correto na URL; recibo completo, com e sem dados da empresa, **Imprimir** só com o recibo em preto sobre branco nos dois temas, **Concluir** limpa o estado e devolve o foco; teclado e leitor de tela (etapa anunciada, radios por setas, troco anunciado, alerta de valor alterado).

- [ ] T18 — Fechamento da feature
  - Arquivos: `docs/specs/saida-veiculos/tasks.md`, `docs/specs/saida-veiculos/prd.md`, `docs/specs/saida-veiculos/techspec.md`
  - Pronto quando: `npm run lint` e `npm run build` passam; critérios de aceite do `prd.md` marcados; pontos em aberto (parâmetros da busca, recusa por divergência de valor, mensalista com valor zero, campos da empresa no recibo) resolvidos ou mantidos com a decisão registrada; `docs/specs/input.md` sem os tokens Bearer reais antes de qualquer commit.
