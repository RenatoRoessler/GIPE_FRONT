# PRD: Ver movimentos do caixa

## Problema
Depois do refactor do layout do Caixa, a tela deixou de listar as movimentações (entradas do pátio, sangrias e outras saídas). Quem administra o caixa em computador/tela grande não tem mais como conferir, item a item, o que compõe o valor em caixa e a gaveta: quem lançou, quando, quanto e de que forma foi paga cada movimentação.

## Objetivo
Na versão para tela grande, a tela do Caixa oferece o botão **Ver movimentos**, que abre uma tela com a lista das movimentações do caixa, para conferência.

## Usuário-alvo
Quem acompanha e confere o caixa em tela grande (computador): Administrador, Gerente e Caixa. [A DEFINIR: o Manobrista também deve ver o botão, ou ele fica restrito aos demais perfis?]

## Requisitos funcionais
- RF1: Em tela grande, a tela do Caixa mostra o botão **Ver movimentos**. Em telas pequenas (celular) o botão não aparece.
- RF2: Ao clicar em **Ver movimentos**, abre a tela de movimentos do caixa.
- RF3: A tela de movimentos lista, da mais recente para a mais antiga, as movimentações informadas pelo sistema. Cada item mostra: data e hora, se é entrada ou saída, a origem (pátio ou sangria), o valor, a forma de pagamento, o usuário responsável e a observação, quando houver.
- RF4: Entradas e saídas ficam distinguíveis entre si de forma clara (não só por cor).
- RF5: Movimentações de entrada do pátio indicam a qual veículo/ticket do pátio se referem, quando essa informação existir. [A DEFINIR: basta o identificador do pátio ou é preciso mostrar a placa?]
- RF6: A tela de movimentos permite voltar à tela do Caixa.
- RF7: A tela trata carregamento, lista vazia ("nenhuma movimentação"), erro ao carregar (com opção de tentar de novo) e falta de permissão.
- RF8: [A DEFINIR: a lista mostra apenas as movimentações do caixa/turno atual ou também de períodos anteriores? O retorno atual da consulta traz movimentos de vários dias e turnos misturados.]

## Fora de escopo
- Criar, editar ou estornar movimentações.
- Filtros, busca, exportação e paginação (a menos que a decisão do RF8 exija).
- Lançar despesa (continua como no refactor do caixa).
- Linha do tempo, gráficos e histórico de caixas/turnos.
- Versão para celular da lista de movimentos.
- Mudanças nas permissões por perfil, além da visibilidade do botão.

## Critérios de aceite
- [ ] Em tela grande, o botão "Ver movimentos" aparece na tela do Caixa; em celular, não aparece.
- [ ] Clicar no botão abre a tela de movimentos, com a lista ordenada da mais recente para a mais antiga.
- [ ] Cada movimentação exibe data/hora, entrada ou saída, origem, valor, forma de pagamento, usuário e observação (quando houver), conforme os dados retornados.
- [ ] Entrada e saída são distinguíveis sem depender só de cor.
- [ ] Lista vazia, carregamento, erro (com tentar de novo) e sem permissão são tratados.
- [ ] É possível voltar da tela de movimentos para o Caixa.
- [ ] O comportamento do restante da tela do Caixa não muda.

## Métricas de sucesso (se aplicável)
- Quem confere o caixa em computador consegue localizar uma movimentação específica sem sair do sistema nem pedir relatório externo.
