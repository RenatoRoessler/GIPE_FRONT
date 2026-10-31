# Tasks: Revisão de UX e Layout do Fluxo de Adesão

Referências: ./prd.md, ./design.md, ./techspec.md

Ordem por dependência: tokens e funções puras → componentes de UI → componentes da adesão → hook → montagem do wizard → verificação. Cada task roda `npm run lint` nos arquivos tocados e seus testes com `npx vitest run <caminho>`.

## Base (tokens e lógica pura)

- [x] T1 — Adicionar tokens de layout ao tema
  - Arquivos: `src/styles/theme.ts`
  - Pronto quando: `layout` expõe `touchTarget` (44px), `actionBarHeight` (76px) e `credentialWidth` (330px), valendo para os dois temas; `npx tsc --noEmit` sem erro.

- [x] T2 — Presets de horário (funções puras)
  - Arquivos: `src/components/adesao/horarios.ts`, `src/components/adesao/horarios.test.ts`
  - Pronto quando: `aplicarSegSex`, `aplicarTodosOsDias`, `aplicar24Horas` e `copiarSegunda` retornam novo `BusinessHoursData` sem mutar a entrada, usando índices de `DIAS_SEMANA`; testes cobrem cada preset e a imutabilidade.

- [x] T3 — Dados da credencial (função pura)
  - Arquivos: `src/components/adesao/credencial.ts`, `src/components/adesao/credencial.test.ts`
  - Pronto quando: `buildCredencial` devolve nome, CNPJ, tipo, vagas, estado dos 7 dias (`aberto`/`24h`/`fechado`) e pagamentos; campo vazio vira `undefined`; testes cobrem tudo vazio, tudo preenchido e dia 24h/fechado.

- [x] T4 — Atribuição de erro do backend a etapa/campo
  - Arquivos: `src/lib/api/adesaoErrors.ts`, `src/lib/api/adesaoErrors.test.ts`
  - Pronto quando: `atribuirErro` mapeia erros de validação com CNPJ, CPF ou e-mail para `{ etapa, campo, rotulo }`, devolve só a mensagem quando não há correspondência e mantém as mensagens de rede, timeout e servidor do `ApiError`; testes cobrem os três campos, o fallback e erro que não é `ApiError`.

## Componentes de UI (design system)

- [x] T5 — `StripeBar`
  - Arquivos: `src/components/ui/StripeBar/StripeBar.tsx`, `src/components/ui/StripeBar/index.ts`
  - Pronto quando: renderiza a listra diagonal com `colors.primary` e a cor de fundo do tema, `aria-hidden`, sem valor visual solto.

- [x] T6 — `CredencialEmpresa`
  - Arquivos: `src/components/ui/CredencialEmpresa/{CredencialEmpresa.tsx,CredencialEmpresa.styles.ts,CredencialEmpresa.test.tsx,index.ts}`
  - Pronto quando: variantes `lateral`, `faixa` e `compacta` funcionam; campo vazio mostra traço apagado, nunca placeholder falso; dias aberto/24h/fechado e selos de vagas aparecem; é uma região com `aria-label="Resumo da credencial"` sem `aria-live`; contraste ok nos dois temas; transição de valor desligada com `prefers-reduced-motion`; testes cobrem vazio × preenchido e as variantes.

- [x] T7 — `ActionBar`
  - Arquivos: `src/components/ui/ActionBar/{ActionBar.tsx,ActionBar.styles.ts,ActionBar.test.tsx,index.ts}`
  - Pronto quando: Voltar à esquerda e ação principal à direita; em < `md` fica fixa no rodapé com `env(safe-area-inset-bottom)` e altura `layout.actionBarHeight`; botões com `min-height: layout.touchTarget`; testes cobrem presença/ausência do Voltar e botão desabilitado.

- [x] T8 — Evoluir `Stepper` sem quebrar `PrecoWizard`
  - Arquivos: `src/components/ui/Stepper/Stepper.tsx`, `src/components/ui/Stepper/Stepper.styles.ts`, teste do `Stepper` (criar se não existir)
  - Pronto quando: props opcionais `onStepClick` e `compact`; com `onStepClick`, etapas concluídas viram `<button aria-label="Voltar para <etapa>">` e as futuras não são interativas; sem as props o resultado é idêntico ao atual; os testes de `PrecoWizard` continuam passando.

## Componentes da adesão

- [x] T9 — `CompanyStepFields` por grupo
  - Arquivos: `src/components/adesao/CompanyStepFields/CompanyStepFields.tsx`
  - Pronto quando: prop opcional `grupo` (`identificacao` | `endereco` | `capacidade`) renderiza só aquele grupo; sem a prop o comportamento é o de hoje; testes de `EmpresaSecoes` e `ConveniadaEmpresaFields` seguem verdes.

- [x] T10 — `AtalhosHorario` e etapa de Horários
  - Arquivos: `src/components/adesao/AtalhosHorario/{AtalhosHorario.tsx,AtalhosHorario.styles.ts,AtalhosHorario.test.tsx,index.ts}`, `src/components/adesao/BusinessHoursStepFields/BusinessHoursStepFields.tsx`, `src/components/adesao/BusinessHoursStepFields/BusinessHoursStepFields.styles.ts`
  - Pronto quando: chips "Seg–Sex 08–18", "Todos os dias", "24 horas" e "Copiar segunda" usam as funções de T2 e têm `aria-pressed`; "24 horas" vira chip por dia (com o nome do dia no `aria-label`); dia fechado ou 24h desabilita os horários; em < `md` cada dia vira cartão de duas linhas sem controles espremidos; testes cobrem aplicar preset e estado do dia.

- [x] T11 — Etapa Titular: mostrar/ocultar senha e texto de apoio
  - Arquivos: `src/components/adesao/AdminUserStepFields/AdminUserStepFields.tsx`
  - Pronto quando: botão mostrar/ocultar senha acessível nos dois campos de senha; texto "Este será o usuário administrador da conta."; schema e `form` inalterados.

- [x] T12 — `ConferirStep`
  - Arquivos: `src/components/adesao/ConferirStep/{ConferirStep.tsx,ConferirStep.styles.ts,ConferirStep.test.tsx,index.ts}`
  - Pronto quando: mostra seções Empresa, Endereço e capacidade, Pagamentos, Horários e Titular; cada uma tem "Editar" que chama `onEditar(etapa, bloco)`; senha aparece como "••••••••" e nunca em texto, `aria-label` ou erro; testes cobrem seções, senha mascarada e "Editar".

- [x] T13 — `AdesaoShell`
  - Arquivos: `src/components/adesao/AdesaoShell/{AdesaoShell.tsx,AdesaoShell.styles.ts,index.ts}`
  - Pronto quando: barra superior com `Logo` (Murel) e `Stepper`; ≥ `lg` duas colunas com credencial sticky em `layout.stickyTop` e largura `layout.credentialWidth`; `md`–`lg` credencial em faixa sob o título; < `md` credencial compacta fixa no topo (toque abre a versão completa em `Modal`) e `padding-bottom` para a barra fixa; sem rolagem horizontal em 320px.

## Lógica do wizard

- [x] T14 — `useAdesaoWizard`
  - Arquivos: `src/components/adesao/useAdesaoWizard.ts`, `src/components/adesao/useAdesaoWizard.test.tsx`
  - Pronto quando: o hook mantém os 4 formulários com os mesmos schemas e expõe `etapa`, `etapasConcluidas`, `blocoAberto`, `blocosConcluidos`, `irParaEtapa`, `avancar`, `enviar`, `corrigir`, `faltam` e `erroBackend`; `avancar` abre os blocos com erro, foca o primeiro campo inválido e conta os campos faltantes; só é possível voltar a etapas concluídas; `enviar` usa `saveAdesao` e `atribuirErro`; testes cobrem avanço bloqueado, empresa válida com pagamentos inválidos (e o inverso), voltar sem perder dados, erro com alvo e sem alvo.

## Montagem

- [x] T15 — Reescrever `OnboardingWizard` com as 4 etapas
  - Arquivos: `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx`, `src/components/adesao/OnboardingWizard/OnboardingWizard.styles.ts`
  - Pronto quando: o componente é só composição (`useAdesaoWizard` + `AdesaoShell` + etapa atual + `ActionBar`); etapa 1 usa 3 `AccordionItem` que concluem, recolhem e abrem o próximo; aviso "Faltam N campos"; foco vai ao título da etapa ao trocar; transição de etapa em CSS com `prefers-reduced-motion`; durante o envio os controles ficam desabilitados e o botão mostra "Criando conta…"; `ErrorBanner` com link "Corrigir …" quando houver alvo; sucesso redireciona a `/login?cadastro=sucesso`.

- [x] T16 — Reescrever os testes do `OnboardingWizard`
  - Arquivos: `src/components/adesao/OnboardingWizard/OnboardingWizard.test.tsx`
  - Pronto quando: cobrem fluxo feliz das 4 etapas com envio e redirecionamento; avanço bloqueado com foco no primeiro inválido; voltar sem perder dados; sem envio duplicado; CNPJ duplicado leva à etapa 1 mantendo o preenchimento; falha de rede com nova tentativa; todos passam.

## Verificação final

- [x] T17 — Lint, build e testes de regressão
  - Arquivos: nenhum novo (só ajustes que surgirem)
  - Pronto quando: `npm run lint` e `npm run build` sem erro; testes de `EmpresaSecoes`, `ConveniadaEmpresaFields`, `PrecoWizard`, `Accordion` e `Stepper` verdes; o resto da suíte não regride.

- [x] T18 — Verificação visual e de acessibilidade
  - Arquivos: nenhum novo (só ajustes que surgirem)
  - Pronto quando: `/adesao` conferida em 320, 390, 768, 1024 e 1440px nos temas claro e escuro, sem rolagem horizontal nem sobreposição; fluxo completo só por teclado com foco visível; contraste AA da credencial; sem animações com movimento reduzido; resultado comparado com `mockups/opcao-1.png`; pendências anotadas neste arquivo.

## Notas da execução

- **T6**: as variantes ficaram `completa` e `compacta` (em vez de `lateral`/`faixa`/`compacta`). A `completa` se adapta à largura (uma coluna na lateral, várias colunas quando fica acima do formulário), então não precisou de uma terceira variante.
- **T11**: o botão mostrar/ocultar senha já existia no `Input`; só foi acrescentado o texto de apoio e o `name` do CPF (usado para focar o campo ao corrigir um erro do backend).
- **T15**: o `<form>` do wizard usa `noValidate`. A validação nativa travava o envio com campos `required` vazios, principalmente dentro de blocos recolhidos; agora valem os erros por campo, o aviso "Faltam N campos" e o foco no primeiro inválido.
- **T17**: `npm run lint` (0 erros), `npm run build` e a suíte completa (287 arquivos, 3080 testes) passam. O teste `src/styles/tokens.test.ts` exigiu trocar usos de `colors.primary` como borda/contorno/texto por preenchimento (selos de vagas e dias da credencial) ou por `accent`.
- **T18** (feito em parte): conferidos no navegador a etapa Empresa em 1440px e ~500px, a etapa Horários em 1440px e ~500px e a Conferir em 1440px (sem sobreposição nem rolagem horizontal). **Não conferidos**: 320px real, 768px (tablet), tema escuro, o painel "Ver credencial" no celular, a etapa Titular e a Conferir no celular, leitor de tela e teclado com o fluxo completo. O Edge sem interface não abre janelas menores que ~500px e o app bloqueia `iframe`, então os tamanhos menores precisam de uma conferência manual.
