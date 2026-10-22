# Task 05: Novo usuário em duas etapas

**Status:** ✅ Concluída
**Dependências:** Task 02, Task 04

## Objetivo

Entrega o modal de novo usuário: consulta de CPF e, conforme o resultado, formulário completo (pessoa nova) ou conferência com escolha de perfil (pessoa já cadastrada no GIPE).

## Contexto Técnico

**Arquivos a criar:**
- `src/components/usuarios/NovoUsuarioModal/NovoUsuarioModal.tsx`
- `src/components/usuarios/NovoUsuarioModal/EtapaCpf.tsx`
- `src/components/usuarios/NovoUsuarioModal/EtapaDados.tsx`
- `src/components/usuarios/NovoUsuarioModal/cadastroEtapa.ts`
- `src/components/usuarios/NovoUsuarioModal/cadastroEtapa.test.ts`
- `src/components/usuarios/NovoUsuarioModal/NovoUsuarioModal.test.tsx`
- `src/components/usuarios/NovoUsuarioModal/index.ts`
- `src/components/usuarios/useConsultaCpf.ts`
- `src/components/usuarios/useUsuarioMutations.ts`

**Arquivos a editar:**
- `src/components/usuarios/UsuariosPage/UsuariosPage.tsx` (abrir o modal e mostrar o `Toast`)

## Critérios de Aceite

- [x] Etapa 1: CPF com máscara; "Continuar" só habilita com CPF válido; erro inline para CPF inválido
- [x] CPF não encontrado leva ao formulário de nome, e-mail, celular e perfil, todos obrigatórios
- [x] CPF encontrado e não vinculado leva à conferência: dados em leitura, só o perfil editável, com o aviso de e-mail e de senha mantida
- [x] CPF já vinculado à empresa permanece na etapa 1 com aviso e atalho para editar o usuário
- [x] "Voltar" mantém o CPF digitado; trocar o CPF descarta a consulta anterior
- [x] Sucesso: modal fecha, lista recarrega e o `Toast` varia conforme `novoCadastro` da resposta
- [x] Erro de rede ou da API aparece no `ErrorBanner`, com o formulário preenchido
- [x] Botões desabilitados durante a operação, sem envio duplicado
- [x] Foco no campo CPF ao abrir e no título da etapa ao trocar de etapa

## Testes

- [x] `cadastroEtapa`: os três resultados da consulta
- [x] Modal: os três caminhos, voltar sem perder o CPF, validação dos campos, erro ao salvar, mensagens de sucesso por `novoCadastro`

## Notas de Implementação

Usar `useAppForm` + Zod como em `MensalistaModal`. Na conferência, o corpo leva os dados da consulta (a API os ignora). Se o back passar a rejeitar, trocar para só `{ cpf, perfil }`.
