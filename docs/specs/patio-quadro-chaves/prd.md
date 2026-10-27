# PRD: Quadro de chaves na tela do Pátio

## Problema
Hoje o gancho da chave só é escolhido no momento da entrada do veículo. Se o operador pulou essa etapa ("escolher depois"), se a empresa cadastrou o quadro depois, ou se a chave mudou de lugar, não há como registrar ou corrigir a posição pela tela do Pátio. Além disso, não dá para saber de relance quantos carros estão sem chave no quadro, o que atrapalha a organização do pátio e a procura pela chave na hora da saída.

## Objetivo
Na tela do Pátio, cada veículo mostra onde sua chave está no quadro (quando estiver) e permite colocá-la ou trocá-la de gancho a qualquer momento. A tela também mostra quantos veículos do pátio estão com a chave fora do quadro.

## Usuário-alvo
Administrador, Gerente, Caixa e Manobrista, que acompanham o pátio durante o dia, normalmente no celular, e precisam achar ou guardar a chave de um carro que já está estacionado.

## Requisitos funcionais
- RF1: Cada card de veículo no Pátio mostra a posição da chave no quadro (ex.: "A2", ou com o nome do quadro quando houver mais de um) quando o veículo tiver uma. Sem posição, o card indica de forma discreta que a chave está fora do quadro.
- RF2: Cada card tem um botão para colocar o carro no quadro de chaves. Quando o veículo já tem posição, o mesmo botão permite trocar de gancho.
- RF3: O botão abre a escolha de gancho já existente na entrada (quadro, grade de ganchos livres e ocupados, sugestão do primeiro livre), identificando o veículo escolhido (placa, modelo e cor).
- RF4: Ao confirmar, a posição aparece no card sem o usuário precisar recarregar a tela, e o gancho antigo (se houver) volta a ficar livre.
- RF5: Se o gancho escolhido for ocupado por outro veículo no meio do caminho, informar quem o ocupa e atualizar a grade para nova escolha.
- RF6: A tela do Pátio mostra um indicador com a quantidade de veículos que estão fora do quadro de chaves, considerando todos os veículos no pátio (não apenas os filtrados pela busca).
- RF7: O indicador some, ou mostra zero de forma positiva ("todas as chaves no quadro"), quando nenhum veículo está fora do quadro, e se atualiza quando uma chave é colocada no quadro ou quando um veículo sai.
- RF8: Empresa sem nenhum quadro cadastrado não vê o botão nem o indicador; quem tem permissão de gerenciar quadros vê, no lugar, um atalho para cadastrá-los.
- RF9: O botão respeita as permissões do pátio: qualquer perfil que acessa o Pátio pode colocar ou trocar a chave de gancho.

## Fora de escopo
- Retirar a chave do quadro sem escolher outro gancho (voltar o veículo ao estado "fora do quadro").
- Filtrar a lista do Pátio por "fora do quadro" ao tocar no indicador.
- Mostrar a placa do veículo em cada gancho ocupado da grade (depende do backend).
- Criação, edição ou exclusão de quadros e posições (já existe em Quadros de chaves).
- Alertas ou notificações sobre carros sem chave no quadro.

## Perguntas em aberto
- O backend não tem como retirar a chave do quadro; confirmar se isso será necessário em outra versão.
- O formato do campo `quadroChaves` no retorno do Pátio (texto pronto ou objeto com quadro, linha e coluna) ainda precisa ser confirmado com o backend para exibir "quadro · posição" corretamente.

## Critérios de aceite
- [ ] Veículo com chave no quadro mostra a posição no card do Pátio.
- [ ] Veículo sem posição mostra que está fora do quadro e oferece o botão para colocá-lo.
- [ ] Tocar no botão abre a escolha de gancho com a placa, o modelo e a cor do veículo e a sugestão pré-selecionada.
- [ ] Confirmar a escolha atualiza o card e o indicador imediatamente, sem recarregar a página.
- [ ] Trocar um veículo de gancho libera o antigo: ele aparece livre na próxima escolha.
- [ ] Conflito de gancho mostra a placa que o ocupa e permite escolher outro.
- [ ] O indicador mostra o total de veículos fora do quadro, ignorando busca e filtros da lista, e diminui ao colocar uma chave no quadro.
- [ ] Empresa sem quadros não vê botão nem indicador.
- [ ] Manobrista, Caixa, Gerente e Administrador conseguem usar o botão.
- [ ] Tudo funciona e é utilizável em celular (~390px), com alvos de toque adequados.

## Métricas de sucesso
- Redução da quantidade média de veículos "fora do quadro" no pátio ao longo do dia.
- Percentual de veículos com gancho registrado em empresas que cadastraram quadro (meta: > 90%).
- Redução de relatos de chave não localizada na saída.
