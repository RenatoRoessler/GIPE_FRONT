# Task 06: Saída: telas do modal

**Status:** ✅ Concluída  
**Dependências:** Task 02, Task 05

## Objetivo

Mostrar o aviso de mensalista na saída, ocultar o pagamento e permitir concluir sem cobrança (RF5, RF6, RF7).

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/components/veiculos/ResumoSaida/ResumoSaida.tsx` — com `consulta.mensalista`, renderiza `CardMensalista contexto="saida"` abaixo do cabeçalho do veículo, mantém o `StatusBadge` e usa `valorACobrar` no `ValuePanel` ("Nada a cobrar").
- `src/components/veiculos/SaidaVeiculoModal/SaidaVeiculoModal.tsx` — com `semCobranca`: não monta `PagamentoSaida`, mostra `Hint` "Sem pagamento nesta saída.", botão "Confirmar saída" (sem valor), e não exibe a nota "Carregando meios de pagamento…" no rodapé.
- Testes: `ResumoSaida.test.tsx`, `SaidaVeiculoModal.test.tsx`, `SaidaVeiculoModal.direto.test.tsx`.

## Critérios de Aceite

- [ ] Mensalista: card visível no resumo, "Nada a cobrar", sem forma de pagamento, valor recebido nem troco, botão "Confirmar saída".
- [ ] Avulso: tela idêntica à atual (card ausente, pagamento e botão com valor).
- [ ] O fluxo aberto direto da lista do pátio (`buscaInicial`) também mostra o card e oculta o pagamento.
- [ ] O foco e o anúncio de fase continuam como hoje; o card é anunciado com `role="status"` sem mover o foco.
- [ ] No celular, o card ocupa a largura do modal sem rolagem horizontal.

## Testes

- [ ] Componente: `ResumoSaida` com mensalista mostra card e "Nada a cobrar"; sem mensalista não mostra card.
- [ ] Componente: modal de mensalista não renderiza as formas de pagamento e confirma a saída.
- [ ] Componente: modal de avulso continua exigindo pagamento.
- [ ] Componente: abertura direta pela lista com mensalista.

## Notas de Implementação

Tech Spec, "Saída" e `design.md`. Não adicionar modo "mensalista" ao `PagamentoSaida`: o modal simplesmente não o monta.
