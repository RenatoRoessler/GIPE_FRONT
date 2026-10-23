# PRD: Permissões padrão por perfil

## Problema
Hoje qualquer usuário autenticado enxerga e tenta operar todas as áreas do GIPE, independentemente da função (Administrador, Gerente, Caixa, Manobrista, Financeiro). Um manobrista vê o menu de preços e de empresa; um caixa pode tentar abrir a gestão de usuários. O back-end já define quais perfis podem usar cada recurso, mas o front não reflete isso: o usuário descobre que não tem acesso só quando a chamada falha.

Além disso, o token passou a trazer o perfil do usuário na claim de role (hoje com o valor numérico do perfil, ex.: `"1"`), e o sistema precisa interpretá-lo para decidir o que mostrar.

## Objetivo
Cada usuário vê e acessa apenas as áreas permitidas ao seu perfil, conforme a matriz padrão abaixo, tanto no menu quanto por URL direta e nas ações dentro das telas. Esta feature cobre a regra **padrão** por perfil; a configuração por módulo (tela de permissões, ver `docs/specs/permissoes/prd.md`) pode sobrescrevê-la.

## Usuário-alvo
Todos os usuários logados de uma empresa de estacionamento (Administrador, Gerente, Caixa, Manobrista, Financeiro) e as conveniadas (Administrador Conveniada), cada um enxergando só o que sua função permite.

## Matriz de permissões padrão

| Área / recurso | Perfis permitidos |
|---|---|
| Abrir caixa, fechar caixa, caixa atual (`/Caixa`), turno, turnos, passagem de turno, movimentos | Administrador, Gerente, Caixa, Manobrista |
| Sangria | Administrador, Gerente, Caixa |
| Histórico de caixa e seus movimentos (`/Caixa/historico/{caixaId}/movimentos`) | Administrador, Gerente |
| Pátio (todas as ações não públicas) | Administrador, Gerente, Caixa, Manobrista |
| Rotatividade / Preços | Administrador, Gerente |
| Manutenção de mensalista | Administrador, Gerente |
| Gestão de nota fiscal | Administrador, Gerente, Financeiro |
| Menu Empresa e todas as ações de edição da empresa | Administrador |
| Gestão de usuários: listar, cadastrar, consultar por CPF, alterar perfil, ativar/inativar, resetar senha | Administrador, Administrador Conveniada |
| Alterar a própria senha (`/Usuario/senha`) | Qualquer usuário autenticado |

## Requisitos funcionais
- RF1: O sistema identifica o perfil do usuário a partir da role presente no token de autenticação, inclusive quando ela vem no formato numérico.
- RF2: O menu (desktop e mobile) exibe somente as áreas permitidas ao perfil do usuário, conforme a matriz.
- RF3: Ao acessar por URL direta uma tela não permitida ao perfil, o usuário é impedido e vê uma mensagem clara de acesso negado (ou é redirecionado para uma área permitida).
- RF4: Ações dentro de telas permitidas que exigem perfil mais restrito (ex.: sangria, edição da empresa, manutenção de mensalista, ações de gestão de usuários) ficam ocultas ou desabilitadas para quem não pode executá-las.
- RF5: Se a API responder acesso negado (403) mesmo assim, o usuário vê uma mensagem compreensível, sem quebrar a tela.
- RF6: Perfil desconhecido ou token sem role recebe apenas o acesso mínimo (alterar a própria senha e sair), nunca acesso amplo por omissão.
- RF7: A regra padrão da matriz deve poder ser sobrescrita pela permissão por módulo configurada na tela de permissões, quando essa existir.
- RF8: A troca da própria senha continua disponível a qualquer usuário autenticado.

## Fora de escopo
- Tela de configuração de permissões por perfil (coberta por `docs/specs/permissoes/prd.md`).
- Permissões granulares por ação definidas pelo administrador.
- Criação de perfis customizados.
- Mudanças de regra no back-end (a autorização definitiva continua sendo da API).

## Critérios de aceite
- [ ] Usuário de cada perfil vê no menu apenas as áreas da sua linha na matriz.
- [ ] Manobrista não vê Preços, Empresa, Mensalistas (manutenção), Notas fiscais, Usuários nem Histórico de caixa.
- [ ] Caixa não vê Histórico de caixa nem Preços, mas consegue fazer sangria.
- [ ] Manobrista não consegue fazer sangria.
- [ ] Financeiro acessa Gestão de nota fiscal e não acessa Pátio, Caixa ou Preços.
- [ ] Somente Administrador vê o menu Empresa e as ações de edição da empresa.
- [ ] Somente Administrador e Administrador Conveniada acessam a gestão de usuários.
- [ ] Acessar uma URL não permitida mostra acesso negado ou redireciona; nunca exibe a tela com dados.
- [ ] Todos os perfis conseguem alterar a própria senha.
- [ ] Role numérica no token (ex.: `"1"`) é reconhecida como o perfil correto.
- [ ] Token sem role ou com role desconhecida não libera nenhuma área além do mínimo.
- [ ] Resposta 403 da API gera mensagem clara.
- [ ] Menu e telas funcionam em desktop e mobile.

## Questões em aberto
- A role do token virá sempre numérica ou também por nome (hoje o sistema aceita só o nome)?
- Mensalista: a matriz cobre só a "manutenção"; consulta/listagem de mensalistas é liberada a todos os perfis ou também restrita?
- Perfis de conveniada (Gerente e Usuário Conveniada) não aparecem na matriz: qual o acesso deles além da troca de senha?
- Quais telas ficam disponíveis ao Financeiro além de nota fiscal (ex.: dashboard/home)?
- Como a permissão por módulo sobrescreve o padrão: pode apenas ampliar, apenas restringir, ou ambos?

## Métricas de sucesso
- Nenhum acesso indevido a áreas restritas reportado após a entrega.
- Redução de erros 403 exibidos ao usuário, já que as áreas proibidas deixam de ser oferecidas.
