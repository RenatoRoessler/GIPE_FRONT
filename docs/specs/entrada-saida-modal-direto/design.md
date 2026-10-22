# Design Spec: Entrada e Saída direto no modal

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Mudança pequena em telas e componentes existentes: não é um redesenho. Segue `claude-design` (tokens em `src/styles/theme.ts`, componentes em `src/components/ui`) e o contexto de `PRODUCT.md`. Os modais de entrada e de saída não mudam; muda só **o que acontece ao tocar** nos itens do menu.

## Direção

Modo **Operate**. Entrada e Saída são ações, não lugares: o toque abre a janela de trabalho e, ao fechar, o operador volta exatamente onde estava. Nada de página intermediária, nada de ornamento novo. Os itens continuam com a mesma aparência (placa no pórtico, aba na barra inferior, linha no painel), mas passam a ser botões em vez de links.

## Componentes do design system

### Reaproveitados
`EntradaVeiculoModal` e `SaidaVeiculoModal` (inalterados), `Toast` (aviso de sucesso), `DiscButton` (botões do Início), os estilos atuais do pórtico (`NavSign`), da barra inferior e do painel do Menu.

### Novos
Nenhum componente visual novo. Um **host dos modais** (sem aparência própria) fica montado no layout da área logada e abre o modal pedido por qualquer item do menu, botão ou link; detalhes no Tech Spec.

## Tokens usados

Nenhum token novo; nenhum valor visual muda.

## Itens do menu (comportamento)

### Pórtico do computador
- "Entrada de Veículos" e "Saída de Veículos" continuam como placas com a mesma aparência, mas viram botões (`<button type="button">`): Enter e Espaço acionam.
- Nunca ficam no estado "página atual" (placa branca com texto azul), pois não há página.
- `aria-haspopup="dialog"` indica que abrem uma janela.

### Barra inferior do celular
- As abas **Entrada** e **Saída** viram botões com o mesmo visual; sem estado ativo.
- **Início** continua link e **Menu** continua botão do painel.
- O item **Menu** fica destacado em qualquer tela que não seja o Início (antes: só fora de Início, Entrada e Saída), já que Entrada e Saída não são mais telas.

### Painel do Menu (celular)
- As linhas "Entrada de Veículos" e "Saída de Veículos" viram botões com o mesmo visual das demais linhas.
- Ao tocar, o painel fecha e, em seguida, o modal abre; nunca os dois ao mesmo tempo na tela.

## Modal aberto a partir do menu

- Abre por cima da tela atual, com o mesmo comportamento de hoje (foco preso, Esc, fundo escurecido, tela cheia no celular).
- Ao fechar (concluir, cancelar ou Esc), o foco volta ao item que o abriu; quando o item estava no painel do Menu (já fechado), volta ao botão **Menu** da barra.
- O aviso de sucesso (`Toast`) aparece no topo, como hoje, depois que o modal fecha; some sozinho.
- Só um modal por vez: enquanto um está aberto, o resto da tela fica inerte, então não há como abrir o outro.

### Estados
- **Padrão:** itens como botões, sem destaque de "página atual".
- **Aberto:** modal visível; item de origem com foco guardado.
- **Sucesso:** modal mostra o recibo (como hoje); ao concluir, fecha e o aviso aparece.
- **Cancelado / erro / carregando:** inalterados, tratados dentro dos modais.

## Acessibilidade

- Itens que abrem modal são `<button>`, não links, com `aria-haspopup="dialog"`; leitores de tela os anunciam como botões que abrem uma janela.
- Teclado: Enter e Espaço acionam; o foco volta ao item de origem ao fechar o modal.
- O estado "página atual" (`aria-current`) deixa de existir nesses itens e segue nos demais.
- Alvos de toque de pelo menos 44px, como hoje.

## Responsividade

- **Computador:** pórtico com as placas; o modal abre centralizado.
- **Celular e tablet:** barra inferior e painel; o modal abre em tela cheia (comportamento atual dos modais).
- A troca entre os dois acontece em `breakpoints.lg`, como já está.
