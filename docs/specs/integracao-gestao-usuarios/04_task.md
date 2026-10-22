# Task 04: Página e listagem de usuários

**Status:** ✅ Concluída
**Dependências:** Task 01, Task 03

## Objetivo

Entrega a tela `/usuarios` com a tabela real, seus estados e a restrição ao Administrador. Os botões de "Novo usuário" e "Editar" já existem e abrem os modais das Tasks 05 e 06.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/usuarios/UsuariosPage/UsuariosPage.tsx`
- `src/components/usuarios/UsuariosPage/index.ts`
- `src/components/usuarios/UsuariosList/UsuariosList.tsx`
- `src/components/usuarios/UsuariosList/index.ts`
- `src/components/usuarios/UsuariosList/UsuariosList.test.tsx`
- `src/components/usuarios/PerfilBadge.tsx`
- `src/components/usuarios/useUsuarios.ts`
- `src/components/usuarios/Usuarios.styles.ts`

**Arquivos a editar:**
- `src/app/(app)/usuarios/page.tsx` (metadata + `<UsuariosPage />`)

## Critérios de Aceite

- [x] Tabela com nome (e-mail abaixo), CPF com máscara, celular, perfil, status e data de criação
- [x] Perfil sempre em português; status em texto e cor (`StatusBadge`)
- [x] Linhas inativas esmaecidas; o usuário logado aparece com "(você)"
- [x] Carregando: linhas de `Skeleton` com o mesmo número de colunas
- [x] Erro de carregamento: `ErrorBanner` com "Tentar novamente"
- [x] Vazio: mensagem e botão "Novo usuário"
- [x] Perfil diferente de Administrador vê "Sem permissão" e a API não é chamada
- [x] Botão "Editar" com `aria-label="Editar {nome}"`
- [x] No mobile (abaixo de `breakpoints.md`) as linhas viram cartões via `data-label`
- [x] `Toast` de sucesso exposto para os modais seguintes

## Testes

- [x] Carregando, erro com nova tentativa, vazio, linha inativa, "(você)", perfil sem permissão, perfil desconhecido

## Notas de Implementação

Sem paginação nem busca (a API não pagina). Chave de cache `USUARIOS_QUERY_KEY` exportada de `useUsuarios.ts`. Antes de criar a página, conferir em `node_modules/next/dist/docs/` o padrão de `metadata` desta versão do Next (ver `AGENTS.md`).
