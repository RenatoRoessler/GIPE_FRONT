# PRD: Refactor de Base Técnica (Formulários, Dados e APIs Depreciadas)

## Problema
O projeto está prestes a crescer bastante (gestão de preços com wizard de 4 etapas e sub-tabelas dinâmicas, gestão de usuários, permissões, entrada/saída de veículos, relatórios — todos já mapeados em `PRODUCT.md`). Hoje, cada formulário (`LoginForm`, `RecoverPasswordForm`, `ResetPasswordForm`, `OnboardingWizard`) reimplementa manualmente o mesmo padrão (um `useState` por campo, uma função `validate()` própria, handler de submit), e toda tela que precisa de dados simula `setTimeout` na mão, sem loading/erro/cache padronizados. Esse padrão não escala: cada tela nova (principalmente o wizard de preços, mais complexo que tudo que existe hoje) vai duplicar ainda mais lógica. Além disso, `RecoverPasswordForm`, `ResetPasswordForm` e `OnboardingWizard` usam o tipo `FormEvent` do React, que está marcado como depreciado pelo pacote de tipos (`@deprecated FormEvent doesn't actually exist`) — já corrigido no `LoginForm`, mas não nos demais. Por fim, `useCurrentUser` é um hook com estado próprio (não um contexto compartilhado): cada componente que o chama (`Header`, `UserMenu`) dispara seu próprio mock/timer independente — funciona hoje só por coincidência (o mock é fixo), mas não escala quando o usuário logado vier de dado real.

## Objetivo
Formulários da aplicação passam a validar dados com schemas `zod` reutilizáveis em vez de funções de validação manuais por componente; toda busca/mutação de dados (mesmo mockada) passa a usar `TanStack Query`, com loading/erro/cache tratados de forma consistente; nenhum arquivo do projeto usa mais o tipo depreciado `FormEvent`; o usuário logado passa a vir de um único contexto compartilhado, não de um hook com estado duplicado por chamada.

## Usuário-alvo
A própria equipe de desenvolvimento do GIPE — este é um investimento de manutenibilidade, não uma feature visível para o usuário final do sistema (operadores, admins). O usuário final não deve perceber diferença de comportamento nas telas afetadas.

## Requisitos funcionais

### Padronização de formulários (zod)
- RF1: Existe uma forma padrão de definir regras de validação de um formulário usando `zod`, reaproveitável por qualquer formulário novo do projeto.
- RF2: `LoginForm`, `RecoverPasswordForm`, `ResetPasswordForm` e as duas etapas do `OnboardingWizard` (`CompanyStepFields`/`AdminUserStepFields`) passam a usar essa validação baseada em schema, no lugar das funções `validate*()` escritas à mão.
- RF3: As mensagens de erro exibidas ao usuário permanecem as mesmas (ou equivalentes) às atuais — este é um refactor interno, não uma revisão de copy.
- RF4: Validações que já existem hoje como funções utilitárias (`isValidCPF`, `isValidCNPJ`, `isValidEmail` em `src/lib`) continuam sendo a fonte de verdade da regra e são reaproveitadas dentro dos schemas `zod` (não duplicar a lógica de dígito verificador de CPF/CNPJ dentro do schema).

### Camada de dados (TanStack Query)
- RF5: Existe uma forma padrão de buscar/mutar dados (mesmo que a "fonte" continue sendo um mock local) usando `TanStack Query`, reaproveitável por qualquer tela nova.
- RF6: As chamadas hoje simuladas com `setTimeout` direto no componente (`mockLogin` no `LoginForm`, o "salvar" do `OnboardingWizard`, o "recuperar senha" do `RecoverPasswordForm`, o "alterar senha" do `ResetPasswordForm`) passam a rodar através dessa camada (como mutations), preservando o comportamento observável atual (mesmo delay, mesmo resultado de sucesso/erro).
- RF7: Estados de carregamento e erro dessas ações continuam sendo exibidos exatamente como hoje (botão em estado "carregando", mensagem de erro, toast de sucesso) — a mudança é de onde esse estado vem, não do que é mostrado.

### Remoção de API depreciada
- RF8: Nenhum arquivo do projeto importa ou usa o tipo `FormEvent` de `react` — todos os `onSubmit` de formulário usam o tipo correto (`SubmitEvent`, já aplicado no `LoginForm`).

### Usuário logado como estado compartilhado
- RF9: O usuário atualmente logado (nome exibido no `Header`, iniciais no `UserMenu`) passa a vir de um único contexto compartilhado na árvore de componentes, carregado uma vez — não de um hook que cria estado/timer independente a cada chamada.
- RF10: O comportamento visível não muda: `Header` continua mostrando o skeleton de carregamento e depois o nome; `UserMenu` continua mostrando as iniciais.

## Fora de escopo
- Testes automatizados (vitest) — fica para uma iniciativa própria futura, não faz parte desta rodada.
- Qualquer backend/API real — a camada de dados nova continua consumindo mocks locais; não há integração de rede nesta spec.
- Mudança visual ou de copy nas telas afetadas — o usuário final não deve perceber diferença.
- Unificar o **conteúdo** de `useCurrentUser`/contexto de usuário com `auth.ts` (mock de token) — continuam sendo dois mocks independentes; esta spec resolve só a duplicação de *estado* do usuário exibido, não a integração entre sessão e usuário.
- **Controle de permissões por perfil (RBAC)** — o `PRODUCT.md` já prevê 4 perfis com permissões de menu configuráveis, e hoje `proxy.ts`/`Sidebar` não diferenciam perfil nenhum. Fica registrado como necessidade futura conhecida, mas é grande demais para entrar neste refactor — deve virar uma spec própria (`criar-prd`) quando a tela de "Permissões" for endereçada.
- Migrar telas que ainda não existem (preços, usuários, veículos, relatórios) — o objetivo é deixar o padrão pronto para quando elas forem construídas, não construí-las.

## Critérios de aceite
- [ ] `LoginForm`, `RecoverPasswordForm`, `ResetPasswordForm`, `CompanyStepFields` e `AdminUserStepFields` validam seus campos usando um schema `zod`, não uma função `validate*()` escrita à mão.
- [ ] As mensagens de erro exibidas para cada campo inválido continuam as mesmas (ou equivalentes) às atuais, em todos esses formulários.
- [ ] As ações de submit mockadas (login, recuperar senha, alterar senha, salvar adesão) rodam através de `TanStack Query` (mutations), preservando o comportamento visível de loading/sucesso/erro.
- [ ] `npm run build` e `npm run lint` passam sem erros após o refactor.
- [ ] Nenhuma ocorrência de `FormEvent` (importado de `"react"`) resta no código-fonte do projeto.
- [ ] `Header` e `UserMenu` consomem o mesmo contexto de usuário (não duas instâncias independentes do mock) — verificável revisando o código, já que o dado mockado é idêntico nos dois.
- [ ] Fluxos manuais continuam funcionando: login com credencial correta/errada, recuperação de senha, alteração de senha, adesão de empresa (as duas etapas, incluindo erros de validação).

## Métricas de sucesso
Não há métrica de produto (mudança não é visível ao usuário final). O critério de sucesso é qualitativo: um formulário novo (ex. o wizard de preços, futuro) deve conseguir reaproveitar o padrão de validação e de dados criado aqui sem reescrever a lógica do zero.
