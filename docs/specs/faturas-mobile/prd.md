# PRD: Faturas otimizado para celular

## Problema
O módulo de Faturas já funciona no celular: a tabela vira cartões e os modais abrem em tela cheia. Mas essa versão é a do computador encolhida, não uma experiência pensada para o celular. Os filtros ocupam espaço antes de a primeira fatura aparecer, os cartões da lista repetem informação e dificultam comparar faturas de relance, o detalhe empilha cartões que exigem rolar muito até chegar às ações, e os formulários de emitir, pagar e cancelar foram desenhados para teclado e mouse. Quem opera o financeiro pelo celular gasta mais toques e mais rolagem do que deveria para emitir, dar baixa ou cancelar uma fatura.

## Objetivo
Quem usa o celular consegue fazer **tudo** que o módulo de Faturas permite (consultar, emitir, registrar pagamento e cancelar) com poucos toques, com o polegar, sem rolagem desnecessária e sem perder nenhuma informação ou regra que existe hoje no computador. A experiência de celular é desenhada a partir do celular (mobile-first), não adaptada do computador.

## Usuário-alvo
Administrador, Gerente e Financeiro (mesmos perfis e permissões do módulo atual), usando o celular com uma mão, muitas vezes fora da mesa, com a mesma frequência e para as mesmas tarefas que no computador: operação completa, não apenas consulta.

## Requisitos funcionais

### Lista de faturas
- RF1: No celular, a primeira fatura aparece sem que o usuário precise rolar além do cabeçalho; os filtros não ocupam a tela inteira antes da lista.
- RF2: Os filtros por conveniada e por situação continuam disponíveis, são alcançáveis com o polegar e mostram de forma visível quais estão ativos, com um jeito direto de limpá-los.
- RF3: Cada fatura na lista permite ver, de relance, conveniada, valor, vencimento e situação (identificada por texto, não só por cor), e leva ao detalhe com um toque. Informação secundária (quantidade de saídas, data de emissão) fica visível sem competir com a principal.
- RF4: O usuário percebe de relance quais faturas abertas estão vencidas ou perto de vencer, sem abrir cada uma.
- RF5: A ação de emitir fatura fica sempre ao alcance do polegar na lista.
- RF6: A paginação e os estados de carregamento, vazio e erro continuam existindo e funcionam bem em tela pequena.

### Detalhe da fatura
- RF7: Ao abrir uma fatura no celular, o usuário vê primeiro o que mais importa: situação, conveniada, valor total e vencimento.
- RF8: As ações disponíveis para a situação da fatura (registrar pagamento, cancelar) ficam ao alcance do polegar sem exigir rolagem até o fim da tela, e só aparecem quando a fatura está aberta, como hoje.
- RF9: O ciclo da fatura (emissão, pagamento, cancelamento, com quem e quando) continua acessível, mas não empurra as saídas para longe.
- RF10: A lista de saídas da fatura mostra todos os dados exigidos hoje (placa, modelo, categoria, entrada e saída, permanência, tabela de convênio, regra da conveniada, total, parte da conveniada e parte do cliente), organizados para leitura em tela pequena, e o total da fatura permanece fácil de conferir.
- RF11: O usuário volta do detalhe para a lista no mesmo ponto em que estava, com os mesmos filtros e a mesma página.

### Emitir, pagar e cancelar
- RF12: Emitir fatura, registrar pagamento e cancelar fatura funcionam por completo no celular, com as mesmas regras de hoje (vencimento de hoje em diante, observação de até 500 caracteres, forma de pagamento obrigatória, valor pago opcional e maior que zero, data de pagamento até hoje, confirmação do cancelamento).
- RF13: Os campos usam o teclado adequado a cada dado (valores, datas e texto), e o teclado aberto não esconde o campo em edição nem o botão de confirmar.
- RF14: A escolha da conveniada e da forma de pagamento é feita por controles fáceis de tocar, com alvos de toque confortáveis.
- RF15: O botão de confirmar cada ação fica sempre visível e ao alcance do polegar enquanto o usuário preenche o formulário.
- RF16: Os avisos importantes continuam claros antes de confirmar: que o pagamento da fatura não entra no caixa e que o cancelamento devolve as saídas para "Aberto".
- RF17: Erros de validação e de envio aparecem junto do campo ou da ação em questão, e o que o usuário já digitou não se perde.
- RF18: Depois de emitir, pagar ou cancelar, o usuário vê a confirmação do resultado e fica na tela onde faz sentido continuar.

### Geral
- RF19: Nenhuma funcionalidade, regra ou informação do módulo atual deixa de existir; computador e celular continuam equivalentes em capacidade.
- RF20: Telas legíveis e operáveis em celulares pequenos, nos temas claro e escuro, com alvos de toque de pelo menos 44 px e sem rolagem horizontal.
- RF21: Quando o navegador permitir, as telas não dependem de passar o mouse sobre nada; tudo é alcançável por toque.

## Fora de escopo
- Mudar regras de negócio de faturas (o que entra na fatura, valores, situações, permissões).
- Novas funcionalidades do módulo (PDF, exportação, envio ao cliente, pagamento parcial, escolha de saídas, marcação automática de vencida).
- Mudar a versão de computador (a menos que um ajuste compartilhado não prejudique a experiência de lá).
- Aplicativo nativo, modo offline e notificações.
- Mudar a navegação geral (barra inferior e menu "Mais") ou o lugar de Faturas nela.

## Critérios de aceite
- [ ] Em tela de celular, a primeira fatura da lista aparece sem rolar além do cabeçalho e dos filtros recolhidos.
- [ ] Os filtros ativos são visíveis e podem ser limpos com um toque.
- [ ] Cada fatura da lista mostra conveniada, valor, vencimento e situação em texto, e abre o detalhe com um toque.
- [ ] Faturas abertas vencidas ou prestes a vencer são distinguíveis na lista sem abrir o detalhe.
- [ ] "Emitir fatura" é alcançável com o polegar na lista.
- [ ] No detalhe, situação, conveniada, valor e vencimento aparecem primeiro, e as ações de pagar e cancelar (quando permitidas) estão acessíveis sem rolar até o fim.
- [ ] Todos os dados das saídas listados no RF10 estão presentes e legíveis, e o total confere com a soma das saídas.
- [ ] Voltar do detalhe devolve o usuário à lista com os mesmos filtros e página.
- [ ] Emitir, pagar e cancelar fatura concluem com sucesso apenas no celular, respeitando todas as validações existentes.
- [ ] O teclado aberto não cobre o campo em edição nem o botão de confirmar nos três fluxos.
- [ ] Os avisos de "não entra no caixa" e de "saídas voltam a Aberto" aparecem antes da confirmação.
- [ ] Nenhuma tela do módulo tem rolagem horizontal, nos temas claro e escuro, em celulares pequenos e grandes.
- [ ] Todos os alvos de toque têm pelo menos 44 px.
- [ ] Nada que existe hoje no computador deixou de existir (nem na versão de computador, nem na de celular).

## Métricas de sucesso (se aplicável)
Sem métricas numéricas. Sucesso = emitir, dar baixa e cancelar uma fatura no celular exige menos toques e menos rolagem do que hoje, e o usuário não precisa mudar para o computador para terminar nenhuma dessas tarefas.

## Pontos em aberto
- **Vencida / perto de vencer (RF4):** hoje o sistema não marca fatura vencida (isso estava fora de escopo no PRD de Faturas). Esta versão assume apenas um **destaque visual calculado a partir da data de vencimento**, sem criar nova situação nem regra de negócio. Confirmar se o destaque é desejado e qual é o limite de "perto de vencer".
- **Contexto de uso:** assumido como operação completa no celular (resposta do solicitante); confirmar se algum fluxo, como emitir, é de fato menos frequente e pode ter prioridade menor.
- **Redução de toques:** não há número-alvo definido; a comparação é com a versão atual.
- **Mudanças que valem também no computador:** confirmar se melhorias de estrutura (por exemplo, filtros recolhíveis) devem ficar só no celular ou podem valer para as duas versões.
