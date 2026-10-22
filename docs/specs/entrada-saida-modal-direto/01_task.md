# Task 01: Host dos modais

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

Entregar o host que abre o modal de entrada ou de saída e mostra o aviso de sucesso, isolado e testado, sem ainda estar ligado a nenhum menu.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/veiculos/VeiculoModais/VeiculoModaisProvider.tsx` — guarda qual modal está aberto (`"entrada" | "saida" | null`), usa `useToast`, renderiza `EntradaVeiculoModal` ou `SaidaVeiculoModal` quando abertos e o `Toast` quando há aviso.
- `src/components/veiculos/VeiculoModais/useVeiculoModais.ts` — devolve `abrirEntrada` e `abrirSaida`; lança erro claro fora do provider.
- `src/components/veiculos/VeiculoModais/VeiculoModais.test.tsx`
- `src/components/veiculos/VeiculoModais/index.ts`

**Arquivos a editar:**
- Nenhum.

## Critérios de Aceite

- [ ] `abrirEntrada()` mostra o modal de entrada e `abrirSaida()` o de saída; nunca os dois ao mesmo tempo.
- [ ] Fechar o modal (cancelar, concluir ou Esc) o remove e libera nova abertura.
- [ ] O aviso de sucesso aparece depois de concluir e some ao ser dispensado; o aviso não depende da tela de onde o modal foi aberto.
- [ ] Usar o hook fora do provider lança um erro com mensagem clara.

## Testes

- [ ] Componente: abre e fecha o modal de entrada (modal real mockado, como nos outros testes).
- [ ] Componente: abre e fecha o modal de saída.
- [ ] Componente: `onSuccess` do modal mostra o `Toast` com a mensagem recebida.
- [ ] Unitário: o hook fora do provider lança erro.

## Notas de Implementação

Tech Spec, "Host dos modais". Mockar os modais como em `RegistrarEntradaButton`/`PatioView`; jsdom não implementa `<dialog>` (usar o mesmo remendo dos testes de modais).
