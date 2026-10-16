# Task 01: Base de testes e tipos

**Status:** ✅ Concluída
**Dependências:** —

## Objetivo

Deixa o projeto com um runner de testes funcionando (Vitest + Testing Library) e os tipos da feature definidos, para que as próximas tasks nasçam com testes.

## Contexto Técnico

**Arquivos a criar:**
- `vitest.config.ts`
- `src/test/setup.ts`
- `src/types/mensalista.ts`
- `src/types/mensalista.test.ts` (teste de sanidade)

**Arquivos a editar:**
- `package.json` — devDependencies `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` e script `test`
- `tsconfig.json` — tipos do Vitest, se necessário

## Critérios de Aceite

- [x] `npm test` executa e passa
- [x] Tipos `Mensalista`, `MensalistaPayload`, `MensalistaTipo`, `MensalistaTipoPayload`, `MensalistaFormValues`, `TipoFormValues` e `TIPO_PESSOA` exportados conforme a seção 3 do Tech Spec
- [x] `npm run lint` e `npx tsc --noEmit` passam

## Testes

- [x] Teste de sanidade do runner (ex.: `TIPO_PESSOA` tem Física=1 e Jurídica=2)

## Notas de Implementação

Seguir a skill `vitest` do projeto. Versões das libs fixadas ao instalar. Tipos sem prefixo `I`, em `src/types`. `CategoriaMensalidade` reaproveita `TipoCategoria` de `src/types/preco.ts`.
