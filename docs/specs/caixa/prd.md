# PRD: Tela de Caixa

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-14  
**Versão:** 1.0

---

## 1. Objetivo

Permitir que a operação do estacionamento controle o caixa da empresa em um único lugar: abrir e fechar o caixa, acompanhar o saldo e o turno em andamento, registrar retiradas de dinheiro (sangria), consultar o histórico de turnos e passar o turno entre operadores — com conferência por forma de pagamento e visibilidade de diferenças.

## 2. Contexto e Motivação

O sistema GIPE já registra movimentações e cobranças, mas ainda não há interface para controlar o caixa. O backend já disponibiliza as operações de caixa e turno (inclusive a passagem de turno, implementada em 11/10/2026). Falta a tela que dê ao operador e à gestão controle financeiro e rastreabilidade por turno.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Administrador | Abrir/fechar caixa, auditar turnos e diferenças | Gestão e conferência ao fim do dia |
| Gerente | Mesmo que Administrador, acompanhar saldo e sangrias | Supervisão da operação |
| Caixa | Operar o turno, registrar sangria, passar o turno | Balcão, durante o expediente |
| Manobrista | Assumir o turno e conferir valores na troca | Troca de turno no pátio/guarita |

## 4. Escopo

### Dentro do Escopo
- Novo item de menu **Caixa** e a respectiva tela.
- Abrir caixa com informação do fundo de caixa (abre também o primeiro turno de quem abriu).
- Fechar caixa com conferência por forma de pagamento.
- Retirada de valor (sangria) com motivo obrigatório.
- Histórico de turnos em modal.
- Passagem de turno com conferência por forma de pagamento.
- Cards de saldo do caixa (abertura, fundo, entradas, saídas, saldo).
- Visão do turno atual por forma de pagamento (entradas, saídas, esperado), troco padrão e valor disponível para sangria.
- Estado da tela com caixa fechado.

### Fora do Escopo
- Lançamento de cobranças/pagamentos (entradas) — origem em outras telas.
- Configuração do troco padrão da empresa.
- Relatórios/exportação de caixa e impressão de comprovantes.
- Múltiplos caixas simultâneos por empresa (só pode existir um aberto).
- Edição ou estorno de movimentações já registradas.

## 5. Requisitos Funcionais

### RF-01: Menu e acesso à tela
**Critério de aceite:**
- Dado um usuário com perfil Administrador, Gerente, Caixa ou Manobrista, quando acessa o sistema, então vê o item **Caixa** no menu e consegue abrir a tela.
- Dado um usuário sem permissão, quando tenta acessar a tela, então é informado de que não tem permissão e nenhuma operação é executada.

### RF-02: Estado com caixa fechado
**Critério de aceite:**
- Dado que não há caixa aberto na empresa, quando o usuário abre a tela, então vê uma mensagem de caixa fechado e o botão **Abrir caixa**, sem o botão **Fechar caixa**, sem saldo e sem turno.

### RF-03: Abrir caixa
**Critério de aceite:**
- Dado que o caixa está fechado, quando o usuário clica em **Abrir caixa**, então um modal solicita o **Fundo de caixa**.
- Dado o modal aberto com valor válido (zero ou maior), quando confirma, então o caixa é aberto, o primeiro turno é iniciado em nome do usuário com o fundo como valor inicial e a tela passa a exibir o caixa aberto.
- Dado que já existe caixa aberto, quando a abertura é tentada, então o sistema informa o erro e mantém o estado atual.
- Dado que o caixa está aberto, então o botão **Abrir caixa** não é exibido.

### RF-04: Saldo do caixa
**Critério de aceite:**
- Dado que o caixa está aberto, quando a tela carrega, então são exibidos: data/hora de abertura, fundo de caixa, total de entradas, total de saídas e saldo.
- Dado que ocorre uma sangria, passagem de turno ou outra operação, então os valores são atualizados sem recarregar a página manualmente.

### RF-05: Turno atual
**Critério de aceite:**
- Dado que há turno aberto, quando a tela carrega, então são exibidos responsável, início, valor inicial e, por forma de pagamento, entradas, saídas e valor esperado.
- Dado a forma de pagamento Dinheiro, então o valor esperado inclui o valor inicial do turno.
- Dado o turno aberto, então são exibidos o troco padrão da empresa e o valor disponível para sangria.

### RF-06: Retirada de valor (sangria)
**Critério de aceite:**
- Dado que há turno aberto, quando o usuário aciona a retirada, então um modal solicita valor e motivo, mostrando o valor disponível para retirada.
- Dado motivo vazio, quando tenta confirmar, então a confirmação é bloqueada com mensagem de campo obrigatório.
- Dado valor maior que o disponível (dinheiro esperado menos o troco padrão), quando tenta confirmar, então o sistema impede e informa o limite.
- Dado valor e motivo válidos, quando confirma, então a saída em dinheiro é registrada, o turno e o saldo são atualizados e o usuário recebe confirmação.

### RF-07: Fechar caixa
**Critério de aceite:**
- Dado que o caixa está aberto, quando o usuário clica em **Fechar caixa**, então um modal solicita o valor conferido por forma de pagamento.
- Dado a conferência preenchida, quando confirma, então o turno e o caixa são encerrados em uma única operação e o resumo do turno encerrado é exibido (esperado, informado e diferença por forma de pagamento).
- Dado que o caixa está fechado, então o botão **Fechar caixa** não é exibido.
- Dado forma de pagamento não informada, então é considerada como zero e isso é indicado ao usuário antes de confirmar.

### RF-08: Histórico de turnos
**Critério de aceite:**
- Dado que o caixa está aberto, quando o usuário clica em **Histórico de turnos**, então um modal lista os turnos do mais antigo ao mais recente.
- Dado um turno fechado, então são exibidos valor informado e diferença por forma de pagamento; diferenças diferentes de zero ficam visualmente destacadas.
- Dado o turno em andamento, então aparece identificado como aberto, sem valores informados.

### RF-09: Passagem de turno
**Critério de aceite:**
- Dado que há turno aberto de outro usuário, quando o usuário logado aciona **Passar turno**, então um modal solicita a conferência por forma de pagamento, o valor inicial (dinheiro que fica na gaveta) e observação opcional.
- Dado valor inicial não preenchido, então assume-se o dinheiro conferido, e isso é indicado no modal.
- Dado confirmação válida, então o turno atual é fechado e um novo turno é aberto em nome do usuário logado, e a tela reflete o novo responsável.
- Dado que o turno atual já é do usuário logado, então a passagem não é permitida e o motivo é informado.

### RF-10: Tratamento de erros
**Critério de aceite:**
- Dado falha de autenticação, permissão ou validação em qualquer operação, então o usuário vê mensagem clara em português e a tela permanece consistente com o estado real do caixa.

## 6. Requisitos Não-Funcionais

- **Performance:** carregamento inicial da tela em até 2 s em conexão normal; feedback imediato (estado de carregamento) em todas as ações.
- **Acessibilidade:** WCAG 2.2 nível AA (modais com foco gerenciado, campos monetários com rótulo, diferenças não sinalizadas só por cor).
- **Compatibilidade:** navegadores modernos, desktop e tablet (uso em balcão); legível em mobile.
- **Segurança:** apenas perfis autorizados operam o caixa; ações financeiras exigem confirmação explícita; nenhuma credencial exibida na interface.

## 7. Fluxos Principais

### Fluxo 1: Abertura do caixa
1. Usuário acessa **Caixa** e vê o caixa fechado.
2. Clica em **Abrir caixa**.
3. Sistema exibe modal de fundo de caixa.
4. Usuário informa o valor e confirma.
5. Sistema abre o caixa e o primeiro turno, exibindo saldo e turno atual.

### Fluxo 2: Sangria
1. Com turno aberto, usuário aciona a retirada.
2. Sistema mostra o disponível para retirada.
3. Usuário informa valor e motivo e confirma.
4. Sistema registra a saída e atualiza saldo e turno.

### Fluxo 3: Passagem de turno
1. Usuário que assume o turno loga com o próprio usuário e abre **Passar turno**.
2. Informa a conferência por forma de pagamento e o valor inicial.
3. Sistema fecha o turno anterior e abre o novo em nome do usuário.
4. Tela exibe o novo turno.

### Fluxo 4: Fechamento do caixa
1. Usuário clica em **Fechar caixa**.
2. Informa a conferência por forma de pagamento e confirma.
3. Sistema encerra turno e caixa e exibe o resumo com diferenças.
4. Tela volta ao estado de caixa fechado.

### Fluxo 5: Consulta ao histórico
1. Usuário clica em **Histórico de turnos**.
2. Sistema exibe o modal com os turnos e suas diferenças.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Operações de caixa (abrir, sangria, passagem, fechar) concluídas sem erro de uso | [A DEFINIR] | ≥ 95% |
| Turnos fechados com conferência registrada por forma de pagamento | 0% (sem tela) | 100% |
| Tempo para abrir o caixa | — | < 30 s |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| Operação de fechar caixa e sua resposta não detalhadas no material de origem | Alto | **[A DEFINIR]** confirmar contrato com o backend na Tech Spec |
| Significado de cada forma de pagamento (códigos 1 a 4) não documentado | Médio | **[A DEFINIR]** suposição: obter nomes com o backend antes do design |
| Regras de permissão por perfil são reforçadas pelo backend (erro 403) | Médio | Interface oculta/desabilita ações e trata a recusa com mensagem clara |
| Concorrência: dois usuários operando o mesmo turno | Médio | Atualizar estado após cada ação e tratar erro de turno já alterado |
| Divergência de valores digitados na conferência | Médio | Resumo de confirmação antes de enviar |

## 10. Referências

- Material de origem: `docs/specs/input.md`
- PRD de referência de formato: `docs/specs/gerenciamento-precos/prd.md`
- Passagem de turno implementada no backend em 11/10/2026 (perfis: Administrador, Gerente, Caixa, Manobrista)
