# PRD: Módulo de Serviços

## Problema
Além de cobrar pelo tempo de permanência, o estacionamento/lava-rápido presta serviços adicionais ao veículo (lavagem, polimento, etc.). Hoje o GIPE não permite cadastrar esses serviços, vinculá-los a um veículo que está no pátio nem acompanhar a execução. O controle é feito fora do sistema, sem preço padronizado por categoria de veículo, sem fila para quem executa o serviço e sem rastro de cancelamentos.

## Objetivo
A empresa cadastra seu catálogo de serviços com preço por categoria de veículo, acrescenta serviços a veículos que estão no pátio e acompanha cada serviço do pedido até ficar pronto (ou ser cancelado). Quem executa (lavador) tem uma fila própria, organizada por status, para trabalhar.

## Usuário-alvo
- **Administrador / Gerente**: mantém o catálogo de serviços (cadastrar, editar, inativar, definir preços).
- **Caixa / Manobrista**: acrescentam serviços a um veículo no pátio, atendendo o pedido do cliente, e cancelam quando o cliente desiste.
- **Lavador**: consulta a fila de serviços dos veículos no pátio e atualiza o status conforme executa.

O acesso a cada ação segue a permissão por perfil/módulo já existente no sistema (a API devolve 403 para perfil sem permissão).

## Requisitos funcionais

### Catálogo de serviços
- RF1: Listar os serviços da empresa, com filtro por ativo/inativo.
- RF2: Cadastrar serviço com nome, descrição, duração estimada (minutos), tempo permitido (minutos) e tabela de preços por categoria de veículo (Moto, Carro pequeno, Carro médio, Caminhonete, Caminhão, Carro grande; ou um valor único para "Todas").
- RF3: Ver o detalhe de um serviço.
- RF4: Editar um serviço, incluindo seus preços.
- RF5: Inativar um serviço (não é excluído de fato; deixa de poder ser acrescentado a novos veículos, mas continua nos registros antigos).

### Serviços no veículo do pátio
- RF6: Ver os serviços de um veículo no pátio, com opção de incluir os cancelados.
- RF7: Acrescentar um ou mais serviços a um veículo no pátio, escolhidos do catálogo ativo.
- RF8: Alterar o status de um serviço do veículo entre Aguardando, Em execução e Pronto.
- RF9: Cancelar um serviço do veículo (cliente desistiu), informando o motivo.

### Fila do lavador
- RF10: Exibir a fila de serviços não cancelados dos veículos no pátio, agrupada por status (Aguardando, Em execução, Pronto) e ordenada por chegada, mostrando placa, modelo, cor, categoria, prisma e horário de entrada do veículo.
- RF11: Filtrar a fila por um único status.
- RF12: Atualizar o status de um serviço diretamente a partir da fila.

### Transversais
- RF13: Exibir mensagens claras para erro de validação, sessão expirada e falta de permissão.
- RF14: O módulo aparece no menu do sistema como "Serviços", respeitando a permissão do perfil.

## Fora de escopo
- Cobrança/fechamento financeiro dos serviços na saída do veículo, caixa e nota fiscal (a definir em PRD próprio se a API passar a suportar).
- Relatórios e métricas de serviços (produtividade por lavador, faturamento por serviço).
- Agendamento de serviços e notificação ao cliente.
- Alteração de permissões por perfil (já coberta pelo módulo de permissões).
- Exclusão definitiva de serviços.

## Critérios de aceite
- [ ] O menu "Serviços" aparece apenas para perfis com permissão e leva ao módulo.
- [ ] É possível cadastrar um serviço com preços por categoria e ele aparece na listagem.
- [ ] A listagem filtra entre ativos e inativos.
- [ ] Editar um serviço persiste nome, descrição, tempos e preços.
- [ ] Inativar um serviço o remove das opções ao acrescentar a um veículo, sem apagar o histórico.
- [ ] Em um veículo no pátio, é possível acrescentar vários serviços de uma vez e vê-los listados.
- [ ] O status de um serviço muda entre Aguardando, Em execução e Pronto e a mudança reflete na fila.
- [ ] Cancelar um serviço exige motivo; o serviço sai da fila e só aparece na lista do veículo ao incluir cancelados.
- [ ] A fila mostra placa, modelo, cor, categoria, prisma e entrada, agrupada por status, e o filtro por status funciona.
- [ ] Erros 400, 401 e 403 da API geram feedback compreensível ao usuário.
- [ ] A tela é utilizável em celular (o lavador usa no pátio).

## Métricas de sucesso
- Todos os serviços prestados passam a ser registrados no sistema (sem controle paralelo).
- Lavadores operam pela fila sem precisar consultar o caixa para saber o que fazer.
- Proporção de serviços cancelados com motivo informado = 100%.
