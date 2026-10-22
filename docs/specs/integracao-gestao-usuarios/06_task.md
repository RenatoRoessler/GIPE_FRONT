# Task 06: Editar perfil e acesso

**Status:** ✅ Concluída
**Dependências:** Task 04

## Objetivo

Entrega o modal de edição: alterar o perfil e ativar ou inativar o acesso, com confirmações e a proteção do último Administrador.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/usuarios/EditarUsuarioModal/EditarUsuarioModal.tsx`
- `src/components/usuarios/EditarUsuarioModal/EditarUsuarioModal.test.tsx`
- `src/components/usuarios/EditarUsuarioModal/index.ts`

**Arquivos a editar:**
- `src/components/usuarios/useUsuarioMutations.ts` (mutações de perfil e de acesso, caso a Task 05 ainda não as tenha)
- `src/components/usuarios/UsuariosPage/UsuariosPage.tsx` (abrir o modal pelo "Editar")

## Critérios de Aceite

- [x] Nome, CPF e e-mail em leitura; `Select` de perfil com os cinco perfis e `Switch` "Acesso ativo nesta empresa"
- [x] Textos fixos: vale só nesta empresa e a partir do próximo login
- [x] "Salvar" desabilitado enquanto nada mudou; envia apenas as chamadas dos campos alterados
- [x] Inativar e rebaixar um Administrador pedem `ConfirmDialog`, com foco em "Cancelar"
- [x] Último Administrador ativo: `Select` e `Switch` desabilitados, com explicação ligada por `aria-describedby`
- [x] Editar a si mesmo mostra o aviso de autoedição
- [x] Falha parcial: a mudança bem-sucedida permanece, o `ErrorBanner` diz qual falhou e a lista é recarregada
- [x] Erro da API (inclusive a regra do último Administrador) aparece no `ErrorBanner` mesmo com o controle habilitado
- [x] Perfil fora do enum aparece como opção desabilitada para não ser perdido

## Testes

- [x] Só perfil muda, só acesso muda, os dois mudam, nada muda
- [x] Confirmações de inativar e de rebaixar, cancelar e confirmar
- [x] Último Administrador, autoedição, falha parcial, erro da API

## Notas de Implementação

Estado inicial vem da linha da lista, sem nova chamada. Perfil e acesso são duas chamadas independentes, sem rollback (Tech Spec, decisão 6).
