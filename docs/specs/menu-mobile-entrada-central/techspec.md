# Tech Spec: Menu Mobile com Entrada em Destaque no Centro

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e registra as decisões de componente)

## Design
- Telas/estados: os de `design.md` (barra de cinco posições, aba atual, Mais atual, botão de Entrada, carregando, perfil sem pátio com a barra atual).
- Componentes do design system reaproveitados: `NavIcon` (ícones das abas), `MaisTabIcon`, `Skeleton`, `MenuSheet`, `IconPill` (também como espaçador, ver abaixo) e tokens do tema. Nada novo em `src/components/ui`: a barra é específica do layout.
- Componentes novos (em `src/components/layout/BottomNav`): `EntradaButton` e `PlusTabIcon` (em `BottomBarIcons.tsx`).
- Tokens de tema criados (em `src/styles/theme.ts`): `colors.navBar`, `colors.navActive`, `layout.bottomNavOverhang`, `layout.entradaButtonSize`, `layout.bottomNavMaxWidth` e `layout.bottomNavReserved` (este último não está no `design.md`: é a decisão do Tech Spec sobre o espaço reservado).

## Arquitetura da solução

### Dados (`src/lib/nav.ts`)
- `BARRA_FIXA = ["/patio", "/caixa", "entrada", "saida"]`: as chaves (`navItemKey`) das quatro posições fixas, na ordem visual. A Entrada é a terceira de cinco, o centro, porque o Mais fecha a fila.
- `montarBarraFixa(perfil): { itens: NavItem[]; excedentes: NavItem[] } | null`:
  - Procura em `navItemsPermitidos(perfil)` cada chave de `BARRA_FIXA`. Se **qualquer uma** faltar, devolve `null`: o perfil não tem o pátio (Conveniada, Carimbo, sem perfil) e usa a barra adaptativa atual.
  - Senão, `itens` são os quatro, na ordem de `BARRA_FIXA`, e `excedentes` é o resto das permitidas, já na ordem do menu (é o filtro de `NAV_ITEMS`, que preserva a ordem).
- `dividirItensDaBarra`, `navItemsPorPrioridade`, `BAR_PRIORITY`, `isMaisAtivo` e `ordenarPeloMenu` ficam como estão, para a barra adaptativa. Um teste garante que `BARRA_FIXA` e `BAR_PRIORITY` têm as mesmas chaves, para as duas barras não divergirem.
- Todo-ou-nada em vez de "posição vazia": hoje os quatro itens têm os mesmos perfis (`permissoes.ts`: Administrador, Gerente, Caixa, Manobrista), então só existem os dois casos. A posição vazia do ponto em aberto do design fica para quando houver um perfil intermediário.

### Tema (`src/styles/theme.ts`)
- `ThemeColors` ganha `navBar` e `navActive`, preenchidos nos dois temas com os valores do `design.md` (claro `#ECE8DA` e `#DCD6C5`; escuro `#16223A` e `#2C3B58`).
- Em `shared.layout`: `bottomNavOverhang: "20px"`, `entradaButtonSize: "56px"`, `bottomNavMaxWidth: "560px"`. As constantes numéricas da altura (64) e do overhang (20) sobem para constantes locais do arquivo, e `bottomNavReserved` é `${64 + 20}px` ("84px"): altura que a barra ocupa **incluindo** o botão que sobressai. Evita escrever a soma em seis lugares e deixa um só número para mudar.
- Comentário em cada token, como os demais de `layout`.

### Espaço reservado (trocar `bottomNavHeight` por `bottomNavReserved`)
Todos reservam espaço acima da barra e, com o botão sobressaindo 20px, precisam da altura total:
- `src/components/layout/AppShell/AppShell.styles.ts` (folga do fim da página).
- `src/components/conferencia/Conferencia.styles.ts` (`Rodape` sticky).
- `src/components/mensalistas/Mensalistas.styles.ts` (botão flutuante).
- `src/components/ui/PainelCadastro/PainelCadastro.styles.ts` (painel sticky).
- `src/components/precos/PrecosMasterDetail/PrecosMasterDetail.styles.ts` (altura do painel em tablet).
- `Sheet` em `BottomNav.styles.ts` (posição e `max-height` do painel em `md`+, que não pode cobrir o botão).

`bottomNavHeight` passa a ser usado só pela própria barra (`BarInner`). Os `calc()` e `env(safe-area-inset-bottom)` continuam iguais.

### Componentes (`src/components/layout/BottomNav`)
- `BottomNav.tsx` (Client Component, já é):
  - Calcula `fixa = useMemo(() => montarBarraFixa(user?.perfil), [user?.perfil])`.
  - `{ visiveis, excedentes }`: se `fixa`, usa `fixa.itens`/`fixa.excedentes`; senão, como hoje (`dividirItensDaBarra` com a capacidade medida, vazio enquanto `capacidade === null`).
  - `carregando = isLoading || (!fixa && capacidade === null)`: no modo fixo não depende da medição de largura, então não espera por ela.
  - Passa `entradaEmDestaque={Boolean(fixa)}` ao `BottomBar`. O resto (painel, foco, ação pendente, Esc) não muda; `useBarCapacity` continua medindo para o modo adaptativo.
- `BottomBar.tsx` (Client Component):
  - Nova prop `entradaEmDestaque: boolean`. Com ela, `BarInner` usa cinco colunas fixas (`$slots = 5`, `$fixa`) e largura máxima `bottomNavMaxWidth`; sem ela, o comportamento atual.
  - No laço dos itens, o item de ação `entrada` vira `<EntradaButton>` quando `entradaEmDestaque`; os demais itens usam o desenho de hoje. A ordem vem pronta de `montarBarraFixa`.
  - Se `entradaEmDestaque` e não houver Mais (`temMais` falso), renderiza uma célula vazia (`aria-hidden`) no fim, para a Entrada continuar no centro.
  - Esqueleto de carregamento: cinco espaços (era quatro), com círculo no centro. Quatro viravam um salto de layout para o perfil operacional, e cinco é a contagem da barra compacta do outro modo.
- `EntradaButton.tsx` (novo, Client Component por causa do `onClick`; sem estado próprio):
  - `<TabButton>` com `type="button"`, `aria-haspopup="dialog"`, `onClick={onClick}`, nome "Entrada" (de `shortLabel`).
  - Dentro: um `IconPill` vazio e transparente como **espaçador** (mesmas dimensões das pílulas das outras abas, para o nome cair exatamente na mesma linha de base sem número mágico), o `TabLabel` e o círculo (`EntradaCircle`) posicionado de forma absoluta sobre o espaçador, com `top: calc(-1 * overhang)` e centralizado na horizontal. Como o círculo é filho do botão, a área de toque inclui a parte que sobressai e o nome.
  - O nome usa a cor `accent` em bold.
- `BottomBarIcons.tsx`: `PlusTabIcon` (28px, traço 2.6, `aria-hidden`), no estilo do `MaisTabIcon`.
- `BottomNav.styles.ts`:
  - `Bar`: fundo `navBar` (era `surface`). O filete em `box-shadow` fica.
  - `BarInner`: aceita `$fixa` para a largura máxima.
  - `itemStyles`: remove o filete amarelo (`::before`) da aba ativa; o hover passa a `navActive`.
  - `IconPill`: fundo ativo `navActive` (era `primarySoft`).
  - `EntradaCircle`: `entradaButtonSize` de diâmetro, `radii.full`, fundo `primary`, cor `onPrimary`, `border: 2px solid accent`, `shadows.sm`; `:active` com `transform: scale(0.96)` só dentro de `@media (prefers-reduced-motion: no-preference)`. Foco por teclado: o `outline` do `TabButton` vai para o círculo (`&:focus-visible` no pai mira o filho) com `outline-offset: 2px`.
- `MenuSheet.tsx` e `index.ts`: sem mudança.

### Tipos
Sem tipos novos fora de `nav.ts` (o retorno de `montarBarraFixa` é um tipo inline). `AppTheme` recebe os tokens por herança de `shared` e `ThemeColors`.

## Decisões e trade-offs
- **Modo fixo decidido por perfil, não por largura.** O PRD pede as mesmas cinco posições em qualquer largura de celular. Manter a lógica de capacidade só no modo adaptativo evita mexer em `dividirItensDaBarra` e nos seus 22 testes, e mantém o comportamento dos perfis que não têm o pátio.
- **Todo-ou-nada** para os quatro itens (acima): menos código agora, sem perder nada hoje.
- **Espaçador com `IconPill`** em vez de calcular `padding-bottom`: o nome do botão central acompanha qualquer mudança futura da pílula das outras abas.
- **Um token `bottomNavReserved`** em vez de somar altura e overhang em seis lugares. Contrapartida: perfis que usam a barra adaptativa (sem botão) ganham 20px a mais de folga no fim da página. É pequeno, só no celular, e evitar o token por perfil exigiria uma variável CSS dependente de estado; não vale a complexidade.
- **Borda `accent`** no círculo para obter o contorno do tema claro sem condicional por tema: no escuro `accent` é o próprio amarelo e a borda some.
- **Sem animação nova** além da escala ao pressionar, protegida por `prefers-reduced-motion`.
- **Barra de largura total** (não flutuante): o design assumiu isso; se mudar, é só estilo de `Bar`/`BarInner`.

## Testes e verificação
- `src/lib/nav.test.ts`: `montarBarraFixa` para um perfil operacional (ordem Pátio, Caixa, Entrada, Saída; excedentes sem esses quatro e na ordem do menu), para Conveniada e Carimbo (`null`) e para perfil nulo (`null`); `BARRA_FIXA` e `BAR_PRIORITY` com as mesmas chaves.
- `BottomBar.test.tsx`: com `entradaEmDestaque`, cinco colunas e a Entrada em terceiro; a Entrada é botão com nome "Entrada", abre a ação certa e nunca é `aria-current`; sem Mais, uma célula vazia mantém as cinco colunas; esqueleto com cinco espaços. Os testes atuais seguem valendo sem a prop.
- `BottomNav.test.tsx`: perfil operacional mostra Pátio, Caixa, Entrada, Saída e Mais com capacidade estreita **e** larga; o painel não repete os quatro; perfil Conveniada continua com a barra adaptativa e sem círculo.
- Se houver teste do tema, incluir os tokens novos.
- Verificação manual com a skill `run` em 375px, 320px, 768px e 1023px, tema claro e escuro: botão sem corte, centro exato, nada coberto no fim das telas (incluindo Mensalistas, Conferência, Preços e cadastros) e painel "Mais" sem cobrir o botão em `md`+.
- `npm run lint` e `npm run build` antes de fechar.

## Riscos / pontos de atenção
- **Seis pontos de espaço reservado**: esquecer um deixa o botão cobrindo conteúdo naquela tela. A lista acima é a busca por `bottomNavHeight`; conferir de novo com `grep` ao final.
- **Teclado de toque** (`keyboardZIndex: 50`) e o `--teclado-altura` do `AppShell` somam-se à folga: o novo valor entra no mesmo `calc`, sem outra mudança.
- **Foco no círculo**: o `outline` mira o filho a partir do estado do pai; validar o anel de foco com Tab nos dois temas.
- **Cores aproximadas** da imagem de referência; ajustar a olho, só nos tokens.
- **Safari/iOS**: o círculo sobe para fora da barra, então a área segura de baixo não o afeta, mas vale conferir o toque na parte que sobressai.

## Fora de escopo técnico
- Barra flutuante com margem e cantos arredondados.
- Posição vazia para perfis com parte dos quatro itens (nenhum perfil hoje).
- Permissão por perfil dos itens do painel e qualquer mudança no menu do computador.
- Mudar a lógica de capacidade (`useBarCapacity`, `dividirItensDaBarra`).
