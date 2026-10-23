# Task 04: Bloqueio por URL no proxy

**Status:** ✅ Concluída  
**Dependências:** Task 01, Task 02, Task 03

## Objetivo

> Impedir o acesso por URL direta às áreas não permitidas ao perfil, sem renderizar a tela protegida (RF3 e critério "nem por URL direta" do PRD).

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/proxy.ts` — com token presente, decodificar o perfil (`parseSession` de `src/lib/session.ts`), resolver `areaDaRota(pathname)` e redirecionar para `/acesso-negado` quando `!podeAcessar`.
- `src/proxy.test.ts` — novos casos.

## Critérios de Aceite

- [x] Perfil sem permissão numa rota restrita é redirecionado para `/acesso-negado`.
- [x] Perfil com permissão segue normalmente (`NextResponse.next()`).
- [x] `/acesso-negado` e rotas sem área (`/usuario/editar`, `/atualizacoes`) não são bloqueadas e não geram loop.
- [x] Token ilegível ou sem role é tratado como `perfil: null` (só `Inicio`), nunca como acesso liberado.
- [x] Rotas públicas e o redirecionamento para `/login` sem cookie continuam como estão.
- [x] Bloqueia também as navegações do cliente (requisições RSC) da mesma rota.

## Testes

- [x] Proxy: matriz perfil × rota restrita (Manobrista em `/precos`, Caixa em `/usuarios`, Gerente em `/minha-empresa`, Financeiro em `/patio` etc.).
- [x] Proxy: perfil permitido em cada área passa.
- [x] Proxy: token inválido/sem role em rota restrita redireciona; em `/dashboard` passa.
- [x] Proxy: rotas públicas sem cookie continuam acessíveis; privadas sem cookie vão a `/login`.

## Notas de Implementação

> Tech Spec, seção 3. Ler `node_modules/next/dist/docs/` sobre `proxy` antes de editar. A decodificação não valida a assinatura (a API valida); isso é só experiência de interface. Não importar APIs de browser no caminho do proxy.
