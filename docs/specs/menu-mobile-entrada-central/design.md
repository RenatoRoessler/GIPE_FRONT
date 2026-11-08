# Design Spec: Menu mobile com Entrada em destaque no centro

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` e da imagem de referência (`docs/specs/WhatsApp Image 2026-11-07 at 16.50.36.jpeg`). Segue `claude-design` (tokens em `src/styles/theme.ts`, componentes em `src/components/ui`) e o contexto de `PRODUCT.md`. Evolui a barra atual em `src/components/layout/BottomNav`; o painel "Mais" não muda.

## Direção

Modo **Operate**. A Entrada é a ação mais repetida do dia, então vira o **único ponto de cor** da barra: um botão amarelo no centro, no lugar mais fácil para o polegar. O resto da barra fica neutro e quieto. A ousadia está só em uma coisa (o botão que sobe acima da barra); nada mais disputa atenção.

Mudanças em relação à barra de hoje:
- A barra deixa de ser adaptativa no celular: são sempre **cinco posições fixas** (Pátio, Caixa, Entrada, Saída, Mais).
- O amarelo da aba ativa (filete no topo) sai: o amarelo passa a ser exclusivo da Entrada. A aba ativa usa só peso e uma pílula neutra.

## Telas/estados

### Barra, perfil operacional (Administrador, Gerente, Caixa, Manobrista)
Esses quatro perfis têm Pátio, Caixa, Entrada e Saída juntos, então a barra fica sempre completa.

| Posição | Item | Tipo |
|---|---|---|
| 1 | Pátio | link para `/patio` |
| 2 | Caixa | link para `/caixa` |
| 3 (centro) | Entrada | botão de destaque, abre o modal de entrada |
| 4 | Saída | botão, abre o modal de saída |
| 5 | Mais | botão, abre o painel |

Estados de cada item:
- **Padrão:** ícone e nome em `textMuted`, peso medium.
- **Atual** (Pátio e Caixa; Mais quando a tela está só no painel, ou com o painel aberto): ícone e nome em `text`, nome em bold, pílula atrás do ícone em `navActive`. Sem filete amarelo. `aria-current="page"` nos links.
- **Entrada e Saída** nunca ficam "atuais": abrem modal, não são telas (comportamento atual).
- **Foco por teclado:** contorno de 2px em `focus`, como hoje.
- **Pressionado:** o fundo do item escurece levemente (hover só em dispositivos com mouse, como hoje); o botão de Entrada reduz a escala para 0.96, só sem `prefers-reduced-motion`.
- **Carregando** (sessão ou largura): cinco espaços com `Skeleton`; no centro, um círculo, sem sobressair.

### Botão de Entrada (centro)
- **Círculo de 56px** em `primary` com o sinal de **+** em `onPrimary` (traço 2.6, 28px). Não usa o ícone de seta do menu: aqui o "+" diz "registrar nova entrada".
- **Sobressai 20px acima da borda superior da barra.** O centro do círculo fica alinhado com o topo da barra mais 8px. O nome "Entrada" fica na mesma linha de base dos nomes dos outros itens.
- **Tema claro:** borda de 2px em `accent` (azul-marinho), que dá o contorno firme da referência. **Tema escuro:** a mesma regra de borda com `accent` (amarelo) se funde ao preenchimento, então não há contorno visível, como na referência. Sem exceção de código por tema.
- **Nome "Entrada":** `accent`, bold (amarelo no escuro, azul-marinho no claro). Contraste ok nos dois temas.
- Sombra `shadows.sm` para descolar o círculo da barra.
- Nome acessível "Entrada" e `aria-haspopup="dialog"`, como hoje.

### Perfil sem acesso ao pátio (Conveniada e Carimbo)
Esses perfis não têm Pátio, Caixa, Entrada nem Saída. Para eles **nada muda**: continua a barra adaptativa atual (itens por prioridade e "Mais"), sem botão em destaque. A barra de cinco posições só vale quando o perfil tem a Entrada. Isso responde ao ponto em aberto do PRD.

### Painel "Mais"
Sem mudança visual. Passa a listar tudo que o perfil pode abrir e **não está na barra**: ou seja, tudo menos Pátio, Caixa, Entrada e Saída, na ordem do menu. Conferência de pátio, Carimbar ticket, Dashboard, Preços, Usuários e os demais ficam aqui. A versão no rodapé continua.

## Componentes

### Reaproveitados
`NavIcon` (ícones das abas), `MaisTabIcon`, `Skeleton`, `MenuSheet`, `useTheme` e os tokens. O painel e a lógica de foco/devolução de foco em `BottomNav.tsx` ficam.

### Novos ou alterados (`src/components/layout/BottomNav`)
- **`BottomBar`:** ganha um modo de cinco posições fixas (grade de 5 colunas iguais) para perfis com Entrada; o modo adaptativo atual continua para os demais.
- **`EntradaButton`** (novo, no mesmo diretório): o botão central. Fica em arquivo próprio porque tem forma, sobreposição e estados diferentes das abas comuns.
- **`PlusTabIcon`** (em `BottomBarIcons.tsx`): ícone "+" próprio da barra, como já é o `MaisTabIcon`. Não vai para `NavIconId`, pois não é um item do menu.
- Estilos em `BottomNav.styles.ts`: remover o filete amarelo da aba ativa, trocar o fundo da pílula e da barra pelos tokens novos, e adicionar o estilo do botão central.

Nada novo em `src/components/ui`: a barra é específica do layout e não é reaproveitada fora dele.

## Tokens

### Existentes
`colors.primary`, `onPrimary`, `accent`, `text`, `textMuted`, `focus`, `border`, `shadows.sm`, `space`, `radii.full`, `fontSizes.xs`, `fontWeights`, `layout.bottomNavHeight`, `layout.touchTarget`, `breakpoints.lg`.

### Novos (em `theme.ts`)
- `colors.navBar`: fundo da barra. Claro `#ECE8DA` (bege da referência, igual ao `surfaceMuted` de hoje); escuro `#16223A` (igual ao `surface`).
- `colors.navActive`: pílula da aba atual. Claro `#DCD6C5` (bege mais escuro); escuro `#2C3B58` (azul-marinho mais claro). Decorativa: o estado também vem do texto em bold e da cor.
- `layout.bottomNavOverhang`: `20px`, quanto o botão da Entrada sobressai acima da barra. Fica no tema porque o espaço reservado do conteúdo precisa somá-lo.
- `layout.entradaButtonSize`: `56px`, diâmetro do botão.
- `layout.bottomNavMaxWidth`: `560px`, largura máxima do conteúdo da barra em tablets, para os cinco itens não ficarem muito afastados. O centro continua sendo o da tela.

Valores de cor são ponto de partida tirado da imagem; ajustar a olho na implementação, mantendo os nomes.

## Responsividade

- A barra aparece abaixo de `breakpoints.lg`, igual a hoje; em tela larga continua oculta.
- Cinco colunas iguais, em qualquer largura. Em celular de 320px cada coluna tem 64px, suficiente para os nomes curtos (o mais longo é "Entrada"/"Saída"/"Caixa"/"Pátio"/"Mais") e para o alvo de 44px. O botão de Entrada tem 56px, dentro da coluna.
- Em tablet, a grade para em `bottomNavMaxWidth` e fica centralizada; o fundo `navBar` continua em largura total.
- A barra respeita `env(safe-area-inset-bottom)`, como hoje. O botão sobressai para cima, então não é cortado pela área segura.
- **Espaço reservado:** hoje o conteúdo e os elementos fixos somam `layout.bottomNavHeight`. Passam a somar também `layout.bottomNavOverhang` para o botão não cobrir conteúdo. Pontos afetados: `AppShell.styles.ts`, `Conferencia.styles.ts`, `Mensalistas.styles.ts` (botão flutuante), `PainelCadastro.styles.ts`, `PrecosMasterDetail.styles.ts` e o posicionamento do painel `Sheet` em `BottomNav.styles.ts`. O Tech Spec decide se isso vira um token único calculado (ex.: altura total ocupada), em vez de somar nos seis lugares.
- Tema claro e escuro cobertos pelos tokens. Movimento: só a escala de 0.96 ao pressionar, e ela some com `prefers-reduced-motion`.

## Acessibilidade

- Alvos de toque de pelo menos 44px: as colunas têm 64px de largura e 64px de altura; o círculo tem 56px.
- A área tocável do botão de Entrada inclui o nome abaixo dele, para ser mais fácil de acertar.
- Ordem de tabulação igual à ordem visual: Pátio, Caixa, Entrada, Saída, Mais.
- Contraste: `textMuted` sobre `navBar` e `accent` sobre `navBar` passam de 4,5:1 nos dois temas; "+" em `onPrimary` sobre `primary` passa de 7:1.

## Pontos em aberto para o Tech Spec

- A referência mostra a barra com cantos arredondados, mas pode ser só a moldura do mockup. Esta spec mantém a barra colada nas bordas, de largura total, como hoje. Se o usuário quiser a barra "flutuante" com margem e cantos arredondados, é ajuste de estilo, sem mudar a estrutura.
- Se o mapeamento `AREA.Patio`/`AREA.Caixa` deixar de ser igual no futuro (perfil com Pátio mas sem Caixa), a regra proposta é manter uma posição vazia, sem deslocar a Entrada. Hoje os quatro itens têm os mesmos perfis, então não acontece.
