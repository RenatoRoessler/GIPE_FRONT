# PRD: Cadastro de Preços em 3 etapas com resumo ao vivo

## Problema
O cadastro e a edição de tabelas de preço passam por 4 etapas (Informações, Horários, Faixas, Categorias) em telas separadas. Hoje:
- O indicador de etapas é só visual: não dá para pular. Mudar um valor de uma tabela existente exige passar pelas 4 etapas.
- O efeito do que se digita só aparece no fim: a placa tarifária está na etapa 3 e o resumo completo na 4.
- A etapa Informações reúne 10 campos de assuntos diferentes (identificação, vigência, tolerâncias, diária e situação), enquanto as faixas, de que a diária e as tolerâncias dependem, ficam em outra etapa.
- "Tolerância de alteração de faixa" aparece sem explicação.
- Não há sinal de quais etapas estão completas ou com pendência antes de tentar salvar.

## Objetivo
O gestor cadastra ou edita uma tabela de preço em 3 etapas claras, navega livremente entre elas, enxerga o tempo todo um resumo da tabela que está montando (incluindo a placa tarifária) e sabe quais etapas estão completas antes de salvar.

## Usuário-alvo
Administradores e gestores que definem e ajustam preços, principalmente no computador, com uso ocasional no celular.

## Requisitos funcionais
- RF1 (Etapas): o fluxo tem 3 etapas, nesta ordem:
  - **O básico**: descrição, tipo de regra, vigência (início e fim), categorias de veículo e situação (ativa/inativa).
  - **Quando vale**: os dias e horários de cobrança, desenhados numa grade semanal (RF11).
  - **Quanto cobra**: faixas de tempo e valor (RF12), diária (período, valor e adicional) e as duas tolerâncias, todos juntos.
  Os campos, as regras de validação e as informações enviadas ao salvar são os mesmos de hoje; só mudam a organização e a navegação.
- RF2 (Navegação): o indicador de etapas é clicável: o usuário pode ir a qualquer etapa a qualquer momento, sem perder o que preencheu. Cada etapa tem também **Voltar** e **Avançar**; a última tem o botão de salvar.
- RF3 (Estado por etapa): cada etapa mostra se está **completa** (✓), **com pendência** (!, só depois de visitada) ou ainda não preenchida, e a etapa atual fica destacada. O cabeçalho mostra o andamento (por exemplo "Rascunho · 2 de 3 etapas" ou "Pronta para salvar").
- RF4 (Resumo ao vivo): ao lado do formulário há o painel **Sua tabela**, que se atualiza enquanto o usuário digita, com: descrição, tipo, vigência, categorias, horários (em texto, agrupando dias iguais), quantidade de degraus e valor da diária, uma barra de progresso e a marca de cada item já preenchido. Abaixo dele, a **placa tarifária** com os degraus e a diária (a mesma pré-visualização de faixas que existe hoje, agora visível em todas as etapas).
- RF5 (Tipo de regra): o tipo é escolhido em cartões com uma frase explicando cada um (Padrão, Convênio, Promocional, Evento), em vez de uma lista suspensa. O campo da empresa conveniada continua como hoje.
- RF6 (Vigência): o fim da vigência tem a opção **Sem data de fim**; marcada, o campo de data fica desabilitado e a tabela não tem término.
- RF7 (Ajuda): as tolerâncias e a diária têm uma frase curta explicando o efeito (por exemplo "Minutos extras antes de passar para o degrau seguinte").
- RF8 (Salvar e pendências): ao tentar salvar com etapas incompletas, o usuário é levado à primeira etapa com pendência e vê o que falta. As mensagens de erro de validação de hoje continuam, agora junto de cada campo.
- RF9 (Edição): o mesmo fluxo serve para editar. Ao editar, o painel **Sua tabela** destaca o que mudou em relação ao salvo ("antes → depois"), o botão de salvar só habilita com alterações, e sair com alterações pede confirmação, como hoje. Depois de salvar, o comportamento de voltar à lista com a tabela selecionada continua.
- RF11 (Grade de horários): na etapa "Quando vale", a semana aparece como uma grade de 7 dias por 24 horas. Cada quadrado é uma hora de cobrança: o usuário clica ou arrasta para pintar, pode alternar um dia inteiro (clicando no nome do dia) ou uma hora em todos os dias (clicando na hora) e usa atalhos (Comercial Seg–Sex 8h–18h, Rotativo Seg–Sex 6h–22h e Sáb 8h–18h, 24 horas, Só fim de semana, Limpar, Copiar segunda para os outros dias). Abaixo há um resumo em texto ("Seg–Sex 06:00–22:00") e o total de horas da semana com cobrança. Horários com minutos quebrados, inativos ou com período específico continuam disponíveis num **Ajuste fino** com os campos atuais, e a grade e o ajuste fino editam os mesmos horários.
- RF12 (Faixas): na etapa "Quanto cobra", cada degrau tem o limite de tempo em **horas e minutos** (em vez de só minutos), o valor e o **salto** em relação ao degrau anterior. Há modelos prontos (Rotativo 1 h, 2 h e 3 h; A cada 30 min até 2 h) e avisos na hora, sem bloquear: limite repetido, degrau que custa menos que o anterior e diária menor que o último degrau.
- RF10 (Celular): em telas pequenas o painel **Sua tabela** e a placa descem para depois do formulário; o indicador de etapas continua acessível no topo.

## Fora de escopo
- Edição em página única com revisão antes de salvar (proposta D).
- Mudança de regras de negócio, de campos ou do que é enviado ao servidor.
- Rascunho salvo no servidor: o "rascunho" é só o estado da tela.
- Seleção e vínculo de empresa conveniada.

## Critérios de aceite
- [ ] Criar e editar mostram 3 etapas (O básico, Quando vale, Quanto cobra) com o conteúdo descrito.
- [ ] Clicar em qualquer etapa do indicador leva a ela sem perder dados já digitados.
- [ ] Cada etapa mostra ✓ quando completa e ! quando visitada e com pendência; o cabeçalho mostra o andamento.
- [ ] O painel **Sua tabela** e a placa tarifária mudam enquanto o usuário digita, em qualquer etapa.
- [ ] O tipo de regra é escolhido em cartões; **Sem data de fim** desabilita o fim da vigência e salva sem data de fim.
- [ ] Faixas, diária e tolerâncias aparecem juntas na etapa Quanto cobra, com a explicação das tolerâncias.
- [ ] Na etapa "Quando vale" a grade 7×24 pinta por clique e arraste, os atalhos funcionam e o resumo em texto acompanha; horários com minutos, inativos ou com período específico seguem editáveis no ajuste fino sem se perderem.
- [ ] Na etapa "Quanto cobra" o limite é em horas e minutos, mostra o salto para o degrau anterior, oferece os modelos e avisa limite repetido, valor que cai e diária menor que o último degrau.
- [ ] Salvar com pendência leva à primeira etapa incompleta e mostra o que falta; salvar completo envia as mesmas informações de hoje e volta à lista com o aviso.
- [ ] Na edição, o painel destaca o que mudou, o salvar só habilita com mudanças e sair com alterações pede confirmação.
- [ ] No celular o painel e a placa aparecem depois do formulário, sem rolagem horizontal.
- [ ] Utilizável por teclado e leitor de tela (WCAG 2.2 AA): o indicador de etapas anuncia a etapa atual e o estado de cada uma, o resumo anuncia atualizações de forma discreta e os cartões de tipo têm estado anunciado.

## Métricas de sucesso
- Menos abandono do cadastro antes de salvar.
- Menos correções de preço logo após salvar (placa visível durante todo o preenchimento).
- Menos passos para ajustar um valor de uma tabela existente (de 4 etapas para ir direto à etapa necessária).

## Pontos em aberto
- Definir quando uma etapa conta como "completa" nas regras de validação de hoje (por exemplo, se "Quando vale" exige ao menos um horário).
- Confirmar o texto de ajuda das tolerâncias com o negócio.
