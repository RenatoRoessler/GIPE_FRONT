# Task 02: Rota pública e proxy

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

Abrir a rota `/recibo/[token]` sem login, com validação do código e página fora de buscadores.

## Contexto Técnico

**Arquivos a criar:**
- `src/app/recibo/[token]/page.tsx` — Server Component: `metadata` (título "Recibo de saída — GIPE", `robots: { index: false, follow: false }`), validação com `/^[A-Za-z0-9]{4,32}$/`; código inválido renderiza `ReciboNaoEncontrado`, senão `ReciboPublico`.
- `src/app/recibo/layout.tsx` — `export { default } from "../comprovante/layout";` (copiar o arquivo se o Next recusar o reexporte).
- `src/components/veiculos/ReciboPublico/ReciboPublico.tsx` (esqueleto) e `index.ts` — nesta task, `ReciboNaoEncontrado` completo e `ReciboPublico` mínimo (a Task 03 o completa).
- `src/app/recibo/[token]/page.test.tsx`

**Arquivos a editar:**
- `src/proxy.ts` — `"/recibo"` em `PUBLIC_PATHS` e o comentário.
- `src/proxy.test.ts` — casos novos.

## Critérios de Aceite

- [ ] `/recibo/<código>` abre sem sessão (não redireciona ao login).
- [ ] Código fora do padrão mostra "Recibo não encontrado" sem chamar a API.
- [ ] A página tem `noindex, nofollow` e o título da aba correto.
- [ ] As demais rotas continuam protegidas.

## Testes

- [ ] Proxy: `/recibo/ABC123` sem sessão passa; `/dashboard` sem sessão vai ao login.
- [ ] Página: código inválido mostra a mensagem e não consulta a API; código válido renderiza `ReciboPublico`.
- [ ] Página: metadados com `robots` correto.

## Notas de Implementação

Tech Spec, "Rota pública". Mesmo padrão de `src/app/comprovante/[token]/page.tsx`.
