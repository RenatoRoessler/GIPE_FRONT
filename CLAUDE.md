@AGENTS.md

# Convenções do projeto GIPE

Estas regras valem sempre, em qualquer interação neste repositório.

- **Stack**: Next.js (App Router) + TypeScript + styled-components. Seguir as skills `code-best-practices` e `styled-components-best-practices` para qualquer código novo ou revisado.
- **Design**: toda decisão visual (cor, espaçamento, tipografia, componente de UI) segue o design system descrito na skill `claude-design` (`src/styles/theme.ts` + `src/components/ui`). Nunca hardcodar valor visual que já existe no tema.
- **Layouts inovadores**: ao criar ou redesenhar qualquer tela/layout (não pequenos ajustes pontuais), usar a skill `.agents/skills/impeccable` para conduzir a decisão visual — foge do óbvio/genérico, propõe composições ousadas e mantém coerência com `PRODUCT.md` (contexto do produto) e com o design system em `claude-design`. Telas do GIPE lidam com dados operacionais/financeiros sérios: ousadia visual sem abrir mão de clareza e confiança.
- **Features novas**: seguir o fluxo spec-driven documentado em `docs/PROCESSO-SPEC-DRIVEN.md` (`criar-prd → claude-design → criar-techspec → criar-tasks → executar-task`), exemplo de referência em `docs/specs/home-hero/`.
- **Commits**: usar a skill `commit` (Conventional Commits, separando por tipo/assunto) sempre que for pedido para commitar.
- **Antes de finalizar qualquer mudança de código**: rodar `npm run lint` e, se a mudança for relevante, `npm run build`.

As demais skills em `.claude/skills` (bibliotecas específicas como zod, tanstack, vitest, etc.) são carregadas automaticamente quando o assunto delas aparecer — não é necessário referenciá-las aqui.
