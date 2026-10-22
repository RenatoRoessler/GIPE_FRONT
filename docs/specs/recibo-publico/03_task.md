# Task 03: Página do recibo

**Status:** ✅ Concluída  
**Dependências:** Task 01, Task 02

## Objetivo

Entregar a página pública do recibo completa, com todos os estados, mensalista e impressão.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/veiculos/ReciboPublico/ReciboPublico.styles.ts` — só o próprio (total em destaque, impressão); o resto vem de `ComprovantePublico.styles`.
- `src/components/veiculos/ReciboPublico/ReciboPublico.test.tsx`

**Arquivos a editar:**
- `src/components/veiculos/ReciboPublico/ReciboPublico.tsx` — completa o componente: `useQuery(["recibo", token], consultarRecibo)` com `refetchOnWindowFocus: false`; estados carregando, recibo, não encontrado e erro com "Tentar novamente".

## Critérios de Aceite

- [ ] Cabeçalho com "Recibo de saída", razão social, endereço e telefone formatados (quando houver).
- [ ] Cartão com "Saída registrada", categoria, "Total pago" em reais (R$ 15.100,00 para 15100) e a forma de pagamento.
- [ ] Grade com placa, veículo, entrada, saída e permanência; campos ausentes somem, sem "null" nem traço.
- [ ] Mensalista (quando `mensalista`): etiqueta "Mensalista" e "Sem cobrança", sem forma de pagamento; valor zero também mostra "Sem cobrança".
- [ ] "Nota fiscal solicitada" no rodapé só quando indicado.
- [ ] Carregando anunciado (`role="status"`); não encontrado e erro (`role="alert"`, com nova tentativa).
- [ ] Impressão: só cabeçalho e cartão saem; botões e moldura de celular não (`@media print`).
- [ ] Botões Baixar PDF e Imprimir presentes; o PDF vem na Task 04 (o botão fica desabilitado ou oculto até lá).

## Testes

- [ ] Componente: recibo completo, formatação de valor, CNPJ e telefone.
- [ ] Componente: campos opcionais ausentes; mensalista; valor zero; nota fiscal.
- [ ] Componente: carregando, não encontrado (404) e erro de rede com nova tentativa.
- [ ] Componente: o botão Imprimir chama `window.print`.

## Notas de Implementação

Tech Spec, "Página pública" e `design.md`. Mocks de `consultarRecibo` e `QueryClient` como em `ComprovantePublico.test.tsx`.
