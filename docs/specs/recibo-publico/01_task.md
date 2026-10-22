# Task 01: Contrato e dados do recibo

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

Preparar os tipos, a consulta pública do recibo e a conversão do valor, usados pelas demais tasks, sem alterar nenhuma tela.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/veiculos/ReciboPublico/format.ts` — `valorDoRecibo(valor)` (o valor já vem em reais; valida e arredonda), único ponto de leitura do campo.
- `src/components/veiculos/ReciboPublico/format.test.ts`

**Arquivos a editar:**
- `src/types/veiculo.ts` (ou `src/types/recibo.ts`) — `ReciboCliente` com os campos do contrato e `mensalista?: boolean` **[A CONFIRMAR]**.
- `src/types/saida.ts` — `SaidaRegistrada.tokenRecibo?: string | null` **[A CONFIRMAR]**.
- `src/lib/api/services/patio.ts` — `consultarRecibo(token)`: `GET /Patio/recibo/cliente?token=...`, sem login; `not_found` e `validation` viram `ApiError("not_found", "Recibo não encontrado.", 404)`.
- Teste do serviço (arquivo existente de `patio` ou novo).

## Critérios de Aceite

- [ ] `consultarRecibo` devolve o recibo com todos os campos do contrato.
- [ ] Código inexistente (404) e inválido (400) viram "Recibo não encontrado"; outros erros (rede, 500) passam como estão.
- [ ] `valorDoRecibo(15100)` devolve `15100` (R$ 15.100,00) e trata valores ausentes ou negativos sem quebrar.
- [ ] `SaidaRegistrada` aceita a resposta com e sem `tokenRecibo`; nada mais muda de comportamento.

## Testes

- [ ] Unitário: `valorDoRecibo` com valor em reais, zero, ausente, negativo e valor quebrado.
- [ ] Serviço: chamada correta (endereço e parâmetro `token`), resposta mapeada, 404 e 400 como não encontrado, rede e 500 repassados.
- [ ] Tipos: `npx tsc --noEmit` sem erros.

## Notas de Implementação

Tech Spec, "API e tipos". A unidade do `valor` foi confirmada pelo back: reais. Não copiar o token real do `input.md` para testes; usar códigos fictícios.
