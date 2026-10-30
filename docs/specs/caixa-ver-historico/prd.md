# PRD: Ver histórico do caixa

## Problema
Depois do refactor do layout do Caixa, o atalho para o histórico de caixas anteriores saiu da tela com o caixa aberto (o PRD do refactor deixou em aberto onde Administrador e Gerente passariam a acessá-lo). Quem confere o fechamento de dias anteriores em computador precisa lembrar o endereço da tela ou fechar o caixa para encontrar o atalho.

## Objetivo
Na versão para tela grande, a tela do Caixa oferece o botão **Ver Histórico**, que leva à tela de histórico de caixas já fechados, para quem tem permissão.

## Usuário-alvo
Administrador e Gerente (perfis padrão do histórico; a permissão por módulo, quando configurada, prevalece), conferindo caixas anteriores em computador.

## Requisitos funcionais
- RF1: Em tela grande, a tela do Caixa mostra o botão **Ver Histórico** somente para quem tem permissão de acessar o histórico. Em telas pequenas (celular) o botão não aparece.
- RF2: Ao clicar, abre a tela de histórico de caixas.
- RF3: A tela de histórico lista os caixas fechados do mais recente para o mais antigo. Cada item mostra quem abriu, quem fechou, data e hora de abertura e de fechamento, o fundo de caixa e os totais do fechamento (entradas, saídas e valor de fechamento).
- RF4: O histórico pode ser filtrado por período (data inicial e final, ambas opcionais), considerando o dia da abertura do caixa, com os dois dias incluídos.
- RF5: A lista é paginada (20 por página por padrão).
- RF6: O botão aparece nos dois estados da tela do Caixa (caixa aberto e caixa fechado), para o histórico ser acessível sempre. [A DEFINIR: no caixa fechado já existe o atalho "Caixas anteriores"; manter os dois ou unificar com "Ver Histórico"?]
- RF7: Sem permissão, o botão não aparece e o acesso direto à tela é negado, como hoje.

## Fora de escopo
- Alterar a tela de histórico, o filtro, a paginação ou o extrato de cada caixa, que já existem.
- Mudar as permissões por perfil.
- Versão do botão para celular.
- Exportação, gráficos ou novos totais.

## Critérios de aceite
- [ ] Administrador e Gerente veem o botão "Ver Histórico" na tela do Caixa em tela grande; Caixa e Manobrista não.
- [ ] Em celular o botão não aparece.
- [ ] Clicar no botão abre a tela de histórico com os caixas do mais recente para o mais antigo, com abriu, fechou e totais do fechamento.
- [ ] O filtro por período e a paginação funcionam na tela aberta pelo botão.
- [ ] Sem permissão, não há botão e o acesso direto é negado.
- [ ] O restante da tela do Caixa não muda.

## Métricas de sucesso (se aplicável)
- Quem confere caixas anteriores chega ao histórico em um clique a partir do Caixa, sem digitar o endereço.
