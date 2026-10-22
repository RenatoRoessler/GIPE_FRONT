# Task 04: Integração no layout

**Status:** ✅ Concluída  
**Dependências:** Task 03

## Objetivo

Ligar a barra ao sistema e remover o menu antigo do topo.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/components/layout/AppShell/AppShell.tsx` — renderiza `<BottomNav />` depois do `AppFooter`.
- `src/components/layout/AppShell/AppShell.styles.ts` — abaixo de `lg`, `Layout` com `padding-bottom: calc(bottomNavHeight + env(safe-area-inset-bottom, 0px))`.
- `src/components/layout/Header/Header.tsx` — remove `<MobileNav />`; conferir o alinhamento do logotipo.
- `src/components/layout/NavSign/NavSign.tsx` e `NavSign.styles.ts` — remove a variante `panel` e a prop `variant`.
- `src/components/layout/Gantry/Gantry.tsx` — ajusta o uso do `NavSign` sem `variant`.
- `src/app/layout.tsx` — `viewport` com `viewportFit: "cover"`.

**Arquivos a remover:**
- `src/components/layout/MobileNav/` (pasta inteira).

## Critérios de Aceite

- [ ] No celular, a barra aparece em todas as telas da área logada e o botão "Menu" do topo não existe mais.
- [ ] O fim de cada página, incluindo o link da versão, rola até aparecer inteiro acima da barra.
- [ ] Em tela larga, o pórtico continua igual e a barra não aparece.
- [ ] Nenhuma referência restante a `MobileNav` nem à variante `panel`.
- [ ] `npm run lint`, os testes e `npm run build` passam.

## Testes

- [ ] Componente: `AppShell` renderiza a barra e o cabeçalho sem o botão antigo.
- [ ] Componente: `Gantry` continua renderizando as placas (ajustar `Gantry.test.tsx`).
- [ ] Suíte completa de testes do projeto.

## Notas de Implementação

Tech Spec, "Componentes" e "Área segura". Conferir `grep -rn MobileNav src` sem resultados.
