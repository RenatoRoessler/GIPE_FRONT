# PRD: Refactor do layout do Caixa

## Problema
A tela do Caixa hoje reúne cabeçalho, resumo da gaveta, turno atual e três abas (movimentos, linha do tempo, gráficos) com várias ações lado a lado. Para quem está no balcão, principalmente no celular, é difícil bater o olho no que importa durante o expediente: quanto entrou, quanto há na gaveta e como o valor se divide por forma de pagamento. Além disso, todos os perfis veem o mesmo conjunto de ações, embora o que cada um precisa fazer no caixa seja diferente.

## Objetivo
A tela do Caixa passa a ser um resumo direto e legível do caixa aberto, no formato das sugestões `docs/specs/1.jpeg` (Administrador/Gerente/Caixa) e `docs/specs/3.jpeg` (Manobrista). Cada perfil vê só as ações que lhe cabem, e o fechamento do caixa fica em destaque.

## Usuário-alvo
- **Administrador, Gerente e Caixa**: acompanham e movimentam o caixa (retirada de dinheiro, despesa, fechamento).
- **Manobrista**: acompanha o caixa do turno e passa o turno.
Uso principal em celular, durante o expediente.

## Requisitos funcionais
- RF1: Com o caixa aberto, a tela mostra o status da abertura: data e hora em que foi aberto e a indicação "Aberto".
- RF2: A tela mostra, em destaque, o **valor em caixa**: total recebido e quantidade de tickets.
- RF3: A tela mostra o **fundo de caixa** (troco na abertura) e o **dinheiro na gaveta** (fundo + dinheiro recebido).
- RF4: A tela mostra o recebido **por forma de pagamento** (dinheiro, Pix, cartão débito, cartão crédito): valor e quantidade de tickets de cada uma, o total e uma barra proporcional entre as formas.
- RF5: Para Administrador, Gerente e Caixa, a tela oferece as ações **Sangria**, **Lançar despesa** e **Fechar caixa**.
- RF6: **Lançar despesa** aparece no layout, mas ainda sem ação: fica desabilitado, indicando que a funcionalidade virá depois.
- RF7: Para o Manobrista, a tela oferece as ações **Trocar turno** e **Fechar caixa**, sem Sangria nem Lançar despesa.
- RF8: Sangria, trocar turno (passagem de turno) e fechar caixa seguem as mesmas regras e os mesmos fluxos de hoje; muda apenas onde e como são acionados.
- RF9: **Fechar caixa** é a ação principal da tela, com destaque visual sobre as demais.
- RF10: Com o caixa fechado, erro de carregamento, falta de permissão e carregamento mantêm o comportamento atual, adaptados ao novo layout.
- RF11: As abas de movimentos, linha do tempo e gráficos, e os atalhos "Histórico de turnos" e "Caixas anteriores", deixam de aparecer nesta tela. [A DEFINIR: onde Administrador/Gerente passam a acessar o histórico de caixas e de turnos, já que o atalho sai da tela.]

## Fora de escopo
- A funcionalidade de **lançar despesa** (campos, regras, efeito no saldo da gaveta).
- Mudanças nas regras de caixa, turno, sangria ou fechamento.
- Novas telas ou novos acessos para histórico, extrato, movimentos, linha do tempo e gráficos.
- Mudança nas permissões por perfil além da separação de ações descrita acima.

## Critérios de aceite
- [ ] Com o caixa aberto, a tela mostra status de abertura, valor em caixa, fundo de caixa, dinheiro na gaveta e o detalhamento por forma de pagamento, com valores e quantidades de tickets iguais aos dados do caixa.
- [ ] Administrador, Gerente e Caixa veem Sangria, Lançar despesa e Fechar caixa; Trocar turno não aparece.
- [ ] Manobrista vê Trocar turno e Fechar caixa; Sangria e Lançar despesa não aparecem.
- [ ] Lançar despesa está desabilitado e não abre nenhum fluxo.
- [ ] Sangria, Trocar turno e Fechar caixa abrem os mesmos fluxos de hoje e produzem os mesmos resultados.
- [ ] Fechar caixa tem o maior destaque entre as ações.
- [ ] As abas e os atalhos de histórico não aparecem mais na tela.
- [ ] Caixa fechado, carregando, erro e sem permissão continuam tratados.
- [ ] A tela é utilizável em celular, sem rolagem horizontal.

## Métricas de sucesso (se aplicável)
- Quem opera o caixa encontra valor em caixa e dinheiro na gaveta sem rolar nem trocar de aba.
- Nenhuma regressão nos fluxos de sangria, passagem de turno e fechamento.
