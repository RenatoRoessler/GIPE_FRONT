# PRD: Reformulação do Layout (Modelo B — Sinalização viária)

## Problema
O layout atual da área logada (menu lateral recolhível, header simples e visual neutro) funciona, mas não tem identidade própria nem expressa o universo do produto: estacionamento e trânsito. Foi escolhida, entre os modelos de layout avaliados, a direção "Modelo B — Sinalização viária" (`docs/design/layouts/modelo-b-sinalizacao.html`), que traduz a interface em placas de trânsito, e o sistema precisa ser alinhado a ela.

## Objetivo
Ao final, toda a área logada do GIPE deve ter a aparência e a estrutura de navegação do Modelo B: navegação no topo em formato de pórtico com placas, header e rodapé no estilo do modelo, tipografia e paleta de sinalização, nos temas claro e escuro, com uma versão mobile que mantenha a mesma linguagem de placas.

## Usuário-alvo
Qualquer usuário autenticado do GIPE (admin, gerente, caixa, manobrista), em desktop, tablet ou celular (~375px), principalmente em contexto operacional, com pressa e às vezes sob luz forte, em que clareza e contraste importam.

## Requisitos funcionais

### Navegação (pórtico de placas)
- RF1: A navegação principal deixa de ser um menu lateral e passa a ser uma faixa horizontal no topo da área de conteúdo, logo abaixo do header, apresentada como um pórtico: uma barra de aço com as opções penduradas como placas azuis.
- RF2: Cada opção é uma placa com ícone e rótulo, contendo todos os itens de navegação atuais (Gestão de Preços, Gestão de Usuários, Entrada de Veículos, Saída de Veículos, Relatórios, Minha Empresa) mais o acesso ao Início (dashboard).
- RF3: A placa da página atual deve ser claramente distinguível das demais (placa invertida: fundo branco, texto e borda azuis). Hover e foco por teclado também devem ter estado visível.
- RF4: Em telas largas, as placas dividem o espaço disponível. Quando não couberem, a faixa rola horizontalmente sem quebrar o layout.
- RF5: O menu lateral atual (incluindo comportamento de expandir ao passar o mouse e o overlay) é removido.

### Responsividade da navegação (mobile)
- RF6: Em telas pequenas, a navegação deve ter uma versão própria, também alusiva a placas de trânsito. Ela não pode ser só uma redução do pórtico desktop.
- RF7: Em mobile, o usuário deve acessar todas as opções de navegação com poucos toques. A opção da página atual deve estar sempre identificável e a navegação deve poder ser fechada sem escolher nada.
- RF8: Os alvos de toque em mobile devem ser confortáveis para uso com uma mão e em movimento.
- RF9: A navegação mobile deve funcionar com teclado e leitor de tela (foco gerenciado, rótulos acessíveis, fechamento por Esc).

### Header
- RF10: O header exibe a logo do GIPE à esquerda, a saudação ao usuário ("Olá, <nome>"), o alternador de tema claro/escuro e o acesso ao menu do usuário (Editar Usuário e Sair) representado por um avatar circular com as iniciais.
- RF11: Em telas pequenas, a saudação por extenso pode ser omitida para dar espaço, mantendo logo, tema e avatar.
- RF12: Em tema escuro, a logo deve continuar legível.

### Rodapé
- RF13: A área logada passa a ter um rodapé fixo ao final do conteúdo, com a versão do sistema alinhada à direita, que leva à página de atualizações.

### Identidade visual
- RF14: A área logada adota a paleta de sinalização do modelo (azul de indicação, amarelo de advertência, branco, aço) e a tipografia do modelo (display condensada em caixa alta para títulos e placas, e uma família sem serifa para o texto corrido), nos temas claro e escuro.
- RF15: Os títulos de página seguem o estilo do modelo (caixa alta, condensados e em destaque).
- RF16: Os componentes de interface existentes (botões, campos, cards, tabelas, mensagens e demais) devem ser coerentes com a nova linguagem, para que nenhuma tela da área logada pareça pertencer ao layout antigo.
- RF17: O contraste de texto, estados de foco e movimento reduzido seguem os mesmos cuidados do modelo (foco com contorno amarelo bem visível; animações desligadas quando o usuário preferir menos movimento).

### Conteúdo das telas
- RF18: O conteúdo funcional das telas existentes não muda. Esta entrega altera apresentação e navegação, não regras de negócio nem fluxos.
- RF19: O dashboard continua sendo a tela de boas-vindas simples, apresentada na nova linguagem visual.

## Fora de escopo
- Telas públicas e de autenticação (login, adesão, recuperação de senha), que seguem o visual atual nesta versão.
- Os blocos de dados do modelo no dashboard (vagas livres, avisos de atenção, movimentação recente, entradas por hora, atalhos de registro). Os dados de exemplo do modelo não devem ser reproduzidos como se fossem reais.
- Mudanças de regra de negócio, rotas, permissões ou conteúdo das telas.
- Novos itens de navegação ou controle de acesso por perfil.
- Redesenho da página de atualizações além da adoção da nova linguagem visual.

## Critérios de aceite
- [ ] Na área logada em desktop, a navegação é um pórtico de placas abaixo do header e o menu lateral não existe mais.
- [ ] Todos os itens de navegação (Início + 6 atuais) estão presentes como placas e levam à rota correta.
- [ ] A placa da página atual é visualmente diferente das demais e tem `aria-current` indicado para tecnologias assistivas.
- [ ] Com muitas placas e pouca largura, a faixa rola horizontalmente sem quebrar o layout nem gerar rolagem horizontal da página.
- [ ] Em ~375px, a navegação usa a versão mobile em formato de placas, dá acesso a todos os itens, destaca o atual e pode ser fechada (toque fora, botão e Esc).
- [ ] A navegação funciona só com teclado, com ordem de foco lógica e foco visível.
- [ ] O header mostra logo, saudação, alternador de tema e avatar com iniciais; o menu do usuário mantém "Editar Usuário" e "Sair" funcionando.
- [ ] O rodapé exibe a versão do sistema e leva à página de atualizações.
- [ ] Tema claro e escuro se parecem com os dois temas do modelo, e a logo é legível nos dois.
- [ ] Todas as telas da área logada existentes continuam funcionando e sem componente visualmente "antigo" ou quebrado.
- [ ] Nenhuma tela da área logada apresenta rolagem horizontal da página em 375px, 768px e 1280px.
- [ ] Contraste de texto cumpre WCAG AA nos dois temas.

## Métricas de sucesso
- Aprovação visual do resultado pelo responsável do produto em comparação com o Modelo B.
- Sem regressões funcionais nas telas da área logada (fluxos existentes seguem passando nos testes).
