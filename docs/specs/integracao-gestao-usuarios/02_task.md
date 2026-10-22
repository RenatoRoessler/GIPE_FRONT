# Task 02: Esquemas de validação

**Status:** ✅ Concluída
**Dependências:** Task 01

## Objetivo

Entrega as regras de validação dos formulários como esquemas Zod puros: cadastro de usuário e troca de senha.

## Contexto Técnico

**Arquivos a criar:**
- `src/lib/schemas/usuario.ts`
- `src/lib/schemas/usuario.test.ts`
- `src/lib/schemas/alterarSenha.ts`
- `src/lib/schemas/alterarSenha.test.ts`

**Arquivos a editar:**
- — (reusar `isValidCPF`, `isValidEmail` e `isValidCelular`; não alterá-los)

## Critérios de Aceite

- [x] `cpfSchema`: CPF com dígito verificador válido, com ou sem máscara
- [x] `novoUsuarioSchema`: nome, e-mail, celular e perfil obrigatórios; e-mail válido; celular DDD + 9 dígitos; perfil dentro do enum; limites de 150 caracteres para nome e e-mail
- [x] `alterarSenhaSchema`: senha atual obrigatória; nova senha com no mínimo 6 caracteres e diferente da atual; confirmação igual à nova
- [x] Mensagens de erro em português, no padrão dos demais esquemas

## Testes

- [x] CPF válido, inválido, com e sem máscara
- [x] Campos vazios, e-mail inválido, celular inválido, perfil fora do enum, nome longo
- [x] Nova senha com 5 e com 6 caracteres, igual à atual, confirmação diferente

## Notas de Implementação

Seguir `src/lib/schemas/mensalista.ts`. Os limites de nome e e-mail são provisórios até o back confirmar.
