# Task 05: Saída sem cobrança no fluxo

**Status:** ✅ Concluída  
**Dependências:** Task 01

## Objetivo

Fazer a lógica da saída tratar o mensalista como sem cobrança: valor zero, confirmação sem forma de pagamento e sem troco (RF6, RF7).

## Contexto Técnico

**Arquivos a criar:**
- Nenhum.

**Arquivos a editar:**
- `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.ts`:
  - `pagamento`: com `consulta.mensalista`, `{ canConfirm: true }`, sem depender de `meios` nem de `forma` (não trava por "Carregando meios de pagamento" nem por empresa sem meios).
  - `confirmMutation`: usa `valorACobrar` na comparação de mudança de valor e no payload; para mensalista envia `valor: 0` e `formaPagamento` padrão (`FORMA_DINHEIRO`); não calcula `recebido` nem `troco`.
  - Retorna `semCobranca: consulta?.mensalista === true`.
  - Mudança da condição de mensalista entre reconsultas é tratada como "valor mudou" (mesmo `Notice`), exigindo nova confirmação.
- `src/components/veiculos/SaidaVeiculoModal/useSaidaFlow.test.tsx` — novos casos.

## Critérios de Aceite

- [ ] Mensalista: `confirmar` fica habilitado assim que há consulta, mesmo com meios carregando, com erro ou vazios.
- [ ] `registrarSaida` recebe `valor: 0` e a forma padrão para mensalista.
- [ ] O resultado do mensalista não tem `recebido` nem `troco`.
- [ ] Avulso: comportamento idêntico ao atual (forma, recebido, troco, valor).
- [ ] Se a reconsulta mudar de mensalista para avulso (ou o inverso), o fluxo avisa e pede nova confirmação, sem registrar nada.

## Testes

- [ ] Hook: mensalista confirma sem forma e envia valor 0.
- [ ] Hook: mensalista confirma com `meios` em carregando/erro/vazio.
- [ ] Hook: avulso mantém a validação de pagamento em dinheiro e cartão.
- [ ] Hook: mudança de condição na reconsulta dispara o aviso de mudança.

## Notas de Implementação

Tech Spec, "Saída" e "Riscos". **Pré-requisito [A CONFIRMAR com o back]:** `POST /Patio/{id}/saida` aceita `valor: 0` com a forma padrão para mensalista, sem gerar lançamento no caixa. Se o back recusar, marcar a task como ❌ Bloqueada e rever o Tech Spec. Todo cálculo de valor passa por `valorACobrar` (Task 01).
