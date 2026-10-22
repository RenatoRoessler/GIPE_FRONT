# Task 04: PDF do recibo

**Status:** ✅ Concluída  
**Dependências:** Task 03

## Objetivo

Permitir baixar o recibo em PDF pela página pública, sem mudar o PDF do comprovante da entrada.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/veiculos/ComprovantePublico/pdfCupom.ts` — auxiliares comuns extraídos de `reciboPdf.ts` (`WIDTH`, `MARGIN`, `formatPlaca`, `toLatin1`, `drawQr`).
- `src/components/veiculos/ReciboPublico/reciboSaidaPdf.ts` — `criarReciboSaidaPdf(recibo, link)` e `baixarReciboSaidaPdf`: PDF de 80 mm com empresa, placa, linhas (entrada, saída, veículo, categoria, permanência, forma, total) e o QR da página; arquivo `recibo-<placa>.pdf`; mensalista com "Sem cobrança" no lugar de forma e total.
- `src/components/veiculos/ReciboPublico/reciboSaidaPdf.test.ts`

**Arquivos a editar:**
- `src/components/veiculos/ComprovantePublico/reciboPdf.ts` — importa os auxiliares de `pdfCupom.ts`, sem mudar o resultado.
- `src/components/veiculos/ReciboPublico/ReciboPublico.tsx` — liga o botão Baixar PDF ("Gerando..." enquanto trabalha; erro com `role="alert"` e nova tentativa).

## Critérios de Aceite

- [ ] O PDF do comprovante da entrada sai idêntico ao de antes (testes existentes passam sem alteração).
- [ ] O PDF do recibo traz os mesmos dados da página e o QR que aponta para a própria página.
- [ ] Mensalista: sem forma de pagamento e com "Sem cobrança".
- [ ] Falha na geração mostra a mensagem e o botão volta a funcionar.

## Testes

- [ ] Unitário: `criarReciboSaidaPdf` com recibo comum e de mensalista (mesmo estilo de `reciboPdf.test.ts`).
- [ ] Componente: clicar em Baixar PDF chama o gerador, mostra "Gerando..." e, em falha, o erro.
- [ ] Regressão: `reciboPdf.test.ts` sem mudanças.

## Notas de Implementação

Tech Spec, "PDF". Texto do PDF só em Latin-1 (`toLatin1`); datas e valor formatados como na página.
