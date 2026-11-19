# PRD: Dashboard — Visão Geral do Administrador

## Problema
A Visão Geral atual é uma tela de atalhos (registrar entrada/saída, gerar cartaz, repetir tour, instalar app) com indicadores do pátio. Ela não responde às perguntas que o dono do estacionamento faz todo dia: **quanto entrou de dinheiro, comparado com o quê, de onde veio, como foi recebido e o que precisa da minha atenção agora**. Além disso, é aberta a quase todos os perfis, o que expõe números financeiros a quem opera o portão.

O back-end passou a entregar tudo isso em uma única consulta (`GET /api/v1/Dashboard`), com as regras de cálculo já resolvidas; falta a tela.

## Objetivo
O Administrador abre a Visão Geral e, em uma tela, entende o faturamento do dia, da semana ou do mês (e de qualquer período anterior), como ele se compara ao período anterior, a projeção do mês, o estado do pátio e as pendências — no desktop e no celular. Os demais perfis deixam de ver a Visão Geral e abrem direto na primeira tela que podem usar.

## Usuário-alvo
- **Administrador da empresa** (dono/gestor do estacionamento): acompanha o negócio, muitas vezes à distância e pelo celular, várias vezes ao dia; no desktop, para análise de períodos fechados.
- Por padrão só o Administrador acessa; a tela de permissões por módulo pode liberar a área para outros perfis.

## Conceitos (regras de negócio, calculadas pelo back-end)
- **Faturamento = dinheiro recebido**: pagamentos no pátio (na saída e antecipados, menos estornos), mensalidades pagas e faturas de conveniada pagas — cada um na data em que foi pago.
- **Período**: Dia (padrão), Semana (segunda a domingo) ou Mês, a partir de uma **data de referência** (padrão: hoje; data futura não é permitida).
- **Período em andamento** vai até agora e compara com o **mesmo ponto** do período anterior (o dia compara com o mesmo dia da semana anterior, até o mesmo horário). **Período fechado** compara com o período anterior inteiro.
- **Início do uso** = data da primeira saída registrada (não a data de cadastro). Antes dele não há base para comparar nem projetar.
- **Avulso e ticket médio** não incluem o lava-rápido, que aparece separado.
- Cada bloco olha para um recorte diferente:
  - *Período pedido*: faturamento do período, comparação, saídas, ticket médio, permanência média, por categoria e movimento por hora.
  - *Mês que contém o fim do período*: faturado no mês, média por dia, projeção/fechamento, melhor dia, origem e formas de recebimento.
  - *Gráfico diário*: os dias do mês, se for um mês fechado; senão os 30 dias até o fim do período.
  - *Agora*: pátio e alertas (só aparecem no período em andamento).

## Requisitos funcionais

### Acesso e navegação
- RF1: A Visão Geral é acessível, por padrão, apenas ao perfil Administrador; a permissão por módulo pode alterar essa regra.
- RF2: Perfis sem acesso que tentarem abrir a Visão Geral seguem o comportamento padrão de área sem permissão do sistema.
- RF3: Ao logar ou abrir a raiz, perfis sem acesso à Visão Geral abrem na **primeira tela que podem acessar** (ex.: Pátio para Gerente/Caixa/Manobrista, Faturas ou Financeiro para Financeiro, Fila de serviços para Lavador). O menu não mostra a Visão Geral para quem não a acessa.
- RF4: Os botões de ação atuais (Registrar entrada, Registrar saída, Gerar cartaz, Repetir tour, Instalar app) e os indicadores atuais do pátio saem da Visão Geral. Nenhuma dessas funções pode ficar sem caminho de acesso no sistema (entrada/saída seguem no menu e no Pátio; os demais devem continuar alcançáveis em outro lugar — a definir no Tech Spec).

### Cabeçalho e seleção de período
- RF5: Saudação ao usuário pelo nome, com a data de hoje e o horário da última atualização dos dados.
- RF6: Seletor de período Dia / Semana / Mês (padrão: Dia).
- RF7: Setas ‹ › navegam um dia, uma semana ou um mês conforme o seletor, com um rótulo do período exibido (ex.: "Hoje · 19 nov", "Ontem · 18 nov", "Esta semana · 16 – 22 nov", "Outubro 2026").
- RF8: A seta › fica desabilitada no período atual (não se navega para o futuro). A seta ‹ fica desabilitada no período que contém o início do uso.
- RF9: Fora do período atual aparece a ação "Voltar para hoje".
- RF10: Ao trocar o tipo de período, a navegação volta para o período atual.

### Faturamento (destaque principal)
- RF11: Exibir o faturamento do período com rótulo contextual ("Faturamento hoje", "Faturamento da semana", "Faturamento do mês", "Faturamento de qua, 18 nov", "Outubro fechou em") e marca "Fechado" quando o período estiver fechado.
- RF12: Exibir a variação percentual em relação ao período comparado (▲ alta / ▼ queda), com o texto do que foi comparado (ex.: "vs. quinta passada", "vs. mesmo ponto da semana passada", "vs. out até dia 19", "vs. outubro"). Sem comparação disponível, a variação não aparece.
- RF13: Abaixo do faturamento, os indicadores do mês de referência, conforme a situação:
  - Mês em andamento: mês até agora (ou média por dia, no seletor Mês) e **projeção do mês**; com o fechamento do mês anterior quando ele foi completo.
  - Projeção só com 5 dias de uso no mês; antes disso, mostrar "Disponível com 5 dias de uso" e quantos dias faltam.
  - Mês fechado: média por dia e **melhor dia** (valor e data).
  - Dia/semana em mês já fechado: quanto o mês fechou (com variação vs. mês anterior, quando houver) e média por dia.

### Indicadores do período
- RF14: Três indicadores: **Saídas** (veículos atendidos), **Ticket médio** (por saída paga) e **Permanência média** (média das saídas avulsas). Sem saídas, mostram "—" com uma frase explicando, nunca zero.

### Pátio agora (só no período em andamento)
- RF15: Ocupação total (ocupados de capacidade, % ocupado, barra), carros e motos (ocupados/capacidade), avulsos e mensalistas.

### Precisa da sua atenção (só no período em andamento)
- RF16: Lista de pendências, cada uma com ícone, título, resumo, quantidade e severidade por cor:
  - Mensalistas inadimplentes (quantidade e valor em atraso) — crítico;
  - Caixas fechados com diferença nos últimos 7 dias — crítico;
  - Veículos avulsos há mais de 72 horas (quantidade e o mais antigo: placa e permanência) — atenção;
  - Mensalidades que vencem em até 5 dias (quantidade e valor a receber) — atenção;
  - Faturas de conveniada abertas (quantidade e valor a receber) — informativo.
- RF17: Cada pendência leva à tela onde ela é resolvida, quando o usuário tiver acesso a ela.
- RF18: Sem pendências, mostrar "Tudo em dia — nenhuma pendência no momento".

### Gráfico de faturamento diário
- RF19: Barras empilhadas por dia, com as origens Avulso, Mensalista, Convênio e Lava-rápido, legenda só das origens com valor, e eixo com início, meio e fim.
- RF20: Recorte: "Faturamento por dia · <mês>" em mês fechado; senão "Faturamento · 30 dias até <hoje/data>". Os dias do período selecionado ficam em destaque; os demais esmaecidos.
- RF21: Dias antes do início do uso aparecem como lacuna tracejada (não como zero). Cada barra informa dia e valor ao passar o mouse/tocar.

### De onde vem o dinheiro / Como você recebe (mês de referência)
- RF22: "De onde vem o dinheiro": barra empilhada e lista com valor e % por origem (Avulso, Mensalistas, Convênios, Lava-rápido), só origens com valor.
- RF23: "Como você recebe": barra empilhada e lista com valor e % por forma de pagamento, como o back-end as descreve (PIX, Dinheiro, Cartão de débito, Cartão de crédito…), só formas com valor.
- RF24: Quando o mês de referência não é o atual, o título indica o mês (ex.: "De onde vem o dinheiro · outubro").

### Por categoria (período pedido)
- RF25: Por categoria de veículo: quantidade de saídas (barra proporcional) e valor em estacionamento avulso, ordenado da maior para a menor, com total de saídas e de valor no rodapé. Só categorias com valor.

### Veículos no pátio por hora (período pedido)
- RF26: Barras de 0h a 23h com veículos no pátio em cada hora; no Dia são valores do dia, na Semana e no Mês são a média por dia.
- RF27: Horas que ainda não chegaram (hoje) aparecem como lacuna.
- RF28: Selecionar uma hora mostra o detalhe: veículos no pátio, % das vagas e entradas naquela hora.
- RF29: Destacar a faixa de 3 horas de **maior movimento** e informar também a de **menor movimento**.
- RF30: Na Semana e no Mês, a média só aparece com 7 dias de uso; antes disso, explicar que a média aparece depois de 7 dias e que no seletor Dia já é possível ver cada dia.

### Estados especiais
- RF31: **Empresa nova** (sem nenhuma saída): o card de faturamento vira boas-vindas ("Seu faturamento aparece aqui…"), setas desabilitadas, indicadores com "—" e cada bloco com um estado vazio de uma frase.
- RF32: **Período fechado**: somem "Pátio agora" e "Precisa da sua atenção"; os demais blocos ocupam o espaço.
- RF33: Qualquer informação que o back-end marque como não aplicável (nula) não é exibida — nunca mostrar "0", "▼ 100%" ou dado inventado no lugar.
- RF34: Estados de carregamento e de erro da consulta, com opção de tentar de novo.

### Layout
- RF35: O layout deve seguir **exatamente** a referência `referencia-layout.html` (nesta pasta — proposta visual com dados fictícios), na estrutura, hierarquia, ordem dos blocos e textos, adaptado ao design system do GIPE (cores, tipografia, componentes e tema claro/escuro).
- RF36: Revisado em **web e mobile**: no desktop, blocos lado a lado como na referência; no celular, uma coluna, sem rolagem horizontal, com o seletor de período e as setas utilizáveis com o polegar, e gráficos legíveis (agrupando horas no gráfico por hora quando a largura não comportar 24 barras).

## Fora de escopo
- Qualquer mudança nas regras de cálculo (são do back-end; a tela exibe o que vem da API).
- Seleção de intervalo de datas livre (só Dia/Semana/Mês navegáveis).
- Exportação (PDF/planilha), compartilhamento ou envio do dashboard.
- Atualização em tempo real/automática dos dados (apenas ao abrir, navegar ou tentar de novo).
- Dashboard para outros perfis (Gerente, Financeiro, conveniada) ou para múltiplas empresas.
- Mudanças no menu inferior/lateral além de esconder a Visão Geral para quem não a acessa.

## Critérios de aceite
- [ ] Com perfil Administrador, `/dashboard` mostra a nova Visão Geral; com Gerente, Caixa, Manobrista, Financeiro ou Lavador (sem permissão por módulo), a Visão Geral não aparece no menu e o acesso direto é bloqueado.
- [ ] Liberando a área para outro perfil na permissão por módulo, esse perfil passa a ver a Visão Geral.
- [ ] Após login, cada perfil sem acesso abre na primeira tela que pode acessar.
- [ ] Os botões de ação antigos não estão mais na Visão Geral e cada função continua acessível em algum lugar do sistema.
- [ ] Dia / Semana / Mês e as setas ‹ › consultam o período correto; › desabilitada no período atual; ‹ desabilitada no período do início do uso; "Voltar para hoje" aparece fora do período atual.
- [ ] Com a resposta de exemplo do input (19/11/2026, início do uso em 07/11): faturamento de hoje R$ 0,00 com "▼ 100% vs. quinta passada"; projeção do mês com o valor da API (R$ 2.591, arredondado como na referência); ticket médio e permanência com "—"; sem comparação com o mês anterior; 17 dias tracejados no gráfico; origem sem Mensalista; recebimento com PIX, Dinheiro, Cartão de débito e Cartão de crédito; categorias com estado vazio; gráfico por hora com 0h–15h e as horas seguintes como lacuna.
- [ ] Período fechado não mostra "Pátio agora" nem "Precisa da sua atenção" e exibe a marca "Fechado".
- [ ] Mês fechado mostra média por dia e melhor dia; mês em andamento com menos de 5 dias de uso mostra "Disponível com 5 dias de uso".
- [ ] Empresa sem nenhuma saída mostra boas-vindas e estados vazios, sem zeros enganosos.
- [ ] Nenhum campo nulo da API aparece como 0, "▼ 100%" ou valor vazio quebrado.
- [ ] Alertas mostram só as pendências existentes, com "Tudo em dia" quando não há nenhuma; cada alerta leva à tela correspondente.
- [ ] Semana/Mês com menos de 7 dias de uso mostram a mensagem no lugar do gráfico por hora.
- [ ] Layout confere com `referencia-layout.html` no desktop e no celular (~375px), sem rolagem horizontal, em tema claro e escuro.
- [ ] Valores em reais no formato brasileiro (faturamento do período com centavos, ex.: R$ 1.403,50; demais valores arredondados como na referência) e datas em português.

## Métricas de sucesso
- O Administrador consegue responder "quanto faturei hoje e como está vs. a semana passada" em uma única tela, sem abrir Caixa ou Financeiro.
- Queda no uso das telas de Caixa/Financeiro só para consulta de totais pelo Administrador.
- Nenhum perfil operacional (Caixa, Manobrista, Lavador) acessa números de faturamento pela Visão Geral.
