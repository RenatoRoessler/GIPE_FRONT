# Task 01: Tipos, perfis e serviço de API

**Status:** ✅ Concluída
**Dependências:** —

## Objetivo

Entrega a base de dados da feature: tipos, rótulos de perfil, regra do último Administrador e o serviço que fala com `/api/v1/Usuario`, sem nenhuma tela.

## Contexto Técnico

**Arquivos a criar:**
- `src/types/usuario.ts`
- `src/components/usuarios/perfil.ts`
- `src/components/usuarios/perfil.test.ts`
- `src/components/usuarios/ultimoAdmin.ts`
- `src/components/usuarios/ultimoAdmin.test.ts`
- `src/lib/api/services/usuario.ts`
- `src/lib/api/services/usuario.mapper.ts`
- `src/lib/api/services/usuario.test.ts`
- `src/lib/api/services/usuario.mapper.test.ts`

**Arquivos a editar:**
- —

## Critérios de Aceite

- [x] `PERFIL_USUARIO` (1 Administrador, 2 Gerente, 3 Manobrista, 4 Caixa, 8 Financeiro) e os tipos `Usuario`, `CpfConsulta`, `NovoUsuarioValues`, `NovoUsuarioPayload`, `NovoUsuarioResultado`
- [x] `perfil.ts` expõe rótulo em português, ordem e opções do `Select`; perfil fora do enum vira "Perfil {n}"
- [x] `ehUltimoAdminAtivo(usuario, lista)` é verdadeiro só para o único Administrador ativo da lista
- [x] `listUsuarios`, `consultarCpf`, `createUsuario`, `updatePerfil`, `updateAtivo` e `alterarSenha` usam as rotas do `input.md`
- [x] CPF é enviado só com dígitos; celular só com dígitos; a lista é um array simples (sem `Paginado`)
- [x] O mapper tolera campos ausentes e guarda `perfilDescricao` e `trocarSenha`
- [x] Os erros são propagados como `ApiError`; nenhuma senha é logada

## Testes

- [x] Mapper: resposta completa, campos ausentes, perfil desconhecido
- [x] `ultimoAdmin`: um admin, dois admins, admin inativo, lista vazia, usuário não admin
- [x] Serviço com `api` mockado: URL, método e corpo de cada chamada, CPF sem máscara, erro propagado

## Notas de Implementação

Seguir o padrão de `mensalista.ts` e `mensalista.mapper.ts`.
