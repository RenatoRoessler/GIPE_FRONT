# Task 05: QR no recibo da tela de saída

**Status:** ✅ Concluída  
**Dependências:** Task 01

## Objetivo

Mostrar o QR que aponta para a página pública no recibo que aparece depois de registrar a saída, na tela e na impressão.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/veiculos/QrRecibo/QrRecibo.tsx`, `index.ts` e `QrRecibo.test.tsx` — pontilhado, `QrCode` de 140px (`aria-label="QR code do recibo de saída"`), "Leve o recibo no celular", frase de apoio e o endereço curto; sem `link`, não renderiza nada.

**Arquivos a editar:**
- `src/components/veiculos/Recibo.styles.ts` — estilos do bloco do QR.
- `src/components/veiculos/ReciboSaidaStep/ReciboConteudo.tsx` — `ReciboData.link?: string | null`; renderiza `QrRecibo` depois do total.
- `src/components/veiculos/ReciboSaidaStep/ReciboSaidaStep.tsx` — monta `link` (`${window.location.origin}/recibo/${encodeURIComponent(token)}`) quando `saida.tokenRecibo` existir; senão `null`.
- Testes de `ReciboConteudo` e `ReciboSaidaStep`.

## Critérios de Aceite

- [ ] Saída registrada com código do recibo: o recibo mostra o QR e o endereço curto, também na impressão.
- [ ] Saída de mensalista também mostra o QR.
- [ ] Sem código do recibo: nenhum QR, nenhum espaço vazio e nenhuma mensagem de erro.
- [ ] O QR aponta para `/recibo/<código>` da origem atual.
- [ ] O resto do recibo (dados, pagamento, troco) não muda.

## Testes

- [ ] Componente: `QrRecibo` com e sem `link`; endereço curto sem `https://`.
- [ ] Componente: `ReciboConteudo` com `link` mostra o QR depois do total; sem `link`, igual ao de hoje.
- [ ] Componente: `ReciboSaidaStep` monta o link a partir de `tokenRecibo` e não monta sem ele.
- [ ] Componente: recibo de mensalista com QR.

## Notas de Implementação

Tech Spec, "Recibo da tela de saída" e `design.md`. O recibo impresso usa o mesmo `ReciboConteudo`, então o QR sai no papel sem trabalho extra.
