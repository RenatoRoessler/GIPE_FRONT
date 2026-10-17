# Tasks: Melhoria do fluxo de saída de veículos

Referências: ./prd.md, ./techspec.md, ./design.md

Antes de começar: confirmar com o back se `/Patio/saida` pode aceitar `token` (senão vale o desenho do techspec: resolver pelo comprovante), o formato do QR em um cupom real e o que o comprovante devolve para veículo que já saiu. Ver §12 do techspec. Nenhum item bloqueia o código.

- [x] T1 — Criar utilitários puros: extração de token, formas de saída e tipo de origem
  - Arquivos: `src/lib/qr.ts`, `src/lib/qr.test.ts`, `src/components/veiculos/saida.ts` (+ teste), `src/types/saida.ts`
  - Pronto quando: `extrairTokenComprovante` aceita a URL `.../comprovante/<token>` (hml, produção, localhost, com barra final e query) e o token solto `^[A-Za-z0-9]{4,32}$`, e devolve `null` para qualquer outra coisa (outra rota, token curto ou longo, texto aleatório); `FORMAS_SAIDA` (Dinheiro, Crédito, Débito, Pix) e `FORMA_PADRAO` existem sem alterar `FORMA_PAGAMENTO_OPTIONS`; `SaidaOrigem` existe; `getPagamentoStatus` está acessível fora do componente antigo (em `saida.ts`) com os testes de Dinheiro vazio, menor, igual, maior e de outras formas; lint passa.

- [x] T2 — Adicionar `resolverBuscaPorToken` ao serviço do pátio
  - Arquivos: `src/lib/api/services/patio.ts`, `src/lib/api/services/patio.test.ts`
  - Depende de: T1
  - Pronto quando: a função chama `consultarComprovante(token)` e devolve `{ tipo: "placa", valor: placa }`; 404 e 400 viram `ApiError("not_found", "Nenhum ticket aberto com este token.", 404)`; 500 e falha de rede propagam; o comentário `[A CONFIRMAR]` sobre `token` direto em `/Patio/saida` está no código; testes cobrem 200, 404, 400 e 500; lint passa.

- [x] T3 — Criar `PaymentTileGroup` e os ícones das formas de pagamento
  - Nota: em vez de um componente novo, o `OptionGroup` (que já tem tiles com ícone, selecionado invertido e radios nativos) ganhou a prop `columns`; as demais tasks usam `OptionGroup` com `columns={4}` onde o techspec diz `PaymentTileGroup`. Ícones em `saidaIcons.tsx` (`DinheiroIcon`, `CreditoIcon`, `DebitoIcon`, `PixIcon`); testes em `OptionGroup.test.tsx`.
  - Arquivos: `src/components/ui/PaymentTileGroup/{PaymentTileGroup.tsx,PaymentTileGroup.styles.ts,PaymentTileGroup.test.tsx,index.ts}`, `src/components/veiculos/saidaIcons.tsx`
  - Pronto quando: `fieldset`/`legend` com radios nativos escondidos; grade de 4 colunas com altura mínima 64px; selecionado em `primary`/`onPrimary` e também anunciado em texto; foco visível; `disabled`; ícone decorativo (`aria-hidden`) com o rótulo como nome acessível; só tokens do tema; testes de seleção por clique e por setas, `disabled` e rótulo acessível; lint passa.

- [x] T4 — Criar o hook `useLeitorQr` (câmera e decodificação)
  - Arquivos: `package.json` (+ `jsqr` 1.4.0), `src/components/veiculos/LeitorQrSaida/useLeitorQr.ts`, `useLeitorQr.test.tsx`
  - Pronto quando: pede a câmera traseira (`facingMode: { ideal: "environment" }`, sem áudio); estados `ocioso`, `abrindo`, `lendo`, `negada` e `indisponivel`; usa `BarcodeDetector` quando existe e `jsqr` por `import()` dinâmico quando não; leitura em `requestAnimationFrame` sem empilhar chamadas; ignora o mesmo texto inválido por ~1,5 s; **para as tracks, zera `srcObject` e cancela o frame ao desativar, após leitura bem-sucedida e ao desmontar**; testes com `getUserMedia`, `BarcodeDetector` e `jsqr` mockados cobrindo cada estado, o fallback, o debounce e a limpeza; lint passa.

- [x] T5 — Criar o componente `LeitorQrSaida` (visor)
  - Arquivos: `src/components/veiculos/LeitorQrSaida/{LeitorQrSaida.tsx,LeitorQrSaida.styles.ts,LeitorQrSaida.test.tsx,index.ts}`
  - Depende de: T1, T4
  - Pronto quando: visor quadrado com cantos de mira e varredura em `warn`, `<video playsinline muted>`, linha do Token com botão **Limpar** (44×44, `aria-label`) visível só após leitura; estados do design (ocioso, abrindo, lendo, lido em `success`, QR inválido em `danger` por ~1,2 s, negada, indisponível); toque no visor chama `iniciar`; texto fora do padrão chama `onInvalido`, texto válido chama `onToken` com o token extraído; região `aria-live="polite"` para os anúncios; `prefers-reduced-motion` deixa a varredura estática; testes de cada estado e dos callbacks; lint passa.

- [x] T6 — Criar `BuscaManualSaida`
  - Arquivos: `src/components/veiculos/BuscaManualSaida/{BuscaManualSaida.tsx,index.ts}`, `BuscaManualSaida.test.tsx`
  - Depende de: T1
  - Pronto quando: Placa, Código do ticket e Sequencial com o comportamento atual (um desabilita os outros, dica "Limpe o campo X para usar outro", placa normalizada, números só com dígitos); prop `bloqueadoPorQr` desabilita os três com a dica "Leitura por QR ativa. Toque em Limpar para digitar."; sem formulário próprio; erros do `saidaBuscaSchema` mostrados na dica (`aria-live="polite"`); testes de bloqueio mútuo, bloqueio por QR, placa inválida e normalização; lint passa.

- [x] T7 — Criar `ResumoSaida` e `PagamentoSaida`
  - Arquivos: `src/components/veiculos/ResumoSaida/{ResumoSaida.tsx,ResumoSaida.test.tsx,index.ts}`, `src/components/veiculos/PagamentoSaida/{PagamentoSaida.tsx,PagamentoSaida.test.tsx,index.ts}`
  - Depende de: T1, T3
  - Pronto quando: `ResumoSaida` mostra `PlateDisplay sm`, modelo e cor, categoria, entrada e permanência, e o valor em `ValuePanel`; sem consulta mostra "—"; carregando mostra `Skeleton`; valor zero mostra "Nada a cobrar"; `valorAnterior` mostra `Notice` (`role="alert"`) com o valor antigo riscado; `PagamentoSaida` usa `PaymentTileGroup` com `FORMAS_SAIDA`, Dinheiro pré-selecionado, campo "Valor recebido" só em Dinheiro (sem `autoFocus`) e `TrocoLine` em `aria-live="polite"` (`success` no troco, `danger` em "Faltam R$ x", `muted` vazio); Crédito, Débito e Pix sem recebido nem troco; testes de cada estado; lint passa.

- [x] T8 — Criar o hook `useSaidaFlow`
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.ts`, `useSaidaFlow.test.tsx`
  - Depende de: T1, T2, T6, T7
  - Pronto quando: estado único (fase, origem, token, busca manual, consulta, valorAnterior, forma, recebido, resultado); `consultarPorQr(token)` encadeia `resolverBuscaPorToken` e `consultarSaida`; `consultarManual` valida com `saidaBuscaSchema` e consulta com debounce de 400 ms ou Enter; `useQuery(["saida-consulta", busca])` com `refetchInterval` de 30 s (`INTERVALO_SAIDA_MS`), sem refetch ao focar e desligado fora da fase de identificação; mudança de valor no refetch marca `valorAnterior` sem registrar; falha de refetch em segundo plano mantém o último resumo com aviso discreto; **confirmar** reconsulta e, se o valor mudou, não registra; senão registra uma vez (bloqueado enquanto pendente) e monta `SaidaResultado` com recebido e troco; **limpar** zera tudo, volta `forma` para Dinheiro e reativa a câmera; testes de cada regra com fake timers e mocks de serviço; lint passa.

- [x] T9 — Reescrever `SaidaVeiculoModal` como tela única
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/SaidaVeiculoModal.tsx`, `SaidaVeiculoModal.styles.ts`, `SaidaVeiculoModal.test.tsx`
  - Depende de: T5, T6, T7, T8
  - Pronto quando: modal `md` com `closeOnBackdrop={false}`, sem `Stepper`; duas colunas a partir de `md` (visor e busca | resumo e pagamento) e coluna única no mobile com rodapé fixo; rodapé **Cancelar** e **Confirmar Saída · R$ x** (vira "Confirmar novo valor · R$ x" após mudança e "Registrando…" no envio), desabilitado sem entrada encontrada ou com pagamento inválido; foco no botão após a leitura e no visor após Limpar; `ErrorBanner` `role="alert"` em erro de registro mantendo os dados; `ConfirmDialog` ao fechar com progresso; câmera desligada ao fechar e ao concluir; recibo existente na fase final com título "Saída registrada", **Imprimir** e **Concluir** (aviso "Saída realizada com sucesso."); testes de integração do techspec §9 (QR válido, QR inválido, token inexistente, busca manual, veículo fora do pátio, Dinheiro padrão, Pix sem troco, valor mudou, erro de registro, duplo clique, fechar, atualização ao vivo, recibo); lint passa.

- [x] T10 — Remover as etapas antigas e limpar o que sobrou
  - Arquivos: `src/components/veiculos/{ConsultaSaidaStep,ConferirSaidaStep,PagamentoSaidaStep}/` (remover), `src/components/veiculos/Saida.styles.ts`, testes que os importavam
  - Depende de: T9
  - Pronto quando: `grep` não encontra nenhuma referência às três pastas; `StepForm`, `StepDescription` e demais estilos sem uso saem de `Saida.styles.ts`; testes que cobriam as etapas foram migrados aos componentes novos (sem perder casos); `RegistrarSaidaButton` e `app/(app)/veiculos/saida/page.tsx` continuam abrindo o modal sem mudança de contrato; `npm test` e lint passam.

- [ ] T11 — Verificação final (lint, build, testes e roteiro manual)
  - Arquivos: nenhum (execução)
  - Depende de: T1 a T10
  - Pronto quando: `npm run lint`, `npm test` e `npm run build` passam; roteiro manual do techspec §9 executado: ler em um celular (Android e iPhone) o QR do cupom emitido por uma entrada real, negar a permissão da câmera e ver a busca manual funcionar, confirmar que em `http://IP-local` aparece "câmera indisponível", registrar uma saída em Dinheiro e em Pix, conferir que a câmera desliga ao fechar o modal e imprimir o recibo; qualquer falha fica registrada nas notas.

## Notas da execução
- T11 ficou **aberta**: a parte automática passou (`npm test`: 33 arquivos, 270 testes; `npm run build` ok; `npm run lint`: 0 erros, 94 avisos que já existiam, todos em `.agents/skills/impeccable/scripts`). Falta o roteiro manual, que depende de aparelho real: ler o QR de um cupom real no Android e no iPhone, negar a câmera, conferir "câmera indisponível" em `http://IP-local`, registrar saída em Dinheiro e em Pix, ver a câmera desligar ao fechar o modal e imprimir o recibo.
- Desvios do techspec: `PaymentTileGroup` não foi criado, o `OptionGroup` ganhou a prop `columns` (ver T3); o modal usa `size="lg"` (760px) em vez de `md`, porque duas colunas não cabem em 600px; `ResumoSaida` recebe só `consulta`, `carregando` e `valorAnterior` (permanência e valor já vêm da consulta, sem props separadas); `BuscaManualSaida` mostra o divisor "ou informe sem QR Code" e o aviso da consulta.
- Corrigido durante a T8: cliques repetidos em **Confirmar Saída** no mesmo instante chegavam a registrar 3 vezes (o `isPending` do closure ficava desatualizado); agora há trava por ref, coberta por teste.
- Busca manual por ticket ou sequencial consulta após 400 ms sem digitar; digitar "4" de "482" pode mostrar por instantes "Nenhum veículo no pátio com esse ticket". A placa só é consultada completa.
- O campo "Código do ticket" da busca manual virou **Token** (texto livre, aceita também o link do cupom colado). O token digitado é resolvido como o do QR (`resolverBuscaPorToken` e depois consulta por placa); a busca por código do ticket deixou de existir na tela. O visor ficou só com o botão "Limpar e ler novamente", e o token lido aparece no campo Token (desabilitado).
- A composição em tela única do modal foi substituída por duas fases em `docs/specs/saida-localizar-e-pagar/`: o visor deixou o estado "lido" e o botão "Limpar e ler novamente", e o campo Sequencial só consulta com Enter.
