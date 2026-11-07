# Tasks: Planos vindos do Back-end na Adesão

Referências: ./prd.md, ./design.md, ./techspec.md

Ordem pensada para o projeto continuar compilando a cada task: primeiro o que é novo e isolado (T1 a T4), depois a troca dos tipos e das regras (T5 a T7), por fim a interface (T8 a T13). Ao fim de cada task, rodar `npm run lint` e os testes do que foi tocado; `npm run build` ao fim da T14.

- [x] T1 — Tipo de domínio `PlanoAdesao` e mapeamento do DTO
  - Arquivos: `src/types/plano.ts` (adicionar `PlanoAdesao`, mantendo por ora `Plano`/`PlanoVendido` e `AreaDoSistema`), `src/lib/api/services/plano.mapper.ts`, `src/lib/api/services/plano.mapper.test.ts`
  - Pronto quando: `fromPlanoResponse` converte `valor`/`valorAtual` em centavos inteiros (99.9 → 9990, 69.9 → 6990), normaliza o nome ("MENSAL" → "Mensal", "TESTE GRATUITO" → "Teste gratuito"), guarda `promocaoAte` como `AAAA-MM-DD` cortando a string (sem `Date`), trata `emPromocao` com `valorAtual >= valor` como `false` e devolve `promocaoAte` indefinido quando `promocaoFim` é nulo; testes cobrem esses casos e o Trial (valor 0).

- [x] T2 — Serviço `listPlanos`
  - Arquivos: `src/lib/api/services/plano.ts`, `src/lib/api/services/plano.test.ts`
  - Pronto quando: `listPlanos(signal)` chama `GET /Plano` pelo `api`, valida com zod, descarta item inválido sem derrubar os demais, ordena por `ordemExibicao` e lança `ApiError("unknown")` se a lista resultante for vazia; testes usam a resposta de exemplo de `docs/specs/input.md` (Trial + Mensal em promoção), um item inválido no meio, lista vazia e erro de rede.

- [x] T3 — Hook `usePlanos` e chave de cache
  - Arquivos: `src/components/adesao/usePlanos.ts`, `src/components/adesao/usePlanos.test.tsx` (usar `src/test/render.tsx`)
  - Pronto quando: `useQuery` com chave `["planos"]` exportada como constante, `staleTime` de 5 min, `refetchOnWindowFocus: false` e `retry: 1`; teste confirma que devolve os planos mapeados, que uma segunda montagem dentro dos 5 min não refaz a chamada e que a falha leva a `status: "error"`.

- [x] T4 — `ariaLabel` por opção no `OptionGroup`
  - Arquivos: `src/components/ui/OptionGroup/OptionGroup.tsx`, `src/components/ui/OptionGroup/OptionGroup.test.tsx`
  - Pronto quando: `OptionGroupOption.ariaLabel?: string` é repassado como `aria-label` do `input` de rádio, sem mudança visual; teste confirma que o rádio é encontrado pelo nome acessível dado e que, sem `ariaLabel`, o comportamento atual se mantém.

- [x] T5 — Funções de apresentação em `src/lib/planos.ts`
  - Arquivos: `src/lib/planos.ts`, `src/lib/planos.test.ts`
  - Pronto quando: existem `formatarReais`, `formatarDataPromocao` (sem `Date`: "2027-06-30" → "30/06/2027"), `descreverDuracao` ("1 mês", "2 meses"), `descreverCondicao`, `rotuloDoSelo`, `descreverParaLeitor`, `descricaoNaCredencial`, `planoDoTipo`, `lerPlanoDaUrl` (inteiro positivo em texto; `"0"`, `"abc"`, `"-1"`, `"1.5"`, vazio e `null` → `undefined`) e `ehTesteGratisNaUrl`; testes cobrem promoção com data, promoção sem data, sem promoção, Trial com e sem dados, e a frase sem "12 meses". Os exports antigos (`PLANO_MENSAL`, `PLANOS`, `FIM_DO_LANCAMENTO`, `ROTULO_FIM_DO_LANCAMENTO`, `lancamentoVigente`, `valorPorMes`, `descricaoDoTeste`) podem permanecer até a T13, para não quebrar quem ainda os importa.

- [x] T6 — `tipoPlanoAdesao` como `number` e schema com os tipos carregados
  - Arquivos: `src/lib/api/services/adesao.mapper.ts` (linhas do tipo do DTO e da entrada), `src/lib/api/services/adesao.mapper.test.ts`, `src/lib/schemas/adesao.ts` (`criarPlanoSchema(tiposValidos: number[])`, mantendo `PLANO_OBRIGATORIO_MESSAGE` e `PlanoValues`), `src/lib/schemas/adesao.test.ts`
  - Pronto quando: o cadastro leva `tipoPlanoAdesao` igual ao número recebido (testes para `0`, `1` e um tipo qualquer como `4`); o schema aceita só tipos da lista informada e devolve `PLANO_OBRIGATORIO_MESSAGE` para `undefined` ou tipo fora da lista; o `planoSchema` antigo é removido e nenhum import dele sobra.

- [x] T7 — Wizard consome a lista de planos
  - Arquivos: `src/components/adesao/useAdesaoWizard.ts` (e o teste do hook, se existir)
  - Pronto quando: o hook chama `usePlanos()` na abertura; `plano` inicia com `lerPlanoDaUrl`; `planoSelecionado` é derivado de `planoDoTipo(planos, plano)` (tipo da URL que não está na lista fica sem seleção, sem erro); `planoEnviado` é `Trial` no modo teste e `planoSelecionado?.tipo` no outro; `validarEtapa` usa `criarPlanoSchema` com os tipos carregados e retorna `false` sem lista carregada; `enviar()` volta à etapa Plano se não há plano selecionado; o hook devolve a consulta (`status`, dados, refazer, refazendo), `planoEscolhido` e `planoTeste`; `buildCredencial` recebe o texto pronto de `descricaoNaCredencial`. A falha da lista no modo teste não impede o envio.

- [x] T8 — `credencial.ts` sem dependência da tabela fixa
  - Arquivos: `src/components/adesao/credencial.ts`, `src/components/adesao/credencial.test.ts`
  - Pronto quando: `buildCredencial` recebe `plano?: string` já formatado e o repassa; `descricaoDoPlano` e os imports de `lib/planos` saem; testes cobrem plano pago, teste com duração, teste sem dados e ausência de plano (traço).

- [x] T9 — Estados de carregamento e erro da etapa Plano
  - Arquivos: `src/components/adesao/PlanoStepFields/PlanosCarregando.tsx`, `PlanosErro.tsx`, `PlanoStepFields.styles.ts` (grade do esqueleto, `PrecoRiscado`), testes de cada um
  - Pronto quando: `PlanosCarregando` tem `role="status"`, texto oculto "Carregando planos" e duas cartas de `Skeleton` na mesma grade e altura mínima do cartão em promoção; `PlanosErro` mostra `ErrorBanner role="alert"` ("Não conseguimos carregar os planos" + frase de apoio) e o botão "Tentar de novo" que chama `onRetry`, vira "Tentando de novo…" com `aria-busy` durante a nova tentativa e continua montado (o foco permanece no botão); só tokens do tema.

- [x] T10 — `PlanoStepFields` montado a partir dos dados do back-end
  - Arquivos: `src/components/adesao/PlanoStepFields/PlanoStepFields.tsx`, `PlanoStepFields.test.tsx`
  - Pronto quando: o componente recebe a consulta, o tipo selecionado, `onChange` e `error`; renderiza `PlanosCarregando`, `PlanosErro` ou o `OptionGroup variant="card"` conforme o `status`, mantendo a lista das 13 áreas em todos os estados; em promoção mostra o preço de tabela riscado (`aria-hidden`), o atual em destaque, a condição e o selo "Promoção até DD/MM/AAAA" (ou "Promoção" sem data), com `ariaLabel` de `descreverParaLeitor`; sem promoção mostra só o atual; o Trial mostra a duração vinda do back-end e não mostra "/mês"; a ordem é a da lista; testes cobrem Trial + Mensal em promoção, promoção sem data, sem promoção, pré-seleção, carregando e erro com retry.

- [x] T11 — Conferir com os dados do plano escolhido
  - Arquivos: `src/components/adesao/ConferirStep/ConferirStep.tsx`, `ConferirStep.test.tsx`
  - Pronto quando: `ConferirStep` recebe `plano: number`, `dadosDoPlano?: PlanoAdesao` e `planoTeste?: PlanoAdesao`; o bloco **Plano** mostra nome, valor por mês (em promoção com o riscado `aria-hidden` e a leitura "de R$ 99,90 por R$ 69,90") e condição; o `ResumoTeste` usa a duração do back-end ("Teste grátis por 1 mês") e, sem dados, o texto sem número; "Editar Plano" continua levando à etapa Plano e voltando à conferência; "30 dias" e `PLANO_MENSAL` somem do arquivo.

- [x] T12 — `OnboardingWizard` liga tudo
  - Arquivos: `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx`, `OnboardingWizard.test.tsx`
  - Pronto quando: passa a consulta ao `PlanoStepFields` e `planoEscolhido`/`planoTeste` ao `ConferirStep`; o botão principal fica desabilitado na etapa Plano enquanto a lista não está em `success`; testes de fluxo com o serviço mockado cobrem: `?tipoPlanoAdesao=1` abre com o Mensal selecionado; `0` abre o fluxo de teste; ausente, `abc`, `9` e `-1` abrem sem seleção e sem mensagem; não avança sem escolher; o cadastro enviado leva o `tipoPlanoAdesao` correto para Trial e Mensal; voltar e avançar mantém plano e dados; falha da lista bloqueia o avanço e "Tentar de novo" recupera; no modo teste a falha da lista não bloqueia o envio.

- [x] T13 — Remover a tabela fixa e os resíduos
  - Arquivos: `src/lib/planos.ts`, `src/types/plano.ts`, e qualquer import que sobrar (busca por `PLANO_MENSAL`, `PLANOS`, `FIM_DO_LANCAMENTO`, `ROTULO_FIM_DO_LANCAMENTO`, `lancamentoVigente`, `valorPorMes`, `descricaoDoTeste`, `PlanoVendido`, `Plano` antigo)
  - Pronto quando: a busca não encontra mais nenhum desses símbolos em `src/`; nenhum valor ou prazo fixo (`99,90`, `69,90`, `30/06/2027`, "12 meses", "30 dias") aparece em código ou testes de adesão fora de fixtures de teste; `npx tsc --noEmit` passa.

- [ ] T14 — Verificação final
  - Arquivos: nenhum novo (ajustes pontuais onde a verificação apontar)
  - Pronto quando: `npm run lint`, a suíte de testes e `npm run build` passam; checagem manual no navegador (dev) em 360 px e desktop dos estados carregando, lista com promoção, erro (back-end bloqueado) com retry, pré-seleção pela URL e Conferir; sem salto de layout na troca do esqueleto para a lista, sem rolagem horizontal, foco visível e navegação só por teclado; os critérios de aceite do `prd.md` marcados um a um.
