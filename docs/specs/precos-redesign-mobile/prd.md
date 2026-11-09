# PRD: Redesenho mobile-first da Gestão de Preços

## Problema
A Gestão de Preços reúne hoje a consulta (lista com busca e filtro, detalhe em abas, simulador de cobrança) e o cadastro/edição em 3 etapas (O básico, Quando vale, Quanto cobra). O desenho nasceu pensando no computador (lista e detalhe lado a lado, painel "Sua tabela" ao lado do formulário) e foi adaptado ao celular depois. Resultado:
- No celular, o gestor alterna entre telas inteiras (lista → detalhe) e perde o contexto: não vê de relance quanto cada tabela cobra, só descrição, tipo e situação.
- O detalhe empilha cabeçalho, 3 abas, fatos e simulador numa rolagem longa; a informação mais consultada (os valores) disputa espaço com dados secundários.
- A ação de editar é pequena e fica no cabeçalho do detalhe; no celular o polegar não alcança.
- No cadastro, o resumo ao vivo e a placa tarifária descem para depois do formulário, então o efeito do que se digita deixa de ser visível justamente onde o espaço é curto.
- Não há uma decisão visual única para o módulo: lista, detalhe e cadastro foram feitos em momentos diferentes.

### Diagnóstico da tela atual (conferido no sistema, a 390 px e a 1262 px)
1. ~~O menu inferior cobre conteúdo.~~ **Corrigido na revisão do Tech Spec:** o que parecia o menu sobre a placa e sobre o campo "Empresa conveniada" era artefato de captura de página inteira (o menu é fixo e aparece no meio da imagem). O código já reserva o espaço do menu no fim da página (`AppShell`) e nas capturas da tela visível nada fica coberto. O risco real é outro: **novas barras fixas do módulo** (simulador e resumo do cadastro) precisam ficar acima do menu e sem cobrir o fim do conteúdo.
2. **A lista não diz quanto cada tabela cobra.** Cada item traz só nome, tipo e situação; para ver um valor é preciso abrir a tabela.
3. **O cabeçalho do detalhe consome a primeira tela.** Título da página, "Novo preço", "‹ Preços", nome, selos e "Editar" empilham antes da placa, que só começa perto de 510 px de altura; o simulador fica abaixo da dobra, depois de mais de 1200 px de rolagem. "Novo preço" e "Editar" ocupam linhas inteiras no alto, longe do polegar.
4. **O cadastro é longo no celular.** O primeiro botão de ação vem depois de mais de 1000 px de formulário; o resumo "Sua tabela" e a placa só aparecem depois do botão Avançar; o resumo mostra "7 degraus · diária —" de uma tabela ainda sem edição; as 3 etapas ocupam 3 cartões grandes no topo; a legenda "Etapa 1 de 3" parece um campo.
5. **Os filtros de situação cortam opções.** Os botões "Todas, Vigente, Agendada, Encerrada, Inativa" rolam na horizontal e "Encerrada" e "Inativa" ficam escondidos, sem pista de que existem.
6. **No computador**, a coluna da lista é estreita (o botão "Encerrada" aparece cortado), sobra espaço vazio abaixo dos itens e a placa não cabe na primeira tela.

## Objetivo
O gestor consulta, simula, cria e edita tabelas de preço com conforto no celular (uso com uma mão, informação principal visível de relance) e com bom aproveitamento do computador, sem perder nenhuma funcionalidade atual. Antes de implementar, o gestor compara **3 propostas de layout** do módulo e escolhe uma.

## Usuário-alvo
Administradores e gestores que definem e conferem os preços praticados, em computador e, cada vez mais, no celular (consulta rápida de um valor, ajuste pontual, conferência durante a operação do pátio).

## Requisitos funcionais
- RF1 (Propostas): entregar **3 modelos de layout** distintos do módulo completo, desenhados primeiro para celular e depois adaptados para telas maiores, para o usuário analisar e escolher **um**. Cada modelo mostra as mesmas telas e funções (RF2 a RF9) e se diferencia na composição, não no conteúdo. Cada proposta traz um resumo de prós e contras. Só a escolhida segue para tech spec e implementação.
- RF2 (Lista): manter a lista de tabelas com descrição, tipo de regra e situação (Vigente, Agendada, Encerrada, Inativa), busca por descrição, filtro por situação (busca e filtro juntos), contagem do filtro atual, paginação e o botão **Novo preço**. O redesenho deve avaliar mostrar na própria lista um resumo do que a tabela cobra (por exemplo valor da primeira faixa e da diária) e a vigência.
- RF3 (Seleção e navegação): escolher uma tabela mostra o detalhe somente leitura, sem abrir a edição. No celular, abrir o detalhe e voltar preserva busca, filtro e página; o botão Voltar do navegador devolve a lista. A tabela selecionada, a busca e o filtro continuam refletidos no endereço (recarregar ou compartilhar o link leva ao mesmo ponto).
- RF4 (Detalhe): manter nome, tipo, situação, vigência e o conteúdo hoje dividido em **Tarifa** (degraus, diária com período/valor/adicional, desconto da conveniada, tolerâncias, categorias), **Horários** (semana inteira, "Sem cobrança", regras inativas e com período específico) e **Informações** (demais dados cadastrais). A organização pode mudar, desde que tudo continue acessível e que o valor cobrado seja o primeiro que o usuário vê.
- RF5 (Simulador): manter o bloco **Simular cobrança** (categoria do veículo, permanência em minutos ou controle deslizante, valor estimado com a explicação do degrau, aviso de categoria não atendida e o aviso permanente "Estimativa. O valor real é calculado no momento da saída."). No celular, deve ser fácil de usar com o polegar.
- RF6 (Editar e criar): manter o cadastro/edição em 3 etapas (**O básico**, **Quando vale**, **Quanto cobra**) com navegação livre entre etapas, estado por etapa (completa, com pendência), resumo ao vivo da tabela e placa tarifária, salvar bloqueado sem alterações na edição, destaque do que mudou ("antes → depois"), confirmação ao sair com alterações e retorno à lista com a tabela atualizada e confirmação. Todos os campos, validações e dados enviados ao salvar permanecem os mesmos.
- RF7 (Campos do cadastro): manter tipo de regra em cartões, **Sem data de fim**, categorias de veículo, situação ativa/inativa, grade semanal de horários 7×24 (clique, arraste, atalhos, resumo em texto, total de horas e ajuste fino), faixas em horas e minutos com salto e modelos prontos, diária, tolerâncias com ajuda e avisos não bloqueantes (limite repetido, degrau que custa menos, diária menor que o último degrau). A grade de horários deve ser utilizável por toque no celular.
- RF8 (Estados): carregamento (esqueleto), erro com **Tentar novamente**, lista vazia (com **Novo preço**), busca sem resultado (com limpar busca), tabela que deixou de existir, sem permissão e salvamento com sucesso/erro continuam existindo em todas as telas.
- RF9 (Mobile first): todas as telas funcionam primeiro em tela estreita (a partir de 360 px de largura, orientação vertical), sem rolagem horizontal, com alvos de toque confortáveis e ações principais ao alcance do polegar. Em telas maiores a composição aproveita o espaço extra sem esconder funções.
- RF10 (Coerência): o redesenho segue a identidade e os componentes do sistema e o padrão de navegação já adotado no restante do aplicativo.
- RF11 (Menu inferior): no celular, nenhum conteúdo, campo ou botão fica coberto pelo menu inferior, pelo botão central "Entrada" ou por barras fixas do próprio módulo, em nenhuma rolagem; as barras fixas do módulo ficam acima do menu e o fim do conteúdo ganha folga igual à altura delas.
- RF12 (Primeira tela do detalhe): ao abrir uma tabela no celular, o valor cobrado (os degraus e a diária) e a ação **Editar** aparecem na primeira tela, sem rolagem, a 360 × 640 px.
- RF13 (Filtros visíveis): todas as opções de situação ficam visíveis ou claramente alcançáveis, sem opção cortada pela borda da tela.
- RF14 (Cadastro curto no celular): no cadastro, a ação de avançar/salvar e o resumo da tabela ficam sempre à vista ou a um toque, sem exigir rolar o formulário inteiro; o resumo não mostra como "preenchido" o que ainda é padrão não editado.

## Fora de escopo
- Mudar regras de negócio, campos, validações ou o que é enviado e recebido do servidor.
- Novas funcionalidades (excluir, duplicar, ativar/desativar pela lista, histórico de alterações, linha do tempo de vigências, vínculo de empresa conveniada).
- Cálculo oficial de cobrança: a estimativa continua sendo só uma estimativa.
- Implementar os 3 modelos: apenas o escolhido será implementado, em etapa posterior.
- Mudar permissões de acesso ao módulo.

## Critérios de aceite
- [x] São apresentados 3 modelos de layout distintos, cada um cobrindo lista, detalhe com simulador, cadastro/edição e estados, em versão celular e versão computador, com prós e contras.
- [x] Nenhuma funcionalidade listada em RF2 a RF8 ficou de fora de qualquer um dos modelos.
- [x] Em cada modelo, o usuário vê o que a tabela cobra sem precisar de mais de um toque após escolher a tabela.
- [x] Em cada modelo, as ações principais (Novo preço, Editar, Avançar/Salvar) ficam ao alcance do polegar no celular.
- [x] Nenhum modelo exige rolagem horizontal a partir de 360 px de largura.
- [x] Em cada modelo, o menu inferior e o botão "Entrada" nunca cobrem conteúdo ou ação do módulo (RF11).
- [x] Em cada modelo, a primeira tela do detalhe a 360 × 640 px já mostra os valores cobrados e **Editar** (RF12).
- [x] Em cada modelo, nenhuma opção de filtro fica cortada (RF13) e o cadastro mantém a ação principal e o resumo ao alcance sem rolar o formulário todo (RF14).
- [x] O usuário escolhe um modelo e a escolha fica registrada no design da feature antes de seguir para o tech spec.
- [ ] Os modelos respeitam acessibilidade (WCAG 2.2 AA): contraste, alvos de toque, foco por teclado e leitura por leitor de tela.

## Métricas de sucesso
- Menos toques para conferir o valor de uma tabela no celular.
- Menos tempo para achar uma tabela e simular uma cobrança.
- Mais cadastros e ajustes de preço concluídos pelo celular, com menos abandono antes de salvar.

## Pontos em aberto
- **Imagem em `docs/specs`**: o arquivo `WhatsApp Image 2026-11-07 at 16.50.36.jpeg` mostra a barra de navegação inferior (Pátio, Caixa, Entrada, Saída, Mais), não a gestão de preços; foi tratado como referência do menu inferior (RF11), não como layout deste módulo.
- **Resumo na lista**: resolvido na leitura do código: a listagem já carrega as tabelas completas, com faixas, diária e regras; o resumo de valores por item não exige chamada nova.
- **Uso por perfil**: confirmar a proporção de uso em celular e computador para definir qual versão recebe mais acabamento.
- **Escolha do modelo**: definir quem decide e como (reunião ou aprovação por escrito) para destravar o tech spec.
