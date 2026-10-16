# Task 04: Componente Tabs no design system

**Status:** ✅ Concluída
**Dependências:** Task 01

## Objetivo

Adiciona o componente `Tabs` acessível ao design system, necessário para a página de mensalistas.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/ui/Tabs/Tabs.tsx`
- `src/components/ui/Tabs/Tabs.styles.ts`
- `src/components/ui/Tabs/index.ts`
- `src/components/ui/Tabs/Tabs.test.tsx`

**Arquivos a editar:**
- —

## Critérios de Aceite

- [x] Renderiza `role="tablist"`, `role="tab"` (com `aria-selected`) e `role="tabpanel"` ligados por `aria-controls`/`id`
- [x] Setas esquerda/direita movem o foco e selecionam; Home/End vão à primeira/última aba; `tabIndex` móvel (roving)
- [x] Aba ativa com sublinhado de `2px` em `colors.primary`; foco visível padrão (`outline: 3px solid colors.primary`)
- [x] Rolagem horizontal em telas estreitas; área de toque mínima de 44px
- [x] Apenas tokens do tema, sem valores soltos; transient props (`$active`)

## Testes

- [x] Clicar em uma aba chama `onChange` com o id
- [x] Setas, Home e End navegam corretamente
- [x] Atributos ARIA corretos na aba ativa e inativa
- [x] Só o painel da aba ativa é exibido

## Notas de Implementação

API da seção 5 do Tech Spec (`tabs`, `value`, `onChange`, `aria-label`, `children`). Seguir `styled-components-best-practices` e `claude-design`. Definição visual em `design.md`.
