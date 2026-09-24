# PRD: Estrutura do Projeto Logado

## Problema
Hoje o sistema tem telas de autenticação e o fluxo de adesão, mas não existe nenhuma estrutura para o usuário autenticado navegar pelo sistema: não há header, não há menu de navegação e não há uma tela inicial (dashboard) para onde o usuário é levado após o login.

## Objetivo
Ter a casca (shell) do sistema logado — header com identificação/ações do usuário, menu lateral com acesso às áreas do sistema e uma tela de dashboard inicial — para que qualquer área futura do GIPE tenha onde "morar" e o usuário autenticado consiga navegar e sair do sistema.

## Usuário-alvo
Qualquer usuário autenticado do GIPE (admin, gerente, caixa, manobrista), em desktop ou mobile, imediatamente após o login.

## Requisitos funcionais

### Header
- RF1: O header deve dar as boas-vindas ao usuário autenticado (ex.: exibir o nome do usuário logado).
- RF2: O header deve exibir um ícone de usuário.
- RF3: Ao clicar no ícone de usuário, deve abrir um dropdown de opções.
- RF4: O dropdown deve conter a opção "Editar Usuário", que navega para a tela de edição de usuário (tela ainda não implementada — o link/rota pode apontar para um destino a ser definido futuramente).
- RF5: O dropdown deve conter a opção "Sair", que efetua o logout do sistema e redireciona o usuário para fora da área logada (ex.: tela de login).

### Menu lateral
- RF6: Deve existir um menu lateral de navegação, visível nas telas da área logada.
- RF7: O menu lateral deve listar as seguintes opções: Gestão de Preços, Gestão de Usuários, Entrada de Veículos, Saída de Veículos, Relatórios.
- RF8: Cada item do menu deve indicar visualmente quando está ativo (rota atual).
- RF9: As rotas de destino de cada item do menu podem ainda não existir (telas serão implementadas em specs futuras) — o item de menu deve existir e ser navegável mesmo que a tela de destino seja um placeholder.

### Dashboard
- RF10: Deve existir uma tela de dashboard que funciona como página inicial da área logada (destino padrão após login).
- RF11: Nesta versão, o dashboard é uma tela de boas-vindas simples, sem dados ou widgets — conteúdo mínimo, preparada para receber mais informação no futuro.

### Estrutura geral
- RF12: Header, menu lateral e área de conteúdo (incluindo o dashboard) devem compor um layout único da área logada, usado por todas as telas autenticadas.

## Fora de escopo
- Implementação das telas de destino do menu (Gestão de Preços, Gestão de Usuários, Entrada/Saída de Veículos, Relatórios) — cada uma terá seu próprio PRD.
- Implementação da tela de "Editar Usuário".
- Controle de permissões por perfil sobre quais itens do menu aparecem (mencionado no PRODUCT.md como capability futura, não faz parte desta versão).
- Conteúdo real do dashboard (indicadores, gráficos, atalhos) além da tela de boas-vindas.
- Lógica de autenticação/sessão em si (já coberta pela spec de autenticação existente).

## Critérios de aceite
- [ ] Usuário autenticado, ao acessar a área logada, vê header, menu lateral e conteúdo da página.
- [ ] Header exibe mensagem de boas-vindas com o nome do usuário logado.
- [ ] Clicar no ícone de usuário no header abre um dropdown com as opções "Editar Usuário" e "Sair".
- [ ] Selecionar "Sair" efetua logout e leva o usuário para fora da área logada.
- [ ] Selecionar "Editar Usuário" navega para a rota/tela correspondente (mesmo que ainda seja um placeholder).
- [ ] Menu lateral exibe os 5 itens: Gestão de Preços, Gestão de Usuários, Entrada de Veículos, Saída de Veículos, Relatórios.
- [ ] Clicar em cada item do menu navega para a rota correspondente e destaca o item ativo.
- [ ] Rota inicial da área logada exibe o dashboard com uma tela de boas-vindas simples.
- [ ] Layout do header, menu lateral e dashboard funciona em desktop e em mobile (~375px), conforme os princípios de responsividade do produto.

## Métricas de sucesso
Não aplicável nesta fase (estrutura de navegação, sem métrica de negócio direta).
