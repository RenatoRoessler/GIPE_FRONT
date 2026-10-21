# Tasks: Finalização do fluxo de mensalista (veículos, contrato e aceite)

Referências: ./prd.md, ./design.md, ./techspec.md

Antes de começar: conferir a doc do Next desta versão em `node_modules/next/dist/docs/` antes da T14 (`page.md`: `searchParams` como Promise; `generate-metadata.md`: `robots` e `referrer`), conforme `AGENTS.md`. Toda task termina com `npm run lint` passando e os testes dela verdes (`npm run test`).

## Base (erros, tipos, serviços)

- [x] T1 — Ler as mensagens de erro reais do back em `normalizeError`
  - Arquivos: `src/lib/api/errors.ts`, `src/lib/api/types.ts`, `src/lib/api/errors.test.ts` (novo)
  - Pronto quando:
    - a mensagem vem, nesta ordem, de `message` → `detail` → `errors[0].message` (quando `errors` é array) → `erros[0].mensagem` → padrão do `kind`;
    - o status 429 vira o novo `kind: "rate_limited"`, com mensagem padrão própria;
    - `ApiErrorBody` aceita o formato antigo (`Record<string, string[]>`) e o array `{ code, message }[]`;
    - há testes para cada formato e para o 429;
    - a suíte inteira passa e os testes que fixavam "Os dados enviados são inválidos." foram revisados.

- [x] T2 — Tipos de veículos, condutores, situação e contrato
  - Arquivos: `src/types/mensalista.ts`, `src/types/contrato.ts` (novo)
  - Pronto quando:
    - existem os tipos `Condutor`, `MensalistaVeiculo`, `CONTRATO_STATUS`/`ContratoStatus`, `ContratoMensalista`, `SituacaoMensalista`, `SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO`, `CondutorFormValues` e `VeiculoFormValues`, em `src/types/mensalista.ts`, conforme §2 do Tech Spec;
    - existem `ContratoCliente`, `AceiteContrato` e `ContratoErroKind`, em `src/types/contrato.ts`;
    - `Mensalista` ganha `veiculos`, `situacao`, `dataProximoVencimento` e `diasAteProximoVencimento`;
    - `MensalistaFormValues` ganha `veiculos`, e `MensalistaPayload` ganha `veiculos` com `condutores?` opcional;
    - `npx tsc --noEmit` passa, ajustando os usos atuais (`EMPTY_VALUES` do modal, mocks de teste).

- [x] T3 — Mapper de veículos e condutores
  - Arquivos: `src/lib/api/services/mensalista.mapper.ts`, `mensalista.mapper.test.ts`
  - Pronto quando:
    - `fromMensalistaResponse` lê `veiculos` (`?? []`), normaliza placa e CPF e lê `situacao` e os campos de vencimento (`?? null`);
    - `fromMensalista` gera `uid` por veículo e por condutor, mascara o CPF e converte a cor com `matchCor`, mantendo o texto original quando não bate;
    - `toMensalistaPayload` normaliza placa, modelo e cor e converte a categoria para número;
    - em `toMensalistaPayload`, pessoa física **não** envia a chave `condutores`, pessoa jurídica envia CPF só com dígitos, e `uid` nunca vai no payload;
    - há testes cobrindo ida e volta, PF × PJ, cor fora da lista e placa com hífen.

- [x] T4 — Validação de veículos e condutores (schema dependente do tipo)
  - Arquivos: `src/lib/schemas/mensalista.ts` (+ teste em `src/lib/schemas/mensalista.test.ts`), `src/components/form/zodFieldErrors.ts` (se precisar)
  - Pronto quando:
    - `createMensalistaSchema({ categoriaTipo })` valida:
      - placa obrigatória e válida, sem repetir (as duas ocorrências marcadas);
      - modelo até 80 e cor até 50;
      - categoria igual à do tipo, ou qualquer uma exceto 99 quando o tipo é 99;
      - para PJ: ao menos 1 condutor por veículo, nome até 100, CPF válido e sem repetir no mesmo veículo;
      - para PF: condutores ignorados;
    - o mesmo CPF em veículos diferentes é aceito, e zero veículos também;
    - um teste garante que `zodFieldErrors` produz nomes de campo aninhados (`veiculos[0].placa`, `veiculos[0].condutores[1].cpf`) compatíveis com o TanStack Form.

- [x] T5 — Serviços de contrato (operador e público)
  - Arquivos: `src/lib/api/services/mensalista.ts`, `src/lib/api/services/contrato.ts` (novo), `contrato.test.ts` (novo)
  - Pronto quando:
    - `getContratoMensalista(id)` devolve `ContratoMensalista` ou `null` no 404;
    - `reenviarContrato(id)` devolve `{ tokenExpiracao, email }`;
    - `consultarContratoCliente(token)` e `aceitarContrato(token, documento)` existem, e o documento vai sem máscara;
    - `classifyContratoError` é pura e exportada:
      - 429 → `rate-limited`;
      - 404 → `invalido`;
      - 400 com "expir/venc" → `vencido`;
      - 400 com "já aceit" → `ja-aceito`;
      - 400 com "documento/cpf/cnpj/confere" → `documento`;
      - qualquer outro 400 → `invalido`;
    - os erros públicos são lançados como `ContratoError` com `contratoKind`;
    - há testes com as mensagens reais já conhecidas ("Token inválido.", "Contrato não encontrado.") e com o 429.

- [x] T6 — Mover a máscara automática de documento para `lib`
  - Arquivos: `src/lib/documento.ts`, `src/lib/documento.test.ts`, `src/components/mensalistas/format.ts`, `src/components/mensalistas/MensalistasList/MensalistasList.tsx`
  - Pronto quando:
    - existe `formatDocumentoAuto` em `src/lib/documento.ts` (com o mesmo comportamento do `formatBusca` atual), testado;
    - a busca da lista passa a usá-lo, por re-export ou troca direta, sem mudança visível;
    - a página pública poderá usá-lo sem importar de `components/mensalistas`.

## Design system

- [x] T7 — Criar o `StageTrack`
  - Arquivos: `src/components/ui/StageTrack/StageTrack.tsx`, `StageTrack.styles.ts`, `index.ts`, `StageTrack.test.tsx`
  - Pronto quando:
    - recebe as props `stages` (`done | current | attention | todo`), `size` (`sm | md`), `tone` (`default | success`) e `label`;
    - a semântica é `<ol aria-label>`, com `aria-current="step"` na etapa atual e texto de estado em cada etapa (visível em `md`, oculto em `sm`);
    - cada estado tem forma distinta (cheio, anel, alerta), não só cor;
    - usa só tokens do tema (`design.md` §3) e transient props;
    - há testes de `aria-current`, textos de estado e rótulos ocultos em `sm`.

## Lista de mensalistas (A)

- [x] T8 — Derivar a situação do mensalista
  - Arquivos: `src/components/mensalistas/situacao.ts`, `situacao.test.ts`
  - Pronto quando:
    - `derivarSituacao(mensalista, contratoQuery, agora)` é pura e cobre todas as linhas da tabela de `design.md` §1A:
      - `ativo`;
      - `inativo` (com outra `situacao`);
      - `carregando`;
      - `aguardando-aceite` e `link-vencido` (pelo `tokenExpiracao` × `agora`, incluindo o instante-limite);
      - `aguardando-pagamento`;
      - `sem-contrato` (404 ou cancelado);
      - `desconhecida` (erro na consulta);
    - um teste cobre cada caso.

- [x] T9 — Consultar contratos das linhas e reenviar
  - Arquivos: `src/components/mensalistas/useContratosMensalistas.ts`, `useReenviarContrato.ts` (+ testes)
  - Pronto quando:
    - `useContratosMensalistas` usa `useQueries` só para os itens inativos com `situacao === "Aguardando Primeiro Pagamento"`, com chave `["mensalistas", "contrato", id]`, `staleTime` de 60s, sem retry e sem refetch no foco;
    - `useReenviarContrato` expõe o id em andamento;
    - no sucesso, o reenvio invalida o contrato daquele id e devolve o e-mail para o toast;
    - no 400 "já aceito", também invalida;
    - há testes com o serviço mockado.

- [x] T10 — Colunas "Veículos" e "Situação" na lista
  - Arquivos: `src/components/mensalistas/VeiculosResumo.tsx`, `src/components/mensalistas/SituacaoMensalista/SituacaoMensalista.tsx` (+ styles, index), `MensalistasList/MensalistasList.tsx`, `Mensalistas.styles.ts`, `MensalistasList.test.tsx`, `MensalistasPage/MensalistasPage.tsx`
  - Pronto quando:
    - **Coluna Veículos:** mostra até 2 `PlateDisplay size="sm"` + "+N", "—" sem veículos, e é um botão com `aria-label="Ver veículos de {nome}"`.
    - **Coluna Situação:** mostra `StageTrack size="sm"` + rótulo + linha secundária conforme a situação derivada, com "Reenviar" ou "Enviar contrato" quando cabe.
    - **Reenvio:** desabilita só a linha e mostra "Reenviando…"; o toast de sucesso cita o e-mail e avisa que o link anterior deixa de funcionar; no erro, toast com a mensagem do back.
    - **Ações:** novo botão "Ver ficha" (44px).
    - **Skeleton:** cobre a coluna nova.
    - **Celular:** os cartões mantêm Nome, Situação e Veículos no topo.
    - **Testes:** "+N", cada situação (serviço mockado) e reenvio.

- [x] T11 — Ficha do mensalista
  - Arquivos: `src/components/mensalistas/MensalistaFichaModal/MensalistaFichaModal.tsx` (+ styles, index, teste), `src/components/mensalistas/format.ts` (`maskCpfParcial`), `MensalistasPage/MensalistasPage.tsx`
  - Pronto quando:
    - o `ModalState` ganha `ficha`;
    - a ficha mostra:
      - o cabeçalho (documento, tipo, categoria e valor);
      - o bloco Contrato, com `StageTrack size="md"` e a frase do próximo passo;
      - os veículos (placa, modelo · cor · categoria e, para PJ, condutores com CPF parcialmente mascarado);
      - "Nenhum veículo cadastrado." quando não houver veículos;
    - o rodapé tem "Reenviar contrato" (quando cabe) e "Editar", que troca para o `MensalistaModal`;
    - a ficha busca o contrato sob demanda quando a linha não buscou;
    - há testes de PF × PJ, sem veículos e Editar.

## Modal de mensalista (B)

- [x] T12 — Seção "Veículos" no `MensalistaModal`
  - Arquivos: `src/components/mensalistas/MensalistaModal/VeiculosSection.tsx`, `VeiculoItem.tsx`, `CondutoresList.tsx`, `MensalistaModal.tsx`, `MensalistaModal.styles.ts`, `MensalistaModal.test.tsx`
  - Pronto quando:
    - **Formulário:**
      - tem duas seções com título ("Dados do mensalista" e "Veículos (N)");
      - a lista de veículos é um array field com `key={uid}` e `AccordionItem` (com `summary` e `hasError`);
      - aceita zero veículos, com o estado vazio do design.
    - **Adicionar veículo:**
      - o item novo entra aberto, com foco na placa, e os outros sem erro se recolhem;
      - o veículo novo de pessoa jurídica já vem com 1 condutor vazio.
    - **Campos do veículo:**
      - placa: `PlateField` + `CameraButton`, que abre um único `LeitorPlacaModal` para o veículo alvo;
      - cor: `ColorField`;
      - categoria: somente leitura quando o tipo tem categoria específica, e `SelectField` sem "Todas" quando o tipo é 99;
      - trocar o tipo ajusta as categorias e mostra a nota "Categorias dos veículos ajustadas para X.".
    - **Condutores:**
      - só aparecem para pessoa jurídica;
      - remover fica desabilitado com 1 condutor;
      - "Copiar condutores de…" soma sem repetir CPF (`mesclarCondutores`, função pura testada);
      - trocar PJ → PF limpa os condutores; PF → PJ cria 1 condutor vazio por veículo.
    - **Remover veículo:**
      - um veículo vazio sai direto;
      - um veículo preenchido pede `ConfirmDialog`;
      - o foco vai para o item anterior ou para "Adicionar".
    - **Testes:** cobrem cada comportamento acima.

- [x] T13 — Regras de salvar: ativo, erros do servidor e mensagens
  - Arquivos: `src/components/mensalistas/MensalistaModal/MensalistaModal.tsx`, `src/components/mensalistas/MensalistaModal/serverErrors.ts` (+ teste), `src/lib/api/services/mensalista.ts`, `MensalistaModal.test.tsx`
  - Pronto quando:
    - **Cadastro:** envia `ativo: false`; o toast é "Mensalista cadastrado. Enviamos o contrato para {email}.".
    - **Edição:** ativo mostra o switch "Desativar mensalista"; inativo mostra `SituacaoMensalista` só leitura, sem switch, e envia `ativo: false`.
    - **Erros do servidor:** `mapMensalistaServerError` liga uma mensagem que cita a placa de um veículo da lista ao campo daquele veículo, abrindo e focando o item; outras mensagens caem no `ErrorBanner`.
    - **Submit com erro de validação:** abre os itens com erro e foca o primeiro campo inválido.
    - **Testes:** cobrem tudo isso.

## Página pública (C)

- [x] T14 — Rota `/contrato` e telas de mensagem
  - Arquivos: `src/proxy.ts`, `src/app/contrato/layout.tsx`, `src/app/contrato/page.tsx`, `src/components/contrato/ContratoMensagem.tsx` (+ teste)
  - Pronto quando:
    - **Acesso:** `/contrato` está em `PUBLIC_PATHS` e abre sem cookie.
    - **Layout:** igual ao de `/comprovante` (`SignageThemeProvider` + Barlow).
    - **`page.tsx`** (Server):
      - faz `await searchParams`, aceita `t` como string (se vier array, usa o primeiro) e valida com `/^[A-Za-z0-9]{10}$/`;
      - token inválido ou ausente renderiza `ContratoMensagem kind="invalido"` sem chamar a API;
      - `metadata` tem `robots: { index: false, follow: false }` e `referrer: "no-referrer"`.
    - **`ContratoMensagem`:** cobre `vencido` ("Este link venceu…") e `invalido` ("Link inválido…") com os textos do design.
    - **Service worker:** `sw.js` não faz cache da navegação de `/contrato` (conferido e anotado).
    - **Build:** `npm run build` passa.

- [x] T15 — Folha do contrato e progresso de leitura
  - Arquivos: `src/components/contrato/ContratoAceite/ContratoAceite.tsx`, `ContratoAceite.styles.ts`, `index.ts`, `src/components/contrato/useReadingProgress.ts` (+ teste), `src/components/contrato/format.ts` (+ teste)
  - Pronto quando:
    - **Consulta:** `useQuery(["contrato-cliente", token])` sem retry.
    - **Carregando:** skeleton sem pulo de layout.
    - **Contrato carregado:**
      - cabeçalho com `Logo`, razão social, título e "Versão N · Para {nome}";
      - faixa de status (pendente `info`, aceito `success`) com o skip link "Pular para a confirmação";
      - folha com `white-space: pre-wrap` e `overflow-wrap: anywhere`, texto `fontSizes.md` e largura de leitura de cerca de 68 caracteres;
      - barra de progresso `aria-hidden` via `useReadingProgress` (passivo + rAF, sem transição).
    - **Erros da consulta:**
      - `vencido`/`invalido` mostram `ContratoMensagem`;
      - status Cancelado também mostra `invalido`;
      - erro de rede mostra `ErrorBanner` + "Tentar novamente";
      - `rate-limited` mostra o banner próprio.
    - **Formatadores:** `formatHash` (grupos de 4, `início…fim`) e `formatDataAceite`, testados.
    - **Celular:** nada rola na horizontal a 320px.

- [x] T16 — Confirmação do aceite e selo
  - Arquivos: `src/components/contrato/ConfirmacaoAceite.tsx`, `SeloAceite.tsx`, `ContratoAceite.tsx`, `ContratoAceite.test.tsx`, `src/components/veiculos/Recibo.styles.ts` (reuso de `PrintStyles`, se precisar ajustar)
  - Pronto quando:
    - **Formulário:**
      - `Checkbox` desmarcado e documento com `formatDocumentoAuto`, mais o texto de transparência e a identificação do texto;
      - o botão fica sempre habilitado; ao enviar incompleto, mostra os erros e foca o primeiro.
    - **Respostas do aceite:**
      - `documento`: erro no campo com foco, mantendo o valor;
      - `ja-aceito`: refaz a consulta;
      - `vencido`: troca para a mensagem de link vencido;
      - `rate-limited`: banner `role="alert"` + contagem de 60s no botão.
    - **Sucesso:**
      - `setQueryData` para aceito e limpeza do documento digitado;
      - o selo aparece com data e hora "(horário de Brasília)", cópia por e-mail, ativação após o 1º pagamento e hash;
      - o foco vai ao título do selo (`role="status"`);
      - "Imprimir ou salvar PDF" usa `window.print()`, imprimindo só cabeçalho, texto e selo.
    - **Link reaberto com contrato já aceito:** mostra folha + selo, sem formulário.
    - **Testes:**
      - carregando, pendente e enviar sem marcar;
      - documento que não confere;
      - 429 com fake timers;
      - sucesso com foco e documento limpo;
      - já aceito, vencido e inválido.

## Fechamento

- [ ] T17 — Verificar o `PUT` de tipo de mensalidade (campos novos do back)
  - **Bloqueada (2026-10-21):** falta uma chamada autenticada real. Análise de contrato já feita, em `techspec.md` §10.
  - Arquivos: `src/lib/api/services/mensalista.mapper.ts` (só leitura, salvo se houver bug), anotação em `techspec.md`
  - Pronto quando:
    - está confirmado, contra a API em homologação, se editar um tipo pelo `TipoModal` atual zera `toleranciaDiasAtraso`, `quantidadeVagas` e os dias da semana;
    - se zerar, o resultado está registrado como bug e com uma correção mínima proposta (preservar os valores lidos no GET e reenviá-los no PUT), sem tela nova, já que a edição desses campos está fora do escopo;
    - se não zerar, está anotado que não há problema.

- [ ] T18 — Validação ponta a ponta contra a API real
  - **Bloqueada (2026-10-21):** depende de login válido na API, de e-mail de teste combinado e do back apontar `Contrato:LinkAceite` para `/contrato?t={token}`. T1 a T16 estão concluídas e verificadas (ver `techspec.md` §10).
  - Arquivos: `docs/specs/mensalistas-contrato/techspec.md` (seção de resultados), `src/lib/api/services/contrato.ts` e `MensalistaModal/serverErrors.ts` (ajuste de textos, se preciso)
  - Pronto quando:
    - **Pré-condição:** em homologação, com e-mail de teste combinado e com o back já apontando `Contrato:LinkAceite` para `/contrato?t={token}`.
    - **Roteiro executado e anotado:**
      1. cadastrar um PF sem veículos e um PJ com 2 veículos e condutores;
      2. conferir o formato real da listagem (`veiculos`, `situacao`, auditoria) e ajustar o mapper se divergir;
      3. abrir o link do e-mail no celular;
      4. aceitar com o documento errado e depois com o certo;
      5. conferir o e-mail de confirmação e o hash;
      6. reenviar o contrato de um pendente e confirmar que o link antigo responde como inválido ou vencido;
      7. abrir um link vencido (ou pedir um ao back);
      8. editar removendo um veículo;
      9. forçar placa de outro mensalista e categoria divergente.
    - **Mensagens reais:** registradas e refletidas em `classifyContratoError` e `mapMensalistaServerError`, com testes atualizados.
    - **Comandos:** `npm run lint`, `npm run test` e `npm run build` passam.

## Cobertura dos requisitos do PRD

| Requisito | Tasks |
|---|---|
| RF-01 Veículos no cadastro/edição | T2, T3, T4, T12, T13 |
| RF-02 Condutores para PJ | T3, T4, T12 |
| RF-03 Ver veículos e condutores | T10, T11 |
| RF-04 Situação do contrato | T5, T7, T8, T9, T10, T11 |
| RF-05 Reenviar contrato | T5, T9, T10, T11 |
| RF-06 Abrir o contrato pelo link | T5, T14, T15 |
| RF-07 Aceitar o contrato | T5, T6, T16 |
| Erros previstos / mensagens claras | T1, T5, T13, T16, T18 |
| Validação contra a API real | T17, T18 |
