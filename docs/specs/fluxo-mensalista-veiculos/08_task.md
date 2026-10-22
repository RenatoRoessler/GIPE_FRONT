# Task 08: Validação final

**Status:** 🔄 Em progresso  
**Dependências:** Task 01 a Task 07

## Objetivo

Confirmar que a feature cumpre o PRD e que nada do fluxo de avulsos regrediu.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- Somente o necessário para corrigir o que a validação apontar; atualizar os status em `tasks.md`.

## Critérios de Aceite

- [x] `npm run lint` sem erros (0 erros; 94 avisos que já existiam em arquivos minificados).
- [x] Todos os testes passam (128 arquivos, 1408 testes).
- [x] `npm run build` conclui.
- [ ] Conferidos, um a um, os critérios de aceite do `prd.md` (entrada, saída, caixa, acessibilidade do card).
- [ ] Contrato com o back confirmado (ver `tasks.md`); pontos em aberto do PRD respondidos ou registrados.
- [ ] Verificado manualmente: entrada e saída de um mensalista e de um avulso, em desktop e em celular.

## Testes

- [x] Suíte completa de testes do projeto.
- [ ] Verificação manual do fluxo completo: entrada de mensalista → saída sem cobrança → conferência de que nada foi lançado no caixa.
- [ ] Verificação manual do fluxo de avulso (regressão).

## Notas de Implementação

Usar a skill `verification-before-completion`: só declarar concluído com a saída dos comandos em mãos.
