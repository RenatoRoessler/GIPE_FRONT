# PRD: Correções da regressão de 17/11/2026

Origem: `docs/specs/relatorio-regressao-2026-11-17.md`.

## Problema
O teste de regressão encontrou falhas que confundem ou enganam quem opera o sistema:
- O recibo de saída mostra "Forma null" no pagamento, o que passa a impressão de comprovante quebrado para o cliente.
- O administrador desliga o acesso de um usuário à empresa, salva, e a lista continua mostrando "Ativo". Ele não sabe se a ação funcionou.
- Criar uma categoria dentro do lançamento financeiro fecha o formulário e apaga o que foi digitado.
- Em "Novo usuário", CPF inválido e perfil não escolhido bloqueiam o avanço sem explicar o motivo.

## Objetivo
Cada ação afetada deve dar um resultado correto e visível, ou uma explicação clara do que falta. O recibo deve sempre mostrar a forma de pagamento escolhida. O status de acesso do usuário deve refletir o que foi salvo. Quem está preenchendo um formulário não perde o que digitou.

## Usuário-alvo
- Operador de caixa e administrador, que emitem e entregam o recibo de saída.
- Administrador, que gerencia usuários e lançamentos financeiros.

## Requisitos funcionais
- RF1: O recibo de saída mostra a forma de pagamento pelo nome (Dinheiro, Crédito, Débito, Pix), inclusive quando o valor pago é R$ 0,00. Nunca aparece "null" ou texto vazio.
- RF2: Ao salvar a edição de um usuário com o acesso desligado ou ligado, a lista passa a mostrar o status correspondente (Ativo ou Inativo), inclusive após recarregar a página. Se a operação não puder ser concluída, o sistema avisa com uma mensagem de erro.
- RF3: No formulário de lançamento financeiro, criar uma categoria nova mantém o lançamento em andamento aberto, com todos os campos já preenchidos, e deixa a categoria recém-criada selecionada.
- RF4: Em "Novo usuário", etapa do CPF, um CPF inválido mostra uma mensagem explicando o problema (ex.: "CPF inválido"), em vez de apenas desabilitar "Continuar".
- RF5: Em "Novo usuário", etapa de dados, tentar cadastrar sem escolher o perfil mostra a mensagem "Selecione o perfil", no mesmo padrão das mensagens de nome, e-mail e celular.

## Fora de escopo
- Upgrade da versão do Next.js (tratado à parte).
- Investigação do `.env.hml` e das credenciais de homologação.
- Itens não cobertos pela regressão: leitura de placa e QR, carimbo, salvar preço completo, mensalistas, conveniadas, catálogo, faturas, notas fiscais, abertura e fechamento de caixa, telas públicas, tema escuro e mobile.
- Mudanças visuais ou de fluxo além do necessário para cada correção.

## Critérios de aceite
- [ ] Uma saída paga em cada forma de pagamento (Dinheiro, Crédito, Débito, Pix) gera recibo com o nome correto da forma.
- [ ] Uma saída com valor R$ 0,00 também mostra a forma de pagamento correta.
- [ ] Desligar o acesso de um usuário e salvar mostra "Inativo" na lista, e continua assim após recarregar.
- [ ] Religar o acesso e salvar volta a mostrar "Ativo".
- [ ] Falha ao salvar o acesso mostra mensagem de erro, sem trocar o status exibido.
- [ ] Criar categoria durante um novo lançamento mantém o modal aberto, preserva os campos preenchidos e seleciona a nova categoria.
- [ ] CPF inválido na etapa 1 de "Novo usuário" mostra mensagem de erro visível.
- [ ] Tentar cadastrar usuário sem perfil mostra "Selecione o perfil".
- [ ] Nenhuma das telas afetadas apresenta regressão nos fluxos que já funcionavam (entrada, saída, criar/editar/cancelar lançamento, criar usuário).

## Métricas de sucesso
- Zero ocorrências de "null" em recibos.
- O relatório de uma nova regressão não reporta os itens 1 a 5 do relatório de 17/11/2026.

## Pontos em aberto
- Após ler o código (ver Tech Spec), os itens 2 e 5 do relatório são prováveis falsos positivos do teste, e o item 4 é parcial (a mensagem já existe, mas só aparece ao sair do campo). RF2 e RF5 viram verificação; só se falharem de verdade viram correção. Se o RF2 falhar, a causa pode estar na API.
