# PRD: Entrada e Saída Direto no Modal

## Problema
Hoje, para registrar uma entrada ou uma saída, o operador toca em "Entrada de Veículos" ou "Saída de Veículos" no menu, espera abrir uma página que só tem um título, uma frase e um botão, e então toca nesse botão para abrir o modal onde o trabalho acontece. É um toque e uma tela a mais em duas das ações mais repetidas do dia, e a página não oferece nada além do botão. Quem está no meio de outra tela (por exemplo, no Pátio) também perde o contexto para registrar um veículo.

## Objetivo
Tocar em Entrada ou Saída no menu abre o modal correspondente na hora, por cima da tela em que o usuário está, sem passar por uma página própria.

## Usuário-alvo
Operadores (caixa, manobrista) que registram entradas e saídas o dia todo, no computador e no celular. Administradores e gerentes que registram um veículo ocasionalmente também se beneficiam.

## Requisitos funcionais
- RF1: Os itens "Entrada de Veículos" e "Saída de Veículos" do menu deixam de levar a uma página. Ao tocar neles, o modal de entrada ou de saída abre imediatamente, por cima da tela atual.
- RF2: Isso vale em todos os lugares onde o menu aparece: o menu do computador, a barra inferior do celular (itens Entrada e Saída) e a lista completa do painel Menu do celular.
- RF3: Ao abrir o modal pelo painel Menu do celular, o painel fecha e o modal fica visível sozinho, sem o painel por trás.
- RF4: O modal funciona exatamente como hoje (mesmos campos, regras, recibo e avisos de sucesso). Ao concluir ou cancelar, o usuário continua na mesma tela em que estava.
- RF5: Se a tela atual mostra dados afetados pelo registro (por exemplo, a lista do Pátio), ela se atualiza depois de registrar, como já acontece hoje.
- RF6: As páginas "Entrada de Veículos" e "Saída de Veículos" deixam de existir. Quem abrir os endereços antigos (por favoritos ou links salvos) é levado ao Início, sem erro.
- RF7: Os botões e links que hoje levam a essas páginas passam a abrir o modal direto: o link "Registrar entrada" do Pátio, e os botões "Registrar entrada" e "Registrar saída" do Início continuam funcionando.
- RF8: Como Entrada e Saída deixam de ser telas, elas não ficam "marcadas como página atual" no menu nem na barra inferior. A marcação segue valendo para as demais telas.

## Fora de escopo
- Mudar o conteúdo, os campos ou o fluxo dos modais de entrada e de saída.
- Mudar a ordem ou o nome dos itens do menu.
- Atalhos de teclado para abrir os modais.
- Esconder os itens do menu conforme a permissão do perfil.

## Critérios de aceite
- [ ] Tocar em Entrada ou Saída no menu do computador abre o modal correspondente por cima da tela atual, sem trocar de página.
- [ ] O mesmo vale para a barra inferior e para a lista do painel Menu no celular; nesse caso o painel fecha e só o modal fica à vista.
- [ ] Depois de registrar ou cancelar, o usuário continua na tela em que estava.
- [ ] Registrar uma entrada ou uma saída com o Pátio aberto atualiza a lista do Pátio.
- [ ] Os endereços `/veiculos/entrada` e `/veiculos/saida` levam ao Início.
- [ ] O link "Registrar entrada" do Pátio e os botões do Início abrem o modal.
- [ ] Entrada e Saída não aparecem como "página atual" no menu e na barra inferior; Início, Caixa, Pátio e as demais continuam marcadas ao serem visitadas.
- [ ] Funciona por teclado: os itens são acionáveis com Enter e Espaço, e ao fechar o modal o foco volta para o item que o abriu.

## Métricas de sucesso (se aplicável)
Sem métricas numéricas. Sucesso = registrar uma entrada ou saída a partir de qualquer tela com um toque no menu, sem passar por página intermediária.

## Pontos em aberto
- Endereços antigos: este PRD assume redirecionar para o Início (RF6). Se preferir outro destino, ou abrir o modal ao chegar por esse endereço, é uma mudança pequena.
