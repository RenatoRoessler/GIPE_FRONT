# Tasks: Teste Grátis na Adesão

Referências: ./prd.md, ./techspec.md

Antes de implementar: ler o guia de `useSearchParams` em `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md` (regra do `AGENTS.md`). Código novo segue `code-best-practices` e `styled-components-best-practices`; nenhum valor visual fora do tema.

- [x] T1 — Reconhecer o teste grátis na URL e descrever o teste
  - Arquivos: `src/lib/planos.ts`, `src/lib/planos.test.ts`
  - Pronto quando: `ehTesteGratisNaUrl(valor)` é verdadeiro só para `"0"` (falso para `null`, `""`, `"1"`, `"00"`, `"abc"`); `lerPlanoDaUrl("0")` continua `undefined`; `descricaoDoTeste()` devolve "Teste grátis · 30 dias"; testes de `planos` passam.

- [x] T2 — Mapear etapas e posições por modo
  - Arquivos: `src/components/adesao/etapas.ts`, `src/components/adesao/etapas.test.ts` (novo)
  - Pronto quando: `etapas.ts` exporta `MODO_ADESAO`/`ModoAdesao`, `NOMES_ETAPAS`, `etapasDoModo`, `posicaoDaEtapa`, `etapaDaPosicao`, `proximaEtapa` e `etapaAnterior`, sem alterar `ETAPA`; no teste: etapas = Empresa, Horários, Titular, Conferir, Conferir na posição 4, Titular → Conferir, Conferir → Titular e a etapa Plano nunca é devolvida; no pago nada muda (cinco etapas, Conferir na posição 5); testes passam.

- [x] T3 — Aceitar Trial no contrato de envio
  - Arquivos: `src/lib/api/services/adesao.mapper.ts`, `src/lib/api/services/adesao.mapper.test.ts`
  - Pronto quando: `AdesaoInput.plano` e `AdesaoPayload.tipoPlanoAdesao` aceitam `TipoPlanoAdesao` (0 a 4); `toAdesaoPayload` envia `tipoPlanoAdesao: 0` para Trial e 1 a 4 para os pagos; o payload do teste não tem chave de cobrança; `planoSchema` segue recusando `0`; testes passam e `tsc` sem erros.
  - Depende de: nenhuma

- [x] T4 — Mostrar o teste na credencial
  - Arquivos: `src/components/adesao/credencial.ts`, `src/components/adesao/credencial.test.ts`
  - Pronto quando: `buildCredencial` aceita `plano?: TipoPlanoAdesao`; com Trial devolve `plano` = "Teste grátis · 30 dias" (via `descricaoDoTeste`); planos pagos e plano vazio (`undefined`) seguem como hoje; testes passam.
  - Depende de: T1

- [x] T5 — Resumo do teste na conferência
  - Arquivos: `src/components/adesao/ConferirStep/ConferirStep.tsx`, `ConferirStep.styles.ts`, `ConferirStep.test.tsx`
  - Pronto quando: a prop `plano` é `TipoPlanoAdesao`; com Trial aparece a seção `aria-label` "Teste grátis por 30 dias" (estilo `SecaoTeste` com `colors.primary` e `colors.primarySoft`), a frase do design e a lista `ul` com as três garantias (checks `aria-hidden`, itens de ao menos `layout.touchTarget`, empilhados abaixo de `breakpoints.sm` e em linha com `flex-wrap` a partir dele); sem "Editar", sem "Valor por mês", sem "Total" e sem `R$`; com plano pago o bloco "Plano" não muda e "Editar Plano" chama `onEditar(ETAPA.Plano)`; `ResumoTeste` declarado fora do corpo de `ConferirStep`; testes passam.
  - Depende de: T3

- [x] T6 — Modo teste no hook do wizard
  - Arquivos: `src/components/adesao/useAdesaoWizard.ts`
  - Pronto quando: o hook lê `tipoPlanoAdesao` uma vez e fixa `modo` em `useState` sem setter; `avancar`, `voltar` e `irParaEtapa` usam `proximaEtapa`, `etapaAnterior` e `etapaDaPosicao` por modo e a etapa Plano não é alcançável no teste; `enviar` e `buildCredencial` usam o mesmo `planoEnviado` (Trial no teste, `plano` no pago; no pago sem plano volta à etapa Plano); o hook devolve `modo`, `etapas` (`etapasDoModo`) e `posicao` além de `etapa`; `tsc` e lint sem erros; `/login?cadastro=sucesso` mantido.
  - Depende de: T1, T2, T3, T4

- [x] T7 — Ligar o wizard ao modo teste
  - Arquivos: `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx`
  - Pronto quando: `ultima = etapa === ETAPA.Conferir`; o rótulo do botão usa `etapas[posicao]` ("Próximo: Conferir" na etapa Titular do teste); `AdesaoShell` recebe `etapas={wizard.etapas}`, `etapaAtual={wizard.posicao}` e `onEtapaClick={wizard.irParaEtapa}`; `ConferirStep` recebe Trial no teste e só renderiza com plano definido; `TITULOS` e `DESCRICOES` continuam indexados pela etapa interna; `tsc` e lint sem erros.
  - Depende de: T5, T6

- [x] T8 — Testes do wizard: teste grátis e regressão do fluxo pago
  - Arquivos: `src/components/adesao/OnboardingWizard/OnboardingWizard.test.tsx`
  - Pronto quando: com `tipoPlanoAdesao=0` o `Stepper` mostra quatro itens sem "Plano" e "Etapa 1 de 4"; Titular mostra "Próximo: Conferir" e leva direto à Conferir ("Etapa 4 de 4 · Conferir"); nenhuma tela mostra `R$` nem pede cartão; a Conferir mostra "Teste grátis por 30 dias" e "Criar conta"; `saveAdesao` recebe `plano: 0`; "Voltar" da Conferir vai ao Titular e voltar/avançar mantém dados e modo; clicar em passo concluído do `Stepper` vai à etapa certa; o foco vai ao título ao trocar de etapa; a credencial mostra "Plano: Teste grátis · 30 dias" desde a etapa 1; sucesso leva a `/login?cadastro=sucesso`; regressão: `1` a `4` mantêm cinco etapas e o plano pré-selecionado e enviado, ausente/`9`/`abc` abrem sem plano e sem erro, e `saveAdesao` nunca recebe `0` fora do teste; suíte do wizard passa.
  - Depende de: T7

- [ ] T9 — Verificação final
  - Arquivos: —
  - Pronto quando: `npm run lint`, `npm run build` e a suíte completa passam; conferência manual em 360 px e desktop, nos dois temas (sem rolagem horizontal, foco visível, uso só por teclado, contraste do texto sobre `primarySoft` e do check); critérios de aceite do `prd.md` conferidos; pendências registradas: backend aceitar `tipoPlanoAdesao=0` sem cobrança e com 30 dias (testar um cadastro real e o login do titular), posição do campo no JSON, e decisão do RF9 (mensagem do login).
  - Depende de: T1–T8
  - Parcial: suíte completa (3303 testes), `tsc`, `npm run lint` (0 erros) e `npm run build` passam. Desvio do design: a borda do resumo usa `colors.accent`, não `colors.primary`, porque `src/styles/tokens.test.ts` proíbe `primary` como cor de borda. Falta a conferência manual no navegador (360 px e desktop, nos dois temas, só teclado, contraste sobre `primarySoft`) e as pendências externas (backend aceitar `tipoPlanoAdesao=0`; posição do campo no JSON; decisão do RF9).
