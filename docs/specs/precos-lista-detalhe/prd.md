# PRD: Gestão de Preços em lista e detalhe

## Problema
Hoje a tela de Gestão de Preços é uma tabela paginada. Cada linha mostra só descrição, tipo, vigência, categorias e situação, e não mostra o que a tabela cobra. Para saber um valor, o gestor precisa abrir a edição de cada tabela. Clicar numa linha abre direto a **edição**, porque a visualização somente leitura ainda não existe, o que dá margem a alterar um preço sem querer. Também não há busca nem filtro: com muitas tabelas, achar uma depende de percorrer páginas. Para conferir o efeito de uma mudança, é preciso chegar à última etapa do cadastro.

## Objetivo
O gestor abre a Gestão de Preços e, na mesma tela, escolhe uma tabela numa lista com busca e filtro e vê ao lado o detalhe completo dela (tarifa, horários, informações e categorias) em modo somente leitura, com uma estimativa de cobrança. Editar continua sendo uma ação explícita.

## Usuário-alvo
Administradores e gestores que definem e conferem os preços praticados. Uso principal em computador, com consulta ocasional pelo celular.

## Requisitos funcionais
- RF1 (Estrutura): a tela mostra, lado a lado no computador, a **lista** de tabelas de preço à esquerda e o **detalhe** da tabela selecionada à direita. O botão **Novo preço** continua no cabeçalho da tela.
- RF2 (Lista): cada item mostra descrição, tipo de regra e situação (Vigente, Agendada, Encerrada, Inativa). A lista continua paginada, com o mesmo critério de ordenação de hoje.
- RF3 (Seleção): clicar num item da lista seleciona e mostra o detalhe, **sem abrir a edição**. O item selecionado fica destacado. Ao abrir a tela, já há uma tabela selecionada: a primeira vigente da página, ou, se não houver, a primeira da lista.
- RF4 (Busca): o usuário busca por parte da descrição; a lista passa a mostrar só as tabelas que combinam, com a paginação ajustada ao resultado. Sem resultado, aparece uma mensagem clara e a opção de limpar a busca.
- RF5 (Filtros): o usuário filtra por **situação** (Todas, Vigente, Agendada, Encerrada, Inativa). Busca e filtro funcionam juntos, e a lista mostra quantas tabelas há no filtro atual.
- RF6 (Detalhe): o detalhe mostra o nome, o tipo de regra, a situação e a vigência, e organiza o conteúdo em três abas:
  - **Tarifa**: os degraus de tempo e valor, a diária (período, valor e adicional), o percentual da conveniada quando houver, as tolerâncias (entrada e alteração de faixa) e as categorias atendidas.
  - **Horários**: a semana inteira, um dia por linha, com o intervalo de cobrança, indicando "Sem cobrança" nos dias sem regra e destacando regras inativas e com período específico.
  - **Informações**: os demais dados cadastrais da tabela (tipo de regra, vigência, situação, valores da diária; empresa conveniada oculta enquanto não usada).
- RF7 (Editar): o detalhe tem o botão **Editar**, que abre o mesmo fluxo de edição em etapas já existente, preenchido com os dados atuais. Ao salvar com sucesso, o usuário volta à tela, a tabela editada aparece selecionada e atualizada, e há confirmação.
- RF8 (Estimativa de cobrança): o detalhe tem um bloco **Simular cobrança**, em que o usuário escolhe a categoria do veículo e a permanência (em minutos ou por controle deslizante) e vê a estimativa do valor, com a explicação de como chegou nele (por exemplo "Degrau até 3 h", "Dentro da tolerância de entrada", "Diária mais 2 h de adicional", "com desconto de 30% da conveniada").
  - A estimativa segue os degraus, as tolerâncias, a diária e o adicional da tabela selecionada.
  - Se a tabela não atende a categoria escolhida, a tela diz isso em vez de mostrar um valor.
  - O bloco traz o aviso permanente "Estimativa. O valor real é calculado no momento da saída."
- RF9 (Estados): lista e detalhe têm carregamento (esqueleto), erro com **Tentar novamente** e vazio ("Nenhuma tabela de preço cadastrada." com **Novo preço**). Se a tabela selecionada deixar de existir, o detalhe avisa e volta a uma seleção válida.
- RF10 (Celular): em telas pequenas a lista ocupa a tela toda; ao escolher um item abre o detalhe em tela cheia com um botão **Voltar** para a lista, que mantém busca, filtro e página.
- RF11 (Link): a tabela selecionada, a busca e o filtro ficam refletidos no endereço da tela, para recarregar a página ou compartilhar o link e voltar ao mesmo ponto.
- RF12 (Valores fora do padrão): tipo de regra desconhecido aparece como "—"; horário sem hora de início e fim aparece como "Dia inteiro" (premissa, ver Pontos em aberto).

## Fora de escopo
- Mudar o fluxo de cadastro e edição em etapas, ou editar dentro do detalhe.
- Excluir, duplicar ou ativar e desativar tabelas pela lista.
- Seleção e vínculo de empresa conveniada.
- Linha do tempo de vigências e avisos de sobreposição entre tabelas (proposta separada, depende de regra de prioridade do negócio).
- Cálculo oficial de cobrança: a estimativa não substitui o valor calculado pelo sistema na saída.
- Ordenação interativa por coluna e filtro por tipo de regra ou categoria nesta versão.
- Histórico de alterações das tabelas.

## Critérios de aceite
- [ ] Dado um gestor na Gestão de Preços, quando abre a tela no computador, então vê a lista e o detalhe lado a lado, com uma tabela já selecionada.
- [ ] Clicar num item da lista mostra o detalhe dele sem abrir a edição, e o item fica destacado.
- [ ] A busca por parte da descrição reduz a lista; sem resultado aparece a mensagem com a opção de limpar.
- [ ] O filtro de situação e a busca funcionam juntos, e a contagem reflete o filtro atual.
- [ ] A lista continua paginada e a troca de página mantém busca e filtro.
- [ ] O detalhe mostra as abas Tarifa, Horários e Informações com todos os dados da tabela em modo somente leitura.
- [ ] Na aba Tarifa aparecem os degraus em ordem de tempo, a diária e o adicional, o percentual da conveniada quando existir, as tolerâncias e as categorias.
- [ ] Na aba Horários os sete dias aparecem, com "Sem cobrança" nos dias sem regra.
- [ ] **Editar** abre o fluxo de edição preenchido, e ao salvar o usuário volta à tela com a tabela atualizada e uma confirmação.
- [ ] O simulador mostra a estimativa com a explicação do degrau, trata a tolerância de entrada (valor zero), a diária e o desconto da conveniada, e avisa quando a categoria não é atendida.
- [ ] O aviso "Estimativa. O valor real é calculado no momento da saída." está sempre visível junto do resultado.
- [ ] Carregando, erro e vazio aparecem tanto na lista quanto no detalhe, e **Tentar novamente** refaz a busca.
- [ ] No celular, a lista e o detalhe se alternam em telas inteiras e **Voltar** devolve a lista como estava.
- [ ] Recarregar a página ou abrir o link compartilhado leva à mesma tabela, busca e filtro.
- [ ] A tela é utilizável por teclado e leitor de tela (WCAG 2.2 AA): a lista anuncia o item selecionado, as abas têm foco e estado anunciados e a estimativa é anunciada ao mudar.

## Métricas de sucesso
- Menos aberturas de edição só para consultar um valor.
- Menos alterações de preço feitas por engano (clique que abria a edição).
- Tempo para achar uma tabela e conferir seus valores.
- Uso da estimativa de cobrança e queda de dúvidas sobre "quanto isso cobra?".

## Pontos em aberto
- **Regras da estimativa**: confirmar com o back-end/negócio como tratar o que passa do último degrau (diária e adicional), a tolerância de alteração de faixa e o efeito dos horários da semana. Sem isso a estimativa pode divergir do valor real; por isso fica rotulada como estimativa.
- **Dia inteiro**: assumido que um dia com horário nulo significa cobrança o dia inteiro; confirmar (ponto já aberto na especificação de Gestão de Preços).
- **Busca e filtro no servidor**: confirmar se a API de listagem aceita busca por descrição e filtro por situação; caso contrário, a busca e o filtro valem apenas sobre a página carregada.
- **Seleção inicial**: assumida "primeira vigente da página, senão a primeira da lista"; confirmar se o negócio prefere lembrar a última tabela vista.
- **Perfis**: confirmar se todos os perfis que acessam preços podem ver o detalhe e se a edição segue restrita como hoje.
- **Substituição**: esta tela substitui a listagem em tabela atual e passa a cumprir a visualização somente leitura (RF3 de `gerenciamento-precos`); confirmar que a tabela pode ser removida.
