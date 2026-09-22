---
name: claude-design
description: Define e aplica o design system do projeto (cores, tipografia, espaçamento, componentes base) usando styled-components. Use ao criar telas/componentes de UI, ao escrever a seção de design de um Tech Spec, ou sempre que precisar de decisões visuais consistentes.
---

# Claude Design — Design System do projeto

Esta skill é a fonte única de verdade para decisões visuais: tokens (cores, espaçamento, tipografia), componentes base reutilizáveis e como eles se conectam ao [[styled-components-best-practices]].

## Onde este processo entra no fluxo spec-driven

```
criar-prd  →  claude-design (spec de UI/UX)  →  criar-techspec  →  implementação
```

- **criar-prd**: define O QUE será construído (problema, usuário, requisitos funcionais). Não deve conter decisões visuais.
- **claude-design** (esta skill): a partir do PRD aprovado, define COMO a interface deve parecer e se comportar — telas, estados (loading/erro/vazio), componentes necessários, e quais tokens do design system serão usados ou criados. Produz uma seção "Design" (ou um arquivo `design.md` ao lado do PRD) que serve de insumo para o Tech Spec.
- **criar-techspec**: consome o PRD + a spec de design e define a implementação técnica (arquitetura, componentes React, contratos de API). A seção de UI do Tech Spec deve referenciar os componentes/tokens definidos aqui, nunca reinventar cores/espaçamentos.

Se `criar-prd`/`criar-techspec` ainda não existirem como skills/commands neste projeto, use esta skill do mesmo jeito manualmente: antes de implementar uma tela nova, produza primeiro a mini-spec de design (seção abaixo) e só depois escreva o código.

## O que produzir antes de codar uma tela/feature nova
Para cada feature vinda do PRD, escrever um bloco curto de "Design Spec":
1. **Telas/estados**: quais estados visuais existem (padrão, loading, erro, vazio, sucesso).
2. **Componentes**: quais componentes do design system (abaixo) serão reaproveitados e quais precisam ser criados.
3. **Tokens usados**: cores, espaçamentos e tipografia do tema — nunca valores soltos (`#3366ff`, `16px`) direto no styled-component.
4. **Responsividade**: breakpoints afetados e comportamento em mobile.

## Tokens (tema)
- Fonte única: `src/styles/theme.ts`, tipado com `DefaultTheme` (module augmentation do styled-components).
- Categorias mínimas do tema: `colors` (incluindo variações semânticas: `primary`, `danger`, `success`, `background`, `text`), `space` (escala consistente, ex: 4/8/16/24/32), `fontSizes`, `fontWeights`, `radii`, `breakpoints`.
- Nunca hardcodar valor visual em um componente se ele já existe (ou deveria existir) no tema. Se faltar um token, adicioná-lo ao tema em vez de criar um valor solto.

## Componentes base (design system)
- Vivem em `src/components/ui` (ex: `Button`, `Input`, `Card`, `Text`, `Stack`). São os blocos que toda feature nova deve reaproveitar antes de criar um componente estilizado do zero.
- Cada componente base expõe variantes via props tipadas (`variant`, `size`) e usa transient props (`$variant`) internamente, seguindo [[styled-components-best-practices]].
- Ao criar uma tela nova: primeiro checar se `src/components/ui` já resolve o necessário; só criar componente novo de UI quando o padrão realmente não existir, e nesse caso adicioná-lo ao design system (não deixar solto dentro da feature).

## Consistência e revisão
- Toda PR/feature de UI deve ser conferida contra o tema e os componentes base antes de ser considerada pronta — nenhuma cor, fonte ou espaçamento "mágico" deve entrar sem passar pelo tema.
- Ao evoluir um token (ex: mudar tom de `primary`), atualizar em `theme.ts` — nunca em cada componente individualmente.
