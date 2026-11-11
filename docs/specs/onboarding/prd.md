# PRD: Tour de onboarding

Origem: `../input.md`.

## Problema
Quem entra no sistema pela primeira vez não tem um guia: os módulos são muitos (pátio, caixa, preços, mensalistas, financeiro, empresa, entre outros) e cada perfil vê um conjunto diferente. O novo usuário precisa descobrir sozinho onde fica cada coisa e para que serve, o que aumenta dúvidas ao operador e dependência de treinamento presencial.

## Objetivo
No primeiro acesso, o usuário faz um tour guiado que percorre todos os módulos disponíveis para o seu perfil, com uma explicação completa de cada um. O sistema lembra, por usuário, que o tour já foi visto e não o mostra de novo sozinho. O usuário pode rever o tour quando quiser.

## Usuário-alvo
Qualquer usuário logado que entra no sistema pela primeira vez, no celular ou no computador. O tour é por usuário (não por empresa) e existe em duas versões:
- **Equipe do estacionamento** (Administrador, Gerente, Caixa, Manobrista, Financeiro): percorre os módulos que o perfil acessa.
- **Conveniada** (Administrador, Gerente e Usuário da conveniada): tour próprio, restrito ao Carimbo e ao Pátio da conveniada.

## Requisitos funcionais
- RF1: Ao entrar no sistema, o sistema consulta se o usuário já visualizou o onboarding. Se ainda não, o tour é iniciado.
- RF2: O tour passa por todos os módulos disponíveis ao usuário (respeitando perfil e permissão por módulo) e explica, para cada um, para que serve e o que se faz nele. Módulos que o usuário não acessa não aparecem. A conveniada vê só o tour próprio (Carimbo e Pátio da conveniada).
- RF3: O usuário avança, volta e vê onde está no tour (por exemplo, passo 3 de 8).
- RF4: Em qualquer passo há dois botões de saída com efeitos diferentes:
  - **Sair**: fecha o tour sem registrar nada; o tour volta a ser oferecido no próximo acesso.
  - **Não mostrar mais**: fecha o tour e registra que o onboarding foi visualizado; ele não reaparece sozinho.
- RF5: Concluir o tour até o último passo também registra que o onboarding foi visualizado.
- RF6: O usuário pode rever o tour quando quiser, por um botão "Repetir tour" na Home. Rever não depende de o tour já ter sido visto e não altera o registro de visualização. Para a conveniada, que não tem Home, o botão fica na tela inicial do seu perfil.
- RF7: O texto de cada módulo é escrito pelo produto desta feature, em português do Brasil, com tom direto e simples, de poucas frases por módulo, dizendo para que o módulo serve e o que se faz nele.
- RF8: Se a consulta ou o registro falharem, o usuário não fica preso: o sistema continua utilizável e o tour não bloqueia o trabalho. Falha ao registrar "Não mostrar mais" ou a conclusão avisa o usuário de forma discreta.
- RF9: O tour funciona no celular e no computador e é utilizável pelo teclado e por leitores de tela.

## Fora de escopo
- Tutoriais passo a passo de tarefas dentro de cada módulo (como registrar uma entrada).
- Onboarding por empresa ou por etapas de configuração inicial (cadastro, preços).
- Métricas de uso do tour.
- Desfazer o "Não mostrar mais" (o botão "Repetir tour" cobre rever o conteúdo, mas o tour não volta a abrir sozinho).

## Critérios de aceite
- [ ] Usuário que nunca viu o onboarding o vê ao entrar no sistema.
- [ ] O tour cobre exatamente os módulos disponíveis ao perfil do usuário, cada um com sua explicação; a conveniada vê só o tour próprio.
- [ ] É possível avançar, voltar, ver o progresso e sair do tour.
- [ ] "Sair" fecha o tour sem registrar; no próximo acesso o tour aparece de novo.
- [ ] "Não mostrar mais" registra a visualização; no próximo acesso o tour não aparece.
- [ ] Concluir o último passo registra a visualização.
- [ ] Usuário que já viu o onboarding não o vê de novo sozinho.
- [ ] Na Home (e na tela inicial da conveniada) há "Repetir tour", que abre o tour completo do perfil mesmo depois de visto.
- [ ] Falha na consulta ou no registro não impede o uso do sistema.
- [ ] O tour é usável no celular, no computador e pelo teclado.

## Métricas de sucesso (se aplicável)
- Parcela de novos usuários que concluem o tour.
- Queda de dúvidas de "onde fica X" ao suporte nas primeiras semanas.

## Questões em aberto
- Onde fica o "Repetir tour" da conveniada (assumido: tela inicial do perfil, o Carimbo)?
- Os textos escritos aqui precisam de revisão do produto antes de ir para produção?
