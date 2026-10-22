# Design Spec: Menu inferior no celular

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. A direção foi escolhida pelo usuário entre cinco propostas (`opcoes-layout.html`, opção 2, "Barra limpa"). Segue `claude-design` (tokens em `src/styles/theme.ts`, componentes em `src/components/ui`) e o contexto de `PRODUCT.md`.

## Direção

Modo **Operate**. A navegação precisa sumir da frente: o operador está de pé, com uma mão ocupada, e só quer chegar a Entrada ou Saída sem pensar. Por isso a barra é a convencional dos apps de celular (ícone e nome, aba atual em azul), sem ornamento. O sistema desktop tem personalidade (placas de sinalização num pórtico); aqui a ousadia fica de fora de propósito, e a identidade vem das cores, da fonte condensada nos títulos e do azul do tema.

## Componentes do design system

### Reaproveitados
`NavIcon` (ícones de início, entrada e saída), `useTheme`/tokens, o `<dialog>` nativo já usado pelo menu atual (foco preso, Esc e backdrop de graça).

### Novos (`src/components/layout`)
- **`BottomNav`**: a barra fixa e o painel do menu, juntos (o botão Menu controla o painel). Substitui o `MobileNav`.
- Itens e linhas do painel ficam em arquivos próprios dentro da mesma pasta (detalhes no Tech Spec).

### Removido
- O botão "Menu" do topo (`MobileNav`) e a variante `panel` do `NavSign`, que ficam sem uso.

## Tokens usados

Existentes: `colors.primary`, `primarySoft`, `background`, `surface`, `text`, `textMuted`, `border`, `steel`, `warn` (foco), `space`, `radii`, `fontSizes`, `fontWeights`, `typography.display` (título do painel), `shadows.md`, `breakpoints.lg`.

**Novo:** `layout.bottomNavHeight` (64px), em `theme.ts`, para a altura da barra ser a mesma no cálculo do espaço reservado, no botão flutuante e no painel.

## Barra (fechada)

- Fixa no rodapé, largura total, fundo `background`, borda superior de 1px em `border`. Aparece abaixo de `breakpoints.lg`, o mesmo ponto em que o pórtico some.
- Altura `bottomNavHeight` mais a área segura do aparelho (`env(safe-area-inset-bottom)`).
- Quatro colunas iguais. Cada item: ícone de 24px sobre o nome em 12px, peso médio, centralizados; alvo de toque com a coluna inteira (mínimo 44px).
- **Inativo:** ícone e nome em `textMuted`.
- **Ativo:** ícone e nome em `primary`; atrás do ícone, uma pílula (52×30px) em `primarySoft`; no topo do item, uma marca de 3px em `primary`, centralizada, com cantos de baixo arredondados. O estado também é dito em texto para leitor de tela (`aria-current="page"`).
- **Menu ativo:** quando a rota atual não é Início, Entrada ou Saída, o item Menu usa o estilo ativo. Com o painel aberto, também.
- **Foco por teclado:** contorno de 3px em `warn` com anel escuro externo, como nos demais controles da área logada.
- Sem hover relevante (uso em toque); em desktop estreito com mouse, o hover escurece levemente o fundo do item.

## Painel do Menu (aberto)

- Folha que sobe da base, largura total, `background`, cantos superiores de 22px, sombra `md`, altura máxima de 82% da tela, rola por dentro quando necessário. O fundo da página escurece (backdrop).
- Alça decorativa no topo (40×5px, `steel`) e cabeçalho com o título "Menu" (fonte de display, caixa alta) e botão de fechar de 44×44px.
- Lista de todas as telas do sistema, uma por linha: ícone, nome e seta à direita; linhas de 48px, separadas por linhas finas em `border`. Mesma ordem e mesmos nomes do menu do computador.
- A tela atual fica com fundo `primarySoft` e texto `primary`, com `aria-current="page"`.
- O painel cobre a barra (fica por cima dela), então só há uma camada interativa por vez.

### Estados
- **Padrão:** barra visível, painel fechado.
- **Aberto:** painel visível, foco no painel, restante da tela inerte; Menu marcado como expandido.
- **Fechando:** ao escolher uma tela, a navegação acontece e o painel fecha; ao fechar sem escolher, o foco volta ao botão Menu.
- **Carregando / vazio / erro:** não se aplicam; a lista é fixa. O painel aparece mesmo se a tela atual ainda estiver carregando.
- **Movimento reduzido:** sem animação de subida; o painel só aparece.

## Espaço para o conteúdo

- O conteúdo ganha uma folga no fim igual à altura da barra mais a área segura, só abaixo de `lg`, para o rodapé (link da versão) ficar visível ao rolar.
- Botões flutuantes de página (por exemplo, "Novo mensalista") sobem a mesma altura, para ficarem acima da barra.
- Diálogos e modais em tela cheia ficam por cima da barra (camada superior do navegador), sem ajuste.

## Acessibilidade

- A barra é um `<nav>` com nome "Navegação principal"; itens são links (`<a>`), exceto Menu, que é um botão com `aria-haspopup="dialog"`, `aria-expanded` e `aria-controls`.
- Painel é um `<dialog>` modal com título associado; Esc e clique no fundo fecham; o foco volta ao botão Menu.
- O estado "página atual" é dado por `aria-current`, não só por cor.
- Contraste AA nos quatro temas (claro e escuro, normal e sinalização); alvos de toque de pelo menos 44px.
- Respeita `prefers-reduced-motion`.

## Responsividade

- **Abaixo de `lg` (1024px):** barra inferior. Em tablet, a barra continua com quatro colunas iguais, sem limite de largura.
- **A partir de `lg`:** a barra e o painel não existem; o pórtico continua como está.
- Em celular com barra de gestos (iPhone sem botão, Android moderno), a barra ganha o recuo da área segura para não ficar sob a barra de gestos.
