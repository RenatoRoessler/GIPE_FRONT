# PRD: Novo layout do Pátio, ticket e comprovante

## Problema
A tela de Pátio hoje é pensada como uma lista de gestão: uma tabela com muitos dados e filtros, gráficos no rodapé e ações pequenas em cada linha. Para o operador que está de pé no portão, com o celular na mão, isso é lento de ler: não dá para ver de relance quantas vagas restam, e o caminho do carro até a saída e até o comprovante do cliente passa por vários toques e modais. Já existe um protótipo aprovado (`Murel_Patio_Ticket.html`) com um desenho mais direto, pensado para a operação.

## Objetivo
Redesenhar a experiência do Pátio para ficar igual ao protótipo: um painel de ocupação no topo, busca simples, cards legíveis de cada veículo, uma tela de detalhe do ticket e um comprovante digital para mostrar ao cliente. Todas as funções que o Pátio tem hoje continuam existindo; muda o visual, a organização e o caminho entre as telas.

## Usuário-alvo
- Operador, manobrista e caixa no portão ou no balcão, quase sempre no celular, que precisam achar um carro, ver quanto ele deve e registrar a saída.
- Administrador e gerente, no computador ou no celular, que conferem a ocupação e o que está no pátio.

## Requisitos funcionais

### Lista do Pátio
- RF1: O topo mostra o título "Pátio", o nome do estacionamento e a hora atual.
- RF2: Um bloco de **vagas ocupadas** mostra ocupadas/capacidade em destaque, uma barra de progresso da ocupação e quantas vagas estão livres. A barra tem equivalente em texto (percentual ocupado).
- RF3: Um bloco **por tipo** mostra a contagem de veículos de cada tipo presente (avulso, mensal e, se existir, convênio), cada um com marcador de cor e o nome em texto. Pátio vazio mostra "Avulso 0".
- RF4: Um campo de **busca** encontra veículos por placa (com ou sem hífen), ticket ou tipo. Os filtros e a busca que o Pátio já tem hoje (modelo, categoria, chave fora/dentro do quadro) continuam disponíveis, reorganizados para não competir com o desenho do protótipo.
- RF5: Cada veículo é um **card** com: placa em destaque, permanência em destaque, modelo e cor, selo do tipo (em texto e cor) e data/hora da entrada. O card inteiro é tocável e abre o detalhe do ticket.
- RF6: A ordem da lista, a atualização automática, o botão de atualizar, o horário da última atualização, o "mostrar mais" e os gráficos continuam como hoje, apenas reposicionados no novo layout.
- RF7: Estados de carregamento, erro, **pátio vazio** ("Nenhum carro no pátio" com orientação para registrar entrada) e **busca sem resultado** ("Nenhum carro encontrado") seguem o tom e o desenho do protótipo.

### Detalhe do ticket
- RF8: Tocar em um card abre o detalhe do ticket, com botão de voltar ao Pátio (preservando busca e filtros) e o código do ticket.
- RF9: O detalhe mostra a placa em grande, modelo, cor e categoria, e o tipo do veículo (com o nome do convênio, quando houver).
- RF10: O detalhe mostra dois destaques: **permanência** e **valor até agora**. Para mensalista, o valor aparece como "Mensal", sem cobrança.
- RF11: O detalhe lista: hora da entrada, **próxima faixa** de preço (valor e horário em que muda, ou "Diária atingida", ou "Plano mensal, sem cobrança"), operador que registrou a entrada e **quadro de chaves** (posição do gancho ou "Fora do quadro"), com ação para guardar ou alterar a chave pelo fluxo que já existe.
- RF12: O detalhe tem a ação principal **Registrar saída** (com o valor atual quando houver cobrança), que abre o fluxo de saída que já existe para aquele veículo, e a ação **Mostrar QR do ticket ao cliente**.
- RF13: Concluída a saída, o operador volta ao Pátio, o veículo não aparece mais e há um aviso de confirmação. Cancelada a saída, o veículo continua no detalhe.
- RF14: Permanência e valor do detalhe se atualizam sozinhos enquanto a tela está aberta.

### Comprovante digital
- RF15: A partir do detalhe, o operador abre o comprovante digital em tela clara, feito para o cliente: nome, CNPJ, endereço e telefone do estacionamento, título "Comprovante Digital", QR Code do ticket, placa, modelo, cor, entrada e ticket, e a instrução de apontar a câmera.
- RF16: O QR Code leva o cliente à página pública do ticket, que mostra tempo e valor sem exigir cadastro.
- RF17: Enquanto o comprovante está aberto, a tela do aparelho não apaga (quando o aparelho permitir).
- RF18: "Fechar" e "Pronto" voltam ao detalhe do ticket.

### Responsividade
- RF19: No celular o layout é igual ao protótipo, em coluna única. No computador os mesmos blocos se reorganizam para aproveitar a largura (por exemplo, resumo ao lado da busca e cards em grade), sem uma coluna estreita centralizada e sem perder nenhuma informação.
- RF20: O Pátio, o ticket e o comprovante têm endereço próprio, de modo que o botão de voltar do navegador e o recarregamento da página levam ao mesmo lugar.

## Fora de escopo
- Mudar o menu e a navegação do sistema: a barra de abas do protótipo (Pátio, Entrada, Saída, Caixa, Mais) **não** entra; vale o menu atual.
- Mudar regras de preço, cálculo de saída, pagamento ou o fluxo de saída em si.
- Mudar a página pública do ticket aberta pelo QR Code.
- Criar novos filtros, alertas ou relatórios além dos que o Pátio já tem.
- Impressão do comprovante.
- O botão "Testar pátio vazio" do protótipo (é só de teste).

## Critérios de aceite
- [ ] A tela do Pátio tem o mesmo desenho do protótipo: topo, bloco de vagas ocupadas, bloco por tipo, busca e cards.
- [ ] Vagas ocupadas, livres e barra de ocupação batem com a quantidade de veículos e a capacidade cadastrada.
- [ ] A busca por placa, ticket e tipo funciona; os filtros e as funções atuais do Pátio continuam acessíveis.
- [ ] Cada card mostra placa, permanência, modelo, cor, tipo em texto e entrada; tocar nele abre o detalhe.
- [ ] O detalhe mostra permanência, valor até agora, próxima faixa, operador e quadro de chaves, e guarda ou altera a chave.
- [ ] "Registrar saída" no detalhe abre o fluxo de saída existente; ao concluir, o veículo some do Pátio e aparece o aviso.
- [ ] "Mostrar QR do ticket ao cliente" abre o comprovante claro com QR que leva à página pública do ticket; "Pronto" volta ao detalhe.
- [ ] Pátio vazio, busca sem resultado, carregamento e erro têm estados próprios.
- [ ] Funciona sem rolagem horizontal a partir de 320px, com alvos de toque de pelo menos 44px, e usa o espaço do computador sem coluna estreita.
- [ ] Voltar do navegador e recarregar a página mantêm a tela em que o operador estava.
- [ ] Nenhuma função que existia no Pátio antes do refactor foi perdida.
- [ ] Atende WCAG 2.2 AA: tipo e situação sempre em texto, foco visível, navegação por teclado, nome acessível com a placa.

## Pontos a confirmar
- **Valor e próxima faixa:** o protótipo calcula preço no próprio navegador com uma tabela de exemplo. É preciso confirmar se a API do Pátio já entrega valor atual e próxima faixa; se não, o back precisa fornecê-los, porque o cálculo não pode divergir do que a saída cobra.
- **Tipo "convênio":** o Pátio atual distingue mensalista e avulso. Confirmar se convênio existe no sistema e de onde vem o nome do convênio; se não existir, o tipo some do desenho.
- **Capacidade de vagas:** o protótipo usa uma capacidade única; hoje o sistema separa vagas de carros e motos. Confirmar como o bloco de ocupação deve apresentar isso.
- **Página pública do ticket:** confirmar o endereço usado no QR Code e o formato do código do ticket mostrado no detalhe.

## Métricas de sucesso
- O operador chega do Pátio à saída de um veículo em menos toques do que hoje.
- O operador lê ocupação e vagas livres sem rolar a tela, no celular.
- Nenhum aumento de erros ou chamados sobre o Pátio, a saída ou a chave depois do lançamento.
