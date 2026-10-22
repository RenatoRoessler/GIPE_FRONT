# Task 04: Recibo de entrada

**Status:** ✅ Concluída  
**Dependências:** Task 01

## Objetivo

Deixar o recibo da entrada coerente com o novo fluxo, identificando o mensalista (RF4).

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/components/veiculos/ReciboEntradaStep/ReciboEntradaConteudo.tsx` — mostra `StatusBadge` (tom `info`) "Mensalista" na linha do veículo quando `entrada.mensalista` for verdadeiro.
- `src/components/veiculos/ReciboEntradaStep/ReciboEntradaConteudo.test.tsx` — novos casos.

## Critérios de Aceite

- [ ] Entrada de mensalista: o recibo mostra a etiqueta "Mensalista".
- [ ] Entrada de avulso: o recibo fica idêntico ao atual.
- [ ] O recibo não mostra o nome do mensalista (dado pessoal).
- [ ] A etiqueta aparece também na impressão.

## Testes

- [ ] Componente: com `mensalista: true` mostra a etiqueta.
- [ ] Componente: com `mensalista: false` não mostra.

## Notas de Implementação

Tech Spec, "Entrada" (recibo) e "Riscos" (dados pessoais). `EntradaRegistrada.mensalista` já existe na resposta de `/Patio/entrada`.
