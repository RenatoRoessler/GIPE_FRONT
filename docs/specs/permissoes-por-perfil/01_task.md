# Task 01: Role numérica e todos os perfis no token

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

> Fazer o sistema identificar o perfil do usuário a partir da role do token mesmo quando ela vem numérica (`"1"`), incluindo os perfis de conveniada, e deixar `session.ts` seguro para rodar no proxy (edge). É a base de todas as demais tasks (RF1, RF6 do PRD).

## Contexto Técnico

**Arquivos a criar:**
- Nenhum (se `session.ts` não puder ficar livre de código de browser, mover `getSession` para um arquivo cliente, por exemplo `src/lib/sessionClient.ts`).

**Arquivos a editar:**
- `src/lib/session.ts` — `perfilDaRole(valor: unknown): PerfilUsuario | null` aceitando número, string só de dígitos, nome e array (primeira role reconhecida); mapa por nome passa a incluir `AdministradorConveniada`, `GerenteConveniada` e `UsuarioConveniada`; garantir que `parseSession` não importa nada de browser.
- `src/lib/session.test.ts` — novos casos.
- `src/types/usuario.ts` — se necessário, mover para cá a checagem de perfil conhecido, evitando dependência `lib → components`.
- Consumidores de `getSession` — ajustar imports se ele mudar de arquivo.

## Critérios de Aceite

- [x] Role `"1"` (string), `1` (número) e `"Administrador"` resultam em `PERFIL_USUARIO.Administrador`.
- [x] Perfis 5, 6 e 7 (e seus nomes) são reconhecidos.
- [x] Role em array usa a primeira reconhecida.
- [x] Role desconhecida, vazia ou ausente resulta em `perfil: null`.
- [x] `parseSession` roda sem `document`/`window` (compatível com o proxy).
- [x] Nenhum comportamento atual de login/menu de usuário quebra.

## Testes

- [x] Unitário (`session.test.ts`): cada formato de role (numérico, texto, array, desconhecido, ausente).
- [x] Unitário: `parseSession` com token sem e-mail/nome continua retornando `null`.
- [x] Rodar a suíte existente que usa `getSession`/`useCurrentUser`.

## Notas de Implementação

> Tech Spec, seção 1. A claim é `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`. Formato real (número vs texto, string vs array) ainda não confirmado: tratar todos. Rodar `npm run lint` ao final.
