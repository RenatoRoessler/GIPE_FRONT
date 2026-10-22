# Task 07: Recibo de saída

**Status:** ✅ Concluída  
**Dependências:** Task 05

## Objetivo

Fazer o recibo da saída de mensalista refletir a ausência de cobrança (RF6).

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/components/veiculos/ReciboSaidaStep/ReciboConteudo.tsx` — `ReciboData` ganha `mensalista?: boolean`; quando verdadeiro, omite forma de pagamento, recebido e troco e mostra "Sem cobrança" no lugar do valor; exibe a etiqueta "Mensalista".
- `src/components/veiculos/ReciboSaidaStep/ReciboSaidaStep.tsx` — passa `mensalista: consulta.mensalista` ao `ReciboData`.
- Testes de `ReciboConteudo` e `ReciboSaidaStep`.

## Critérios de Aceite

- [ ] Saída de mensalista: o recibo (tela e impressão) mostra "Mensalista" e "Sem cobrança", sem forma de pagamento, recebido nem troco.
- [ ] Saída de avulso: recibo idêntico ao atual.
- [ ] O recibo não mostra o nome do mensalista.

## Testes

- [ ] Componente: com `mensalista: true` mostra "Sem cobrança" e oculta os campos de pagamento.
- [ ] Componente: com `mensalista: false` mantém todos os campos.
- [ ] Componente: `ReciboSaidaStep` repassa a condição de mensalista.

## Notas de Implementação

Tech Spec, "Saída" (recibo) e "Riscos" (dados pessoais).
