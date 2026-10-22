# Task 05: Botão flutuante e conferências

**Status:** ✅ Concluída  
**Dependências:** Task 04

## Objetivo

Garantir que nada na tela fique coberto pela barra e que as páginas públicas continuem corretas com a área segura.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/components/mensalistas/Mensalistas.styles.ts` — `NovoFlutuante` sobe `bottomNavHeight` (`bottom: calc(space[3] + bottomNavHeight + env(safe-area-inset-bottom, 0px))`).
- Páginas públicas (comprovante e contrato), só se a conferência mostrar conteúdo na borda: acrescentar `padding` com `env(safe-area-inset-*)`.

## Critérios de Aceite

- [ ] O botão "Novo mensalista" fica acima da barra, sem cobrir nem ser coberto.
- [ ] Varredura de `position: fixed` com `bottom` não encontra outra peça escondida atrás da barra.
- [ ] Comprovante e contrato continuam corretos com `viewportFit: "cover"` em celular com entalhe, em retrato e paisagem.
- [ ] Formulários com teclado virtual (entrada, saída, caixa) continuam utilizáveis.

## Testes

- [ ] Testes existentes de mensalistas continuam passando.
- [ ] Verificação manual no navegador (modo celular): agenda de mensalistas, comprovante público e contrato.

## Notas de Implementação

Tech Spec, "Ajuste em outra tela" e "Riscos". A folga do conteúdo já vem do `Layout` (Task 04).
