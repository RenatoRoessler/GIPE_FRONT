# Tasks: Tour de onboarding

Referências: ./prd.md, ./techspec.md, ./design.md

Antes de T2, confirmar com o back o contrato do onboarding (techspec, "Contrato da API"): tipo de `onboardingId` e corpo da resposta do `PUT`. O código lê só `visualizado`, então T1 e T2 não ficam bloqueadas.

- [x] T1 — Tipo e serviço do onboarding
  - Arquivos: `src/types/onboarding.ts`, `src/lib/api/services/onboarding.ts`, `src/lib/api/services/onboarding.test.ts`
  - Pronto quando: `getOnboarding()` chama `GET /Onboarding` e devolve `{ visualizado, dataVisualizacao }` (campo ausente ou fora do formato vira `visualizado: false`); `marcarOnboardingVisualizado()` chama `PUT /Onboarding` com `{ visualizado: true }`; erros sobem como `ApiError`; testes cobrem os dois casos, resposta incompleta e erro.

- [x] T2 — Hooks de consulta e registro
  - Arquivos: `src/components/onboarding/useOnboarding.ts`, `src/components/onboarding/useOnboarding.test.tsx`
  - Pronto quando: `useOnboarding()` consulta só com o usuário conhecido (sem `retry`, sem refetch ao focar) e `useMarcarVisualizado()` grava `{ visualizado: true }` no cache ao ter sucesso, sem nova consulta; testes cobrem usuário desconhecido (não consulta), sucesso, falha da consulta e atualização do cache.

- [x] T3 — Conteúdo e montagem dos passos
  - Arquivos: `src/components/onboarding/conteudo.ts`, `src/components/onboarding/passos.ts`, `src/components/onboarding/passos.test.ts`
  - Pronto quando: `conteudo.ts` traz o texto (2 a 3 frases, pt-BR) de cada módulo de `NAV_ITEMS` e as boas-vindas e o fechamento nas versões equipe e conveniada; `montarPassos(perfil)` devolve Boas-vindas, um passo por módulo permitido na ordem do menu e Pronto, com a linha "No menu, em {grupo}." (ou "No menu." sem grupo); conveniada recebe só Carimbo e Pátio da conveniada; perfil desconhecido recebe só Boas-vindas e Pronto; o teste de completude falha se um item de `NAV_ITEMS` ficar sem texto.

- [x] T4 — Janela do tour
  - Arquivos: `src/components/onboarding/OnboardingTour/OnboardingTour.tsx`, `OnboardingTour.styles.ts`, `index.ts`, `OnboardingTour.test.tsx`
  - Pronto quando: renderiza o `Modal` com medalhão do `NavIcon`, "Módulo X de N", título, texto, "onde encontrar", `ProgressBar` e "Passo X de N"; Voltar some no primeiro passo e Avançar vira Concluir no último; Sair, "×" e Esc chamam `onSair` sem registrar; "Não mostrar mais" aparece só no modo `primeiro-acesso` e chama `onNaoMostrarMais`; clique no fundo não fecha; setas navegam; rodapé em duas linhas no celular; sem cor ou espaço fora do tema; testes cobrem navegação, os dois modos, teclado e o nome acessível do progresso.

- [x] T5 — Provider do tour e integração no AppShell
  - Arquivos: `src/components/onboarding/OnboardingProvider.tsx`, `OnboardingProvider.test.tsx`, `index.ts`, `src/components/layout/AppShell/AppShell.tsx` (e seu teste, com mock do serviço)
  - Pronto quando: com `visualizado: false` o tour abre sozinho no primeiro acesso; com `true`, consulta em erro ou carregando, não abre; "Sair" fecha, grava a marca em `sessionStorage` (por usuário, dentro de `try/catch`) e não reabre ao trocar de rota nem ao recarregar na mesma sessão; "Não mostrar mais" e "Concluir" registram o `PUT`, fecham e atualizam o cache; falha no `PUT` fecha e mostra o `Toast` "Não foi possível salvar. O tour pode aparecer de novo no próximo acesso."; `abrirTour()` abre em modo repetição, sem registrar nada; testes cobrem esses cenários e o `AppShell` segue renderizando.

- [x] T6 — Botão "Repetir tour" na Home e no Carimbo
  - Arquivos: `src/components/onboarding/RepetirTourButton/RepetirTourButton.tsx`, `index.ts`, `RepetirTourButton.test.tsx`, `src/app/(app)/dashboard/page.tsx` (e seu teste), `src/components/carimbo/CarimboPage/CarimboPage.tsx` (e seu teste)
  - Pronto quando: o botão `secondary` "Repetir tour" aparece na linha de ações da Home e na tela do Carimbo e abre o tour em modo repetição, completo, mesmo já visto; a Home continua Server Component; testes confirmam a presença nas duas telas e a abertura do tour.

- [x] T7 — Validação final
  - Arquivos: —
  - Pronto quando: `npm run lint` sem erros, `tsc` limpo, `npm run build` passa e os testes das áreas tocadas passam; critérios de aceite do `prd.md` conferidos; revisão dos textos pelo produto e confirmação do contrato do back registradas como pendências, se ainda abertas.
  - Situação: lint 0 erros (95 avisos, os mesmos de antes), `tsc` limpo, build passa e os testes das áreas tocadas passam. No conjunto completo, 4 falhas antigas e alheias à feature: os três testes de 403 (MinhaEmpresa, UsuariosList e CaixaPage, link "Ir para o início") e um teste instável do `MensalistaModal`. Pendências fora do código: confirmar com o back o tipo de `onboardingId` e a resposta do `PUT`, revisão dos textos pelo produto e conferência visual do tour no navegador (celular e computador), que não foi feita aqui.
