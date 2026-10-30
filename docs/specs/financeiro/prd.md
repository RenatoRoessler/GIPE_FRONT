# PRD: Módulo Financeiro

## Problema
Hoje o GIPE registra o que entra pelo pátio (estacionamento rotativo) e pelas mensalidades, mas não há onde registrar as outras receitas e as despesas do estacionamento (aluguel, salários, manutenção, contas). Quem cuida do dinheiro da empresa precisa de planilhas por fora para saber quanto entrou, quanto saiu e qual o saldo de um período, juntando à mão o que o sistema já sabe com o que ele não sabe.

## Objetivo
O GIPE ganha um módulo **Financeiro** onde se cadastram categorias de receita e despesa, se lançam receitas e despesas já pagas (inclusive pela gaveta do caixa) e se consulta o fluxo de caixa de um período, que junta automaticamente estacionamento rotativo, mensalidades e lançamentos.

## Usuário-alvo
Administrador, Gerente e Financeiro (perfis padrão do módulo; a permissão por módulo, quando configurada, prevalece). Uso típico: o responsável financeiro, em computador, lançando contas pagas e acompanhando o resultado do dia, do mês ou do ano.

## Requisitos funcionais

### Acesso
- RF1: O módulo Financeiro aparece na navegação somente para quem tem permissão (padrão: Administrador, Gerente e Financeiro). Sem permissão, a entrada não aparece e o acesso direto às telas é negado, como nas demais áreas.
- RF2: O módulo entra na tela de permissões por módulo, para a empresa poder mudar quais perfis o acessam.
- RF2a: Todas as telas do módulo são responsivas: funcionam por completo em computador e em celular (consultar o fluxo, lançar, editar, cancelar e cadastrar categorias).

### Fluxo de caixa
- RF3: A tela de fluxo de caixa mostra, para um período escolhido (data inicial e final obrigatórias, os dois dias incluídos, até 366 dias), o total de entradas, o total de saídas e o saldo do período.
- RF4: O fluxo junta três origens:
  - **Estacionamento rotativo**: pagamentos na saída do pátio, menos estornos;
  - **Mensalidades**: cobranças de mensalista pagas, pelo valor pago;
  - **Lançamentos**: lançamentos do financeiro não cancelados, por categoria.
- RF5: Sangria e suprimento não entram no fluxo (o dinheiro só muda de lugar), nem os movimentos de caixa gerados por lançamentos do financeiro (já contados como lançamento). A tela deixa isso claro para o usuário não estranhar diferença com o caixa.
- RF6: O fluxo pode ser agrupado por **dia** (padrão) ou por **mês**. Cada dia/mês do período aparece, inclusive os sem movimento, com entradas, saídas, saldo do dia/mês e saldo acumulado desde o início do período. No agrupamento por mês, o mês é identificado pelo seu primeiro dia.
- RF7: A tela mostra o total do período por origem e por categoria (com a categoria pai, quando houver), separando entradas e saídas.
- RF8: Ao abrir a tela, o período inicial é o mês atual (do primeiro ao último dia do mês), agrupado por dia.

### Lançamentos
- RF9: A tela de lançamentos lista os lançamentos do mais recente para o mais antigo (pela data do pagamento), paginada (20 por página por padrão).
- RF10: A lista pode ser filtrada por período (data inicial e final opcionais, pela data do pagamento, os dois dias incluídos), por tipo (entrada ou saída) e por categoria — escolhendo uma categoria pai, vêm também as subcategorias. Por padrão os cancelados não aparecem; há opção para incluí-los, e eles ficam identificados como cancelados.
- RF11: Novo lançamento: categoria (ativa), descrição, valor, data do pagamento (até hoje; vazia = hoje), forma de pagamento, favorecido, documento e observação. O tipo (entrada ou saída) vem da categoria escolhida. Nesta versão só se lança o que já foi pago.
- RF12: **Pelo caixa**: ao lançar, o usuário pode indicar que o dinheiro entrou ou saiu da gaveta do caixa. Só é permitido em dinheiro, com data de hoje e com turno de caixa aberto; o lançamento aparece no turno e entra na conferência dele. Uma saída pelo caixa não pode passar do dinheiro esperado na gaveta (fundo do turno mais o dinheiro do turno). Quando as condições não são atendidas, a tela explica o motivo.
- RF13: Ver o detalhe de um lançamento, incluindo, se cancelado, quem cancelou.
- RF14: Editar um lançamento não cancelado (mesmos campos do cadastro; "pelo caixa" não muda). Lançamento feito pelo caixa só permite mudar categoria (do mesmo tipo), descrição, favorecido, documento e observação; para mudar valor, data ou forma de pagamento, a tela orienta a cancelar e lançar de novo.
- RF15: Cancelar um lançamento, com confirmação. O lançamento não é apagado: fica marcado como cancelado, com quem cancelou, e sai do fluxo de caixa. Lançamento feito pelo caixa só pode ser cancelado enquanto aquele caixa estiver aberto; o cancelamento devolve o dinheiro à gaveta (numa saída) ou o retira (numa entrada). Lançamento cancelado não pode ser editado.

### Categorias
- RF16: A tela de categorias lista as categorias por tipo e nome, cada categoria pai seguida das suas subcategorias, com filtro por tipo (entrada/saída) e por situação (ativas, inativas ou todas).
- RF17: Nova categoria: nome, tipo (entrada = receita, saída = despesa) e, opcionalmente, a categoria pai. O nome é único entre as categorias ativas da empresa. A pai precisa estar ativa, ser do mesmo tipo e não ser subcategoria (um nível só).
- RF18: Editar categoria: nome, categoria pai e situação (ativa/inativa). O tipo não muda depois de criado. Categoria que agrupa outras não pode virar subcategoria. Categoria inativa não recebe lançamentos novos, mas os antigos continuam valendo.
- RF19: As mensagens de regra violada vindas do sistema (nome repetido, pai inválido, saída maior que a gaveta, caixa fechado etc.) aparecem para o usuário em linguagem clara.

## Fora de escopo
- Contas a pagar/receber futuras (agendamento, vencimentos, parcelas, recorrência): nesta versão só se lança o que já foi pago.
- Excluir lançamentos ou categorias (lançamento só é cancelado; categoria só é inativada).
- Conciliação bancária, contas bancárias e saldo inicial/saldo em conta.
- Exportação (PDF, planilha) e impressão do fluxo ou dos lançamentos.
- Detalhar no fluxo cada pagamento do pátio ou de mensalista (o fluxo mostra só os totais dessas origens).
- Mudanças no caixa além de os lançamentos pelo caixa aparecerem no turno, que já é tratado pelo sistema.

## Critérios de aceite
- [ ] Administrador, Gerente e Financeiro veem e acessam o módulo; Caixa, Manobrista e perfis de conveniada não, e o acesso direto é negado.
- [ ] Ao abrir, o fluxo de caixa mostra o mês atual agrupado por dia.
- [ ] Todas as telas do módulo funcionam em celular e em computador, sem perder nenhuma ação.
- [ ] O fluxo de caixa exige data inicial e final, não aceita período maior que 366 dias e mostra totais de entradas, saídas e saldo.
- [ ] O fluxo por dia lista todos os dias do período (inclusive sem movimento) com saldo acumulado correto; por mês, lista todos os meses identificados pelo primeiro dia.
- [ ] Os totais por origem/categoria somam o total de entradas e de saídas do período.
- [ ] Um lançamento novo aparece na lista e no fluxo do dia do pagamento; ao ser cancelado, sai do fluxo e só aparece na lista com "incluir cancelados".
- [ ] Os filtros de lançamentos (período, tipo, categoria com subcategorias, cancelados) e a paginação funcionam.
- [ ] Lançamento pelo caixa só é aceito em dinheiro, hoje e com turno aberto; aparece no turno; saída acima do dinheiro esperado na gaveta é recusada com mensagem clara.
- [ ] Lançamento feito pelo caixa só permite editar categoria, descrição, favorecido, documento e observação, e só pode ser cancelado com aquele caixa aberto.
- [ ] Categorias são criadas, editadas e inativadas respeitando nome único, um nível de hierarquia e tipo fixo; categoria inativa não aparece para novos lançamentos.
- [ ] Sangria e suprimento não aparecem no fluxo.

## Métricas de sucesso (se aplicável)
- O responsável financeiro consegue saber o saldo de qualquer dia, mês ou ano sem planilha externa.
- Empresas passam a registrar suas despesas no GIPE (lançamentos de saída criados nas primeiras semanas após a liberação).
