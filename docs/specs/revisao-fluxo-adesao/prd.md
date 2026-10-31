# PRD: Revisão de UX e Layout do Fluxo de Adesão

## Problema
O fluxo de adesão é o primeiro contato de uma empresa com o GIPE e hoje ele cresceu sem uma revisão de experiência. Ele passou de 2 para 3 etapas e a primeira etapa acumulou campos: identificação, endereço, capacidade de vagas e meios de pagamento, tudo em uma única tela longa. Os pontos de atrito observados:

- A etapa "Dados da empresa" é um formulário extenso, o que dá a impressão de esforço alto logo no início e favorece a desistência, principalmente no celular.
- A etapa "Funcionamento" exige configurar 7 dias com vários controles por linha (aberto, 24 horas, abertura, fechamento), o que é pesado de preencher e difícil de usar em tela estreita.
- Quando há erro de validação, o usuário não vê claramente o que falta nem quantos campos faltam; o progresso entre etapas é pouco informativo (só nomes das etapas).
- O usuário não tem uma visão do que já preencheu antes de enviar: não existe um momento de conferência dos dados.
- Falhas recusadas pelo backend (ex.: CNPJ ou e-mail já cadastrado) só aparecem na última etapa, mesmo quando o dado a corrigir está em uma etapa anterior.
- O visual é correto, mas genérico para um momento que deveria transmitir confiança e profissionalismo.

## Objetivo
Tornar o fluxo de adesão mais fácil, rápido e visualmente marcante: o responsável pela empresa deve concluir o cadastro com pouco esforço, entender sempre em que ponto está e o que falta, e sentir confiança no produto, tanto no desktop quanto no celular.

## Usuário-alvo
Responsável pela empresa (estacionamento, lava-rápido, valet) que recebe o link de adesão e se cadastra pela primeira vez, normalmente sem treinamento, em desktop ou celular (uso com uma mão, teclado virtual, conexão variável).

## Requisitos funcionais

### Usabilidade
- RF1: O fluxo mantém todas as informações hoje coletadas (empresa, endereço, vagas, meios de pagamento, horários e usuário titular), mas organizadas de forma que cada tela peça uma quantidade de informação menor e coesa, reduzindo a sensação de formulário longo.
- RF2: O usuário sempre vê em que etapa está, quantas existem e o que vem a seguir, com indicação clara das etapas concluídas e a possibilidade de voltar a uma etapa já concluída sem perder dados.
- RF3: Validações aparecem no momento e no lugar certos: o erro é mostrado junto do campo, com texto objetivo que diz como corrigir, e ao tentar avançar com pendências o usuário é levado ao primeiro campo com problema.
- RF4: Ajudas que reduzem digitação são mantidas e valorizadas (preenchimento do endereço pelo CEP, máscaras de CNPJ/CPF/telefone, teclado adequado a cada campo no celular).
- RF5: A configuração de horários de funcionamento é simplificada, com atalhos para os casos comuns (por exemplo, aplicar o mesmo horário a vários dias ou a todos os dias, marcar dias úteis/fim de semana) além do ajuste individual por dia.
- RF6: O fluxo apresenta uma conferência final dos dados informados (resumo por seção, com acesso rápido para corrigir cada uma) antes de o usuário confirmar o cadastro.
- RF7: Quando o backend recusar o cadastro por um dado de uma etapa anterior, o usuário é informado de qual dado precisa corrigir e conduzido até ele, mantendo tudo o que já preencheu.
- RF8: Durante o envio o usuário recebe feedback imediato de progresso, sem possibilidade de envio duplicado; ao concluir, recebe uma confirmação clara do que acontece em seguida (acesso ao login).
- RF9: O usuário consegue sair e voltar a uma etapa sem perda de dados dentro da mesma sessão de preenchimento.
- RF10: Textos, rótulos e mensagens usam linguagem simples e direta, sem jargão, e explicam brevemente por que um dado é pedido quando isso não for óbvio.

### Layout e visual
- RF11: As telas do fluxo recebem uma nova composição visual, mais marcante e profissional que o formulário em cartão atual, transmitindo confiança para um produto que lida com dados operacionais e financeiros, sem sacrificar a clareza.
- RF12: A identidade do GIPE (logo, tagline, cores, tipografia) é reforçada ao longo de todo o fluxo e as telas seguem o design system do projeto.
- RF13: Hierarquia visual clara: título e orientação de cada etapa, agrupamento de campos relacionados e destaque inequívoco da ação principal.
- RF14: Transições entre etapas e estados (carregando, sucesso, erro) são suaves e comunicam o que está acontecendo, respeitando a preferência do usuário por menos movimento.

### Responsividade e acessibilidade
- RF15: O fluxo é totalmente utilizável em celular, tablet e desktop; a experiência no celular é pensada como principal (campos legíveis, alvos de toque confortáveis, ações principais sempre alcançáveis, sem rolagem horizontal), e não apenas uma versão reduzida do desktop.
- RF16: A configuração de horários é confortável em tela estreita, sem linhas apertadas nem controles sobrepostos.
- RF17: O fluxo atende WCAG 2.2 AA: navegação completa por teclado, foco visível e gerenciado na troca de etapas, rótulos em todos os campos, erros anunciados a leitores de tela, contraste adequado e estado dos controles perceptível sem depender só de cor.

## Fora de escopo
- Alterar quais dados são exigidos pelo backend ou o contrato de envio do cadastro.
- Cobrança, plano comercial, aprovação manual e confirmação de e-mail (já fora de escopo na adesão original).
- Consulta automática de CNPJ em serviços externos.
- Salvamento de rascunho entre sessões (retomar o cadastro depois de fechar a página).
- Edição dos dados da empresa depois do cadastro (tratada em "Minha empresa").
- Mudanças no login ou na recuperação de senha, além do aviso de sucesso já existente.

## Critérios de aceite
- [ ] Nenhuma informação coletada hoje deixa de ser coletada; o cadastro continua sendo enviado e criado com sucesso.
- [ ] Nenhuma tela do fluxo apresenta um bloco de campos que exija rolagem longa para ser concluído em desktop; no celular, cada tela tem um objetivo único e claro.
- [ ] O usuário identifica em qualquer momento a etapa atual, o total de etapas e as etapas já concluídas, e consegue voltar a uma delas sem perder dados.
- [ ] Ao tentar avançar com pendências, o primeiro campo inválido recebe o foco e todos os erros têm mensagem específica junto ao campo.
- [ ] É possível configurar os horários dos 7 dias com no máximo poucas ações usando os atalhos (ex.: mesmo horário para todos os dias) e também ajustar cada dia individualmente.
- [ ] Existe uma tela de conferência com todos os dados, e cada seção permite voltar para corrigir.
- [ ] Uma recusa do backend atribuível a um dado de etapa anterior indica o dado e leva o usuário até ele, sem perder o preenchimento.
- [ ] Durante o envio os botões ficam indisponíveis e há indicação de progresso; não é possível enviar duas vezes.
- [ ] O fluxo é usável sem rolagem horizontal e sem sobreposição de elementos nas larguras de celular pequeno (~320px), celular comum, tablet e desktop; alvos de toque com tamanho confortável.
- [ ] O fluxo completo pode ser feito apenas pelo teclado, com foco visível e leitura correta por leitor de tela, e passa na verificação de contraste AA.
- [ ] Animações respeitam a preferência de movimento reduzido.
- [ ] Revisão visual aprovada pelo responsável do produto: o resultado é percebido como mais bonito e profissional que a versão atual, coerente com `PRODUCT.md` e com o design system.
- [ ] O usuário cadastrado consegue logar normalmente depois da adesão concluída.

## Métricas de sucesso
- Taxa de conclusão do fluxo (iniciaram a etapa 1 e concluíram o envio): aumentar em relação à medição atual (baseline a medir antes do lançamento).
- Tempo médio para concluir a adesão: reduzir em relação ao baseline.
- Taxa de abandono por etapa, com foco na etapa de empresa e na de horários: reduzir.
- Proporção de tentativas de avanço bloqueadas por erro de validação: reduzir.
- Taxa de conclusão em celular aproximando-se da de desktop.
