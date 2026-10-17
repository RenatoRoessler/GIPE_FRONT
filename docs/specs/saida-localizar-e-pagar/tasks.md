# Tasks: Saída de veículos em duas fases (localizar, depois pagar)

Referências: ./prd.md, ./techspec.md, ./design.md

Antes de começar: confirmar os três pontos do techspec (§ "Pontos a confirmar"): sequencial só com Enter (T2), os 5 s para ignorar token repetido (T3) e voltar sem confirmação mesmo com valor recebido digitado (T4). Os valores usados abaixo são os do techspec; mudar um deles não muda a estrutura das tasks.

Ordem pensada para o projeto continuar funcionando a cada task: T1 a T5 só **acrescentam** comportamento (o modal atual segue passando nos testes), T6 troca a tela para duas fases e T7 remove o que ficou sem uso.

- [x] T1 — Dica e teclado do campo Sequencial na busca manual
  - Arquivos: `src/components/veiculos/BuscaManualSaida/BuscaManualSaida.tsx`, `BuscaManualSaida.test.tsx`
  - Pronto quando: o campo Sequencial tem `enterKeyHint="search"` e a dica "Pressione Enter para buscar" (sem sumir quando outro campo bloqueia ou quando há erro, e anunciada como as demais dicas); placa e token não ganham dica nova; testes da dica e do `enterKeyHint`; `npm test` e lint passam.

- [x] T2 — Sequencial só consulta com Enter
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.ts`, `useSaidaFlow.test.tsx`, `SaidaVeiculoModal.test.tsx`
  - Depende de: T1
  - Pronto quando: digitar no sequencial não dispara consulta nem debounce, e `handleBuscaEnter` consulta na hora; placa completa e token continuam com o debounce de 400 ms; apagar o campo ainda descarta a busca; testes do hook (sequencial parcial como "1" não consulta, Enter consulta, placa e token inalterados) e do modal (consulta por sequencial passa a usar `{Enter}`); `npm test` e lint passam.

- [x] T3 — Ignorar o mesmo token por 5 s depois de uma busca que falhou
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.ts`, `useSaidaFlow.test.tsx`
  - Pronto quando: existe `REPETICAO_TOKEN_MS` (5000); quando a busca por token falha, o token e o instante são guardados; `handleToken` com o mesmo token dentro da janela é ignorado (sem nova chamada à API e sem mudar o aviso); passada a janela, é aceito; a guarda é limpa por busca bem-sucedida, por reinício do fluxo e por digitação na busca manual; um token diferente nunca é ignorado; testes com fake timers cobrindo cada um desses casos; `npm test` e lint passam.

- [x] T4 — `fase` derivada e `voltar()` no `useSaidaFlow`
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.ts`, `useSaidaFlow.test.tsx`, `src/components/veiculos/SaidaVeiculoModal/SaidaVeiculoModal.tsx` (só o ajuste necessário), `SaidaVeiculoModal.test.tsx`
  - Depende de: T2, T3
  - Pronto quando: `fase` é derivada (`"recibo"` com resultado, `"pagamento"` com veículo consultado, `"pesquisa"` nos demais) e substitui o estado `fase` e o `setFase`; o `enabled` da consulta periódica passa a ser `busca !== null && !resultado`; existe `voltar()` que não faz nada com `enviando` e, caso contrário, zera busca, campos, erros, aviso, forma, valor recebido e `valorAnterior`, cancela o debounce e dá `reset` nas duas mutações; `hasProgress` vale `true` na fase de pagamento e, na de pesquisa, quando há campo preenchido; `limpar` continua exportado como apelido de `voltar` até a T7 e o modal segue funcionando (a checagem `fase === "recibo"` continua válida); testes: a fase em cada situação, `voltar` zera tudo e devolve a pesquisa, `voltar` ignorado durante o envio, a consulta periódica continua na fase de pagamento e para no recibo; `npm test` e lint passam.

- [x] T5 — `LeitorQrSaida` pausa a câmera durante a busca
  - Arquivos: `src/components/veiculos/LeitorQrSaida/LeitorQrSaida.tsx`, `LeitorQrSaida.styles.ts` (se precisar), `LeitorQrSaida.test.tsx`
  - Depende de: T4
  - Pronto quando: o componente aceita `buscando?: boolean`; com `buscando` a câmera fica inativa (`ativo` falso no `useLeitorQr`), o visor usa o tom de sucesso, a mensagem de apoio some e a região `role="status"` anuncia "Buscando veículo…"; `lido`, `mensagemLido` e `onLimpar` continuam aceitos nesta task, sem mudar o comportamento atual; testes de cada efeito de `buscando`; `npm test` e lint passam.

- [x] T6 — Modal em duas fases (pesquisa, pagamento) mais o recibo
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/SaidaVeiculoModal.tsx`, `SaidaVeiculoModal.styles.ts`, `SaidaVeiculoModal.test.tsx`
  - Depende de: T1, T2, T3, T4, T5
  - Pronto quando: título do modal "Localizar veículo", "Confirmar saída" e "Saída registrada" conforme a fase; fase de pesquisa mostra só `LeitorQrSaida` (com `buscando`) e `BuscaManualSaida`, com rodapé só de **Cancelar**; fase de pagamento mostra só `ResumoSaida`, `ErrorBanner` do registro e `PagamentoSaida`, com rodapé **Voltar para a pesquisa** (seta, `secondary`, desabilitado durante o envio, chama `voltar`) e **Confirmar Saída · R$ x** (mesmos rótulos "Confirmar novo valor" e "Registrando…"), sem **Cancelar**; o recibo não tem o botão de voltar; a troca de fase é automática (sem botão "continuar"); cada fase renderiza em `FaseConteudo` com `key={fase}` e fade de ~150 ms desligado em `prefers-reduced-motion`; `FaseTitulo` (`h3` oculto, `tabIndex={-1}`) recebe o foco a cada troca de fase, menos na montagem inicial, e seu texto anuncia a fase ("Veículo encontrado. Confirme os dados e o pagamento." / "Pesquisa de veículo."); o efeito antigo que focava o botão de confirmar sai; fechar na pesquisa sem nada em andamento fecha direto, e na fase de pagamento sempre pede confirmação ("Cancelar a saída?"); a câmera fica desligada na fase de pagamento e religa ao voltar; testes de integração do techspec (pesquisa só com QR e busca; QR, placa e token levam ao pagamento; sequencial por Enter; mensagens de QR inválido, token inexistente e fora do pátio ficam na pesquisa e a câmera religa; **Voltar para a pesquisa** volta com busca vazia, câmera ativa e pagamento descartado; voltar desabilitado no envio e ausente no recibo; foco no `h3` da fase; rodapé por fase; fechar por fase; valor mudou, erro de registro e duplo envio continuam funcionando); `npm test` e lint passam.

- [x] T7 — Remover o que ficou sem uso
  - Arquivos: `src/components/veiculos/LeitorQrSaida/LeitorQrSaida.tsx`, `LeitorQrSaida.styles.ts`, `LeitorQrSaida.test.tsx`, `src/components/veiculos/BuscaManualSaida/BuscaManualSaida.tsx`, `BuscaManualSaida.test.tsx`, `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.ts`, `useSaidaFlow.test.tsx`, `src/types/saida.ts`
  - Depende de: T6
  - Pronto quando: `LeitorQrSaida` sem `lido`, `mensagemLido`, `onLimpar`, `disabled`, botão **Limpar e ler novamente** e overlay "Ticket encontrado" (e sem `Lido`, `Check` e `LimparButton` nos estilos); `BuscaManualSaida` sem `bloqueadoPorQr` nem `BUSCA_QR_ATIVA_HINT`; `useSaidaFlow` sem `origem`, `token`, `lido`, `mensagemLido`, `valoresExibidos` e sem o apelido `limpar`; tipo `SaidaOrigem` removido; `grep` não encontra nenhuma dessas referências; testes migrados sem perder casos; `npm test`, `npx tsc --noEmit` e lint passam.

- [ ] T8 — Verificação final (lint, build, testes e roteiro manual)
  - Arquivos: `docs/specs/melhoria-fluxo-saida/prd.md` e `tasks.md` (nota de que as telas lado a lado foram substituídas por esta spec), `docs/specs/saida-localizar-e-pagar/tasks.md` (notas da execução)
  - Depende de: T1 a T7
  - Pronto quando: `npm run lint`, `npm test` e `npm run build` passam; as specs anteriores trazem a nota de que RF1 e RF13 da tela única foram substituídos por `saida-localizar-e-pagar`; roteiro manual executado: ler o QR no celular e ver a troca de fase, usar **Voltar para a pesquisa** e ler outro veículo, QR inválido e token inexistente (câmera religa sem repetir a mensagem em loop), QR do comprovante do cliente, câmera negada (só busca manual), sequencial com Enter, leitor de tela (anúncio e foco por fase), `prefers-reduced-motion`, rodapé fixo com o corpo rolando e recibo com Imprimir/Concluir; qualquer falha fica registrada nas notas.

## Notas da execução
- T1 a T7 concluídas. T8 ficou **aberta**: a parte automática passou (`npm test`: 34 arquivos, 328 testes; `npx tsc --noEmit` limpo; `npm run build` ok; `npm run lint`: 0 erros e 94 avisos que já existiam, todos em `.agents/skills/impeccable/scripts`). Falta o roteiro manual em aparelho real: ler o QR e ver a troca de fase, usar **Voltar para a pesquisa** e ler outro veículo, QR inválido e token inexistente (a câmera religa sem repetir a mensagem em loop), QR do comprovante do cliente, câmera negada, sequencial com Enter, leitor de tela (anúncio e foco por fase), `prefers-reduced-motion` e rodapé fixo com o corpo rolando.
- Desvios do techspec/design: na fase de pesquisa os campos da busca manual **não** são desabilitados durante a busca (só ficam desabilitados no envio); desabilitar tirava o foco do campo que o operador acabara de digitar. A câmera continua pausada durante a busca. O foco de volta à pesquisa vai ao título oculto da fase (não ao visor ou ao campo Placa).
- T1: a dica "Pressione Enter para buscar" do Sequencial dá lugar à dica de bloqueio ("Limpe o campo X para usar outro.") quando outro campo está preenchido, e some quando há erro no campo (comportamento do `Input`).
- T3: a guarda de 5 s também vale quando o token existe mas o veículo já saiu (falha na consulta de saída) e quando o token foi digitado em vez de lido.
- Os três pontos em aberto do techspec ficaram como estão: sequencial só com Enter, 5 s para o token repetido e voltar sem confirmação mesmo com valor recebido digitado.
