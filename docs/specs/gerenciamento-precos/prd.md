# PRD: Gerenciamento de Preços

## Problema
As tabelas de preço de rotatividade (valores cobrados por tempo de permanência, diária, tolerâncias e regras de horário) existem no sistema, mas não há uma tela para consultá-las nem para criar e ajustar novas tabelas. Hoje qualquer mudança de preço depende de intervenção fora da interface, o que atrasa a operação e aumenta o risco de erro.

## Objetivo
O operador consegue, em uma única tela, listar todas as tabelas de preço, visualizar o detalhe de cada uma, cadastrar novas tabelas por meio de um passo a passo guiado e editar tabelas existentes.

## Usuário-alvo
Administradores e gestores financeiros/operacionais do GIPE que definem e mantêm os preços praticados nos estacionamentos.

## Requisitos funcionais
- RF1: Ao abrir a tela, exibir uma tabela com os registros de preço cadastrados, com paginação.
- RF2: A listagem deve mostrar, no mínimo: descrição, tipo de regra, início e fim de vigência e situação (ativo/inativo).
- RF3: Permitir visualizar o detalhe completo de uma tabela de preço (informações, horários, faixas de valores e categorias) em modo somente leitura.
- RF4: Permitir cadastrar uma nova tabela de preço por um fluxo em etapas (ver RF5 a RF8).
- RF5: **Etapa 1 – Informações**: descrição, tipo de regra (Padrão, Convênio, Promocional, Evento), início e fim de vigência, tolerância de entrada (minutos), tolerância de alteração de faixa (minutos), período da diária, valor da diária, valor adicional da diária e situação (ativo).
- RF6: **Etapa 2 – Horários**: cadastrar uma ou mais regras de horário, cada uma com dia da semana, hora de início, hora de fim, data de início, data de fim e situação (ativo).
- RF7: **Etapa 3 – Faixas de valores**: cadastrar uma ou mais faixas, cada uma com limite em minutos, valor e percentual da conveniada (opcional).
- RF8: **Etapa 4 – Categorias**: selecionar uma ou mais categorias de veículo (Moto, Carro pequeno, Carro médio, SUV/Pick-up, Caminhonete, Caminhão ou Todas).
- RF9: O campo de empresa conveniada deve aparecer na Etapa 1 **desabilitado** (reservado para uso futuro).
- RF10: Permitir editar uma tabela de preço existente, reaproveitando o mesmo fluxo em etapas, já preenchido com os dados atuais.
- RF11: Validar os dados de cada etapa antes de avançar, indicando claramente os campos com erro.
- RF12: Informar ao usuário o resultado do salvamento (sucesso ou falha) e atualizar a listagem após cadastrar ou editar.
- RF13: Exibir estados de carregamento, lista vazia e erro ao buscar dados.

## Fora de escopo
- Seleção/vínculo de empresa conveniada (campo apenas visível e desabilitado).
- Exclusão de tabelas de preço (não solicitada).
- Filtros e busca na listagem (não solicitados nesta versão).
- Simulação ou cálculo de cobrança com a tabela criada.

## Critérios de aceite
- [ ] Ao abrir a tela, a listagem carrega os registros da primeira página e permite navegar entre páginas.
- [ ] É possível abrir a visualização de qualquer registro e ver todas as suas informações, horários, faixas e categorias sem poder alterá-los.
- [ ] O cadastro percorre as etapas (Informações, Horários, Faixas de valores, Categorias) e só permite avançar com dados válidos.
- [ ] O campo de empresa conveniada aparece desabilitado e não é enviado preenchido.
- [ ] Ao concluir o cadastro com sucesso, o novo registro aparece na listagem e o usuário recebe confirmação.
- [ ] A edição abre com os dados atuais preenchidos e, ao salvar, a listagem reflete as alterações.
- [ ] Falhas de rede/API exibem mensagem compreensível sem perder os dados digitados no fluxo.
- [ ] A tela é utilizável em desktop e em telas menores.

## Métricas de sucesso
- Tabelas de preço passam a ser criadas e alteradas pela interface, sem intervenção técnica.
- Redução de erros de cadastro de preços reportados pela operação.

## Pontos em aberto (a confirmar antes do Tech Spec)
1. O pedido cita "3 steps", mas descreve 4 (Informações, Horários, Faixas, Categorias). Este PRD assume **4 etapas**.
2. Não há endpoint de edição informado no material de entrada (apenas listagem e criação). É preciso confirmar como a edição será persistida (ex.: atualização do registro inteiro).
3. A listagem retorna `tipoRegra: 0`, valor que não existe no enum (Padrão = 1). Definir como exibir esse caso.
4. Na listagem, os horários vêm com `horaInicio`/`horaFim` nulos para alguns dias. Definir se isso significa "dia inteiro" e como exibir/editar.
5. Regras de negócio de validação: faixas com limites crescentes e sem repetição, `fimVigencia` posterior a `inicioVigencia`, quantidade mínima de horários/faixas/categorias.
