# Tasks: Menu Mobile com Entrada em Destaque no Centro

Referências: ./prd.md, ./techspec.md (e ./design.md para valores visuais)

- [x] T1 — Criar os tokens de tema: `colors.navBar` e `colors.navActive` nos dois temas (claro `#ECE8DA` e `#DCD6C5`; escuro `#16223A` e `#2C3B58`) e, em `layout`, `bottomNavOverhang` (20px), `entradaButtonSize` (56px), `bottomNavMaxWidth` (560px) e `bottomNavReserved` (altura da barra mais o overhang, 84px, a partir de constantes locais). Cada token com comentário, como os demais.
  - Arquivos: `src/styles/theme.ts` (e o teste do tema, se existir)
  - Pronto quando: `npm run lint` e o type-check passam; os tokens aparecem tipados em `useTheme()`; `bottomNavHeight` continua com 64px.

- [x] T2 — Trocar `bottomNavHeight` por `bottomNavReserved` nos pontos que reservam espaço acima da barra: `AppShell`, `Conferencia` (`Rodape`), `Mensalistas` (botão flutuante), `PainelCadastro`, `PrecosMasterDetail` e o `Sheet` (posição e `max-height` em `md`+). Os `calc()` e a área segura ficam iguais.
  - Arquivos: `src/components/layout/AppShell/AppShell.styles.ts`, `src/components/conferencia/Conferencia.styles.ts`, `src/components/mensalistas/Mensalistas.styles.ts`, `src/components/ui/PainelCadastro/PainelCadastro.styles.ts`, `src/components/precos/PrecosMasterDetail/PrecosMasterDetail.styles.ts`, `src/components/layout/BottomNav/BottomNav.styles.ts`
  - Pronto quando: `grep bottomNavHeight src` (sem testes) só encontra o tema e o `BarInner`; testes existentes desses componentes passam.
  - Depende de: T1

- [x] T3 — Em `nav.ts`, adicionar `BARRA_FIXA` (`/patio`, `/caixa`, `entrada`, `saida`) e `montarBarraFixa(perfil)`, que devolve `{ itens, excedentes }` na ordem visual e o resto na ordem do menu, ou `null` se faltar qualquer um dos quatro. Cobrir com testes: perfil operacional (ordem e excedentes sem os quatro), Conveniada e Carimbo (`null`), perfil nulo (`null`), e `BARRA_FIXA` com as mesmas chaves de `BAR_PRIORITY`. Não mexer nas funções da barra adaptativa.
  - Arquivos: `src/lib/nav.ts`, `src/lib/nav.test.ts`
  - Pronto quando: os testes novos e os 22 existentes de `nav.test.ts` passam.

- [x] T4 — Estilos da barra: `Bar` com fundo `navBar`; `BarInner` com a prop `$fixa` (largura máxima `bottomNavMaxWidth`; sem ela, `contentMaxWidth` como hoje); remover o filete amarelo (`::before`) da aba ativa; hover e `IconPill` ativo com `navActive`; novo `EntradaCircle` (diâmetro `entradaButtonSize`, `radii.full`, fundo `primary`, cor `onPrimary`, borda de 2px em `accent`, `shadows.sm`, posição absoluta com `top` negativo igual ao overhang e centralizado, escala 0.96 ao pressionar só sob `prefers-reduced-motion: no-preference`, anel de foco no círculo quando o botão recebe foco por teclado).
  - Arquivos: `src/components/layout/BottomNav/BottomNav.styles.ts`
  - Pronto quando: lint passa; nenhum valor visual solto (tudo vem do tema); barra adaptativa existente continua renderizando (testes de `BottomBar` e `BottomNav` atuais passam).
  - Depende de: T1

- [x] T5 — Criar `PlusTabIcon` (28px, traço 2.6, `aria-hidden`, no estilo do `MaisTabIcon`) e o componente `EntradaButton`: `TabButton` com `type="button"`, `aria-haspopup="dialog"`, `onClick`, um `IconPill` vazio e transparente como espaçador, o `TabLabel` "Entrada" em `accent` e bold, e o `EntradaCircle` com o `PlusTabIcon`. Nome acessível "Entrada".
  - Arquivos: `src/components/layout/BottomNav/BottomBarIcons.tsx`, `src/components/layout/BottomNav/EntradaButton.tsx`
  - Pronto quando: o componente renderiza isolado, expõe o botão com nome "Entrada", chama `onClick` ao tocar e não tem `aria-current`.
  - Depende de: T4

- [x] T6 — `BottomBar`: nova prop `entradaEmDestaque`. Com ela: cinco colunas fixas, `$fixa` no `BarInner`, o item de ação `entrada` renderizado como `EntradaButton`, e célula vazia (`aria-hidden`) no fim quando não há Mais. Esqueleto de carregamento com cinco espaços e círculo no centro. Sem a prop, comportamento atual. Testes novos: cinco colunas com a Entrada em terceiro; botão "Entrada" aciona a ação certa e nunca é página atual; sem Mais a célula vazia mantém as cinco colunas; esqueleto com cinco espaços.
  - Arquivos: `src/components/layout/BottomNav/BottomBar.tsx`, `src/components/layout/BottomNav/BottomBar.test.tsx`
  - Pronto quando: testes novos e existentes de `BottomBar.test.tsx` passam (ajustar só o que depender das quatro posições do esqueleto).
  - Depende de: T5

- [x] T7 — `BottomNav`: calcular `fixa = montarBarraFixa(user?.perfil)`; usar `fixa.itens` e `fixa.excedentes` quando existir, senão a lógica de capacidade atual; `carregando = isLoading || (!fixa && capacidade === null)`; passar `entradaEmDestaque={Boolean(fixa)}`. Testes: perfil operacional mostra Pátio, Caixa, Entrada, Saída e Mais com capacidade estreita e larga; o painel não repete os quatro e abre com Mais; perfil Conveniada mantém a barra adaptativa e sem círculo.
  - Arquivos: `src/components/layout/BottomNav/BottomNav.tsx`, `src/components/layout/BottomNav/BottomNav.test.tsx`
  - Pronto quando: testes novos e existentes de `BottomNav.test.tsx` passam; Entrada e Saída ainda abrem seus modais e o foco volta ao Mais ao fechar o painel.
  - Depende de: T3, T6

- [ ] T8 — Verificação final: rodar `npm run lint`, a suíte de testes e `npm run build`; conferir de novo com `grep` que não sobrou `bottomNavHeight` onde deveria haver `bottomNavReserved`; conferir visualmente (skill `run`) em 320, 375, 768 e 1023px, nos temas claro e escuro: Entrada no centro exato, botão sem corte, nada coberto no fim das telas (Mensalistas, Conferência, Preços, cadastros), anel de foco com Tab, painel "Mais" sem cobrir o botão em `md`+, e perfil Conveniada com a barra de antes. Ajustar a olho só os valores dos tokens de cor, se preciso.
  - Arquivos: nenhum novo (ajustes pontuais em `src/styles/theme.ts` se necessário)
  - Pronto quando: lint, testes e build passam sem erros e os pontos visuais acima foram conferidos.
  - Depende de: T2, T7
