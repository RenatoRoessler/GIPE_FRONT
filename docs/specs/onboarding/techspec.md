# Tech Spec: Tour de onboarding

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele)

## Design
Seguem `design.md`: uma janela única (`Modal`) com passos, sem navegar entre telas.
- Componentes reaproveitados: `Modal`, `Button`, `ProgressBar`, `Toast`, `NavIcon`, `Text`; nomes e ícones dos módulos vêm de `NAV_ITEMS` (`src/lib/nav.ts`).
- Componentes novos (em `src/components/onboarding`, nenhum em `ui`): `OnboardingProvider`, `OnboardingTour`, `RepetirTourButton`.
- Tokens: nenhum novo (`primarySoft`, `accent`, `textMuted`, `border`, `space`, `radii.full`, `fontSizes`, `layout.touchTarget`).

## Contrato da API (dado no `input.md`)
- `GET /Onboarding` → `{ onboardingId: number | null, visualizado: boolean, dataVisualizacao: string | null }`. A pessoa é identificada pelo token.
- `PUT /Onboarding` com `{ visualizado: true }` → registra a visualização. Não há como desfazer.
- Não informado: tipo de `onboardingId` (assumido número ou nulo) e o corpo da resposta do `PUT`. Tudo é lido com tolerância; só `visualizado` importa.

## Arquitetura da solução

### Dados
- `src/types/onboarding.ts` (novo): `Onboarding = { visualizado: boolean; dataVisualizacao: string | null }`.
- `src/lib/api/services/onboarding.ts` (novo): `getOnboarding(): Promise<Onboarding>` (`GET /Onboarding`, lê `visualizado === true`, resto tolerante) e `marcarOnboardingVisualizado(): Promise<void>` (`PUT /Onboarding` com `{ visualizado: true }`). Erros sobem como `ApiError`. Testes em `onboarding.test.ts`.
- `src/components/onboarding/useOnboarding.ts` (novo): `ONBOARDING_QUERY_KEY = ["onboarding"]`; `useOnboarding()` com `useQuery` (`staleTime` longo, `refetchOnWindowFocus: false`, `retry: false`, habilitada só com o usuário conhecido) e `useMarcarVisualizado()` com `useMutation` que, no sucesso, grava `{ visualizado: true }` no cache (`setQueryData`).

### Passos do tour (lógica pura)
- `src/components/onboarding/conteudo.ts` (novo): mapa `chave do item de menu → { explicacao, onde? }`, indexado por `navItemKey` (`/patio`, `entrada`, `saida`, `/caixa`, `/carimbo`...). Aqui ficam os textos de cada módulo (português do Brasil, 2 a 3 frases) e os de Boas-vindas e Pronto, em duas variações (equipe e conveniada).
- `src/components/onboarding/passos.ts` (novo): `montarPassos(perfil): Passo[]` — Boas-vindas, um passo por `navItemsPermitidos(perfil)` na ordem do menu, Pronto. Cada passo tem `id`, `titulo`, `texto`, `icone?` (`NavIconId`) e `onde?`. A linha "onde encontrar" vem do grupo (`GRUPOS_NAV`): "No menu, em Operação."; itens sem grupo (Visão Geral, itens da conveniada): "No menu.". Conveniada recebe o tom e as boas-vindas próprios. Perfil desconhecido: só Boas-vindas e Pronto. Testes em `passos.test.ts`, incluindo **um teste que falha se algum item de `NAV_ITEMS` não tiver texto em `conteudo.ts`**, para um módulo novo não ficar sem explicação.

### Estado e exibição
- `OnboardingProvider` (Client Component): montado no `AppShell`, que vive durante a sessão logada, e dono do estado do tour (`aberto`, `modo: "primeiro-acesso" | "repeticao"`). Expõe `useOnboardingTour()` com `abrirTour()` (modo repetição).
  - Abre sozinho quando a consulta retorna `visualizado === false` e o tour não foi dispensado nesta sessão do navegador. "Sair" guarda uma marca em `sessionStorage` (por usuário, em `try/catch`): trocar de página ou recarregar não reabre; só um novo acesso (nova sessão do navegador) reabre. Isso cumpre "volta no próximo acesso" sem insistir a cada navegação.
  - Consulta falhou ou carregando: não abre nada.
- `OnboardingTour` (Client Component): renderiza o `Modal` com os passos de `montarPassos(user.perfil)`, progresso, rodapé do design e o `Toast` de erro. Ações:
  - **Sair** (e "×"/Esc): só fecha; no primeiro acesso grava a marca de sessão.
  - **Não mostrar mais** (só no primeiro acesso): `useMarcarVisualizado().mutate`; fecha ao terminar, com sucesso ou erro (erro → `Toast`).
  - **Concluir**: no primeiro acesso igual a "Não mostrar mais"; na repetição só fecha.
  - Teclas: Enter avança (padrão do botão focado), setas esquerda e direita navegam.
- `RepetirTourButton` (Client Component): `Button secondary` que chama `abrirTour()`. Entra em `src/app/(app)/dashboard/page.tsx` (junto de Entrada, Saída e Gerar Cartaz) e em `CarimboPage` (conveniada, que não tem Home). O provider está no `AppShell`, sempre presente nessas telas.
- Edição em `AppShell.tsx`: envolve o conteúdo com `OnboardingProvider` e renderiza `OnboardingTour` ao lado do `BottomNav`.

### Server vs Client
Tudo em `src/components/onboarding` é Client Component (estado, query, `Modal`). `conteudo.ts`, `passos.ts` e o serviço são módulos puros. A página `dashboard/page.tsx` continua Server Component e só importa o botão cliente.

## Decisões técnicas e trade-offs
- **Janela única, sem destacar elementos da página**: evita depender do layout (menu lateral no computador, barra inferior no celular) e de bibliotecas de tour. Custo: o tour explica, não aponta.
- **Textos em módulo próprio, indexado pelo menu**: o tour acompanha `NAV_ITEMS` (permissão, ordem, ícone) sem duplicar a lista de módulos; o teste de completude trava a divergência.
- **Marca de "Sair" em `sessionStorage`**: sem isso, "Sair" reabriria o tour a cada troca de página, pois o back ainda diz `visualizado: false`. Sessão do navegador é o equivalente mais próximo de "próximo acesso" sem exigir novo campo no back. Se o armazenamento falhar, vale o estado em memória do provider.
- **Atualização do cache em vez de nova consulta** após o `PUT`: evita um GET desnecessário e impede o tour de reabrir se a consulta atrasar.
- **Erro ao registrar não prende a pessoa**: fecha e avisa; no pior caso o tour volta no próximo acesso.
- **Sem abstração genérica de "tours"**: um único tour; criar um motor de passos reaproveitável agora seria prematuro.

## Riscos / pontos de atenção
- **Contrato do back não confirmado em detalhes**: tipo de `onboardingId` e resposta do `PUT` (tratados com tolerância).
- **Textos escritos aqui** precisam de revisão do produto antes de produção (questão em aberto do PRD).
- **Perfil desconhecido ou sessão sem perfil**: o tour só mostra Boas-vindas e Pronto; não bloqueia.
- **`/acesso-negado` e telas dentro de `(app)`**: o tour pode abrir sobre qualquer uma delas, por estar no `AppShell`; aceitável, pois é por usuário e não por tela.
- **Modal do tour e outros modais** (por exemplo, entrada de veículo): o tour abre ao entrar, antes de a pessoa iniciar outra tarefa; não há tratamento de sobreposição.
- **Testes de `AppShell` existentes** precisam do `QueryClientProvider` e de um mock do serviço de onboarding.

## Fora de escopo técnico
- Destaque de elementos da página e navegação entre telas durante o tour.
- Desfazer o "Não mostrar mais" ou nova rota no back.
- Métricas do tour e tutoriais dentro dos módulos.
- Tradução/i18n (o sistema é só pt-BR).
