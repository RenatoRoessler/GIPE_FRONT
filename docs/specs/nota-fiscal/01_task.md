# Task 01: Dados e API de notas

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

Preparar os tipos, o serviço dos três endpoints, a validação do formulário e os auxiliares de período, usados pelas demais tasks, sem alterar nenhuma tela.

## Contexto Técnico

**Arquivos a criar:**
- `src/types/notaFiscal.ts` — `NotaFiscal` (campos opcionais, **[A CONFIRMAR]**), `SolicitarNotaPayload` e `NotaSolicitada`.
- `src/lib/api/services/notaFiscal.ts` — `listNotasPendentes()` (`GET /nota-fiscal/pendentes`), `listNotasLancadas({ dataInicio, dataFim })` (`GET /nota-fiscal/lancadas`, datas como `2026/10/01`), `solicitarNotaFiscal(payload)` (`POST /nota-fiscal/cliente/solicitar`, sem login), e o mapeador tolerante `fromNotaResponse`.
- `src/lib/api/services/notaFiscal.test.ts`
- `src/lib/schemas/notaFiscal.ts` e `notaFiscal.test.ts` — `solicitarNotaSchema` (e-mail obrigatório, aparado, formato válido, até 150 caracteres; `pessoaJuridica`; documento: CPF opcional para pessoa física e CNPJ obrigatório para pessoa jurídica).
- `src/components/notas/periodo.ts` e `periodo.test.ts` — `mesAtual(hoje)`, `formatDataApi(data)`, `validarPeriodo(de, ate)`.

**Arquivos a editar:**
- Nenhum.

## Critérios de Aceite

- [ ] Os três endpoints são chamados com o caminho, o método, os parâmetros e o corpo certos; a solicitação não envia `documento` quando vazio e envia só dígitos quando preenchido.
- [ ] O mapeador aceita respostas com campos ausentes sem quebrar e nunca devolve "null" como texto.
- [ ] O esquema recusa e-mail vazio, inválido ou com mais de 150 caracteres, e CPF/CNPJ inválido; aceita documento vazio, com e sem máscara.
- [ ] `mesAtual` devolve o primeiro dia do mês até hoje; `formatDataApi` devolve `AAAA/MM/DD`; `validarPeriodo` recusa fim antes do início.
- [ ] Nada mais muda de comportamento; lint e tipos passam.

## Testes

- [ ] Serviço: chamadas e corpo dos três endpoints, datas no formato do exemplo, erros repassados (403, 429, rede).
- [ ] Unitário: mapeador com resposta completa, parcial e vazia.
- [ ] Unitário: esquema com e-mail e documento válidos e inválidos; limite de 150 caracteres.
- [ ] Unitário: helpers de período com datas fixas (virada de mês e de ano).

## Notas de Implementação

Tech Spec, "Tipos", "API" e "Validação". O formato das respostas das listas está **[A CONFIRMAR]**: concentrar a leitura no mapeador. Não copiar o token real do `input.md`; usar códigos fictícios.
