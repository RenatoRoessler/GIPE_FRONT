# Task 08: Validação final

**Status:** 🔄 Em progresso
**Dependências:** Task 01 a Task 07

## Objetivo

Confere a feature de ponta a ponta contra o PRD e fecha as dúvidas de contrato com o back.

## Contexto Técnico

**Arquivos a criar:**
- —

**Arquivos a editar:**
- Os que a conferência apontar

## Critérios de Aceite

- [x] `npm run lint` (0 erros) e `npm run build` sem erros
- [x] Todos os testes da feature passam (suíte completa: 1728 de 1729 na execução conjunta; o teste que falhou, de Mensalistas, estourou o tempo e passa isolado)
- [ ] Cada requisito RF-01 a RF-08 do PRD conferido contra a tela
- [ ] Tela revisada em desktop e mobile, nos temas claro e escuro
- [ ] Acessibilidade: foco ao abrir e fechar modais e ao trocar de etapa, nomes acessíveis, erros ligados aos campos
- [ ] Contrato confirmado com o back: erro de senha atual, limites de nome e e-mail, celular com máscara, corpo da conferência de CPF, vínculo do usuário logado
- [ ] Decisões abertas do PRD respondidas (Gerente gerencia usuários? perfil Financeiro) e refletidas em código e docs
- [ ] `docs/specs/input.md` com o Bearer real não entra em nenhum commit

## Testes

- [ ] Roteiro manual com a API real: listar, cadastrar pessoa nova, dar acesso a pessoa existente, mudar perfil, inativar, tentar remover o último Administrador, trocar a própria senha

## Notas de Implementação

Não há mock do backend: o roteiro exige uma empresa de teste com ao menos dois usuários.
