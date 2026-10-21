# Tasks: Pagamento do mensalista

Referências: ./prd.md, ./design.md, ./techspec.md

Antes de começar: conferir `node_modules/next/dist/docs/` conforme o `AGENTS.md` (esta feature não cria rotas nem Server Components, então só vale revisar se algo de `next/navigation` for tocado). Toda task termina com `npm run lint` passando e os testes dela verdes (`npm run test`). Nunca copiar tokens reais para código, testes ou docs: os testes montam um JWT fictício.

Ordem: T1 → T2 → T3 e T4 (em qualquer ordem) → T5 → T6 → T7 → T8. A T1 pode bloquear a T2; se bloquear, parar e alinhar com o back antes de seguir.

## Base (sessão, serviço, regras)

- [ ] T1 — Confirmar os ids da sessão e o contrato do pagamento
  - Arquivos: `docs/specs/mensalistas-pagamento/techspec.md` (atualizar §3 e §8)
  - Pronto quando:
    - com um token válido (ou resposta do back), está registrado em quais claims do JWT vêm `empresaId` e `usuarioId` numéricos, **ou** está decidido o plano B (o back lê empresa e usuário do token e o front deixa de enviá-los);
    - está registrado o formato real da resposta de `POST /Mensalista/pagamento` (nomes dos campos da cobrança paga e da próxima) e, se possível, o texto dos erros de contrato não aceito e sem cobrança pendente;
    - está registrado se a API aceita uma chave de idempotência;
    - o Tech Spec reflete a decisão (mantém ou remove `session.ts`, e reduz a lista de apelidos do mapper).
  - Depende de: um token válido ou de resposta do back (fora do código). Sem isso, seguir com as candidatas do Tech Spec e deixar o registro final para a T8.
  - **Atualização (2026-10-21):** o token só traz `empresa_guid` e um `nameidentifier` não numérico. O back vai **remover o `empresaId`** do corpo (a empresa é a do token); o `usuarioId` segue em aberto (sair do corpo, entrar no JWT, endpoint de sessão ou aceitar o `nameidentifier`). O front já não envia `empresaId`.
  - **Status anterior (2026-10-21):** aberta. Sem token válido (Swagger exige 401), T2 a T4 seguiram com as claims candidatas de `src/lib/session.ts` (`empresa_id`/`empresaId` e `usuario_id`/`usuarioId`/`nameid`/`sub`), sem confirmação.

- [x] T2 — Tipos, sessão e serviço de pagamento
  - Arquivos: `src/types/mensalista.ts`, `src/lib/session.ts` (+ `session.test.ts`), `src/lib/api/services/mensalista.ts`, `src/lib/api/services/mensalista.mapper.ts` (+ testes: `mensalista.mapper.test.ts`, `mensalista.test.ts`)
  - Pronto quando:
    - existem `ORIGEM_PAGAMENTO`, `PagamentoMensalistaPayload`, `CobrancaMensalista`, `PagamentoMensalistaResultado` e `PagamentoFormValues` (Tech Spec §2);
    - `getSessaoIds()` decodifica o payload do JWT do cookie (base64url), lê as claims candidatas em constantes no topo do arquivo, devolve `null` para token ausente, malformado ou sem ids inteiros positivos, nunca lança e nunca loga o token (ou foi removido, se a T1 decidiu pelo plano B);
    - `toPagamentoPayload` monta o corpo com `origemPagamento = ORIGEM_PAGAMENTO.PainelAdministrativo` e `valorPago` arredondado a centavos;
    - `fromPagamentoResponse` é tolerante: aceita os apelidos de campo da constante única, tolera `proxima` ausente e campos faltando;
    - `pagarMensalista({ mensalistaId, valorPago, formaPagamento })` chama `POST /Mensalista/pagamento`, preenche empresa e usuário só pela sessão e não aceita esses valores do chamador;
    - sessão sem ids → `ApiError("unauthorized", "Sua sessão expirou. Entre novamente.")` **sem chamar a API**.
  - Testes: JWT montado no teste (base64url com `-` e `_`, claim ausente, não numérica, malformado), payload e arredondamento, resposta completa, sem `proxima`, só alguns campos, rota e corpo do serviço, sessão inválida sem requisição.

- [x] T3 — Validação do formulário e regras puras
  - Arquivos: `src/lib/schemas/pagamento.ts` (+ teste), `src/components/mensalistas/pagamento.ts` (+ `pagamento.test.ts`)
  - Pronto quando:
    - **Schema:**
      - `valorPago` recusa vazio, zero, negativo, mais de 2 casas e texto inválido, e aceita "280", "280,5" e "1.234,56" (mensagem: "Informe um valor maior que zero, com até 2 casas decimais.");
      - `formaPagamento` é obrigatória e pertence a `FORMA_PAGAMENTO_OPTIONS`.
    - **`podeRegistrarPagamento(situacao)`** segue a tabela do Tech Spec §5: `ativo` e `inativo` liberam; `aguardando-pagamento` e `desconhecida` liberam como primeiro pagamento; `aguardando-aceite`, `link-vencido` e `sem-contrato` dão `contrato-nao-aceito`; `carregando` dá `carregando`.
    - **`rotuloConfirmar(valor, forma)`** devolve "Confirmar R$ 280,00 em Pix" e, com valor inválido, "Confirmar pagamento".
    - **`explicarVencimento(diaCadastro, vencimentoProxima)`** devolve a frase só quando o dia efetivo difere do cadastro (31/10 → 01/12 → 31/12, fevereiro bissexto e comum, dia 30).
    - **`classificarErroPagamento(error)`** devolve `rede`, `sessao`, `contrato-nao-aceito`, `sem-cobranca` ou `generico` (Tech Spec §3), com os padrões de texto centralizados.
  - Testes: um por linha das tabelas acima, incluindo cada status HTTP e cada mensagem conhecida.

- [x] T4 — Hook `usePagamentoMensalista`
  - Arquivos: `src/components/mensalistas/usePagamentoMensalista.ts` (+ `usePagamentoMensalista.test.tsx`)
  - Pronto quando:
    - usa `useMutation(pagarMensalista)` com `retry: 0`;
    - no sucesso, invalida `MENSALISTAS_QUERY_KEY` e devolve o `PagamentoMensalistaResultado`;
    - no erro, devolve `classificarErroPagamento(error)`; em `contrato-nao-aceito`, invalida também o contrato daquele mensalista (`contratoQueryKey`);
    - ignora uma segunda chamada enquanto há uma em andamento, inclusive dois cliques no mesmo tick (trava por ref síncrona, além do estado);
    - expõe `isPending` e uma função de reset para voltar ao formulário.
  - Testes (serviço mockado): sucesso invalida o prefixo; duplo clique gera uma única chamada; erro de contrato invalida o contrato; erro genérico não invalida; sem retry automático.
  - Depende de: T2 e T3.

## Modal de pagamento (C)

- [x] T5 — Modal de pagamento: formulário
  - Arquivos: `src/components/mensalistas/PagamentoMensalistaModal/PagamentoMensalistaModal.tsx`, `.styles.ts`, `index.ts`, `PagamentoMensalistaModal.test.tsx`
  - Pronto quando:
    - **Estrutura:** `Modal size="md"` com título "Registrar pagamento", cabeçalho com nome, tipo, categoria e `StageTrack size="sm"` da situação atual;
    - **Valor:** `Input` monetário com a mensalidade do tipo já preenchida, foco e conteúdo selecionado ao abrir, e dica "Mensalidade do tipo: R$ …", que passa a `warn` quando o valor difere (sem bloquear);
    - **Forma:** `OptionGroup` com `FORMA_PAGAMENTO_OPTIONS`, `columns={3}`, sem ícones, Dinheiro pré-selecionado;
    - **Frase de efeito:** explica o que a confirmação faz e muda para "O cadastro será ativado." no primeiro pagamento;
    - **Botão:** o rótulo acompanha valor e forma ao vivo (`rotuloConfirmar`); Enter no valor confirma;
    - **Validação:** erro de valor aparece ao confirmar, com foco no campo; o botão não fica desabilitado em silêncio;
    - **Envio:** durante o envio, tudo fica desabilitado, o rótulo vira "Registrando pagamento…" e o modal não fecha por Esc, clique fora ou ✕;
    - nenhum campo de empresa, usuário ou origem aparece.
  - Testes (hook mockado): valor padrão e foco; Enter; erro de valor; rótulo do botão; dica em `warn`; bloqueio de fechar ao enviar; ausência de campos de empresa e usuário.
  - Depende de: T3 e T4.
  - **Executada (2026-10-21):** a dica de valor diferente usa `StatusBadge tone="warn"` (texto amarelo `warn` sobre fundo claro não passa no contraste); o foco inicial vem do `autoFocus` no `<dialog>` nativo (o jsdom não o simula, então o teste cobre só a seleção ao focar); o envio por Enter é do navegador (o teste dispara o `submit`). Ao concluir, o modal fecha com o toast; a T6 troca isso pelo comprovante.

- [x] T6 — Modal de pagamento: comprovante e erros
  - Arquivos: `src/components/mensalistas/PagamentoMensalistaModal/ComprovantePagamento.tsx`, `PagamentoMensalistaModal.tsx`, `.styles.ts`, testes
  - Pronto quando:
    - **Comprovante:** depois do sucesso, o modal vira "Pagamento registrado", com foco no título (`tabIndex=-1`, `role="status"`), `StageTrack` fechado em `success` quando houve ativação, valor recebido, forma, data e hora (horário de Brasília) e a próxima cobrança com valor e vencimento **vindos da resposta**;
    - **Detalhes:**
      - a frase do dia 31 aparece só quando cabe;
      - o badge "Valor atualizado do tipo" aparece só quando o valor da próxima difere;
      - sem `proxima` na resposta, mostra "Próxima cobrança gerada." sem valor;
    - **Conclusão:** "Concluir" fecha o modal e devolve o foco a quem o abriu; o toast é "Pagamento registrado. Mensalista ativado." (primeiro pagamento) ou "Pagamento registrado.";
    - **Erros em `ErrorBanner role="alert"`, com formulário editável e valores preservados:**
      - `contrato-nao-aceito`: mensagem do design e botão "Reenviar contrato" (`useReenviarContrato`);
      - `sem-cobranca`: só "Fechar";
      - `sessao`: pede para entrar novamente;
      - `generico`: mensagem do back, sem detalhe técnico;
    - **Falha de rede:** banner "Não conseguimos confirmar se o pagamento foi registrado…" com **"Conferir situação"** (refaz a lista e, se o mensalista passou a constar como pago/ativo, mostra o comprovante resumido com "Pagamento já registrado"; se nada mudou, libera "Tentar de novo");
    - não há reenvio automático em nenhum caso.
  - Testes: comprovante completo; sem `proxima`; badge e frase do dia 31; foco no título; cada erro; "Reenviar contrato" dentro do banner; "Conferir situação" nos dois resultados; fechar devolve o foco.
  - Depende de: T5.
  - **Executada (2026-10-21):** a data do comprovante usa `formatDateTime` (horário local, sem o rótulo "horário de Brasília"); datas de cobrança são formatadas pelas partes do dia (`formatDiaCobranca`), porque `new Date("2026-11-05")` deslocaria o dia no fuso do Brasil; "Conferir situação" consulta a listagem pelo documento e compara `ativo`, `situacao` e `dataProximoVencimento` com o que o modal recebeu; depois de falha de rede o envio só é liberado ao conferir, e mexer no formulário não o libera. Testes em `PagamentoMensalistaModal.comprovante.test.tsx`.

## Entrada pela ficha, lista e página (A, B)

- [x] T7 — Pontos de entrada: ficha, lista e página
  - Arquivos: `src/components/mensalistas/MensalistaFichaModal/MensalistaFichaModal.tsx` (+ styles, teste), `SituacaoMensalista/SituacaoMensalista.tsx` (+ teste), `MensalistasList/MensalistasList.tsx` (+ teste), `MensalistasPage/MensalistasPage.tsx` (+ teste), ícone de pagamento junto dos ícones da lista
  - Pronto quando:
    - **Ficha:**
      - o bloco "Pagamento" mostra o vencimento do cadastro, `dataProximoVencimento` (quando existir) e o valor da mensalidade;
      - o rodapé tem "Registrar pagamento" (primário) e "Editar" (secundário);
      - com `podeRegistrarPagamento` negativo, o botão usa `aria-disabled="true"` com `aria-describedby` apontando ao texto do bloco, e o clique não abre nada;
      - com a situação ainda carregando, o bloco mostra `Skeleton`.
    - **`SituacaoMensalista`:** `aguardando-pagamento` ganha a ação "Receber pagamento" (`variant="primary" size="sm"`, `aria-label="Receber pagamento de {nome}"`); `Reenviar` e `Enviar contrato` continuam como estão.
    - **Lista:** novo `IconButton` "Registrar pagamento de {nome}" (44px) entre "Ver ficha" e "Editar", só nas linhas liberadas e que não sejam `aguardando-pagamento`; linhas aguardando aceite não ganham atalho.
    - **Página:** `ModalState` ganha `{ kind: "pagamento"; mensalista }`; da ficha e da lista o modal abre com a situação derivada; ao concluir, o toast aparece e a lista já mostra a nova situação.
  - Testes: botão habilitado e `aria-disabled` por situação; atalho só nas linhas certas; clique abre o modal; fluxo completo com o serviço mockado (da linha até o toast e a lista atualizada); cartões no celular mantêm as ações acessíveis.
  - Depende de: T6.
  - **Executada (2026-10-21):** o callback de pagamento recebe `(mensalista, situacao)` (a lista e a ficha já têm a situação derivada, então a página não a recalcula); `Button` ganhou o estilo de `aria-disabled="true"` (igual ao `disabled`); o ícone de pagamento é `PagamentoIcon`. Testes em `*.pagamento.test.tsx` na ficha, na lista e na página.

## Verificação final

- [ ] T8 — Verificação final e validação contra a API real
  - Arquivos: `docs/specs/mensalistas-pagamento/prd.md` (critérios de aceite), `docs/specs/mensalistas-pagamento/techspec.md` (resultados), `classificarErroPagamento` e o mapper (textos reais)
  - Pronto quando:
    - `npm run lint`, `npm run test` e `npm run build` passam;
    - **roteiro manual** executado em homologação, com mensalista e empresa de teste combinados, registrando o resultado de cada item:
      1. mensalista que aceitou o contrato: pagar e conferir baixa, ativação e próxima cobrança;
      2. mensalista sem aceite: conferir o 400 e a mensagem real;
      3. mensalista ativo com cobrança: segundo pagamento;
      4. mensalista sem cobrança pendente: mensagem real;
      5. valor diferente do da mensalidade, a mais e a menos;
      6. dia de vencimento 31 atravessando novembro, e 29, 30 e 31 em fevereiro;
      7. falha de rede simulada: conferir que "Conferir situação" evita a baixa dupla;
      8. usuário sem permissão (se existir perfil): 403 com mensagem;
    - os textos e campos reais foram ajustados em `classificarErroPagamento` e no mapper, e o resultado ficou registrado no Tech Spec (nova seção "Resultados da execução");
    - cada critério de aceite do `prd.md` (RF-01 a RF-06) foi conferido e marcado, ou tem pendência registrada;
    - `docs/specs/input.md` sem JWT real antes de qualquer commit.
  - Depende de: T7 e de ambiente de homologação com dados de teste.
  - **Status (2026-10-21):** parcial. Feitos: `npm run lint`, `npm run test` (1124 testes) e `npm run build` verdes, e a seção "Resultados da execução" no Tech Spec. Pendentes (precisam de login válido, homologação e dados de teste): o roteiro manual de 8 itens, o ajuste final de `classificarErroPagamento` e do mapper com os textos e campos reais, e a conferência dos critérios de aceite do PRD contra a API real.
