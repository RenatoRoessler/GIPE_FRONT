# PRD: Menu Inferior no Celular

## Problema
No celular, a navegação do sistema fica num botão "Menu" no topo da tela, que abre um painel. Para quem trabalha no portão com uma mão só, o topo é a parte mais difícil de alcançar com o polegar. As duas telas mais usadas na operação, Entrada e Saída de veículos, ficam escondidas atrás desse painel: para ir de uma à outra são sempre dois toques e um movimento da mão até o alto da tela.

## Objetivo
No celular, a navegação principal fica na parte de baixo da tela, ao alcance do polegar, com acesso direto a Início, Entrada e Saída, e um botão Menu que abre o restante do sistema.

## Usuário-alvo
Operadores (caixa, manobrista) que usam o sistema no celular no balcão ou no portão do estacionamento, em pé, geralmente com uma mão ocupada. Administradores e gerentes que consultam o sistema pelo celular também se beneficiam, mas não são o foco.

## Requisitos funcionais
- RF1: Em telas de celular e tablet (abaixo do ponto em que o pórtico de placas do computador aparece), exibir uma barra de navegação fixa na parte inferior da tela, sempre visível enquanto o usuário rola a página.
- RF2: A barra tem quatro itens, nesta ordem: **Início**, **Entrada**, **Saída** e **Menu**. Cada item mostra ícone e nome.
- RF3: Início, Entrada e Saída levam direto às suas telas. O item da tela em que o usuário está fica destacado, além de ser identificado por texto para leitores de tela.
- RF4: Tocar em **Menu** abre um painel, que sobe da parte de baixo, com todas as telas do sistema (as mesmas do menu atual: Início, Gestão de Preços, Gestão de Usuários, Mensalistas, Entrada de Veículos, Saída de Veículos, Pátio, Caixa, Relatórios e Minha Empresa). A tela atual aparece marcada no painel.
- RF5: O painel fecha ao escolher uma tela, ao tocar fora dele, ao tocar em fechar ou ao pressionar Esc.
- RF6: Quando a tela atual não é Início, Entrada nem Saída (por exemplo, Caixa), o item **Menu** da barra fica destacado, indicando que o usuário está numa tela do menu.
- RF7: O botão "Menu" que hoje fica no topo no celular deixa de existir. O cabeçalho mantém logotipo, boas-vindas, tema e menu do usuário.
- RF8: O conteúdo das telas nunca fica escondido atrás da barra: o fim da página pode ser rolado até aparecer por inteiro, incluindo o link da versão no rodapé.
- RF9: O botão flutuante "Novo mensalista" da agenda de mensalistas continua visível e alcançável acima da barra.
- RF10: Em telas largas (computador), nada muda: o pórtico de placas continua como está e a barra inferior não aparece.

## Fora de escopo
- Mudar o menu do computador (pórtico de placas).
- Um quinto item fixo na barra (por exemplo, Pátio). A barra tem os quatro itens pedidos; o Pátio continua acessível pelo Menu.
- Esconder itens do menu conforme a permissão do perfil (o menu atual já mostra todos; isso é tratado separadamente).
- Gestos (arrastar para fechar o painel), indicadores de notificação ou contadores nos itens.
- Personalizar quais itens aparecem na barra.

## Critérios de aceite
- [ ] No celular, a barra com Início, Entrada, Saída e Menu aparece fixa na parte de baixo em todas as telas da área logada.
- [ ] O item da tela atual fica destacado, e o leitor de tela o anuncia como página atual.
- [ ] Tocar em Entrada ou Saída abre a tela correspondente com um toque.
- [ ] Tocar em Menu abre o painel com todas as telas e a atual marcada; escolher uma tela, tocar fora, fechar ou Esc fecham o painel.
- [ ] Em telas fora de Início, Entrada e Saída, o item Menu fica destacado.
- [ ] O botão "Menu" do topo não existe mais no celular.
- [ ] Nenhum conteúdo, nem o link de versão, fica coberto pela barra; o botão "Novo mensalista" aparece acima dela.
- [ ] Em tela larga, o pórtico continua igual e a barra não aparece.
- [ ] Todos os alvos de toque têm pelo menos 44 px e a barra respeita a área segura de aparelhos com barra de gestos.
- [ ] Funciona nos temas claro e escuro, e sem animação quando o usuário pede movimento reduzido.

## Métricas de sucesso (se aplicável)
Sem métricas numéricas. Sucesso = operador troca de Entrada para Saída com um toque, sem usar o topo da tela.

## Pontos em aberto
- O pedido fala em "5 opções principais", mas lista quatro (Home, Entrada, Saída e Menu). Esta versão usa os quatro. Se houver um quinto item, entra como evolução, sem refazer a barra.
