---
name: styled-components-best-practices
description: Boas práticas para usar styled-components neste projeto Next.js (App Router) + TypeScript. Use ao criar ou revisar componentes estilizados, temas, ou ao configurar SSR de CSS-in-JS.
---

# Boas práticas — styled-components (Next.js App Router + TS)

## Configuração (já feita neste projeto)
- `compiler.styledComponents: true` em `next.config.ts` (habilita SSR correto e nomes de classe legíveis em dev).
- `src/lib/registry.tsx` (`StyledComponentsRegistry`) envolve `{children}` em `src/app/layout.tsx` — necessário para extrair o CSS no server e evitar FOUC (flash sem estilo). Nunca remover esse wrapper nem criar um novo `ServerStyleSheet` por página.

## Onde usar "use client"
- Todo arquivo que declara `styled.div`, `styled(Component)`, etc., ou usa `ThemeProvider`/`useTheme`, deve ter `"use client"` no topo — styled-components não roda em Server Components puros.
- Prefira manter a lógica de dados no Server Component (page/layout) e passar props prontas para um Client Component que só cuida de apresentação/estilo.

## Organização dos estilos
- Um arquivo `Componente.styles.ts` (ou `.styles.tsx` se tiver JSX) ao lado do componente, exportando os `styled.*` — não misturar estilos de vários componentes não relacionados no mesmo arquivo.
- Nomear elementos estilizados por função, não por tag: `Card`, `CardTitle`, `SubmitButton` — nunca `Div1`, `StyledDiv`.
- Evitar estilos inline via `style={{ ... }}` quando já existe styled-components no projeto — manter uma única fonte de estilo.

## Tema (ThemeProvider)
- Definir um único tema tipado em `src/styles/theme.ts` e usar `DefaultTheme` (module augmentation) para ter autocomplete/tipagem em `props.theme` — nunca usar `any` no tema.
- Um único `<ThemeProvider theme={theme}>` no topo da árvore (ex.: dentro do registry ou logo abaixo dele no layout), não vários providers aninhados sem necessidade.
- Acessar valores do tema sempre via `props.theme.xxx`, nunca hardcodar cores/espaçamentos que já existem no tema.

## Performance e boas práticas de CSS-in-JS
- Não criar `styled.div` dentro do corpo de outro componente (dentro de render) — isso recria o componente estilizado a cada render. Declarar sempre no escopo do módulo.
- Usar `css` helper para blocos de estilo condicionais/reaproveitáveis em vez de concatenar strings manualmente.
- Preferir a prop `$prop` (transient props, prefixo `$`) para valores usados só na estilização, evitando que vazem para o DOM como atributo HTML inválido.
- Evitar seletores profundamente aninhados ou `&&&` para forçar especificidade — geralmente sinal de estrutura de componente a repensar.

## TypeScript
- Tipar props de componentes estilizados explicitamente: `styled.button<{ $variant: "primary" | "secondary" }>`.
- Não usar `any` nas props de estilo; usar union types/enum para variantes.

## Checklist antes de finalizar
- Rodar `npm run build` para garantir que o SSR do styled-components não quebrou (erros de hydration aparecem aqui ou no console do browser).
- Conferir que não há flash de conteúdo sem estilo (FOUC) ao recarregar a página no navegador.
