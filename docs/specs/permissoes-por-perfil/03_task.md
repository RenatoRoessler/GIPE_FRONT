# Task 03: Tela de acesso negado

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

> Entregar a tela exibida quando o usuário tenta abrir uma área que seu perfil não permite, dentro do `AppShell` para que o menu continue visível (RF3 do PRD, tela 2 do `design.md`).

## Contexto Técnico

**Arquivos a criar:**
- `src/app/(app)/acesso-negado/page.tsx` — Server Component com `metadata.title`.
- `src/components/layout/AcessoNegado/AcessoNegado.tsx`
- `src/components/layout/AcessoNegado/AcessoNegado.styles.ts`
- `src/components/layout/AcessoNegado/index.ts`
- `src/components/layout/AcessoNegado/AcessoNegado.test.tsx`

**Arquivos a editar:**
- Nenhum.

## Critérios de Aceite

- [x] Título "Você não tem acesso a esta área" em `h1`, que recebe foco ao carregar.
- [x] Texto de apoio em `Text variant="muted"` orientando falar com o administrador da empresa.
- [x] `Button` primary "Ir para o início" leva a `/dashboard`.
- [x] Usa `Text`, `Button` e tokens do tema; nenhum valor visual solto. Desvio do design: não usa `InfoCard`, que tem `role="status"` e título em `<p>`, incompatíveis com o `h1` da página; o contêiner é uma `section` estilizada com `surface`/`border`.
- [x] Largura máxima confortável no desktop; full-width com margem no celular, botão em largura total abaixo de `breakpoints.sm`.
- [ ] Contraste AA nos dois temas (claro e escuro): usa `text`/`textMuted` sobre `surface` do tema, mas não foi medido; conferir na Task 08.

## Testes

- [x] Componente: renderiza título, texto e botão; o botão aponta para `/dashboard`.
- [x] Componente: o foco vai para o `h1` ao montar.
- [x] Componente: `h1` único, focável e com nome acessível (coberto pelo teste de título e foco).

## Notas de Implementação

> Tech Spec, seção 4; skills `claude-design` e `styled-components-best-practices` (transient props `$`). O componente só precisa ser Client se usar `ref`/foco programático. Ler `node_modules/next/dist/docs/` antes de escrever a página (convenções desta versão do Next).
