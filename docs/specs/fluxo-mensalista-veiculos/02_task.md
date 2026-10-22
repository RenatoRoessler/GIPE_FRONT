# Task 02: InfoCard e CardMensalista

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

Entregar o card compartilhado pelas telas de entrada e de saída, isolado e testado, conforme `design.md`.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/ui/InfoCard/InfoCard.tsx`, `InfoCard.styles.ts`, `InfoCard.test.tsx`, `index.ts` — aviso informativo com ícone, título e texto de apoio (`title`, `icon?`, `children?`), `role="status"`, fundo `primarySoft` e borda `primary`.
- `src/components/veiculos/CardMensalista/CardMensalista.tsx`, `CardMensalista.test.tsx`, `index.ts` — props `nome?: string | null` e `contexto: "entrada" | "saida"`.

**Arquivos a editar:**
- Nenhum.

## Critérios de Aceite

- [ ] Título "Mensalista" e nome do mensalista quando informado; sem nome, só o título.
- [ ] Variante `rotativo` (só na entrada): título "Mensalista fora do horário", texto "A entrada será registrada como rotativo e cobrada normalmente." e, com `horario`, "Horário contratado: 07:00 às 19:00"; ícone de relógio.
- [ ] Texto de apoio: entrada "A entrada será registrada como mensalista."; saída "Saída sem cobrança."
- [ ] Ícone decorativo (`aria-hidden`); nome longo quebra em até duas linhas, com `title` do texto completo.
- [ ] Só tokens do tema; sem cor ou espaçamento solto. Contraste AA nos quatro temas.
- [ ] Respeita `prefers-reduced-motion` (sem transição de altura).

## Testes

- [ ] Componente: `InfoCard` renderiza título, conteúdo e `role="status"`.
- [ ] Componente: `CardMensalista` com e sem nome.
- [ ] Componente: variante `rotativo` com e sem horário.
- [ ] Componente: texto de apoio muda entre `entrada` e `saida`.

## Notas de Implementação

Tech Spec, "Design" e "Decisões técnicas": `InfoCard` fica em `ui` por ser usado em dois fluxos; não promover o `Notice` (ele é `role="alert"`). Seguir `claude-design` e `styled-components-best-practices` (transient props).
