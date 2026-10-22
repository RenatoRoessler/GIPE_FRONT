# Task 03: Botão no recibo da saída

**Status:** ✅ Concluída  
**Dependências:** Task 02

## Objetivo

Oferecer "Gerar nota fiscal" no recibo da tela de saída, depois de registrada a saída.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/components/veiculos/ReciboSaidaStep/ReciboSaidaStep.tsx` — botão secundário **Gerar nota fiscal** ao lado de Imprimir e Concluir quando `saida.tokenRecibo` existir, a saída não for de mensalista e `saida.valor > 0`; abre o `NotaFiscalModal` com `token`, `valor` e `placa`. Ao solicitar, guarda `notaSolicitada` (troca o botão pelo texto "Nota fiscal solicitada" com ícone de check) e invalida a lista de pendentes.
- Testes de `ReciboSaidaStep` (e do modal de saída, se necessário).

## Critérios de Aceite

- [ ] Saída com cobrança e código do recibo: o botão aparece e abre o modal com o valor da saída.
- [ ] Saída de mensalista, valor zero ou sem código do recibo: o botão não aparece.
- [ ] Depois de solicitada, o botão dá lugar a "Nota fiscal solicitada".
- [ ] O botão e o texto não entram no recibo da impressão.
- [ ] O restante do recibo (dados, QR, pagamento, troco) não muda.

## Testes

- [ ] Componente: aparece com cobrança e código; não aparece sem um deles nem para mensalista.
- [ ] Componente: abrir o modal e concluir troca o botão pelo texto.
- [ ] Componente: a impressão (nó `recibo-print-root`) não contém o botão.
- [ ] Regressão: testes existentes de `ReciboSaidaStep` e do modal de saída.

## Notas de Implementação

Tech Spec, "Pontos de entrada". O modal abre por cima do modal de saída (dois `<dialog>` empilhados): conferir o foco ao fechar.
