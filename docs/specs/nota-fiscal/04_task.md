# Task 04: Botão no recibo público

**Status:** ✅ Concluída  
**Dependências:** Task 02

## Objetivo

Oferecer "Solicitar nota" na página pública do recibo.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/components/veiculos/ReciboPublico/ReciboPublico.tsx` — terceiro botão **Solicitar nota** (ícone de documento) na linha de ações quando `!notaFiscalSolicitada`, a saída tem cobrança (`!mensalista` e `valorDoRecibo(valor) > 0`); abre o `NotaFiscalModal` com `token = recibo.token` e `valor = valorDoRecibo(recibo.valor)`. Ao solicitar, atualiza o cache da consulta com `notaFiscalSolicitada: true`.
- `src/components/veiculos/ReciboPublico/ReciboPublico.test.tsx`.

## Critérios de Aceite

- [ ] Recibo com cobrança e sem nota solicitada: o botão aparece e abre o modal com o valor do recibo.
- [ ] Recibo com nota já solicitada, de mensalista ou com valor zero: o botão não aparece.
- [ ] Depois de solicitada, o botão some e o rodapé mostra "Nota fiscal solicitada."
- [ ] A linha de ações continua fora da impressão.
- [ ] Baixar PDF e Imprimir continuam funcionando.

## Testes

- [ ] Componente: botão visível, escondido por nota já solicitada, mensalista e valor zero.
- [ ] Componente: abrir o modal, solicitar e ver o rodapé e o botão sumindo.
- [ ] Regressão: testes existentes do recibo público.

## Notas de Implementação

Tech Spec, "Pontos de entrada". A página é pública: o modal não pode depender de sessão.
