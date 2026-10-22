# Task 05: Remover páginas e redirecionar

**Status:** ✅ Concluída  
**Dependências:** Task 03, Task 04

## Objetivo

Apagar as páginas próprias de Entrada e Saída e fazer os endereços antigos levarem ao Início.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `next.config.ts` — `redirects()` com `/veiculos/entrada` e `/veiculos/saida` para `/dashboard`, `permanent: false`.

**Arquivos a remover:**
- `src/app/(app)/veiculos/entrada/page.tsx` e `src/app/(app)/veiculos/saida/page.tsx` (a pasta `veiculos` some).
- `src/components/veiculos/ActionRow`, só se nenhuma outra tela o usar.
- Textos ou referências restantes a `/veiculos/entrada` e `/veiculos/saida` em código (varredura com `grep`).

## Critérios de Aceite

- [x] As páginas não existem mais e o build não as lista.
- [x] Abrir `/veiculos/entrada` ou `/veiculos/saida` redireciona para o Início (307), sem erro (conferido com `curl` no app compilado; sem sessão, o Início leva ao login).
- [ ] Nenhuma referência restante a esses endereços no código da aplicação (specs antigas podem manter a menção).
- [ ] `npm run lint` e `npm run build` passam.

## Testes

- [ ] Verificação no build: as rotas removidas somem da lista de rotas.
- [ ] Verificação manual: abrir os endereços antigos logado e deslogado (deslogado cai no login).
- [ ] Suíte completa de testes do projeto.

## Notas de Implementação

Tech Spec, "Rotas". Os `redirects` de `next.config` valem antes do sistema de arquivos e do proxy (documentação do Next em `node_modules/next/dist/docs`).
