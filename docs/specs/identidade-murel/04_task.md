# Task 04: Hook useBarCapacity

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

> Entregar o hook que mede a largura da barra e informa quantos slots de 64px cabem, sem divergir na hidratação.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/layout/BottomNav/useBarCapacity.ts`
- `src/components/layout/BottomNav/useBarCapacity.test.tsx`

**Arquivos a editar:**
- Nenhum.

## Critérios de Aceite

- [x] O hook devolve `{ ref, capacidade }`; `capacidade` é `null` até a primeira medição.
- [x] `capacidade = Math.floor(largura / 64)`; a constante `SLOT_MIN` está comentada com o motivo (alvo de 44px + rótulo).
- [x] Atualiza ao redimensionar e ao girar o aparelho, sem recarregar.
- [x] Mede o contêiner externo da barra (largura limitada por janela e `contentMaxWidth`), não o conteúdo, para evitar laço de medição.
- [x] Desconecta o `ResizeObserver` ao desmontar.

## Testes

- [x] Valor inicial `null`.
- [x] Larguras 320, 375, 768, 1440 (com `ResizeObserver` simulado) geram as capacidades esperadas.
- [x] Mudança de largura atualiza a capacidade.
- [x] Desmontar chama `disconnect`.

## Notas de Implementação

> Techspec seções 3 e "Riscos". jsdom não calcula layout: o teste simula `ResizeObserver` e `contentRect`.

## Registro da execução

- Assinatura: `useBarCapacity(larguraMaxima = Infinity)` devolve `{ ref, capacidade }`. `ref` é um callback ref (guarda o elemento em estado), então o efeito roda quando a barra aparece mesmo que ela monte depois do hook. `larguraMaxima` é o limite de largura útil (a Task 05 passa `contentMaxWidth` do tema em número).
- Acrescentei um caminho sem `ResizeObserver` (mede com `getBoundingClientRect` e acompanha `resize` da janela), para a barra não ficar eternamente em `null` em ambientes sem o recurso, como o jsdom dos testes dos componentes que ainda não mockam o hook.
- `SLOT_MIN` (64) é exportada para a Task 05 e os testes usarem o mesmo valor.
- Com largura zero a capacidade é 0; a regra do mínimo de três espaços fica em `dividirItensDaBarra` (Task 03), não no hook.
- Verificado: 14 testes do hook passam; `npx tsc --noEmit` e ESLint sem erros nos dois arquivos.
- Não verificado em navegador: a medição real e o comportamento ao girar o aparelho dependem da barra da Task 05.
