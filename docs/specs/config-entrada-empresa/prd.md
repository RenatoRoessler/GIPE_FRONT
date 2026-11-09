# PRD: Configuração da empresa — dados obrigatórios na entrada

## Problema
Cada estacionamento tem uma rotina diferente na portaria. Hoje o sistema decide sozinho quais dados do veículo são exigidos na entrada, e a empresa não consegue ajustar isso. Uns precisam de modelo e cor para identificar o carro no pátio; outros exigem também o prisma (número da peça de identificação do veículo) para ter mais controle. O gestor não tem como dizer ao sistema o que a sua operação exige.

## Objetivo
O gestor da empresa escolhe, numa tela de configuração, quais dados do veículo são obrigatórios na entrada (modelo, cor e prisma), e essa escolha vale para todas as entradas registradas na empresa, tanto pela entrada do pátio quanto pela conferência.

## Usuário-alvo
- Quem configura: perfis com acesso à configuração da empresa. Por padrão Administrador, Gerente, Caixa e Manobrista aparecem como perfis do sistema, mas a permissão por módulo pode mudar quem acessa e quem edita (ver questões em aberto).
- Quem sente o efeito: operadores que registram entrada de veículos, no celular ou no computador.

## Requisitos funcionais
- RF1: Existe uma tela de configuração da empresa com três opções ligar/desligar: "Modelo obrigatório", "Cor obrigatória" e "Prisma obrigatório".
- RF2: A tela mostra o valor atual de cada opção ao abrir. Para uma empresa que nunca salvou configuração, mostra o padrão: modelo e cor obrigatórios, prisma opcional.
- RF3: O usuário altera as opções e salva. Depois de salvar, a tela confirma e passa a mostrar os valores gravados.
- RF4: A tela mostra quem alterou por último e quando. Se nunca foi alterada, não mostra essa informação.
- RF5: Na entrada do pátio e na entrada pela conferência, os campos marcados como obrigatórios passam a ser exigidos; os demais continuam opcionais. O operador vê claramente quais são obrigatórios e não consegue registrar a entrada sem preenchê-los.
- RF6: Para mensalista, o prisma nunca é obrigatório, mesmo com a opção ligada: a entrada pode ser registrada sem ele. Modelo e cor seguem a configuração.
- RF7: Só quem tem permissão de edição altera as opções. Quem só pode ver enxerga os valores sem poder mudá-los; quem não tem acesso não vê a tela.
- RF8: A tela funciona bem no celular, com opções fáceis de tocar, e também no computador.
- RF9: Se a configuração não puder ser carregada ou salva, o usuário vê uma mensagem clara e pode tentar de novo, sem perder o que marcou.

## Fora de escopo
- Outras configurações da empresa além dessas três (ficam para versões futuras da mesma tela).
- Configuração por unidade, por turno ou por perfil de operador: a regra vale para a empresa toda.
- Histórico completo de alterações; só a última alteração é mostrada.
- Mudar o que já foi registrado: entradas antigas não são revalidadas.
- Gestão de permissões por módulo (já existente, só é usada aqui).

## Critérios de aceite
- [ ] Empresa sem configuração gravada abre a tela com modelo e cor obrigatórios e prisma opcional, sem dados de última alteração.
- [ ] Alterar uma opção e salvar mostra confirmação, e ao reabrir a tela o valor salvo aparece.
- [ ] Depois de salvar, a última alteração mostra o usuário e a data da alteração.
- [ ] Com "Prisma obrigatório" ligado, registrar entrada de um veículo comum sem prisma é bloqueado e o campo indica a falta.
- [ ] Com "Prisma obrigatório" ligado, registrar entrada de um mensalista sem prisma funciona.
- [ ] Com modelo ou cor desligados, a entrada pode ser registrada sem esses campos; ligados, é bloqueada se faltarem.
- [ ] A regra vale igual na entrada do pátio e na entrada pela conferência.
- [ ] Perfil sem permissão de edição não consegue alterar as opções; perfil sem acesso não encontra a tela.
- [ ] Erro ao carregar ou salvar mostra mensagem e permite tentar de novo mantendo o que o usuário marcou.
- [ ] A tela é utilizável em 360×640 e em desktop, com alvos de toque de pelo menos 44px.

## Métricas de sucesso (se aplicável)
- Redução de entradas registradas sem os dados que a empresa considera essenciais.
- Gestores conseguem mudar uma opção e salvar em menos de 30 segundos, sem ajuda.

## Questões em aberto
- Quais perfis podem ver e quais podem editar a configuração por padrão? A anotação lista os quatro perfis como padrão, com ajuste por módulo; falta confirmar se os quatro editam ou só visualizam.
- Onde a tela fica no menu (grupo Configurações, junto de "Minha empresa", ou dentro dela)?
- O operador deve ver o motivo do bloqueio ("a empresa exige prisma") ou apenas o campo marcado como obrigatório?
