# Task 03: Sessão real do usuário logado

**Status:** ✅ Concluída
**Dependências:** —

## Objetivo

Troca o usuário fixo (`mock-user-1`) do `CurrentUserContext` por dados lidos do token, para a gestão saber quem está logado e qual o perfil dele.

## Contexto Técnico

**Arquivos a criar:**
- `src/lib/session.ts`
- `src/lib/session.test.ts`

**Arquivos a editar:**
- `src/types/user.ts` (`CurrentUser` ganha `email` e `perfil`, opcionais)
- `src/contexts/CurrentUserContext.tsx`
- `src/components/layout/AppShell/AppShell.test.tsx` (ajustar se o mock deixar de valer)

## Critérios de Aceite

- [x] `session.ts` decodifica as claims do cookie `gipe_token` (e-mail, nome e role) só para leitura, sem validar assinatura
- [x] Token ausente ou malformado resulta em usuário nulo, sem erro lançado
- [x] `CurrentUserProvider` entrega nome, e-mail e perfil reais; `useCurrentUser()` mantém a mesma forma de uso
- [x] `Header` e `UserMenu` continuam mostrando as iniciais do nome
- [x] Nenhum token é logado

## Testes

- [x] Token válido com as claims esperadas, token malformado, token ausente, role desconhecida
- [x] `AppShell.test.tsx` segue passando

## Notas de Implementação

A claim de identificador é um GUID e não o `usuarioId` numérico; o vínculo com a lista é por e-mail (ver Tech Spec, decisão 1). Nos testes, gerar tokens fictícios no próprio teste.
