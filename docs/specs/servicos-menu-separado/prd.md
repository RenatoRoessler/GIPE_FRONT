# PRD: Menu de Serviços separado em Operação e Cadastro

## Problema
O módulo de Serviços reúne duas atividades diferentes numa só entrada do menu, em abas na mesma tela: a **fila** de quem executa o serviço (lavador, manobrista, caixa) e o **catálogo** de quem define o que se vende e por quanto (administração). Isso mistura públicos e momentos de uso:

- Quem trabalha no pátio não tem motivo para ver ou cair na tela de preços, e quem mantém o catálogo não precisa da fila para fazer o seu trabalho.
- O item único fica no grupo Operação do menu, longe dos demais cadastros (Gestão de Preços, Mensalistas, Usuários).

## Objetivo
O menu passa a ter dois itens de Serviços, cada um no grupo e para os perfis que fazem sentido: a fila em Operação e o catálogo em Configurações, cada um abrindo direto na sua tela, sem abas.

## Usuário-alvo
- **Operação (fila)**: Lavador, Manobrista e Caixa, que acompanham e executam os serviços dos veículos no pátio.
- **Cadastro (catálogo)**: Administrador e Gerente, que definem os serviços e os preços.

## Requisitos funcionais
- RF1: O menu tem o item **Fila de serviços**, no grupo Operação, que abre a fila de serviços. Aparece para Lavador, Manobrista e Caixa.
- RF2: O menu tem o item **Catálogo de serviços**, no grupo Configurações, que abre o catálogo (lista, detalhe, cadastro, edição e inativação). Aparece para Administrador e Gerente.
- RF3: Cada item abre direto na sua tela: some a alternância entre fila e catálogo dentro da tela de Serviços.
- RF4: Cada perfil vê no menu somente o(s) item(ns) a que tem direito; um perfil que não pode ver um item também não o acessa digitando o endereço (recebe o aviso de falta de permissão já usado no sistema).
- RF5: Administrador e Gerente deixam de ter a fila no menu. O que já fazem sobre os serviços de um veículo pelo ticket do Pátio (acrescentar, mudar status, cancelar) continua como está.
- RF6: Administrador e Gerente cadastram, editam e inativam serviços no catálogo. O Financeiro não tem acesso a Serviços.
- RF7: Links, favoritos e atalhos que apontavam para a tela única de Serviços continuam levando a um lugar válido: quem abria a fila continua na fila; quem abria o catálogo (Administrador e Gerente) chega ao catálogo.
- RF8: Os dois itens aparecem na navegação de celular e de computador, respeitando os grupos do menu, com os nomes "Fila de serviços" (Operação) e "Catálogo de serviços" (Configurações), que deixam clara a diferença.
- RF9: Se o módulo de serviços estiver desligado na configuração da empresa, os dois itens mantêm o comportamento atual de aviso de módulo desligado.

## Fora de escopo
- Mudar o conteúdo ou o visual da fila e do catálogo (tratado em `servicos-melhorias`).
- Criar um novo grupo no menu (o catálogo entra em Configurações).
- Alterar as permissões do ticket do Pátio e dos serviços do veículo.
- Tela de gestão de permissões por perfil (já existe em módulo próprio; apenas passa a refletir as duas áreas).
- Dar ao Financeiro qualquer acesso a Serviços (o back não o permite hoje).

## Critérios de aceite
- [ ] Lavador, Manobrista e Caixa veem **Fila de serviços** em Operação e não veem o catálogo.
- [ ] Administrador e Gerente veem **Catálogo de serviços** em Configurações e não veem a fila.
- [ ] Cada item abre direto na sua tela, sem abas entre fila e catálogo.
- [ ] Lavador, Manobrista, Caixa e Financeiro que digitam o endereço do catálogo, e Administrador, Gerente e Financeiro que digitam o da fila, recebem o aviso de falta de permissão.
- [ ] O Financeiro não vê nenhum item de Serviços no menu.
- [ ] Administrador e Gerente cadastram, editam e inativam serviços como antes, e continuam gerindo serviços pelo ticket do Pátio.
- [ ] Os endereços antigos de Serviços (com ou sem `?aba=`) levam à tela correta para o perfil, sem erro.
- [ ] Menu de celular e de computador mostram os itens nos grupos corretos.

## Métricas de sucesso
- Nenhum perfil cai em tela de serviços que não é a sua; zero chamados de "não acho a fila/catálogo".
- Lavador chega à fila em um toque a partir do menu.

## Pontos a confirmar
- **Financeiro sem acesso** (RF6): decisão tomada depois de a documentação do back mostrar que `GET /Servico` não inclui o perfil.
- **Administrador e Gerente sem a fila no menu** (RF5): decisão tomada; eles seguem acompanhando e cancelando serviços pelo ticket do Pátio.
- **Interação com `servicos-melhorias`**: a fila e o catálogo mudam de visual lá; esta mudança só reorganiza a entrada e o acesso. As tasks de `servicos-melhorias` que citam as abas da tela única precisam ser lidas à luz deste PRD.
