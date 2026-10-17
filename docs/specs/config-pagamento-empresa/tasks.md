# Tasks: Configuração de meios de pagamento da empresa

Referências: ./prd.md, ./techspec.md, ./design.md

Antes de começar: confirmar com o back os pontos do techspec (§ "Pontos a confirmar"): nomes e posição dos quatro campos, se `GET /Empresa` é legível por todos os perfis que dão saída (risco que decide a T6 a T8), padrão "todos ligados" para empresas antigas e o bloqueio da saída quando a configuração falha. As tasks T1 a T5 (cadastro) não dependem das respostas 2 e 4.

Ordem pensada para o projeto continuar funcionando a cada task: T1 a T5 só acrescentam o cadastro; T6 e T7 preparam a saída sem mudar o comportamento atual; T8 liga a saída à configuração.

- [x] T1 — Tipos, constantes e schema dos meios de pagamento
  - Arquivos: `src/types/adesao.ts`, `src/lib/schemas/adesao.ts`, `src/lib/schemas/adesao.test.ts` (ou o teste de schema existente)
  - Pronto quando: `PaymentsData`, `EMPTY_PAYMENTS_DATA` (só Dinheiro ligado) e `MEIOS_PAGAMENTO` (chave, rótulo e rótulo curto, na ordem Dinheiro, Pix, Cartão de crédito, Cartão de débito) existem; `paymentsSchema` e `PAGAMENTOS_MINIMO_MESSAGE` ("Selecione ao menos um meio de pagamento") existem, com o erro do conjunto no campo `dinheiro`; testes: aceita cada combinação com ao menos um ligado, rejeita todos desligados com a mensagem e o campo certos, e `zodFieldErrors` produz `{ fields: { dinheiro: ... } }`; `npm test`, `tsc` e lint passam.

- [x] T2 — Mapeamento e envio dos meios de pagamento nos serviços
  - Arquivos: `src/types/empresa.ts`, `src/lib/api/services/empresa.mapper.ts`, `empresa.mapper.test.ts` (novo), `src/lib/api/services/adesao.mapper.ts` (+ teste), `src/lib/api/services/empresa.ts`, `adesao.ts`, `src/components/empresa/MinhaEmpresa/EmpresaForm.tsx` e `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx` (só a ligação mínima), fixtures de teste que montam `EmpresaFormValues`
  - Depende de: T1
  - Pronto quando: `EmpresaFormValues` ganha `payments`; `fromEmpresaResponse` lê os quatro campos e trata **ausente ou `null` como `true`** (só `false` explícito desliga); `toEmpresaPayload` envia os quatro no corpo plano; `AdesaoInput` ganha `payments` e `toAdesaoPayload` coloca os quatro dentro de `empresa`; a ligação mínima mantém o app compilando e funcionando como hoje (o `EmpresaForm` repassa `initial.payments` ao salvar e o wizard envia `EMPTY_PAYMENTS_DATA`), a ser substituída nas T4 e T5; testes: leitura com os quatro campos, com `false` explícito, com ausentes e `null`; payloads do PUT e da adesão com os quatro campos; `npm test`, `tsc` e lint passam.

- [x] T3 — Componente `PagamentosFields`
  - Arquivos: `src/components/empresa/PagamentosFields/{PagamentosFields.tsx,PagamentosFields.styles.ts,PagamentosFields.test.tsx,index.ts}`
  - Depende de: T1
  - Pronto quando: `fieldset` com `legend` "Meios de pagamento aceitos" e texto de apoio "Só os meios ligados aparecem na saída de veículos."; quatro linhas na ordem de `MEIOS_PAGAMENTO`, cada uma com ícone decorativo (de `saidaIcons.tsx`) e um `SwitchField` com nome e estado; linha ligada com borda `primary` e fundo `primarySoft`; grade de 1 coluna e de 2 colunas a partir de `sm`; o erro do conjunto, lido do campo `dinheiro`, aparece abaixo das linhas (`role="alert"`, `aria-describedby` e `aria-invalid` no `fieldset`, linhas com borda `danger`) quando algum `switch` foi tocado ou houve tentativa de envio, e some ao ligar um meio; `disabled` trava os quatro; só tokens do tema; testes de cada um desses pontos; `npm test`, `tsc` e lint passam.

- [x] T4 — Seção Pagamentos em Minha Empresa
  - Arquivos: `src/components/empresa/MinhaEmpresa/EmpresaForm.tsx`, `MinhaEmpresaSkeleton.tsx`, testes do `EmpresaForm`
  - Depende de: T2, T3
  - Pronto quando: `paymentsForm` (valores iniciais de `initial.payments`, validação por `paymentsSchema`) como terceiro formulário; terceira seção expansível "Pagamentos", aberta por padrão, com resumo dos nomes curtos dos meios ligados ("Dinheiro, Pix") e `hasError` próprio; `handleSave` valida os três formulários juntos, abre a seção com erro e foca o primeiro campo inválido; `mutate` envia `payments` do formulário (substitui a ligação mínima da T2); `onSuccess` faz `reset` dos três e atualiza o cache; **Descartar alterações** e o estado "sujo" incluem os pagamentos; o esqueleto de carregamento ganha mais um bloco; testes: seção e resumo corretos, salvar envia os quatro campos, erro abre a seção e marca o cabeçalho, descartar volta ao último salvo, falha de salvamento mantém o que foi marcado; `npm test`, `tsc` e lint passam.

- [x] T5 — Bloco Pagamentos na etapa 1 da adesão
  - Arquivos: `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx`, teste do wizard
  - Depende de: T2, T3
  - Pronto quando: `paymentsForm` com `EMPTY_PAYMENTS_DATA`; a etapa 1 mostra `CompanyStepFields` seguido de `PagamentosFields`, sem mudar o `Stepper`; **Próximo** dispara a validação dos dois formulários e só avança se ambos forem válidos, com foco no primeiro campo inválido; `payments` entra no envio final da adesão (substitui a ligação mínima da T2); testes: o bloco aparece com só Dinheiro ligado, não avança com todos desligados e mostra a mensagem, avança com ao menos um ligado, o envio final inclui os meios escolhidos; `npm test`, `tsc` e lint passam.

- [x] T6 — Hook `useMeiosPagamento` e mapeamento das formas da saída
  - Arquivos: `src/components/veiculos/useMeiosPagamento.ts`, `useMeiosPagamento.test.tsx`, `src/components/veiculos/saida.ts` (+ teste)
  - Depende de: T2
  - Pronto quando: `saida.ts` mapeia cada forma de `FORMAS_SAIDA` à chave de `PaymentsData` (Dinheiro, Crédito, Débito, Pix); o hook lê a empresa pela chave de cache existente, com `staleTime: 0` e sem refetch ao focar a janela, e devolve `MeiosPagamento` (`carregando`, `erro` com `mensagem` e `refetch`, `vazio` quando todos estão desligados, `pronto` com as opções filtradas na ordem da saída); empresa antiga (campos ausentes) resulta nas quatro opções; testes de cada estado, do filtro e da ordem; `npm test`, `tsc` e lint passam.

- [x] T7 — `PagamentoSaida` mostra só os meios aceitos e seus estados
  - Arquivos: `src/components/veiculos/PagamentoSaida/PagamentoSaida.tsx`, `PagamentoSaida.test.tsx`
  - Depende de: T6
  - Pronto quando: o componente aceita `meios?: MeiosPagamento` (sem a prop, mantém as quatro formas de hoje, para o modal continuar funcionando até a T8); com `pronto` mostra só as `opcoes` no `OptionGroup` de 4 colunas (tiles do mesmo tamanho, alinhados à esquerda), e, com uma só, o texto "Único meio de pagamento aceito pela empresa."; `carregando` mostra `Skeleton` com `aria-busy`; `erro` mostra `ErrorBanner` com a mensagem e **Tentar novamente**; `vazio` mostra "Nenhum meio de pagamento configurado. Peça ao administrador para revisar em Minha Empresa."; sem Dinheiro aceito não há "Valor recebido" nem troco; testes de cada estado; `npm test`, `tsc` e lint passam.

- [x] T8 — Saída lê a configuração da empresa e escolhe a forma efetiva
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.ts`, `useSaidaFlow.test.tsx`, `SaidaVeiculoModal.tsx`, `SaidaVeiculoModal.test.tsx`, `src/components/veiculos/ReciboSaidaStep` (só testes, se mockam `getEmpresa`)
  - Depende de: T6, T7
  - Pronto quando: a configuração é carregada na montagem do modal (não mais só depois de achar o veículo), por `useMeiosPagamento`; `forma` vira `formaEscolhida: string | null` e a forma efetiva é a escolhida se ainda estiver nas opções, senão a primeira aceita (nada de efeito que reajuste o estado); `getPagamentoStatus`, o `confirmar` e o recibo usam a forma efetiva; `voltar` zera a escolha; o modal passa `meios` ao `PagamentoSaida`; **Confirmar Saída** fica desabilitado em `carregando`, `erro` e `vazio`, com o motivo em texto ao lado ("Carregando meios de pagamento…" e equivalentes); a configuração só é revalidada na abertura do modal, sem intervalo; os mocks de `getEmpresa` dos testes de saída passam a devolver uma configuração (o atual `mockRejectedValue("sem empresa")` bloquearia a saída); testes: só os meios aceitos aparecem, a primeira aceita vem marcada quando Dinheiro está desligado, meio único, carregando e erro bloqueiam o botão, **Tentar novamente** refaz, a saída usa o meio escolhido no registro, voltar à pesquisa devolve a escolha ao padrão, a configuração é lida na abertura; `npm test`, `tsc` e lint passam.

- [ ] T9 — Verificação final (lint, build, testes e roteiro manual)
  - Arquivos: nenhum (execução e notas em `docs/specs/config-pagamento-empresa/tasks.md`)
  - Depende de: T1 a T8
  - Pronto quando: `npm run lint`, `npm test` e `npm run build` passam; roteiro manual executado: adesão ponta a ponta (padrão só Dinheiro, bloqueio com todos desligados), Minha Empresa em dois navegadores (mudar um meio e a saída refletir ao reabrir o modal), empresa antiga sem os campos (todos ligados), operador de caixa e manobrista na saída (confirma o risco de permissão do techspec), saída com meio único e com Dinheiro desligado; qualquer falha fica registrada nas notas.

## Notas da execução
- T1 a T8 concluídas. T9 ficou **aberta**: a parte automática passou (`npm test`: 42 arquivos, 424 testes; `npx tsc --noEmit` limpo; `npm run build` ok; `npm run lint`: 0 erros e 94 avisos que já existiam, todos em `.agents/skills/impeccable/scripts`). Falta o roteiro manual: adesão ponta a ponta contra o back, Minha Empresa em dois navegadores (mudar um meio e a saída refletir ao reabrir o modal), empresa antiga sem os campos, e operador de caixa e manobrista na saída (confirma o risco de permissão do techspec).
- Visual: o bloco Pagamentos foi conferido no Chrome (duas colunas, linha ligada com borda e fundo `primary`, ícones e switches); a seção em Minha Empresa e a etapa 1 da adesão não foram abertas em tela porque dependem de login e do back.
- Desvios do techspec/design: o `Switch` ganhou as props `aria-describedby` e `invalid` (marca `data-invalid`), porque `aria-invalid` não vale para `role="switch"`; o foco do formulário passou a procurar `[aria-invalid="true"], [data-invalid="true"]`. O texto "Único meio de pagamento aceito pela empresa." fica **abaixo** dos tiles (o `OptionGroup` não tem espaço de descrição abaixo da legenda). O estado de erro do `fieldset` usa `aria-describedby`, sem `aria-invalid` (não vale para grupo).
- Os testes de `EmpresaForm` renderizam a tela completa (`MinhaEmpresa` com `getEmpresa` mockado): com um `initial` fixo, o formulário voltava ao valor antigo depois de salvar, o que não acontece na aplicação (o cache devolve os dados novos).
- Os testes de saída agora mockam `getEmpresa` com uma configuração; o mock antigo (`mockRejectedValue`) bloquearia a saída pelo novo estado de erro.
- Pontos a confirmar com o back continuam em aberto (techspec): nomes e posição dos quatro campos, leitura de `GET /Empresa` por todos os perfis de saída, padrão "todos ligados" para empresas antigas e o bloqueio da saída quando a configuração falha.

