# Task 03: Login encaminha para o primeiro acesso

**Status:** ✅ Concluída  
**Dependências:** Task 01, Task 02

## Objetivo

Fecha o fluxo: quando o login responde que a troca de senha é obrigatória, o `LoginForm` guarda o token de troca e leva o usuário à tela de primeiro acesso, sem criar sessão e sem mostrar erro.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/auth/LoginForm/LoginForm.test.tsx`

**Arquivos a editar:**
- `src/components/auth/LoginForm/LoginForm.tsx` — tratar o resultado `trocar-senha` com `switch` exaustivo sobre `LoginResult`

## Critérios de Aceite

- [x] Resultado `trocar-senha`: guarda o token de troca em memória e vai para `/primeiro-acesso`
- [x] Nesse caso nenhum cookie de sessão é criado
- [x] Nesse caso a credencial não é salva como lembrada, mesmo com "Lembrar senha" marcado, e a credencial lembrada anterior é limpa
- [x] Nenhum erro nem toast aparece no login nesse caso; durante a requisição vale o "Entrando..."
- [x] Resultado `sessao`: comportamento atual (cookie, lembrar ou limpar a credencial, `/dashboard`)
- [x] Depois de trocar a senha, o login com o mesmo CPF e a nova senha entra normalmente
- [x] Erros de login (CPF ou senha inválidos, rede) continuam como hoje

## Testes

- [x] `trocar-senha`: token guardado, `router.push("/primeiro-acesso")`, sem `saveToken`, sem `saveRememberedLogin`, com `clearRememberedLogin`
- [x] `trocar-senha` com "Lembrar senha" marcado: ainda assim não salva a credencial
- [x] `sessao`: `saveToken` e `/dashboard`, com e sem "Lembrar senha"
- [x] Erro 401 mostra "CPF ou senha inválidos." e não navega
- [x] Fluxo ponta a ponta com serviços mockados: login com troca → tela de primeiro acesso → troca bem-sucedida → `/login?senha=alterada` mostra o aviso

## Notas de Implementação

Tech Spec, seção 4 ("Login → primeiro acesso") e decisão 2. O `LoginForm` já chama `clearToken()` antes do login. O `switch` exaustivo faz o TypeScript apontar um novo resultado de login no futuro (ex.: seleção de empresa).
