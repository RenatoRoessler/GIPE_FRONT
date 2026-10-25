# Task 05: Barra inferior adaptável, menu estendido e remoção do pórtico

**Status:** ✅ Concluída  
**Dependências:** Tasks 01, 03, 04

## Objetivo

> Entregar a navegação única: barra inferior em todas as larguras com os itens que couberem, botão "Mais" com menu estendido para o resto, e o pórtico do topo removido (RF-06 a RF-09).

## Contexto Técnico

**Arquivos a criar:**
- `src/components/layout/NavIcons/` — `NavIcons` movido de `NavSign/` (antes de apagá-lo).

**Arquivos a editar:**
- `src/components/layout/BottomNav/BottomNav.tsx` — usar `useBarCapacity` + `dividirItensDaBarra`; passar excedentes ao painel; fechar o painel se os excedentes acabarem; devolver o foco ao primeiro item da barra se o botão "Mais" sumir; remover o listener do breakpoint `lg`.
- `src/components/layout/BottomNav/BottomBar.tsx` — receber itens visíveis e `temMais`; rótulo `shortLabel`; "Mais" só quando necessário; slots de `Skeleton` enquanto a capacidade é `null` ou o usuário carrega.
- `src/components/layout/BottomNav/BottomNav.styles.ts` — sem `display: none` em `lg`; contêiner interno com `contentMaxWidth` centralizado; `colors.focus` no lugar de `FOCUS_RING`; faixa do item ativo em `primary`, ícone/rótulo ativo em `accent`/`text`; folha centralizada com máx. 480px a partir de `md`, sem alça.
- `src/components/layout/BottomNav/MenuSheet.tsx` — receber `itens` (excedentes); título "Mais"; nome completo dos itens; imports dos ícones do novo caminho.
- `src/components/layout/AppShell/AppShell.tsx` e `AppShell.styles.ts` — remover `<Gantry />`; `padding-bottom` da barra em todas as larguras.
- `src/components/mensalistas/Mensalistas.styles.ts` — botão flutuante acima da barra em todas as larguras.
- `src/lib/nav.ts` — remover `BOTTOM_NAV_ITEMS`, `BOTTOM_NAV_LABELS`, `bottomNavItemsPermitidos`, `isMenuTabActive`.
- Testes: `BottomBar.test.tsx`, `BottomNav.test.tsx`, `AppShell.test.tsx`, `nav.test.ts`.

**Arquivos a apagar:**
- `src/components/layout/Gantry/` e `src/components/layout/NavSign/` (e seus testes)

## Critérios de Aceite

- [x] Nenhuma tela da área logada tem menu no topo, em qualquer largura.
- [x] A barra aparece fixa na base em todas as larguras, com conteúdo limitado a 1120px e centralizado.
- [x] Mostra só os itens que cabem (≥ 64px por slot, alvo ≥ 44px); "Mais" só aparece se algum item não couber.
- [x] O painel lista só os itens excedentes, com a tela atual marcada; fecha por escolha, fora, fechar ou Esc.
- [x] Se a tela atual é um excedente, "Mais" fica destacado.
- [x] Redimensionar ou girar o aparelho ajusta os itens sem recarregar e sem rolagem horizontal na barra.
- [x] Nenhum conteúdo, nem o link de versão, fica coberto pela barra; "Novo mensalista" aparece acima dela.
- [x] Entrada e Saída continuam abrindo o modal só depois que o painel fecha.
- [x] `nav`, `aria-current`, `aria-haspopup`, `aria-expanded` e `aria-controls` corretos.

## Testes

- [x] Barra completa sem "Mais" (capacidade ≥ total).
- [x] Barra com "Mais" e painel só com excedentes.
- [x] Item ativo oculto destaca "Mais" e marca a linha no painel.
- [x] Esc, clique fora e fechar; foco volta ao botão "Mais".
- [x] Ação Entrada/Saída abre o modal após fechar o painel.
- [x] Redimensionar de largo para estreito com o painel aberto não deixa estado quebrado.
- [x] `AppShell` não renderiza o pórtico e renderiza a barra.
- [x] `useBarCapacity` mockado nos testes de componente.

## Notas de Implementação

> Techspec seção 3. Design.md seções 4.2 a 4.4. Rótulo longo nunca quebra em duas linhas nem corta sem reticências.

## Registro da execução

- `BottomNav` calcula `visiveis` e `excedentes` com `useBarCapacity` + `navItemsPorPrioridade` + `dividirItensDaBarra`; `BottomBar` e `MenuSheet` ficaram só de apresentação (não leem mais a sessão). Enquanto a sessão carrega ou a largura não foi medida, a barra mostra quatro espaços reservados.
- Novo `ordenarPeloMenu` em `lib/nav.ts`: o painel mostra os excedentes na ordem natural do menu, não na ordem de prioridade da barra.
- Removidos de `lib/nav.ts`: `BOTTOM_NAV_ITEMS`, `BOTTOM_NAV_LABELS`, `bottomNavItemsPermitidos` e `isMenuTabActive` (e seus testes).
- Se o botão Mais some com o painel aberto (a tela cresceu e tudo coube), o painel fecha e o foco vai para o primeiro item da barra.
- O botão Mais usa ícone próprio de três pontos e o painel se chama "Mais" (antes "Menu"). O botão de fechar continua com o nome "Fechar menu".
- Cabeçalho: sem o pórtico, ele passou a ficar fixo no topo em todas as larguras (antes só abaixo de `lg`, porque o pórtico era o elemento fixo no computador). Não estava na task; foi necessário para a navegação principal não "sumir" no topo. Também troquei o foco do cabeçalho para `colors.focus`.
- O botão flutuante "Novo mensalista" já usava `bottomNavHeight` e só aparece abaixo de `md` (em telas maiores o botão fica no cabeçalho da página), então não precisou de mudança.
- `NavIcons` foi movido para `src/components/layout/NavIcons`; `Gantry`, `NavSign` e `FontScope` foram apagados.
- Verificado: `npx tsc --noEmit` sem erros, `npm run lint` com 0 erros, `npm run build` compila, 653 testes de `src/components/layout` e `src/lib` passam (antes 649). Os testes da barra, do painel e do `AppShell` foram reescritos para o novo comportamento.
- Os critérios sobre layout real (sem rolagem horizontal, nada coberto pela barra, conteúdo limitado a 1120px, ajuste ao girar) foram marcados com base no código e nos testes com largura simulada; a conferência visual fica para a Task 11.
- Suíte completa: 2312 passam e 2 falham em `MensalistaModal.veiculos.test.tsx` por tempo esgotado sob carga; o arquivo passa sozinho (17/17), com e sem as mudanças desta task. É a mesma instabilidade vista nas Tasks 01 e 02, em área que não mexi.
- Não conferido em navegador: aparência da barra e do painel, centralização da folha em `md+`, corte por largura real, rotação do aparelho e rótulos longos ("Mensalistas", "Relatórios") em 64px. Fica para a Task 11.
