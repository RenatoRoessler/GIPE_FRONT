# PRD: Gestão de Preços

## Problema
O estacionamento cobra valores diferentes conforme tipo de veículo, convênio com empresas parceiras, dia/horário e tempo de permanência. Hoje não existe forma de cadastrar empresas conveniadas nem as regras de preço que o sistema de cobrança deve usar.

## Objetivo
Um administrador consegue cadastrar empresas conveniadas e criar/editar tabelas de preço completas (regras gerais, categorias de veículo, vigência por dia/horário e faixas de tolerância/valor adicional), além de visualizar todas as tabelas de preço já cadastradas.

## Usuário-alvo
Administradores e gerentes responsáveis por definir a política de cobrança do estacionamento.

## Requisitos funcionais

### Menu Preços
- RF1: Área central de onde se cadastra e atualiza preços, empresas conveniadas e se consulta a listagem de preços.

### Cadastro de empresa conveniada
- RF2: Campo descrição.
- RF3: Campo CNPJ.
- RF4: Campo endereço.
- RF5: Campo telefone.

### Cadastro de preço (multi-step)
**Step 1 — Dados gerais**
- RF6: Campo descrição (texto).
- RF7: Campo empresa conveniada, como select alimentado pelo cadastro de empresas conveniadas.
- RF8: Campo data início de vigência.
- RF9: Campo data fim de vigência (pode ficar em branco/nulo, indicando vigência indeterminada).
- RF10: Campo tolerância de entrada, em minutos (inteiro).
- RF11: Campo tolerância de alteração de faixa, em minutos (inteiro).
- RF12: Campo período da diária, em minutos (inteiro).
- RF13: Campo valor da diária (float).
- RF14: Campo valor adicional da diária (float).
- RF15: Campo tipo do preço, select com as opções: 1 = Padrão, 2 = Convênio, 3 = Promocional, 4 = Evento.

**Step 2 — Categorias**
- RF16: Tabela editável de categorias aplicáveis a este preço, com no mínimo 1 item.
- RF17: Cada item tem categoria, enum: 1 = Carro, 2 = Moto, 3 = Caminhonete, 4 = SUV, 99 = Todas.

**Step 3 — Vigência por dia/horário**
- RF18: Tabela editável de regras de vigência, com no mínimo 1 item.
- RF19: Cada item tem: dia da semana (enum), hora início, hora fim, data início, data fim, e um indicador ativo.

**Step 4 — Faixas de valor por tempo**
- RF20: Tabela editável de faixas, com no mínimo 1 item.
- RF21: Cada item tem: minutos limite (inteiro, ex: 30 minutos), valor (float), percentual conveniada de 0 a 100 (não obrigatório).

### Listagem de preços
- RF22: Mostra uma tabela com os preços cadastrados.
- RF23: Cada linha permite clicar em editar para abrir o preço no fluxo de cadastro/edição.

## Fora de escopo
- Cálculo do valor cobrado na saída do veículo (tratado no PRD de Movimentação de Veículos, que consome essas regras).
- Histórico/auditoria de alterações de preço.
- Exclusão de preços já vigentes (apenas encerrar vigência via data fim).

## Critérios de aceite
- [ ] É possível cadastrar uma empresa conveniada com descrição, CNPJ, endereço e telefone.
- [ ] É possível cadastrar um preço completo passando pelos 4 steps, cada um exigindo o mínimo de itens especificado.
- [ ] O select de empresa conveniada no step 1 lista as empresas cadastradas.
- [ ] Data fim de vigência do preço pode ser deixada em branco.
- [ ] Nos steps 2, 3 e 4 não é possível avançar/salvar com menos de 1 item na tabela.
- [ ] A listagem de preços mostra todos os preços cadastrados e permite abrir cada um para edição.
- [ ] Todas as telas funcionam de forma responsiva em desktop e mobile.

## Métricas de sucesso
- Tempo médio para cadastrar uma tabela de preço completa.
- Zero preços salvos sem os itens mínimos obrigatórios em cada step.
