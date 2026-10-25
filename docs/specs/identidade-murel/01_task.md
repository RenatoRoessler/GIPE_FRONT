# Task 01: Tema Murel e fontes

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

> Trocar os quatro temas atuais por dois temas Murel (claro e escuro), com os tokens novos e as fontes do guia, mantendo os nomes de token existentes para o app seguir compilando. Base de todas as outras tasks.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/styles/theme.ts` — reescrever `shared`, `lightTheme` e `darkTheme` com os valores do design.md (seção 2); adicionar `accent`, `focus`, `cliente`, `pagamento`, `fontFamilies`, `fontWeights.semibold/extrabold`, `fontSizes.xxl/subtitle`, `layout.contentMaxWidth`, raios novos; apagar `signageShared`, `signageTypography`, `signageLightTheme`, `signageDarkTheme`. Manter `glass`, `glassBorder`, `shadows.glow`, `onSign`, `signEdge` por ora (saem na Task 07).
- `src/contexts/ThemeModeContext.tsx` — remover `SignageThemeProvider`; chave `murel-theme-mode` com leitura única da `gipe-theme-mode`.
- `src/app/layout.tsx` — `Plus_Jakarta_Sans` e `JetBrains_Mono` no lugar de Geist; `<html lang="pt-BR">`.
- `src/app/globals.css` — remover `--background`/`--foreground` fixos e `Arial`; fonte e cores vêm do tema.
- `src/app/(app)/layout.tsx`, `src/app/comprovante/layout.tsx`, `src/app/contrato/layout.tsx` — remover Barlow, `FontScope` e `SignageThemeProvider`.
- `src/test/render.tsx` e testes que referenciam `signage*` ou `gipe-theme-mode`.

**Arquivos a apagar:**
- `src/components/layout/FontScope.tsx`
- `src/app/comprovante/layout.tsx`, `src/app/contrato/layout.tsx`, `src/app/recibo/layout.tsx` (ficaram só repassando `children` depois da remoção do tema de sinalização)

## Critérios de Aceite

- [x] `lightTheme` e `darkTheme` seguem os valores do design.md e `AppTheme` tem os tokens novos.
- [x] Não existe mais nenhuma referência a `signageLightTheme`, `signageDarkTheme`, `SignageThemeProvider`, `FontScope` ou Barlow.
- [x] O app compila e abre nos dois temas; o alternador continua funcionando.
- [x] Quem tinha `gipe-theme-mode` salvo mantém a preferência; só a chave nova é gravada.
- [x] Texto usa Plus Jakarta Sans e números/placas usam a variável mono; fallback de sistema definido.
- [x] Decisão sobre o relampejo claro no primeiro pintar registrada (script inline em `<head>` ou comportamento atual aceito).

## Testes

- [x] `ThemeModeContext`: migra a chave antiga, grava a nova, alterna entre os temas.
- [x] Teste de tema: `lightTheme` e `darkTheme` expõem todos os tokens de `AppTheme` (sem `undefined`).
- [x] Atualizar testes existentes que usavam os temas de sinalização.
- [x] `npm run lint` e `npm run build` passam.

## Notas de Implementação

> Ler antes os guias de `next/font` em `node_modules/next/dist/docs/` (AGENTS.md). Valores do tema claro são propostas: conferir contraste AA (texto ≥ 4,5:1; controles ≥ 3:1). Não remover `glass`, `glow`, `onSign` e `signEdge` nesta task.

## Registro da execução

- Contraste conferido por script (razão de luminância WCAG) para os pares do tema claro e escuro: texto, texto secundário, `accent`, `danger`, `success` e `onPrimary` sobre `background`/`surface` ficam ≥ 4,5:1 (claro: 4,74 a 17,9; escuro: 5,2 a 15,85). A borda de controle do claro foi escurecida para `#737D91` e virou o token `borderStrong` (a `#8A93A5` do design.md dava 2,74:1, abaixo de 3:1).
- Novo token `colors.borderStrong` (não estava no design.md): borda de controles, com contraste ≥ 3:1. A Task 06 o usa em `Input`, `Select` e botões secundários.
- Primeiro pintar: `GlobalStyle` (em `ThemeModeProvider`) aplica fundo, cor e fonte do tema ao `body`. O tema salvo ainda é lido após a hidratação, então quem usa o escuro vê o claro por um instante, como já acontecia com o resto da interface. Decisão: aceitar o comportamento atual; um script inline em `<head>` fica como melhoria separada.
- `typography.displayTransform/displayTracking/displaySize` ficam: 20 arquivos os usam. A Task 07 decide se removê-los.
- `glass`, `glassBorder`, `glow`, `onSign` e `signEdge` ficam com valores Murel até a Task 07.
- Verificado: `npx tsc --noEmit` sem erros, `npm run lint` sem erros, `npm run build` passa e testes do tema, contexto, `StatusBadge` e `nav` passam. Na suíte completa houve uma falha por tempo esgotado (5s) em um teste pesado de `MensalistaModal` que muda de uma execução para outra; ele passa isolado.
