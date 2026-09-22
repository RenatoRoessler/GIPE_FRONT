---
name: code-best-practices
description: Checklist de boas práticas de código para este projeto Next.js + React + TypeScript. Use antes de escrever ou revisar código (componentes, rotas, hooks, API routes) para manter consistência, tipagem correta, performance e organização.
---

# Boas práticas — Next.js / React / TypeScript (App Router)

## Estrutura e organização
- Código de aplicação vive em `src/`. Rotas e páginas em `src/app` seguindo as convenções do App Router (`page.tsx`, `layout.tsx`, `route.ts`).
- Componentes reutilizáveis em `src/components`; hooks em `src/hooks`; utilitários puros em `src/lib`; tipos compartilhados em `src/types`.
- Um componente por arquivo. Nome do arquivo em PascalCase para componentes (`UserCard.tsx`), camelCase para hooks/utils (`useUser.ts`, `formatDate.ts`).
- Evite arquivos `index.ts` como barrel exports gigantes — prefira imports diretos, mais fáceis de rastrear e melhores para tree-shaking.

## Componentes React
- Prefira Server Components por padrão; adicione `"use client"` apenas quando o componente precisar de estado, efeitos, ou APIs do browser.
- Não busque dados no cliente se puder ser feito no server component (fetch direto, sem useEffect + useState para dados iniciais).
- Extraia lógica repetida para hooks customizados em vez de duplicar `useEffect`/`useState` em vários componentes.
- Nomeie props com tipos explícitos (interface/type), nunca `any`.
- Evite prop drilling profundo — use composição ou Context quando fizer sentido, sem exagerar em abstração.

## TypeScript
- `strict` deve permanecer ativado no `tsconfig.json`. Nunca usar `any` — prefira `unknown` + narrowing, ou tipar corretamente.
- Não usar `as` para forçar tipos incompatíveis; corrigir a origem do tipo.
- Tipos de dados de API/backend devem ficar centralizados (ex: `src/types`) e reaproveitados, não redeclarados em cada arquivo.

## Estilo e formatação
- Seguir as regras do ESLint (`eslint-config-next`) já configuradas — rodar `npm run lint` antes de considerar uma tarefa concluída.
- Não desabilitar regras de lint com comentários (`eslint-disable`) sem justificativa clara e comentário explicando o motivo.
- Nomes de variáveis e funções descritivos; evitar abreviações obscuras.

## Performance
- Usar `next/image` para imagens e `next/font` para fontes, evitando `<img>`/`@import` manuais.
- Evitar imports de bibliotecas inteiras quando só uma função é necessária (import nomeado, não `import * as`).
- Memoização (`useMemo`/`useCallback`/`React.memo`) só quando há um problema de performance real e medido — não por padrão.

## API Routes / Server Actions
- Validar toda entrada externa (query params, body) antes de usar — não confiar em dados do client.
- Nunca expor segredos (chaves de API, tokens) no código client-side; usar variáveis de ambiente sem prefixo `NEXT_PUBLIC_` para segredos server-only.
- Tratar erros de forma explícita e retornar status HTTP corretos, sem vazar detalhes internos (stack trace) na resposta.

## Commits e revisão
- Rodar `npm run build` e `npm run lint` antes de finalizar uma mudança significativa.
- Não deixar código morto, imports não usados, ou `console.log` de debug no código final.
