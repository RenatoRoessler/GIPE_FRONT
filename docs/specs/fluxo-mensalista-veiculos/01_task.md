# Task 01: Tipos e utilitários de mensalista

**Status:** ✅ Concluída  
**Dependências:** —

## Objetivo

Preparar a base de tipos e a regra pura de valor, usadas pelas demais tasks, sem alterar nenhuma tela.

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/types/veiculo.ts` — `PlacaConsulta` ganha `mensalista?: boolean` e `dadosMensalista?: DadosMensalistaPlaca | null` (contrato confirmado com o back; novo tipo `DadosMensalistaPlaca`).
- `src/types/saida.ts` — `SaidaConsulta` ganha `mensalistaNome?: string | null`.
- `src/components/veiculos/saida.ts` — nova função `valorACobrar(consulta)`: `consulta.mensalista ? 0 : consulta.valor`.
- `src/components/veiculos/saida.test.ts` — casos da nova função.

## Critérios de Aceite

- [ ] Os campos novos são opcionais; respostas sem eles continuam válidas (equivalem a "não é mensalista").
- [ ] `valorACobrar` devolve 0 para mensalista e o valor da consulta para avulso.
- [ ] Nada mais muda de comportamento; `npm run lint` e a checagem de tipos passam.

## Testes

- [ ] Unitário: `valorACobrar` com mensalista e valor > 0 devolve 0.
- [ ] Unitário: `valorACobrar` com avulso devolve o valor da consulta (inclusive 0).

## Notas de Implementação

Tech Spec, "Tipos e dados". Os campos de `PlacaConsulta` já foram confirmados com o back; `SaidaConsulta.mensalistaNome` segue **[A CONFIRMAR]**; a decisão de manter opcionais evita quebrar o que já funciona.
