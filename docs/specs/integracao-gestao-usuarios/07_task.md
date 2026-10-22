# Task 07: Alterar a própria senha

**Status:** ✅ Concluída
**Dependências:** Task 02, Task 03

## Objetivo

Entrega a troca da própria senha para qualquer perfil, aberta pelo menu do usuário, e retira o item antigo "Editar Usuário".

## Contexto Técnico

**Arquivos a criar:**
- `src/components/usuarios/AlterarSenhaModal/AlterarSenhaModal.tsx`
- `src/components/usuarios/AlterarSenhaModal/AlterarSenhaModal.test.tsx`
- `src/components/usuarios/AlterarSenhaModal/index.ts`

**Arquivos a editar:**
- `src/components/layout/UserMenu/UserMenu.tsx` ("Editar Usuário" vira "Alterar senha" e abre o modal)
- `src/components/ui/PasswordRequirements/PasswordRequirements.tsx` (prop opcional `rules`, com o padrão atual)
- `src/app/(app)/usuario/editar/page.tsx` (passa a redirecionar para `/usuarios`)

## Critérios de Aceite

- [x] Campos: senha atual, nova senha e confirmação, com alternância de visibilidade
- [x] A nova senha exige no mínimo 6 caracteres e ser diferente da atual; os critérios aparecem em texto, não só em cor
- [x] Texto fixo: a senha vale para todas as empresas e o usuário continua logado
- [x] "Alterar senha" desabilitado até tudo estar válido
- [x] Senha atual incorreta aparece inline no campo; os outros campos mantêm o valor
- [x] Sucesso: modal fecha, `Toast` "Senha alterada." e o token **não** é limpo
- [x] Qualquer perfil acessa o item no menu
- [x] `/usuario/editar` redireciona para `/usuarios`
- [x] `PasswordRequirements` segue igual nos usos atuais (cadastro e recuperação)

## Testes

- [x] Validação de 5 e 6 caracteres, igual à atual, confirmação diferente
- [x] Senha atual incorreta inline, erro genérico no banner, sucesso sem logout
- [x] `PasswordRequirements` com e sem `rules`

## Notas de Implementação

O formato do erro de senha atual incorreta não está no contrato. Tratar `unauthorized` e `validation` como erro do campo até o back confirmar. O 401 do cliente `api` não derruba a sessão. Conferir o padrão de `redirect` desta versão do Next em `node_modules/next/dist/docs/`.
