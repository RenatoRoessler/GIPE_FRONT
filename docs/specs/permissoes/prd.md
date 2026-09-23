# PRD: Permissões

## Problema
O GIPE tem diferentes funções de usuário (admin, caixa, manobrista, gerente) que precisam de acessos diferentes aos menus do sistema. Hoje não existe forma de configurar quais menus cada perfil pode acessar.

## Objetivo
Um administrador consegue visualizar a lista de perfis existentes e, ao selecionar um perfil, configurar quais menus/telas do sistema aquele perfil pode acessar.

## Usuário-alvo
Administradores responsáveis por definir o que cada função (perfil) de usuário pode ver e operar no GIPE.

## Requisitos funcionais
- RF1: Tela de listagem de perfis, mostrando os perfis existentes no sistema.
- RF2: Ao clicar em um perfil, abre uma tela de edição de permissões daquele perfil.
- RF3: Na tela de edição, é possível conceder ou remover acesso do perfil a cada menu do sistema.
- RF4: As permissões salvas passam a valer para todos os usuários daquele perfil, controlando quais menus aparecem/são acessíveis para eles.

## Fora de escopo
- Permissões granulares por ação dentro de uma tela (ex: só visualizar vs. editar) — este PRD cobre acesso a nível de menu/tela.
- Criação de novos perfis customizados (perfis são os definidos no enum de função do usuário: admin, caixa, manobrista, gerente).

## Critérios de aceite
- [ ] A listagem de perfis mostra todos os perfis disponíveis no sistema.
- [ ] Ao clicar em um perfil, abre a tela de configuração de acessos daquele perfil.
- [ ] É possível marcar/desmarcar acesso a cada menu do sistema para o perfil selecionado.
- [ ] As alterações de permissão são salvas e refletem no que os usuários daquele perfil enxergam no menu.
- [ ] Usuário sem permissão para um menu não consegue acessar a tela correspondente (nem por URL direta).
- [ ] Telas funcionam de forma responsiva em desktop e mobile.

## Métricas de sucesso
- Todos os menus do sistema respeitam a configuração de permissões (nenhum acesso indevido reportado).
