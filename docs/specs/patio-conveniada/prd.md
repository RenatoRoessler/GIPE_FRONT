# PRD: Pátio da Conveniada

## Problema
A empresa conveniada carimba o ticket do cliente, mas depois não tem onde ver o que já carimbou. Ela não sabe quais veículos dela ainda estão nos estacionamentos, há quanto tempo estão lá, nem quem da equipe carimbou cada um. Para saber isso hoje, precisa perguntar ao estacionamento ou conferir os tickets de papel.

## Objetivo
A conveniada logada tem uma tela de pátio com os veículos que ela carimbou e que ainda não saíram, em todos os estacionamentos com que tem convênio. Cada veículo mostra os dados do carimbo e o tempo de permanência até agora. A tela segue a mesma linguagem da visão do lojista (operador do estacionamento), mas só com o que importa para a conveniada.

## Usuário-alvo
Usuários de empresas conveniadas (Administrador Conveniada, Gerente Conveniada e Usuário Conveniada), no balcão da própria conveniada, principalmente no celular. O acesso é desses perfis por padrão, podendo ser alterado pela permissão por módulo.

## Requisitos funcionais
- RF1: A conveniada logada tem uma tela de pátio, acessível pelo menu conforme perfil e permissão por módulo.
- RF2: A tela lista os veículos carimbados pela conveniada que ainda não saíram do estacionamento, de todos os estacionamentos com que ela tem convênio.
- RF3: A lista vem do carimbo mais recente para o mais antigo. O veículo entra na lista quando é carimbado e sai quando o estacionamento dá baixa nele.
- RF4: Cada item mostra: estacionamento, placa, modelo, cor, categoria, data e hora da entrada, data e hora do carimbo, quem carimbou, tabela de convênio aplicada e permanência até agora (por exemplo "0h 30min" ou "1d 5h 26min").
- RF5: A conveniada filtra pela placa, digitada com ou sem hífen, em maiúsculas ou minúsculas. Com o filtro ativo, a tela mostra só os veículos dessa placa. Placa inválida é recusada com mensagem clara, sem esvaziar a lista sem explicar.
- RF6: A tela mostra um resumo da lista: quantos veículos estão no pátio da conveniada [A DEFINIR: totais por estacionamento ou por categoria].
- RF7: A tela tem estados claros: carregando, lista vazia (nenhum veículo carimbado em aberto), nenhum resultado para a placa filtrada, erro ao carregar com opção de tentar de novo e sem permissão.
- RF8: A lista pode ser atualizada pela conveniada, e a permanência mostrada não fica defasada por muito tempo [A DEFINIR: atualização automática periódica ou só manual].
- RF9: Quando a conveniada tem convênio com mais de um estacionamento, o estacionamento de cada veículo aparece de forma evidente [A DEFINIR: filtro por estacionamento].
- RF10: A tela funciona bem em celular, que é o uso principal, e também em telas maiores.

## Fora de escopo
- Carimbar tickets (já existe na tela de carimbo).
- Dar entrada, saída, baixa ou cobrança de veículos: isso é do estacionamento.
- Desfazer ou corrigir um carimbo.
- Histórico de veículos que já saíram e relatórios de carimbos.
- Valores a pagar ou faturas da conveniada.
- Ver a vista completa do operador do estacionamento (quadro de chaves, vagas, tickets digitais e outros).

## Critérios de aceite
- [ ] Um usuário de conveniada com perfil permitido vê o item de pátio no menu e abre a tela; um perfil sem permissão não vê o item e é impedido de acessar pelo endereço.
- [ ] A tela lista, do carimbo mais recente para o mais antigo, os veículos carimbados pela conveniada que ainda não saíram, de todos os estacionamentos com convênio.
- [ ] Cada item mostra estacionamento, placa, modelo, cor, categoria, entrada, carimbo, quem carimbou, tabela de convênio e permanência.
- [ ] Filtrar por placa, com ou sem hífen e em qualquer caixa, mostra só os veículos dessa placa; limpar o filtro volta à lista completa.
- [ ] Placa inválida mostra mensagem clara.
- [ ] Sem veículos em aberto, a tela mostra o estado vazio com uma explicação; sem resultado para a placa, mostra o estado de nenhum resultado.
- [ ] Falha ao carregar mostra o erro e permite tentar de novo.
- [ ] Veículo que sai do pátio deixa de aparecer na próxima atualização da lista.
- [ ] A tela é usável em 320 px de largura, sem rolagem horizontal, nos dois temas.
- [ ] Atende acessibilidade WCAG 2.2 AA: lista e estados anunciados a leitores de tela e operação por teclado.

## Métricas de sucesso (se aplicável)
Sem métricas definidas nesta entrega [A DEFINIR]. O sucesso é a conveniada saber, em poucos segundos e sem perguntar ao estacionamento, quais dos seus veículos ainda estão no pátio e há quanto tempo.

## Pendências para o design e o Tech Spec
- Confirmar o que da "visão do lojista" deve ser reaproveitado (cartões, filtros, resumo) e o que fica de fora.
- Definir o resumo (RF6), a atualização da lista (RF8) e o filtro por estacionamento (RF9).
- Definir o nome do item no menu e onde ele fica, ao lado de "Carimbar ticket".
- Confirmar com o back o que a placa inválida devolve (400) e se há limite de itens ou paginação.
- O `docs/specs/input.md` contém um token de autenticação real no exemplo de chamada; ele não foi copiado para este PRD e convém removê-lo do arquivo.
