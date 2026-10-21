# PRD: Tela de pátio

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-10-21
**Versão:** 1.0

---

## 1. Objetivo

Dar ao operador uma tela que mostre todos os veículos que estão no pátio agora e permita agir sobre eles: achar um carro, ver há quanto tempo ele está lá, ver o comprovante da entrada e registrar a saída, sem sair da tela.

O valor é substituir a consulta feita às cegas (hoje só se chega a um veículo digitando a placa na saída) por uma visão do pátio inteiro, que serve tanto para conferir o que está lá quanto para atender quem chegou para retirar o carro.

## 2. Contexto e Motivação

O sistema já registra a entrada de veículos (com comprovante e QR Code) e a saída (com cálculo e pagamento). O que falta é enxergar o conjunto: não existe uma tela que liste quem está no pátio. O operador não consegue conferir quantos carros há, quais estão há mais tempo, quais são de mensalistas nem quem registrou cada entrada.

A API já devolve a lista dos veículos no pátio. Para cada um, traz a placa, o modelo, a cor, a categoria, a data e hora da entrada, o tempo de permanência já formatado, se é mensalista, o número sequencial e o código do ticket, a tabela de preço aplicada, o operador que registrou a entrada e o endereço do comprovante.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Operador no portão ou no balcão | Achar rápido o carro de quem chegou para retirá-lo e registrar a saída | Durante o expediente, várias vezes ao dia, no computador ou no celular |
| Administrador / gerente | Conferir o que está no pátio: quantos carros, há quanto tempo, quais são mensalistas e quem registrou a entrada | De vez em quando, geralmente no computador |

A regra de acesso é a das telas operacionais de entrada e saída. Quem não tem permissão não vê a página.

## 4. Escopo

### Dentro do Escopo
- Nova página "Pátio" no menu, com a lista dos veículos que estão no pátio.
- Identificação de cada veículo: placa em destaque, modelo, cor e categoria, e a indicação de mensalista.
- Data e hora da entrada e o tempo de permanência.
- Tabela de preço aplicada e operador que registrou a entrada.
- Busca por placa, modelo e ticket.
- Filtros por mensalista (ou avulso) e por categoria.
- Quantidade de veículos no pátio.
- Ação "Registrar saída" em cada veículo, com o fluxo de saída que já existe.
- Ação "Ver comprovante de entrada" em cada veículo.
- Atualização da lista sob comando do operador e depois de uma saída registrada.
- Estados de carregamento, vazio, busca sem resultado e erro.
- Layout pensado para o computador e para o celular.

### Fora do Escopo
- Registrar a entrada de um veículo (já existe) e editar ou cancelar uma entrada.
- Quadro de chaves e qualquer controle de vagas ou mapa do pátio.
- Histórico de veículos que já saíram e relatórios.
- Pagamento (continua no fluxo de saída).
- Alertas ou notificações de permanência longa.
- Impressão de comprovante.

## 5. Requisitos Funcionais

### RF-01: Ver os veículos no pátio
**Critério de aceite:**
- Dado que existem veículos no pátio, quando o operador abre a página "Pátio", então vê a lista de todos eles, sem precisar buscar antes.
- Dado a lista aberta, então a quantidade de veículos no pátio aparece em destaque.
- Dado que o operador não tem permissão para a página, então ela não aparece no menu e o acesso direto é bloqueado.

### RF-02: Identificar o veículo
**Critério de aceite:**
- Dado um veículo na lista, então mostra a placa em destaque, o modelo, a cor e a categoria.
- Dado um veículo de mensalista, então a lista o indica em texto ("Mensalista"), e não só por cor.
- Dado um veículo sem modelo ou sem cor informados, então a lista mostra um traço, sem quebrar o layout.

### RF-03: Ver a entrada e a permanência
**Critério de aceite:**
- Dado um veículo, então mostra a data e a hora da entrada e há quanto tempo ele está no pátio (por exemplo "4d 1h 7min").
- Dado a lista aberta, então os veículos aparecem ordenados do que está há mais tempo para o que está há menos [A CONFIRMAR se esta é a ordem desejada].
- Dado que a lista foi atualizada, então o tempo de permanência reflete o momento da atualização.

### RF-04: Ver a tabela de preço e o operador
**Critério de aceite:**
- Dado um veículo, então mostra a tabela de preço aplicada à entrada e o nome do operador que a registrou.
- Dado um veículo sem essas informações, então mostra um traço.

### RF-05: Buscar um veículo
**Critério de aceite:**
- Dado um texto digitado, quando é uma placa (com ou sem hífen), parte do modelo ou o ticket, então a lista mostra só os veículos que correspondem.
- Dado um texto sem resultado, então a tela diz que nada foi encontrado e oferece limpar a busca.
- Dado a busca limpa, então a lista volta a mostrar todos os veículos.

### RF-06: Filtrar a lista
**Critério de aceite:**
- Dado o filtro de tipo, quando o operador escolhe "Mensalistas" ou "Avulsos", então a lista mostra só aquele grupo; "Todos" mostra todos.
- Dado o filtro de categoria, quando o operador escolhe uma categoria, então a lista mostra só os veículos dela.
- Dado busca e filtros ativos ao mesmo tempo, então valem todos juntos, e a quantidade mostrada acompanha o resultado.

### RF-07: Registrar a saída a partir da lista
**Critério de aceite:**
- Dado um veículo na lista, quando o operador escolhe "Registrar saída", então abre o fluxo de saída já existente com aquele veículo escolhido, sem precisar digitar a placa de novo.
- Dado que a saída foi concluída, então o veículo deixa de aparecer na lista e o operador volta a ela sem perder a busca e os filtros.
- Dado que o fluxo de saída foi cancelado, então o veículo continua na lista.

### RF-08: Ver o comprovante de entrada
**Critério de aceite:**
- Dado um veículo, quando o operador escolhe "Ver comprovante", então vê o comprovante da entrada daquele veículo, o mesmo que o cliente recebe.
- Dado um veículo cujo comprovante não está disponível, então a tela explica que não foi possível abri-lo.

### RF-09: Atualizar a lista
**Critério de aceite:**
- Dado a lista aberta, quando o operador pede para atualizar, então ela é recarregada e mostra o horário da última atualização.
- Dado que uma entrada ou saída foi registrada em outro lugar, quando o operador atualiza, então a lista reflete a mudança.
- [A DEFINIR] se a lista também se atualiza sozinha em intervalos.

### RF-10: Tratar carregamento, vazio e erro
**Critério de aceite:**
- Dado o carregamento, então a tela mostra esqueletos no formato da lista, sem saltos de layout.
- Dado que não há veículos no pátio, então a tela diz "Nenhum veículo no pátio" e oferece registrar uma entrada.
- Dado um erro ao carregar, então mostra a mensagem em português e permite tentar de novo; um erro de permissão não oferece tentar de novo.

### RF-11: Usar no celular
**Critério de aceite:**
- Dado um celular, então cada veículo é um item compacto, sem tabela e sem rolagem horizontal, a partir de 320px.
- Dado um celular, então botões e áreas de toque têm pelo menos 44px de altura.
- Dado um celular, então busca e filtros ficam acessíveis sem ocupar a tela toda.

## 6. Requisitos Não-Funcionais

- **Performance:** a lista abre rápido em conexão móvel comum e continua fluida com o volume esperado de veículos no pátio [A CONFIRMAR o volume máximo].
- **Acessibilidade:** WCAG 2.2 nível AA; ações com nome acessível que cita a placa; situação (mensalista, permanência) sempre em texto; foco visível e navegação por teclado.
- **Compatibilidade:** navegadores atuais de celular e computador, nos temas claro e escuro.
- **Consistência:** reutiliza os componentes e os fluxos já existentes (saída, comprovante, placa), sem criar um segundo fluxo de saída.
- **Segurança e privacidade:** a tela mostra só os dados da empresa do operador; o código do comprovante (token) não é exibido como texto na lista, só usado para abrir o comprovante.

## 7. Fluxos Principais

### Fluxo 1: Atender quem veio retirar o carro
1. O operador abre o Pátio e digita a placa na busca.
2. A lista mostra só aquele veículo, com a entrada e a permanência.
3. O operador escolhe "Registrar saída" e conclui o fluxo de saída.
4. O veículo sai da lista, e o operador segue para o próximo.

### Fluxo 2: Conferir o pátio
1. O gerente abre o Pátio e vê a quantidade de veículos e a lista, dos mais antigos para os mais recentes.
2. Filtra por "Mensalistas" ou por uma categoria para conferir um grupo.
3. Abre o comprovante de um veículo para checar a entrada.

### Fluxo 3: Lista desatualizada
1. O operador volta ao Pátio depois de um tempo.
2. Toca em "Atualizar" e vê o horário da última atualização.
3. A lista passa a refletir as entradas e saídas feitas no intervalo.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Toques do operador para chegar ao carro e iniciar a saída | Digitar a placa na tela de saída, sem ver o pátio | Abrir o Pátio, buscar e escolher "Registrar saída" |
| Conferência do pátio sem ajuda do suporte | Não é possível hoje | O operador vê quantos veículos há e há quanto tempo cada um está |
| Uso no celular sem rolagem horizontal e com alvos de 44px | Não existe | Atende em 320px |
| Saídas registradas a partir do Pátio | — | [A DEFINIR] |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| A listagem devolve todos os veículos de uma vez, sem paginação nem filtros | Médio | [A CONFIRMAR] o volume máximo esperado; buscar e filtrar na própria tela, e pedir paginação ao back se o volume crescer |
| O tempo de permanência vem pronto do back no instante da consulta | Baixo | Mostrar o horário da última atualização e permitir atualizar |
| A categoria vem como número; o nome precisa ser traduzido na tela | Baixo | Usar a mesma tabela de categorias das telas de entrada e saída |
| O fluxo de saída exige abrir o veículo escolhido sem digitar a placa | Médio | Reaproveitar a busca por placa ou sequencial que a saída já aceita |
| O comprovante é aberto pelo token do veículo | Baixo | Não exibir o token; abrir o comprovante pelo endereço já existente |
| `docs/specs/input.md` contém um JWT real no exemplo de chamada | Alto | Remover ou invalidar o token antes de qualquer commit; nunca copiá-lo para código, testes ou documentos |
| O campo do quadro de chaves chega sempre vazio nos exemplos | Baixo | Fora do escopo desta versão |

## 10. Referências

- Pedido original: `docs/specs/input.md` (`GET /Patio`)
- Entrada de veículos: `docs/specs/entrada-veiculos/prd.md` e `docs/specs/melhoria-fluxo-entrada/prd.md`
- Saída de veículos: `docs/specs/saida-veiculos/prd.md` e `docs/specs/saida-localizar-e-pagar/prd.md`
- Comprovante de entrada e QR Code: `docs/specs/qrcode-entrada/prd.md`
