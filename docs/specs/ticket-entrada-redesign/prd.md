# PRD: Redesenho do ticket de entrada

> Referência visual: `prototipo-v5.html` (cópia de `murel_ticket_entrada_redesign_v5.html`, nesta pasta).
> Este PRD complementa `docs/specs/patio-layout-ticket/` e trata **só** do detalhe do ticket aberto a partir do Pátio.

## Problema
O ticket de entrada (detalhe do veículo aberto a partir do Pátio) mostra tudo com o mesmo peso: placa, descrição, dois destaques lado a lado (permanência e valor), uma lista de itens, serviços e ações. No celular, de pé no portão, o operador precisa ler duas coisas antes de qualquer outra: **qual é o carro** e **quanto ele deve agora**. Hoje o valor disputa espaço com a permanência e não salta aos olhos, e os blocos não formam uma leitura clara de cima para baixo. Existe um protótipo aprovado (v5) com uma hierarquia mais direta, com o valor em destaque num cartão próprio, em âmbar.

## Objetivo
O ticket de entrada fica igual ao protótipo v5: um cartão do veículo (placa, tipo, descrição e permanência), um cartão de destaque com o **valor até agora**, uma lista de detalhes, a seção de serviços adicionais e, no rodapé fixo, as ações "Comprovante cliente" e "Registrar saída · valor". Nenhuma função que o ticket tem hoje se perde; muda o visual e a ordem de leitura.

## Usuário-alvo
- Operador, manobrista e caixa no portão ou no balcão, quase sempre no celular, que abrem o ticket para conferir o carro, ver quanto ele deve, mostrar o comprovante ao cliente ou registrar a saída.
- Administrador e gerente, no computador ou no celular, que conferem um veículo específico do pátio.

## Requisitos funcionais

### Cabeçalho
- RF1: O título do ticket mostra "Ticket Entrada - <código do ticket>" (ou o sequencial quando não há código), centralizado, com o botão de fechar à direita. Fechar volta ao Pátio preservando busca e filtros, como hoje.

### Cartão do veículo
- RF2: Um cartão reúne, nesta ordem: a **placa** em destaque (fonte monoespaçada, grande) com o **selo do tipo** ao lado (Avulso, Mensal ou Convênio, em texto e cor); abaixo, a descrição do veículo em caixa alta (modelo · cor · categoria).
- RF3: Separada por uma linha tracejada, a parte inferior do cartão mostra **Permanência** (com ícone de relógio) à esquerda e o tempo à direita (ex.: "3d 19h 3min"), que se atualiza sozinho enquanto o ticket está aberto.

### Cartão de valor
- RF4: Abaixo do cartão do veículo, um cartão de destaque em **âmbar** mostra "Valor até agora" à esquerda e o valor em grande à direita (ex.: "R$ 500,00"). O valor é o mesmo que a saída cobra e se atualiza sozinho.
- RF5: Quando há serviços adicionais, o cartão de valor continua mostrando como o total se divide (estadia + serviços), como hoje.
- RF6: Para mensalista, o cartão mostra "Mensal" sem cobrança; se o valor não puder ser carregado, mostra o estado de erro com "Tentar novamente", como hoje. Esses casos mantêm a leitura do cartão sem parecer uma cobrança.

### Lista de detalhes
- RF7: Um cartão lista, em linhas separadas por traço: **Entrada** (data e hora), **Tabela de preço** e **Registrado por**.
- RF8: Os itens condicionais que existem hoje continuam na mesma lista, depois dos três acima e só quando se aplicam: **Ticket**, **Prisma** (com "Informar"/"Alterar") e **Quadro de chaves** (gancho ou "Fora do quadro", com "Guardar chave"/"Alterar").

### Serviços adicionais
- RF9: Uma seção "SERVIÇOS ADICIONAIS" (rótulo pequeno, em caixa alta) mostra os serviços do veículo e a ação "+ Adicionar serviço" em um botão tracejado. Toda a funcionalidade atual de serviços do ticket continua (adicionar, ver, aviso de pendentes). Quando a empresa não usa serviços, a seção não aparece.

### Rodapé de ações
- RF10: Um rodapé separado do conteúdo, fixo na base da janela do ticket (o conteúdo rola por trás dele), tem duas ações empilhadas:
  - **Comprovante cliente** (secundária, com ícone de QR Code): abre o comprovante digital, como o atual "Mostrar QR do ticket ao cliente". Não aparece quando o veículo não tem comprovante; nesse caso continua o aviso "Comprovante indisponível para este veículo".
  - **Registrar saída · R$ valor** (principal, amarela): abre o fluxo de saída existente. Sem cobrança (mensalista ou valor zero), o texto é só "Registrar saída".
- RF11: O aviso de serviços pendentes continua aparecendo junto às ações, antes de registrar a saída.

### Estados e comportamento
- RF12: Carregamento, erro e "este carro não está mais no pátio" continuam existindo, com o visual do novo layout.
- RF13: Saída, guardar chave, alterar prisma e serviços continuam funcionando exatamente como hoje, incluindo o aviso de confirmação e a volta ao Pátio depois da saída.

### Responsividade
- RF14: No celular, o ticket é igual ao protótipo, em coluna única. No computador, os mesmos blocos se reorganizam para aproveitar a largura, sem perder informação nem a hierarquia (veículo e valor primeiro, ações sempre à vista).
- RF15: O visual segue o tema do sistema, tanto no modo escuro (como no protótipo) quanto no claro. As cores do protótipo são substituídas pelos tons equivalentes do tema (ver "Decisões").

## Fora de escopo
- Mudar a lista do Pátio, o comprovante digital (tela do QR) ou a página pública do ticket.
- Mudar regras de preço, cálculo de valor, fluxo de saída, pagamento, quadro de chaves, prisma ou serviços.
- Criar informações novas que o sistema não tem hoje (por exemplo, "próxima faixa" de preço).
- Mudar o menu e a navegação do sistema.

## Critérios de aceite
- [ ] O ticket tem o mesmo desenho do protótipo v5: cabeçalho, cartão do veículo, cartão de valor em âmbar, lista de detalhes, serviços adicionais e rodapé com as duas ações.
- [ ] A placa aparece em fonte monoespaçada com o selo do tipo ao lado; a descrição aparece em caixa alta abaixo.
- [ ] Permanência e valor se atualizam sozinhos com o ticket aberto, e o valor bate com o que a saída cobra.
- [ ] Mensalista mostra "Mensal" no cartão de valor e "Registrar saída" sem valor no botão.
- [ ] Entrada, Tabela de preço e Registrado por aparecem sempre; Ticket, Prisma e Quadro de chaves aparecem nos mesmos casos de hoje, com as mesmas ações.
- [ ] "Comprovante cliente" abre o comprovante digital; "Registrar saída" abre o fluxo de saída; ao concluir, o veículo some do Pátio e aparece o aviso.
- [ ] Serviços adicionais funcionam como hoje e a seção some quando a empresa não usa serviços.
- [ ] O rodapé de ações fica visível sem rolar até o fim do ticket, no celular.
- [ ] Carregamento, erro e veículo ausente têm estados próprios.
- [ ] Funciona sem rolagem horizontal a partir de 320px, com alvos de toque de pelo menos 44px, em tema claro e escuro.
- [ ] Atende WCAG 2.2 AA: tipo sempre em texto, contraste do cartão âmbar e do botão amarelo, foco visível, navegação por teclado.
- [ ] Nenhuma função do ticket atual foi perdida.

## Decisões
- **Rodapé fixo:** o rodapé de ações fica fixo na base da janela do ticket; só o conteúdo acima dele rola.
- **Cores seguem o tema:** as cores do protótipo (âmbar do cartão de valor, amarelo do botão de saída, azul do selo de tipo, fundos e bordas) são só referência. Cada uma usa o tom equivalente que já existe no tema do sistema, nos modos claro e escuro; nenhuma cor nova é criada para esta tela. O selo de tipo usa as mesmas cores do Pátio.

## Métricas de sucesso
- O operador identifica o valor devido sem rolar a tela, ao abrir o ticket no celular.
- O caminho do ticket até a saída ou até o comprovante continua com um toque.
- Nenhum aumento de chamados sobre valor, saída, chave ou serviços depois do lançamento.
