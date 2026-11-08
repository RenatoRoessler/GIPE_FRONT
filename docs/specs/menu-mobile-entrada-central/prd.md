# PRD: Menu Mobile com Entrada em Destaque no Centro

## Problema
A barra de navegação inferior do celular hoje mostra Pátio, Entrada, Saída, Caixa e Mais, todos com o mesmo peso visual. A Entrada de veículos é a ação mais frequente da operação (cada carro que chega), mas fica espremida entre os outros itens, sem destaque e fora do centro, onde o polegar chega mais fácil. Não há diferença visual entre "ir para uma tela" e "registrar uma nova entrada".

## Objetivo
No celular, a barra inferior tem cinco posições fixas, na ordem **Pátio | Caixa | Entrada | Saída | Mais**, com a Entrada no centro exato da barra e em destaque, como botão de ação principal.

## Usuário-alvo
Operadores (caixa, manobrista) que usam o sistema no celular no portão ou no balcão, em pé e com uma mão ocupada. Administradores e gerentes que consultam pelo celular se beneficiam, mas não são o foco.

## Requisitos funcionais
- RF1: Em telas de celular, a barra inferior mostra cinco itens, nesta ordem, da esquerda para a direita: **Pátio**, **Caixa**, **Entrada**, **Saída** e **Mais**. Cada item mostra ícone e nome.
- RF2: A **Entrada** fica no centro horizontal da barra, com o mesmo espaço à esquerda e à direita (dois itens de cada lado).
- RF3: A **Entrada** é exibida como botão de destaque: ícone dentro de um círculo amarelo com um sinal de "+", que se sobressai acima da borda superior da barra, e nome em amarelo. Os demais itens têm aparência de item comum.
- RF4: A Entrada mantém o comportamento atual: tocar abre o fluxo de registrar entrada de veículo.
- RF5: Pátio, Caixa e Saída mantêm o comportamento atual. O item da tela em que o usuário está aparece em destaque discreto (ícone e nome mais fortes, com fundo sutil, e não amarelo), além de ser identificado como página atual para leitores de tela.
- RF6: **Mais** abre o painel com as demais telas do sistema, como hoje. O item **Mais** fica destacado quando a tela atual é uma das que só estão no painel.
- RF7: A ordem e as cinco posições são as mesmas para qualquer largura de celular. Nas telas maiores em que a barra hoje mostra mais itens, a barra continua mostrando apenas esses cinco, e o restante vai no **Mais**.
- RF8: A barra funciona nos temas escuro e claro. No escuro, fundo azul-marinho com o botão central amarelo. No claro, fundo bege claro, com o botão central amarelo contornado em azul-marinho.
- RF9: Itens de perfis sem permissão para Pátio, Caixa, Entrada ou Saída não aparecem. A Entrada continua no centro: quando algum dos cinco não estiver disponível, a barra reaproveita o espaço sem deslocar a Entrada do centro.
- RF10: Em telas largas (computador), nada muda.

## Fora de escopo
- Mudar o menu do computador (pórtico de placas).
- Mudar o conteúdo do painel "Mais" ou o que cada tela faz.
- Personalizar quais itens aparecem na barra.
- Animações novas além das já existentes, gestos ou indicadores de notificação.

## Critérios de aceite
- [ ] No celular, a barra mostra Pátio, Caixa, Entrada, Saída e Mais, nessa ordem.
- [ ] A Entrada está centralizada na barra, com o mesmo número de itens e o mesmo espaço dos dois lados.
- [ ] A Entrada aparece como botão amarelo circular com "+", acima da borda da barra, com o nome em amarelo.
- [ ] Tocar na Entrada abre o fluxo de entrada de veículo, como antes.
- [ ] A tela atual fica destacada de forma discreta e é anunciada como página atual por leitores de tela; o Mais fica destacado quando a tela atual está no painel.
- [ ] A barra tem a mesma ordem em celulares estreitos e largos (até o ponto em que o pórtico do computador aparece).
- [ ] Nos temas escuro e claro, o visual segue o descrito em RF8, com contraste legível.
- [ ] Todos os alvos de toque têm pelo menos 44 px, o botão em destaque não fica cortado e a barra respeita a área segura de aparelhos com barra de gestos.
- [ ] Nenhum conteúdo fica coberto pela barra nem pelo botão que se sobressai.
- [ ] Em tela larga, o pórtico e a ausência da barra continuam iguais.

## Métricas de sucesso (se aplicável)
Sem métricas numéricas. Sucesso = operador identifica e alcança o registro de entrada de imediato, com o polegar no centro da barra.

## Pontos em aberto
- A imagem de referência é uma sugestão de layout. Cores exatas, tamanho do botão e quanto ele se sobressai são decididos na etapa de design, dentro do design system.
- Perfis sem acesso a algum dos cinco itens (RF9): a regra proposta é manter a Entrada no centro. Confirmar se esse é o comportamento desejado ou se esses perfis devem ver a barra atual.
