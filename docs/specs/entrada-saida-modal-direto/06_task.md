# Task 06: Validação final

**Status:** 🔄 Em progresso  
**Dependências:** Task 01 a Task 05

## Objetivo

Confirmar que a feature cumpre o PRD e que o restante do sistema não regrediu.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- Somente o necessário para corrigir o que a validação apontar; atualizar os status em `tasks.md`.

## Critérios de Aceite

- [x] `npm run lint` sem erros (0 erros; 94 avisos que já existiam em arquivos minificados).
- [x] Todos os testes passam (134 arquivos, 1475 testes; rodando com 3 processos em paralelo, pois com todos os processos alguns testes pesados de mensalista estouram o tempo limite por carga da máquina).
- [x] `npm run build` conclui; as rotas `/veiculos/*` não aparecem mais.
- [ ] Conferidos, um a um, os critérios de aceite do `prd.md`.
- [ ] Verificado no navegador: computador e celular, com o foco voltando ao item certo ao fechar o modal.

## Testes

- [x] Suíte completa de testes do projeto.
- [ ] Verificação manual: de qualquer tela, tocar em Entrada e em Saída (pórtico, barra inferior e painel do Menu) e ver o modal por cima da tela atual.
- [ ] Verificação manual: registrar uma entrada e uma saída com o Pátio aberto e ver a lista atualizar.
- [ ] Verificação manual: endereços antigos redirecionam para o Início.

## Notas de Implementação

Usar a skill `verification-before-completion`: só declarar concluído com a saída dos comandos em mãos.
