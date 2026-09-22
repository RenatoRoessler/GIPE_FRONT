# Tasks: Home Hero

Referências: ./prd.md, ./techspec.md

- [x] T1 — Criar os estilos do Hero
  - Arquivos: `src/components/home/Hero/Hero.styles.ts`
  - Pronto quando: existem `Wrapper`, `Title` e `Subtitle` estilizados usando tokens do tema, responsivos via `theme.breakpoints`.

- [x] T2 — Criar o componente Hero
  - Arquivos: `src/components/home/Hero/Hero.tsx`, `src/components/home/Hero/index.ts`
  - Pronto quando: `Hero` renderiza título, subtítulo e `<Button variant="primary">Começar agora</Button>`.

- [x] T3 — Usar o Hero na home
  - Arquivos: `src/app/page.tsx`
  - Pronto quando: a rota `/` renderiza apenas o `<Hero />` (conteúdo padrão do create-next-app removido).

- [x] T4 — Validar
  - Arquivos: n/a
  - Pronto quando: `npm run build` e `npm run lint` passam sem erros.
