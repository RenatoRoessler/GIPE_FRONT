# Task 05: Menu e página de mensalistas (esqueleto)

**Status:** ✅ Concluída
**Dependências:** Task 04

## Objetivo

Torna a funcionalidade acessível: item no menu, rota `/mensalistas` e página com as duas abas ligadas à URL, ainda com conteúdo provisório nas abas.

## Contexto Técnico

**Arquivos a criar:**
- `src/app/(app)/mensalistas/page.tsx`
- `src/components/mensalistas/MensalistasPage/MensalistasPage.tsx`
- `src/components/mensalistas/MensalistasPage/index.ts`
- `src/components/mensalistas/Mensalistas.styles.ts`

**Arquivos a editar:**
- `src/lib/nav.ts` — `NavIconId` ganha `"members"` e novo item "Mensalistas" após "Gestão de Usuários"
- `src/components/layout/NavSign/NavIcons.tsx` — `MembersIcon` e entrada no mapa de ícones

## Critérios de Aceite

- [x] Item "Mensalistas" aparece no menu (desktop e mobile) e fica ativo em `/mensalistas`
- [x] `/mensalistas` abre com título "Mensalistas" e as abas "Mensalistas" e "Tipos de mensalidade"
- [x] A aba ativa vem de `?aba=` (padrão mensalistas); trocar de aba atualiza a URL sem rolar a página
- [x] `metadata` com título "Mensalistas — GIPE"
- [x] `npm run lint` e `npm run build` passam

## Testes

- [x] Teste do mapeamento `aba` → aba ativa (valor inválido cai em "mensalistas")
- [x] Teste de renderização da página com as duas abas (componentes filhos mockados)

## Notas de Implementação

A rota fica dentro de `(app)` (protegida pelo proxy). Estilos de página replicam o padrão da `PrecosList.styles.ts` (`Page`, `Header`); extrair módulo compartilhado só se for mecânico.
