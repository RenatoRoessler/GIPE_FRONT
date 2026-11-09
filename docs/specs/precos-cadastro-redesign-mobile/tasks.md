# Tasks: Redesenho mobile-first do cadastro e da edição de preços (Modelo A · Página única em seções)

Referências: ./prd.md, ./techspec.md, ./design.md, ./layouts.html

Convenções: toda task termina com `npm run lint` sem erros, `npx tsc --noEmit` limpo e os testes da área passando (`npx vitest run <caminho>`); ao fim dos blocos 3 e 4, `npm run build`. Estilo com tokens do tema, nunca valor solto. Verificar sempre com captura da **janela visível** (360 × 640), não de página inteira (menu e barra sticky enganam). Heredoc do shell quebra com aspas triplas de Python: gerar scripts de edição em arquivo.

## Bloco 1 — Base de design system e validação

- [x] T1 — `Accordion` com resumo rico, marca de estado e etiqueta (compatível com os usos atuais).
  - Arquivos: `src/components/ui/Accordion/Accordion.tsx`, `Accordion.styles.ts`, testes do `Accordion`
  - Pronto quando: `summary` aceita `ReactNode`; novas props opcionais `marca?: "pronta" | "pendente" | "erro" | number` (círculo à esquerda do título, com ✓/!/número) e `etiqueta?: string` (ex.: "Alterado"); sem as props o visual e o comportamento são os de hoje; testes novos cobrem marca, etiqueta e resumo com elemento; testes de Empresa, Faturas, Lançamentos, Onboarding, Mensalistas e `FiltroPeriodo` seguem passando.

- [x] T2 — `NumberStepper` com passo, formatação e casas decimais.
  - Arquivos: `src/components/ui/NumberStepper/NumberStepper.tsx`, `NumberStepper.styles.ts`, testes
  - Pronto quando: props opcionais `step` (padrão 1), `format` (padrão o número) e `decimals` (padrão 0); − e + e as setas andam de `step` em `step`, limitados por `min`/`max`, sem erro de ponto flutuante (ex.: 0,1 + 0,2); usos atuais inalterados; testes cobrem passo 5 e valores em reais com 2 casas.

- [x] T3 — `StepperField` (liga o `NumberStepper` a um campo de texto do formulário).
  - Arquivos: `src/components/form/StepperField.tsx`, registro em `src/components/form/form.ts` (e `index.ts` se aplicável), teste
  - Pronto quando: `form.AppField` aceita `field.StepperField` com `label`, `min`, `max`, `step`, `decimals`, `format`, `hint`; converte texto ↔ número (inteiro e `parseMoney`/`formatBRL` simples, sem mudar o texto salvo no formulário além do formato já usado: "70,00"); texto vazio ou inválido vira `min` ao primeiro toque em − / +; mostra o erro do campo como os outros; teste cobre vazio, − / + e limites.

- [x] T4 — Validação por seção em `lib/schemas/preco.ts`.
  - Arquivos: `src/lib/schemas/preco.ts`, `src/lib/schemas/preco.test.ts`
  - Pronto quando: `validarSecoesPreco(values)` devolve `{ basico, categorias, horarios, cobranca }` com as mesmas mensagens de hoje (a soma de `basico` + `categorias` é igual a `validarEtapasPreco(values).basico`, na mesma ordem); `findInvalidPrecoSecao(values)` devolve o id da primeira seção com erro na ordem da tela (`basico`, `categorias`, `horarios`, `cobranca`) ou `null`; testes cobrem tabela válida, uma pendência em cada seção e várias ao mesmo tempo; `validarEtapasPreco`/`findInvalidPrecoStep` continuam existindo até a T14.

## Bloco 2 — Utilitários e campos da feature

- [x] T5 — `secoes.ts`: definição das 4 seções, estado, resumo e mudanças por seção.
  - Arquivos: `src/components/precos/secoes.ts`, `src/components/precos/secoes.test.ts`
  - Pronto quando: `SECOES` (id e título), `estadoDaSecao(...)` (`pronta`/`pendente`/`erro`, com a regra de "visitada"), `resumoDaSecao(secao, values)` (ex.: "Padrão · 07/11/2026 → sem fim · Todas"; "ainda sem valores definidos" quando as faixas ainda são o modelo padrão) e `mudancasDaSecao(secao, diff)` (pares antes → depois agrupando os campos de `diffPreco`: básico = descrição, tipo, empresa, vigência, ativo; categorias; horários; cobrança = faixas, diária, adicional, tolerâncias); testes cobrem cada seção, cadastro novo e edição com e sem mudanças.

- [x] T6 — `pintarFaixa` em `grade.ts`.
  - Arquivos: `src/components/precos/grade.ts`, `src/components/precos/grade.test.ts`
  - Pronto quando: `pintarFaixa(grade, dias, de, ate, ligada = true)` liga (ou desliga) as horas de `de` até `ate` (exclusivo) nos dias escolhidos, sem alterar os outros; intervalo que cruza a meia-noite (ex.: 22 → 6) pinta de 22 a 23 e de 0 a 5 no mesmo dia, como no restante da grade; `de === ate` não pinta nada; testes cobrem os casos, incluindo a meia-noite e dias não escolhidos intocados.

- [x] T7 — `CampoVigencia` (início e fim em chips, seletor só sob demanda).
  - Arquivos: `src/components/precos/CampoVigencia/{CampoVigencia.tsx,CampoVigencia.styles.ts,index.ts,CampoVigencia.test.tsx}`, `src/components/precos/PrecoBasicoFields/PrecoBasicoFields.tsx` (e seu teste, se houver)
  - Pronto quando: início em **Começa hoje** (grava `inicioVigenciaDeHoje()`) | **Escolher data** (mostra o `datetime-local`); fim em **Sem fim** (grava `""` e some o campo) | **Termina em…** (mostra o `datetime-local`); ao abrir uma tabela existente os chips refletem os valores (início igual a hoje 00:00 = "Começa hoje"; fim vazio = "Sem fim"); os valores gravados no formulário seguem o formato de hoje; `PrecoBasicoFields` usa o `CampoVigencia` no lugar dos dois campos e do checkbox "Sem data de fim"; alvos de 44 px; testes cobrem criar e editar, sem fim e com fim.

- [x] T8 — Diária e tolerâncias com − / + em `PrecoCobrancaFields`.
  - Arquivos: `src/components/precos/PrecoCobrancaFields/PrecoCobrancaFields.tsx` (e testes que dependam dos rótulos)
  - Pronto quando: valor da diária (passo R$ 1,00) e valor adicional (passo R$ 0,50) e as duas tolerâncias (passo 5 min) usam `StepperField`; o seletor de período e as frases de ajuda continuam; os valores gravados e as validações são os mesmos; testes de `PrecoWizard`/`PrecoCobrancaFields` que digitam nesses campos ajustados e passando.

- [x] T9 — `FaixaRapida` na grade de horários.
  - Arquivos: `src/components/precos/GradeHorarios/FaixaRapida.tsx`, `GradeHorarios.styles.ts`, `GradeHorarios.tsx`, teste
  - Pronto quando: chips Seg a Dom (multi-seleção), campos **De** e **Até** (horas 0 a 24, com teclado numérico) e botão **Aplicar** que usa `pintarFaixa` sobre os horários do formulário (preservando os horários fora da grade); fica entre os modelos e a grade; sem dia escolhido o botão fica desabilitado; teste cobre aplicar Seg–Sex 8–18 e o intervalo que cruza a meia-noite.

## Bloco 3 — Estrutura em seções

- [x] T10 — `PrecoSecoes` (os 4 `AccordionItem` com os campos de cada seção).
  - Arquivos: `src/components/precos/PrecoWizard/PrecoSecoes.tsx`, `PrecoSecoes.styles.ts`, `PrecoSecoes.test.tsx`
  - Pronto quando: renderiza *O básico* (descrição, tipo de regra, empresa conveniada, vigência, situação), *Categorias*, *Quando vale* (modelos, faixa rápida, grade e ajuste fino) e *Quanto cobra* (faixas, diária e tolerâncias), cada uma num `AccordionItem` com `id`, título, resumo (`resumoDaSecao`), `marca`, `etiqueta="Alterado"` e `hasError`; só uma aberta por vez (`aberta`/`onAbrir`); **Continuar** no fim de cada seção (só no cadastro) abre a próxima e rola até ela; os painéis recolhidos continuam montados; testes cobrem abrir uma seção fechando a outra, Continuar e o "Alterado" com resumo antes → depois.

- [x] T11 — Reescrever `PrecoWizardForm` em `CadastroCorpo` + `PrecoSecoes` + `PainelCadastro`.
  - Arquivos: `src/components/precos/PrecoWizard/PrecoWizardForm.tsx`, `PrecoWizard.styles.ts`
  - Pronto quando: sai o `step` e entram `aberta`, `visitadas` e `falhaSecao`; `abrir(id)` fecha as outras, marca visitada e chama `irParaSecao`; cadastro novo começa com *O básico* aberta e a edição com todas fechadas; `PainelCadastro` com 4 segmentos, `status` ("Faltam: … (+N)", "N mudanças", "Pronta para salvar", "Tudo salvo") e as ações Cancelar e Salvar (cadastro: Salvar só com a tabela válida; edição: só com `hasChanges`); `salvar()` valida tudo e, com pendência, abre a primeira seção (`findInvalidPrecoSecao`) e mostra o que falta num `ErrorBanner`; `BackButton` no topo no lugar do Card e do título grande, com a confirmação de hoje; `PrecoResumoAoVivo` ao fim no celular e sob o painel lateral em telas grandes; mutação, invalidação de cache, `beforeunload`, `ErrorDialog` e o redirecionamento depois de salvar inalterados.

- [x] T12 — Cabeçalho e esqueleto da edição em `PrecoWizard`.
  - Arquivos: `src/components/precos/PrecoWizard/PrecoWizard.tsx`
  - Pronto quando: o esqueleto de carregamento mostra a barra de topo e 4 seções recolhidas (sem `Stepper`); na edição o topo mostra "Editar preço" com o nome e a situação da tabela; os estados de erro, tabela não encontrada e novo preço continuam.

## Bloco 4 — Testes, limpeza e fechamento

- [x] T13 — Migrar `PrecoWizard.test.tsx` para as seções.
  - Arquivos: `src/components/precos/PrecoWizard/PrecoWizard.test.tsx`
  - Pronto quando: os mesmos comportamentos de antes (cadastro completo, validações por parte, edição com "Alterado", só salva com mudanças, saída com alterações, erro ao salvar com Tentar novamente, convênio com empresa obrigatória, grade e ajuste fino preservados) são verificados abrindo seções e usando Continuar/Salvar; novos testes cobrem: edição abre com tudo fechado e "Alterado" com antes → depois; salvar de uma seção com pendência em outra abre a primeira com problema; cadastro com Salvar desabilitado e o status dizendo o que falta; todos passam.

- [x] T14 — Remover o que ficou sem uso.
  - Arquivos: `src/components/precos/PrecoEtapasNav/*`, `src/components/precos/PrecoWizard/DockCadastro.tsx`, `DockCadastro.styles.ts`, `DockCadastro.test.tsx`; `validarEtapasPreco`, `findInvalidPrecoStep` e seus testes em `src/lib/schemas/preco.ts` e `preco.test.ts`
  - Pronto quando: `grep` não encontra mais referências aos removidos; `tsc`, lint e os testes de `precos`, `ui` e `lib/schemas` passam; nada de código morto.

- [ ] T15 — Revisão visual e de acessibilidade a 360 × 640, 320 × 568, 768 × 1024 e 1280 × 800.
  - Arquivos: ajustes pontuais em `src/components/precos/**` e `src/components/ui/{Accordion,NumberStepper,PainelCadastro}`
  - Pronto quando: capturas da janela visível (login com a conta de teste do projeto), nos temas claro e escuro, confirmam: primeiro campo à vista na primeira tela e topo até um terço da altura (RF11); na edição, mudar um valor e salvar sem passar por outras seções, com "antes → depois" nas linhas (RF4/RF5); barra do painel acima do menu sem cobrir o fim do formulário (RF7); vigência, grade e degraus utilizáveis por toque com alvos de 44 px (RF8/RF9); sem rolagem horizontal; `aria-expanded`, nome acessível das marcas de estado e foco ao abrir a seção.
  - Situação (parcial, 09/11/2026): sem login não foi possível conferir o app real. Numa página temporária de preview (já removida), sem o cabeçalho e o menu do app, a 320 × 568, 360 × 640, 768 × 1024 e 1280 × 800, tema claro: sem rolagem horizontal; primeiro campo (Descrição) à vista e topo (voltar + título) com cerca de 85 px a 360 × 640; edição com todas as seções fechadas e resumo; passo − / + da diária e tolerâncias; painel lateral com resumo a 1280 px. **Não conferido:** barra do painel acima do menu inferior real, capturas logadas, tema escuro, alvos de 44 px dos degraus (campos de Horas/Minutos/Valor), foco ao abrir a seção em leitor de tela. A barra do painel cobre o fim da tela visível a 360 × 640 enquanto o formulário está na tela (padrão já usado em Minha empresa).

- [ ] T16 — Regressão e entrega.
  - Arquivos: `docs/specs/precos-cadastro-redesign-mobile/*` (marcar tasks e critérios do PRD)
  - Pronto quando: `npm run lint`, `npx tsc --noEmit`, `npx vitest run` (sem novas falhas além das já conhecidas dos testes de 403 em Minha Empresa, Usuários e Caixa) e `npm run build` passam; critérios de aceite do PRD marcados (exceto os que dependem de leitor de tela real, que ficam registrados como não verificados); modelos B e C registrados como descartados em `design.md`.
  - Situação (parcial, 09/11/2026): `npm run lint` (0 erros), `npx tsc --noEmit` e `npm run build` passam; `npx vitest run` com 4104 testes passando e só as 3 falhas já conhecidas de 403 (Minha Empresa, Usuários e Caixa). Critérios do PRD marcados: 1, 2, 4, 6 e 8; ficam abertos 3, 5, 7 e 9 até a T15 ser concluída com o app real. Modelos B e C já constam como descartados em `design.md` (seção Decisão).
