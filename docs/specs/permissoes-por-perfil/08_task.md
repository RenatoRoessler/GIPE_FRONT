# Task 08: Service worker e verificação final

**Status:** 🔄 Em progresso (verificação manual pendente)  
**Dependências:** Task 04, Task 05, Task 06, Task 07

## Objetivo

> Garantir que páginas autenticadas em cache não contornem o bloqueio e validar a feature inteira contra os critérios de aceite do PRD, por perfil.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- Service worker (`public/sw.js` ou equivalente) — só se ele cachear rotas autenticadas: excluí-las do cache.
- `docs/specs/permissoes-por-perfil/prd.md` — atualizar "Questões em aberto" com as respostas obtidas (Relatórios, Mensalistas, conveniadas, Financeiro, `overrides`), e `permissoes.ts` se alguma regra provisória mudar.
- `docs/specs/permissoes-por-perfil/tasks.md` — marcar o status das tasks.

## Critérios de Aceite

- [x] Verificado: `public/sw.js` não faz cache de páginas nem da API, só serve `offline.html` quando a navegação falha. Nenhuma correção necessária.
- [ ] Critérios do PRD testados em navegador com cada perfil. Cobertos por testes automatizados (proxy, menu, caixa, dashboard); falta o passe manual.
- [ ] Role numérica real (`"1"`) validada ponta a ponta com login (coberta só em teste unitário com token montado).
- [ ] Menu e telas conferidos em desktop e mobile (contraste AA da tela de acesso negado incluído).
- [x] Nenhuma rota de `src/app/(app)` fica sem área definida (teste em `permissoes.test.ts`).
- [x] `npm run lint`: 0 erros (94 avisos `no-unused-expressions` em arquivo gerado, anteriores a esta feature).
- [x] `npm run build` passando (rota `/acesso-negado` e Proxy listados).

## Testes

- [x] Suíte completa: 172 arquivos e 1941 testes passando. O Vitest reporta 6 rejeições não tratadas vindas de `PrimeiroAcessoForm.test.tsx` (arquivo com alterações anteriores a esta feature e não tocado por ela).
- [ ] Manual: percorrer a matriz do PRD perfil por perfil, tentando também a URL direta de cada área restrita.
- [ ] Manual: simular 403 (perfil com menu liberado e API recusando) e conferir a mensagem.

## Notas de Implementação

> Skill `verification-before-completion`: mostrar a saída dos comandos antes de afirmar que está concluído. Usar a skill `run`/`agent-browser` para a verificação visual, se necessário. Commits via skill `commit`.
