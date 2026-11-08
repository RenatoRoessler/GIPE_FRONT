# PRD: Menu Organizado em Grupos

## Problema
O menu do sistema é uma lista única e cada vez mais longa. Hoje ele tem 17 telas, da operação do pátio ao cadastro de preços, do caixa às faturas, todas no mesmo nível e numa ordem que cresceu conforme os módulos foram chegando. Quem procura uma tela precisa ler a lista inteira, e telas de naturezas diferentes (apertar o caixa, cadastrar um preço, emitir uma fatura) ficam misturadas. No celular o problema aparece no painel "Mais", que acumula tudo o que não cabe na barra inferior.

## Objetivo
O menu agrupa as telas por assunto, com um título para cada grupo: **Financeiro**, **Configurações** e **Operação**. A mesma organização vale para o menu lateral do computador e para o painel "Mais" do celular, de modo que o usuário encontre cada tela pelo assunto, não pela posição numa lista.

## Usuário-alvo
Todos os perfis que usam o menu: Administrador, Gerente, Caixa, Manobrista e Financeiro (e, em menor grau, os perfis da conveniada). Os mais beneficiados são Administrador e Gerente, que veem a lista mais longa e usam telas de todos os assuntos.

## Requisitos funcionais
- RF1: O menu abre com a **Visão Geral** (antes "Dashboard"), fora de qualquer grupo e sem título. Depois dela, as telas ficam organizadas em três grupos, nesta ordem e com estes itens, na ordem listada:
  - **Operação**: Pátio, Entrada de Veículos, Saída de Veículos, Conferência de pátio.
  - **Financeiro**: Financeiro, Caixa, Faturas, Notas Fiscais.
  - **Configurações**: Minha Empresa, Gestão de Preços, Quadros de Chaves, Mensalistas, Gestão de Usuários, Empresas Conveniadas.
- RF2: Cada grupo mostra o seu título acima dos itens, de forma que o usuário reconheça onde um grupo termina e o seguinte começa.
- RF3: **Computador:** o menu lateral mostra os grupos com os respectivos títulos. Com o menu recolhido (só ícones), os grupos continuam distinguíveis, sem depender de ler o título; ao expandir, os títulos aparecem.
- RF4: **Celular:** o painel "Mais" mostra os mesmos grupos, com título, contendo apenas as telas que não estão na barra inferior. A barra inferior não muda (Pátio, Caixa, Entrada, Saída e Mais).
- RF5: Cada usuário vê só os itens que o seu perfil pode abrir, como hoje. Um grupo em que o usuário não tem nenhum item não aparece, nem o seu título.
- RF6: Entrada e Saída continuam abrindo o seu modal, e as demais telas continuam levando à mesma rota. A tela atual continua marcada como página atual, dentro do seu grupo.
- RF7: A ordem de tabulação e a leitura por leitor de tela seguem a ordem visual: grupo, depois os itens do grupo. Cada grupo é identificado como tal para o leitor de tela.
- RF8: Os perfis de conveniada, que não têm nenhuma das telas dos três grupos, continuam vendo os seus itens (Carimbar ticket e Pátio da conveniada) como hoje.

## Fora de escopo
- Mudar a barra inferior do celular, o que ela mostra ou a ordem dos seus itens.
- Grupos que se recolhem e expandem, ou lembrar quais o usuário abriu.
- Renomear, remover ou criar telas, ou mudar o que cada uma faz.
- Mudar as permissões de cada tela por perfil.
- Reordenar os grupos por perfil ou deixar o usuário personalizar a ordem.

## Critérios de aceite
- [ ] No computador, o menu lateral abre com a Visão Geral e mostra Operação, Financeiro e Configurações, nessa ordem, cada um com os itens do RF1 na ordem indicada.
- [ ] Para um Administrador, todos os itens do RF1 aparecem, cada um no seu grupo.
- [ ] Para um perfil com poucos itens (por exemplo, Caixa), aparecem só os grupos que têm item permitido, sem títulos de grupo vazio.
- [ ] O menu recolhido mostra os grupos separados; ao passar o mouse ou focar um item, os títulos aparecem.
- [ ] No celular, o painel "Mais" mostra os grupos com título, só com as telas que não estão na barra inferior, e a barra inferior segue igual.
- [ ] Entrada e Saída abrem o modal; as demais telas abrem pela mesma rota de antes; a tela atual aparece marcada.
- [ ] Um leitor de tela anuncia o nome do grupo antes dos seus itens.
- [ ] O perfil de conveniada continua vendo Carimbar ticket e Pátio da conveniada.
- [ ] Funciona nos temas claro e escuro.

## Métricas de sucesso (se aplicável)
Sem métricas numéricas. Sucesso = o usuário encontra uma tela do menu sem ler a lista inteira, e uma tela nova pode entrar num grupo existente sem desorganizar o menu.

## Pontos em aberto
- **"Faturamento":** o pedido usa esse nome, mas o módulo criado se chama **Faturas**. Esta versão assume que é a mesma tela e mantém o nome "Faturas". Confirmar se o nome do menu deve mudar.
- **Item "Financeiro" (fluxo de caixa):** a lista do pedido não o inclui, mas ele existe hoje no menu. Esta versão o mantém no grupo **Financeiro**, como primeiro item, para não deixar a tela sem acesso. Confirmar a posição, ou se ele deve sair do menu.
- **Ordem dos grupos:** decidida depois do pedido inicial: Visão Geral (sem grupo) primeiro, depois Operação, Financeiro e Configurações.
- **Perfis da conveniada:** Carimbar ticket e Pátio da conveniada não aparecem em nenhum grupo do pedido. Esta versão não os agrupa (RF8). Confirmar se querem um grupo próprio (por exemplo, "Conveniada").
- **Nome do item:** o pedido escreve "Dashboad", "Patio", "entrada" e "saida"; esta versão usa os nomes atuais das telas (Dashboard, Pátio, Entrada de Veículos, Saída de Veículos).
