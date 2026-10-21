# PRD: Pagamento do mensalista

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-10-21
**Versão:** 1.0

---

## 1. Objetivo

Permitir que o operador registre o pagamento da mensalidade de um mensalista diretamente na página dele. Ao confirmar, o sistema dá baixa na cobrança pendente, ativa o mensalista e já deixa pronta a cobrança do mês seguinte, tudo de uma só vez.

O valor é fechar o ciclo do mensalista: depois do cadastro e do aceite do contrato, o primeiro pagamento ativa o cadastro, e os pagamentos seguintes mantêm a mensalidade em dia sem controle paralelo em papel ou planilha.

## 2. Contexto e Motivação

A gestão de mensalistas (`docs/specs/mensalistas/prd.md`) e o fluxo de veículos, contrato e aceite (`docs/specs/mensalistas-contrato/prd.md`) já existem. Naquela entrega o pagamento ficou explicitamente de fora: após o aceite, o mensalista continua inativo à espera do primeiro pagamento, mas hoje o operador não tem como registrá-lo no sistema.

O back-end passou a oferecer uma operação única de pagamento que, de forma atômica:
- dá baixa na cobrança pendente mais recente do mensalista, registrando data, forma de pagamento, valor pago, origem e quem recebeu;
- ativa o mensalista;
- gera a cobrança pendente do mês seguinte, com o valor atual do tipo de mensalidade.

O próximo vencimento sai sempre do dia de vencimento do cadastro do mensalista. Quando o mês não tem esse dia, vence no dia seguinte ao último dia do mês (exemplo com dia 31: 31/10 → 01/12 → 31/12).

O primeiro pagamento só é aceito depois do aceite do contrato; quem já pagou alguma mensalidade antes não é bloqueado por essa regra.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Operador / administrador com permissão sobre mensalistas | Registrar o recebimento da mensalidade, ver que o mensalista ficou ativo e saber o próximo vencimento | No balcão ou no pátio, ao receber o pagamento do mensalista, no computador ou no celular |

A regra de acesso segue a da gestão de mensalistas existente. A empresa considerada é sempre a selecionada no login, e quem recebeu o pagamento é o usuário logado.

## 4. Escopo

### Dentro do Escopo
- Ação "Registrar pagamento" na página do mensalista.
- Formulário de pagamento com valor pago e forma de pagamento (dinheiro, PIX, débito, crédito, boleto, transferência).
- Registro automático, sem o operador informar, de quem recebeu (usuário logado), da empresa (a do login) e da origem do pagamento (painel administrativo).
- Confirmação do pagamento mostrando a cobrança paga e a próxima cobrança gerada (valor e vencimento).
- Atualização da situação do mensalista na tela após o pagamento (passa a ativo).
- Bloqueio claro do primeiro pagamento enquanto o contrato não foi aceito, com orientação ao operador.
- Mensagens claras para os erros previstos (valor inválido, mensalista sem cobrança pendente, contrato não aceito, usuário ou mensalista fora da empresa).
- Validação do fluxo contra a API real.

### Fora do Escopo
- Cobrança automática, boletos, PIX com QR Code, integração com gateway ou conciliação bancária.
- Pagamento pelo próprio mensalista (site) ou por webhook; nesta entrega só o painel administrativo registra.
- Estorno, cancelamento ou edição de um pagamento já registrado.
- Pagamento antecipado de várias mensalidades, ou parcial com saldo.
- Histórico completo de cobranças e relatório de inadimplência.
- Emissão de recibo ou nota fiscal.
- Alterar a data de vencimento do mensalista.

## 5. Requisitos Funcionais

### RF-01: Acessar o pagamento pela página do mensalista
**Critério de aceite:**
- Dado um mensalista com cobrança pendente, quando o operador abre a página dele, então vê a opção de registrar pagamento.
- Dado um mensalista sem cobrança pendente, então a opção não é oferecida ou aparece indisponível com o motivo.

### RF-02: Informar os dados do pagamento
**Critério de aceite:**
- Dado o formulário de pagamento, quando o operador o abre, então precisa informar o valor pago e escolher a forma de pagamento entre: dinheiro, PIX, débito, crédito, boleto e transferência.
- Dado o valor pago, quando é zero, negativo ou tem mais de 2 casas decimais, então o operador vê o erro e não consegue confirmar.
- Dado que nenhuma forma de pagamento foi escolhida, então não consegue confirmar.
- Dado o formulário, então o operador não precisa informar empresa, usuário que recebeu nem origem: o sistema preenche esses dados.

### RF-03: Confirmar o pagamento
**Critério de aceite:**
- Dado um formulário válido, quando o operador confirma, então a cobrança pendente mais recente é dada como paga com data, forma, valor, origem e quem recebeu.
- Dado o pagamento confirmado, então o mensalista passa a constar como ativo.
- Dado o pagamento confirmado, então é gerada a cobrança do mês seguinte com o valor atual do tipo de mensalidade e o vencimento calculado pelo dia de vencimento do cadastro.
- Dado que a operação falhou em qualquer etapa, então nenhuma das três mudanças vale (baixa, ativação e nova cobrança) e o operador vê o erro.
- Dado um clique repetido ou duplo envio, então o pagamento não é registrado duas vezes.

### RF-04: Ver o resultado do pagamento
**Critério de aceite:**
- Dado o pagamento registrado, quando a confirmação aparece, então o operador vê o valor pago, a forma, a data e a próxima cobrança com valor e vencimento.
- Dado um mês que não tem o dia de vencimento do mensalista, então o vencimento exibido segue a regra do dia seguinte ao último dia do mês.
- Dado o pagamento registrado, quando o operador volta à lista ou à página do mensalista, então a situação já aparece atualizada.

### RF-05: Bloquear o primeiro pagamento sem aceite do contrato
**Critério de aceite:**
- Dado um mensalista que nunca pagou e cujo contrato não foi aceito, quando o operador tenta registrar o pagamento, então vê uma mensagem dizendo que o pagamento só é liberado após o aceite do contrato, com a indicação de reenviar o contrato se necessário.
- Dado um mensalista que já pagou alguma mensalidade, então o pagamento não é bloqueado por falta de aceite.
- Dado um contrato aceito, então o primeiro pagamento é liberado.

### RF-06: Tratar os erros do pagamento
**Critério de aceite:**
- Dado um erro devolvido pela API (mensalista sem cobrança pendente, contrato não aceito, dados inválidos, mensalista ou usuário de outra empresa), então o operador vê uma mensagem em português clara, sem detalhes técnicos, e pode corrigir e tentar de novo.
- Dado falha de conexão, então o operador vê que o pagamento não foi confirmado e pode tentar de novo sem risco de duplicar.

## 6. Requisitos Não-Funcionais

- **Confiabilidade financeira:** o registro é tudo ou nada; o operador nunca vê um sucesso que não foi gravado nem um erro com o pagamento gravado.
- **Segurança:** a empresa e o usuário que recebeu vêm da sessão, não de campo editável; a ação só é oferecida a quem tem permissão sobre mensalistas.
- **Acessibilidade:** WCAG 2.2 nível AA; formulário navegável por teclado, erros associados aos campos, valores monetários em formato brasileiro (R$).
- **Usabilidade:** o pagamento é registrado em poucos toques, inclusive no celular, com o valor da cobrança pendente como sugestão quando a tela já a conhecer.
- **Compatibilidade:** navegadores atuais de celular e computador.

## 7. Fluxos Principais

### Fluxo 1: Primeiro pagamento
1. Mensalista cadastrado já aceitou o contrato e aparece como inativo.
2. Operador abre a página do mensalista e escolhe registrar pagamento.
3. Informa o valor pago e a forma de pagamento e confirma.
4. Sistema dá baixa na cobrança, ativa o mensalista e gera a cobrança do mês seguinte.
5. Operador vê a confirmação com a próxima cobrança e o mensalista ativo.

### Fluxo 2: Pagamento de mensalidade seguinte
1. Mensalista ativo tem uma cobrança pendente.
2. Operador registra o pagamento da mesma forma do Fluxo 1.
3. Sistema registra a baixa e gera a cobrança do mês seguinte; o mensalista segue ativo.

### Fluxo 3: Primeiro pagamento sem aceite
1. Operador tenta registrar o pagamento de um mensalista que ainda não aceitou o contrato.
2. Sistema informa que o pagamento só é liberado após o aceite.
3. Operador reenvia o contrato (fluxo existente) e retoma o pagamento depois do aceite.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Pagamento de mensalista registrado no sistema sem ajuda do suporte | Não existe hoje | Operador conclui sozinho |
| Mensalistas ativados pelo primeiro pagamento registrado no sistema | — | [A DEFINIR] |
| Erros de pagamento por tentativa | — | [A DEFINIR] |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| Não está documentado se a API informa o valor e o vencimento da cobrança pendente antes do pagamento (para sugerir o valor na tela) | Médio para RF-02 | [A CONFIRMAR] com o back; sem isso, o operador digita o valor |
| Não está documentado como a tela sabe se o mensalista tem cobrança pendente e se já pagou alguma vez (para RF-01 e RF-05) | Alto | [A CONFIRMAR] com o back; se a listagem não trouxer, a API precisa expor; o bloqueio final continua sendo da API |
| Não está definido se o valor pago pode diferir do valor da cobrança (pagamento a menor ou a maior) | Médio | [A CONFIRMAR] com o negócio; seguir o que a API aceitar e exibir a mensagem dela |
| Validar o fluxo contra a API real grava pagamentos e ativa mensalistas de verdade | Alto | Usar mensalista e empresa de teste combinados, preferencialmente em homologação |
| Clique duplo ou reenvio após falha de rede registrar duas baixas | Alto | Impedir novo envio durante o processamento e conferir a situação antes de tentar de novo |
| Erros de regra de negócio (contrato não aceito, sem cobrança pendente) pouco claros para o operador | Médio | Traduzir as mensagens da API e orientar o próximo passo |

## 10. Referências

- Pedido original: `docs/specs/input.md`
- Gestão de mensalistas: `docs/specs/mensalistas/prd.md`
- Veículos, contrato e aceite: `docs/specs/mensalistas-contrato/prd.md`
- Endpoint do back descrito em `docs/specs/input.md`: pagamento do mensalista (`POST /api/v1/Mensalista/pagamento`), que retorna a cobrança paga e a próxima gerada.
