# PRD: Redesenho mobile-first do cadastro e da edição de preços

## Problema
O cadastro e a edição de tabelas de preço usam o mesmo fluxo em 3 etapas (O básico, Quando vale, Quanto cobra), desenhado para o computador (formulário à esquerda, painel "Sua tabela" à direita) e depois adaptado ao celular. A adaptação resolveu o mais urgente (indicador de etapas compacto, barra fixa com resumo e ação, grade de horários que cabe na tela), mas o fluxo continua pesado no celular. Conferido no sistema, a 360 px de largura e a 1280 px:

1. **O topo gasta a primeira tela.** Título, selo de andamento, nome e situação (na edição), frase da etapa e indicador de etapas ocupam cerca de 300 px antes do primeiro campo; no celular o formulário só começa na metade da tela.
2. **As etapas são longas.** O básico tem mais de 1000 px de campos (descrição, tipo de regra em 4 cartões, empresa conveniada, início e fim da vigência, "Sem data de fim", situação e categorias). "Quanto cobra" tem 7 degraus de cerca de 170 px cada, mais diária, adicional e duas tolerâncias, e os botões Cancelar e Voltar ficam empilhados no fim.
3. **Na edição, salvar está longe.** Quem só quer mudar um valor precisa chegar à última etapa para salvar: a barra fixa mostra "Tudo preenchido" e o botão "Avançar", e o botão de salvar só aparece na etapa 3. O resumo com "antes → depois" fica escondido atrás de um toque.
4. **Campos de data e hora nativos pesam no celular.** Início e fim de vigência são campos de data e hora completos ("dd/mm/aaaa --:--"); o fim continua visível e vazio mesmo com "Sem data de fim" marcado.
5. **Pouco apoio de leitura entre etapas.** A frase "Etapa 1 de 3: …" aparece como texto solto com contorno de foco depois de trocar de etapa; o estado de cada etapa só aparece como marca ✓ ou !, sem dizer o que falta ao tocar nela.
6. **A grade de horários é longa na vertical** (24 linhas de 32 px, cerca de 850 px) e não tem arraste por toque, só toque célula a célula (mais rápido pelos modelos prontos, mas lento para ajustes).
7. **Não há uma decisão visual única** para criar e editar: os dois reaproveitam o mesmo desenho, sem pensar no que cada situação precisa (criar do zero, ou ajustar um ou dois valores).

## Objetivo
O gestor cria uma tabela de preço ou ajusta uma existente pelo celular, com uma mão, sem rolar o que não precisa: no cadastro, chega ao fim sabendo o que falta; na edição, muda o valor desejado e salva em poucos toques, vendo o que mudou. Antes de implementar, o gestor compara **3 propostas de layout** do cadastro e da edição e escolhe uma.

## Usuário-alvo
Administradores e gestores que definem e ajustam preços: no computador para cadastros novos e mais completos; cada vez mais no celular para ajustes pontuais (um valor, uma vigência, um horário) e para cadastros rápidos.

## Requisitos funcionais
- RF1 (Propostas): entregar **3 modelos de layout** distintos do cadastro e da edição, desenhados primeiro para celular e depois adaptados para telas maiores, para o usuário analisar e escolher **um**. Cada modelo mostra o mesmo conteúdo e as mesmas funções (RF2 a RF10) e se diferencia na composição e na navegação, não nos campos. Cada proposta traz prós e contras. Só a escolhida segue para o Tech Spec.
- RF2 (Conteúdo preservado): manter todos os campos, regras de validação e dados enviados ao salvar, em duas visões que o redesenho pode reorganizar:
  - **O básico**: descrição, tipo de regra (Padrão, Convênio, Promocional, Evento, com a frase de cada um), empresa conveniada (obrigatória no tipo Convênio), vigência (início, fim e "Sem data de fim"), situação ativa/inativa e categorias de veículo.
  - **Quando vale**: grade semanal de horários (modelos prontos Comercial, Rotativo, 24 horas, Só fim de semana; Copiar segunda para os outros dias; Limpar; resumo em texto e total de horas) e ajuste fino para minutos exatos, horários inativos e períodos específicos.
  - **Quanto cobra**: degraus em horas e minutos com valor e salto em relação ao anterior, modelos prontos (Rotativo 1 h, 2 h, 3 h; A cada 30 min até 2 h), percentual da conveniada (tipo Convênio), diária (período, valor e adicional), tolerâncias de entrada e de alteração de faixa com a explicação, e os avisos não bloqueantes (limite repetido, degrau que custa menos, diária menor que o último degrau).
- RF3 (Estrutura e navegação): o redesenho pode mudar o número e o agrupamento das etapas (ou propor outra forma, como seções), desde que o gestor veja onde está, o que está completo, o que tem pendência e o que falta para salvar, e possa ir a qualquer parte sem perder o que preencheu.
- RF4 (Edição direta): na edição, o gestor chega ao que quer mudar sem passar por tudo e **salva a partir de onde estiver**, assim que houver alterações e a tabela estiver válida. O botão de salvar só habilita com alterações; com pendências, leva ao primeiro ponto a corrigir e mostra o que falta.
- RF5 (O que mudou): na edição, o gestor vê com facilidade, sem abrir telas à parte, o que mudou em relação ao salvo ("antes → depois") e quantas mudanças há, antes de salvar.
- RF6 (Resumo e placa): o resumo da tabela e a placa tarifária (degraus e diária) ficam à vista ou a um toque durante o preenchimento; o resumo não mostra como definido o que ainda é o modelo padrão do cadastro novo.
- RF7 (Ação principal ao alcance do polegar): avançar, voltar, salvar e cancelar ficam acessíveis no celular sem rolar o formulário inteiro e sem ficar atrás do menu inferior ou de outra barra fixa; cancelar com alterações pede confirmação, como hoje.
- RF8 (Campos para toque): campos de data e hora, horas e minutos, valores em dinheiro e tolerâncias são pensados para o celular: alvos de toque de pelo menos 44 px, teclados numéricos próprios onde já existem, e nenhum campo que perca sentido (por exemplo, o fim da vigência some ou fica desabilitado de forma clara com "Sem data de fim").
- RF9 (Grade de horários no celular): a grade de horários continua utilizável por toque e deve permitir ajustes mais rápidos que célula a célula (por exemplo, por dia inteiro ou por faixa de horas), mantendo os modelos prontos e o ajuste fino.
- RF10 (Estados e erros): carregamento da tabela na edição, tabela não encontrada, erro de carregamento com Tentar novamente, erro ao salvar (com Tentar novamente), saída com alterações não salvas (aviso do navegador e confirmação ao cancelar) e salvamento com sucesso (volta à consulta com a tabela atualizada e confirmação) continuam existindo.
- RF11 (Mobile first): todas as telas funcionam primeiro em tela estreita (a partir de 360 px, vertical), sem rolagem horizontal, com o primeiro campo à vista na primeira tela (sem o topo gastar mais de um terço da altura). Em telas maiores a composição aproveita o espaço extra (por exemplo, formulário e resumo lado a lado) sem esconder funções.
- RF12 (Coerência): o redesenho segue o tema, os componentes e o padrão de navegação já adotados no módulo de preços e no restante do aplicativo.

## Fora de escopo
- Mudar regras de negócio, campos, validações ou o que é enviado e recebido do servidor.
- Novas funcionalidades (duplicar tabela, rascunho salvo no servidor, histórico de alterações, linha do tempo de vigências, regras de prioridade entre tabelas).
- A tela de consulta (esteira, detalhe, simulador), já redesenhada em `precos-redesign-mobile`.
- Implementar os 3 modelos: apenas o escolhido será implementado, em etapa posterior.
- Mudar permissões de acesso.

## Critérios de aceite
- [x] São apresentados 3 modelos de layout distintos, cada um cobrindo cadastro e edição, nas três partes (O básico, Quando vale, Quanto cobra) ou equivalentes, em versão celular e versão computador, com prós e contras.
- [x] Nenhuma função ou campo de RF2 ficou de fora de qualquer um dos modelos.
- [ ] Em cada modelo, a primeira tela a 360 × 640 px mostra o primeiro campo a preencher e o que falta para salvar, e o topo não passa de um terço da altura.
- [x] Em cada modelo, na edição, é possível mudar um valor e salvar sem passar pelas outras partes, e o "antes → depois" fica à vista sem abrir outra tela.
- [ ] Em cada modelo, avançar, voltar, salvar e cancelar ficam ao alcance do polegar e nunca atrás do menu inferior.
- [x] Nenhum modelo exige rolagem horizontal a partir de 360 px de largura.
- [ ] Em cada modelo, o fim da vigência, a grade de horários e os degraus têm tratamento próprio para toque (alvos de pelo menos 44 px, sem campos sem sentido).
- [x] O usuário escolhe um modelo e a escolha fica registrada no design da feature antes de seguir para o Tech Spec.
- [ ] Os modelos respeitam acessibilidade (WCAG 2.2 AA): contraste, alvos de toque, foco por teclado, ordem de leitura e anúncio do estado de cada parte.

## Métricas de sucesso
- Menos toques e menos tempo para ajustar um valor de uma tabela existente pelo celular.
- Menos abandono do cadastro antes de salvar.
- Mais cadastros e ajustes concluídos pelo celular.
- Menos correções logo depois de salvar (o "antes → depois" e a placa à vista).

## Pontos em aberto
- **Salvar de qualquer parte na edição (RF4):** hoje o botão de salvar só existe na última etapa. **Premissa adotada para o design** (o usuário pediu para seguir sem responder a esta pergunta): salvar de qualquer parte é aceitável, sempre com a validação completa. Se o negócio não aceitar, o modelo escolhido mantém o salvar só no fim e reforça o atalho para chegar lá.
- **Uso por contexto:** sem resposta, o design trata criar e editar com o mesmo peso; confirmar a proporção de cadastros novos e de edições feitas no celular para decidir onde dar mais acabamento.
- **Contorno de foco na frase da etapa:** em desenvolvimento a frase "Etapa N de 3: …" aparece com contorno depois de trocar de etapa (foco programático para leitores de tela). Conferir em produção se o contorno aparece também para quem usa toque; se aparecer, tratar no modelo escolhido.
- **Escolha do modelo:** definir quem decide e como, para destravar o Tech Spec.
