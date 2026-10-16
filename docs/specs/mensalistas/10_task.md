# Task 10: Validação final

**Status:** 🔄 Em progresso
**Dependências:** Task 01 a Task 09

## Objetivo

Confere que a feature atende ao PRD e que o projeto continua saudável.

## Contexto Técnico

**Arquivos a criar:**
- —

**Arquivos a editar:**
- `docs/specs/mensalistas/*` — atualizar os `[A CONFIRMAR]` resolvidos com a resposta real da API

## Critérios de Aceite

- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` e `npm run build` passam
- [ ] Roteiro manual dos Fluxos 1 a 3 do PRD: criar tipo → cadastrar mensalista → buscar por documento → desativar
- [ ] Conferidos os critérios de aceite RF-01 a RF-09 do PRD
- [ ] Responsivo em 320px e desktop; abas por teclado; leitor de tela anuncia abas e erros
- [ ] Perfil sem permissão (403) mostra a mensagem correta
- [ ] Formatos reais de `documento`, horários e auditoria confirmados contra a API e o mapper ajustado se preciso
- [ ] `docs/specs/input.md` não contém token (revogado e removido antes de commitar)

## Testes

- [x] Suíte completa verde
- [ ] Smoke manual em dev/hml com a API real

## Notas de Implementação

Cobre o checklist de entrega do `CLAUDE.md` (lint + build). Não commitar sem pedido do usuário.
