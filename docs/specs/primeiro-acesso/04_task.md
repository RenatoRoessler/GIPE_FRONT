# Task 04: Validação final

**Status:** 🔄 Em progresso  
**Dependências:** Task 01 a Task 03

## Objetivo

Confere a feature de ponta a ponta contra o PRD e fecha as dúvidas de contrato com o back.

## Contexto Técnico

**Arquivos a criar:**
- —

**Arquivos a editar:**
- Os que a conferência apontar

## Critérios de Aceite

- [x] `npm run lint` sem erros e `npm run build` sem erros
- [x] Todos os testes passam (165 arquivos, 1765 testes)
- [ ] Cada requisito RF-01 a RF-05 do PRD conferido contra a tela
- [ ] Tela revisada em desktop e mobile, nos temas claro e escuro
- [ ] Acessibilidade: foco inicial em "Nova senha", erros anunciados, requisitos em texto, alternador de senha com nome acessível
- [ ] Confirmado com o back que `PUT /api/v1/Usuario/senha` aceita o `passwordChangeToken` do login como Bearer e quais códigos devolve para token vencido ou recusado
- [ ] Prazo do token de troca conhecido e a mensagem de expiração conferida com ele
- [x] O token de troca não aparece em URL, cookie, storage nem log (coberto por testes: tela, cookie e storage; sem `console` no código)
- [ ] `docs/specs/input.md`, que contém token real, não entra em nenhum commit

## Testes

- [ ] Roteiro manual com a API real: cadastrar um usuário novo na gestão de usuários, entrar com a senha temporária recebida por e-mail, trocar a senha, entrar com a nova e confirmar que a temporária deixou de funcionar
- [ ] Roteiro manual: recarregar `/primeiro-acesso` e abrir o endereço direto, e conferir que vai ao login
- [ ] Roteiro manual: esperar o token vencer e conferir o estado "prazo expirado"

## Notas de Implementação

O roteiro exige uma empresa de teste e uma conta de e-mail para receber a senha temporária. Não há mock do back para este fluxo.
