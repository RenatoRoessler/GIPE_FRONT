# PRD: Recibo Público da Saída

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-22  
**Versão:** 1.0

---

## 1. Objetivo

Permitir que o cliente leve o recibo da saída no próprio celular. Ao registrar uma saída, o recibo da tela passa a trazer um QR code; ao lê-lo, qualquer pessoa abre uma página pública, sem login, com os dados daquela saída e a opção de baixar o recibo em PDF.

## 2. Contexto e Motivação

Hoje o recibo da saída existe só na tela e no papel: se o cliente perde o papel ou precisa do documento depois (para o patrão, para reembolso, para conferir o valor), não há como recuperá-lo. A entrada já resolve isso com um comprovante público acessado por QR code. O back agora disponibiliza uma consulta pública do recibo de saída a partir de um código do recibo, então falta a página e o QR para o cliente usar.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Cliente do estacionamento | Guardar ou consultar o recibo da saída no celular, sem pedir segunda via e sem criar conta | Logo depois de pagar, no balcão, ou dias depois, quando precisar do documento |
| Operador (caixa) | Entregar o recibo digital sem imprimir de novo ou sem ficar enviando por aplicativo | Atendimento no portão, com o cliente ao lado |

A página é pública: quem tiver o link ou o QR abre, sem login.

## 4. Escopo

### Dentro do Escopo
- QR code no recibo que aparece na tela de saída depois de registrar a saída, tanto na tela quanto na impressão.
- Página pública do recibo, aberta pelo QR, com os dados da saída.
- Download do recibo em PDF e impressão pela página.
- Recibo também para saída de mensalista (sem cobrança), identificado como tal.
- Mensagem clara quando o recibo não existe ou não está mais disponível.

### Fora do Escopo
- Pedir nota fiscal pela página (o recibo apenas indica se ela já foi solicitada, quando essa informação existir).
- Envio do recibo por e-mail ou WhatsApp.
- Consultar ou reimprimir recibos de saídas antigas por dentro do sistema.
- Prazo de validade próprio do link: quem decide se o recibo ainda está disponível é o back; a página só mostra o resultado.
- Mudar o recibo impresso além de incluir o QR.

## 5. Requisitos Funcionais

### RF-01: QR code no recibo da saída
**Critério de aceite:**
- Dado que uma saída foi registrada com sucesso, quando o recibo aparece na tela, então ele mostra um QR code que aponta para a página pública daquele recibo.
- Dado o recibo na impressão, quando o operador imprime, então o QR code também sai no papel.
- Dado uma saída de mensalista (sem cobrança), quando o recibo aparece, então o QR code também é mostrado.
- Dado que não foi possível obter o código do recibo para aquela saída, quando o recibo aparece, então ele é mostrado normalmente, sem QR code e sem erro para o operador.

### RF-02: Abrir o recibo pelo QR
**Critério de aceite:**
- Dado o QR code do recibo, quando o cliente o lê com a câmera do celular, então abre a página pública do recibo daquela saída.
- Dado que o cliente não tem conta nem está logado, quando abre a página, então vê o recibo sem ser levado ao login.
- Dado o link aberto em celular ou em computador, então a página se ajusta ao tamanho da tela.

### RF-03: Dados do recibo
**Critério de aceite:**
- Dado que o recibo existe, quando a página carrega, então mostra: empresa (razão social, CNPJ, endereço e telefone, quando houver), placa, modelo e cor do veículo, categoria, data e hora da entrada, data e hora da saída, tempo de permanência, valor e forma de pagamento.
- Dado que algum dado opcional não existe (por exemplo, endereço ou modelo), então a página omite o campo, sem mostrar "null" nem espaços vazios.
- Dado o valor, então ele aparece em reais, no formato brasileiro (R$ 174,00), e o CNPJ e o telefone aparecem formatados.

### RF-04: Recibo de mensalista
**Critério de aceite:**
- Dado uma saída de mensalista, quando a página carrega, então identifica que é mensalista e mostra "Sem cobrança" no lugar do valor e da forma de pagamento.
- Dado uma saída com cobrança, então nada disso aparece.

### RF-05: Baixar e imprimir
**Critério de aceite:**
- Dado a página do recibo, quando o cliente toca em baixar PDF, então recebe um arquivo PDF com os mesmos dados da página.
- Dado a página do recibo, quando o cliente toca em imprimir, então só o recibo é impresso, sem elementos de navegação.

### RF-06: Recibo indisponível
**Critério de aceite:**
- Dado um link com código inexistente ou que não é mais atendido, quando a página carrega, então mostra "Recibo não encontrado" com uma orientação curta (procurar o estacionamento), sem mostrar erro técnico.
- Dado uma falha de rede ou do servidor, quando a página carrega, então mostra uma mensagem de que não foi possível carregar e a opção de tentar de novo.
- Dado que a página está carregando, então mostra um estado de carregamento anunciado a leitores de tela.

### RF-07: Página fora dos buscadores
**Critério de aceite:**
- Dado a página pública do recibo, quando um buscador a encontra, então ela não deve ser indexada nem exibir o conteúdo em resultados de busca.

## 6. Requisitos Não-Funcionais

- **Performance:** a página abre e mostra o recibo em poucos segundos em rede móvel comum; carrega só o necessário (sem o menu e sem o restante da área logada).
- **Acessibilidade:** WCAG 2.2 nível AA; contraste adequado, leitura por leitor de tela, alvos de toque de pelo menos 44px.
- **Compatibilidade:** celulares (principal uso) e computadores; temas claro e escuro conforme a preferência do aparelho.
- **Segurança:** o recibo só é acessível a quem tem o código do recibo; a página não mostra dados além dos do recibo (por exemplo, nome do operador ou do mensalista) e o código não é registrado em lugar nenhum além do necessário.

## 7. Fluxos Principais

### Fluxo 1: Cliente lê o QR do recibo
1. Operador registra a saída e o recibo aparece com o QR code.
2. Cliente aponta a câmera do celular para o QR.
3. Sistema abre a página pública do recibo daquela saída.
4. Cliente confere os dados e, se quiser, baixa o PDF.

### Fluxo 2: Recibo indisponível
1. Cliente abre um link antigo ou digitado errado.
2. Sistema não encontra o recibo.
3. Página mostra "Recibo não encontrado" e orienta procurar o estacionamento.

### Fluxo 3: Saída de mensalista
1. Operador conclui a saída de um mensalista, sem cobrança.
2. Recibo mostra "Sem cobrança" e o QR code.
3. Cliente abre a página e vê o recibo identificado como de mensalista.

## 8. Critérios de Sucesso

Sem métricas numéricas nesta entrega. A feature é bem-sucedida quando o cliente consegue, a partir do QR do recibo, abrir o recibo no celular sem login e baixar o PDF, e quando recibos inexistentes mostram uma mensagem clara.

| Métrica | Baseline | Meta |
|---------|----------|------|
| Cliente consegue abrir o recibo da saída pelo celular | Não existe | Funcional e validado pelos critérios de aceite |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| O código do recibo precisa vir na resposta que registra a saída; hoje o sistema não o usa [A CONFIRMAR com o back] | Alto | Confirmar o nome e a presença do campo; se faltar, o recibo continua sem QR (RF-01) |
| Unidade do campo "valor" na consulta do recibo | Baixo | **Confirmado com o back:** vem em reais (15100.00 = R$ 15.100,00); a página só formata |
| Prazo de validade do link não definido: depende do back | Médio | A página só reage ao "não encontrado" do back (RF-06) |
| Forma de pagamento e valor pago no recibo da tela (valor recebido e troco) não existem na consulta pública | Baixo | A página mostra só o que a consulta devolve; recibo da tela e página podem diferir nesses dois campos |
| O exemplo do `input.md` inclui um token de acesso real | Alto | Não copiar o token para specs ou código; recomenda-se revogá-lo/rotacioná-lo |
| Dados do veículo (placa) numa página sem login | Médio | Só quem tem o link do recibo acessa; página fora dos buscadores (RF-07) |

## 10. Referências

- Consulta pública do recibo de saída: exemplo de resposta em `docs/specs/input.md` (campos: empresa, veículo, entrada, saída, permanência, valor, forma de pagamento, código do recibo e indicação de nota fiscal solicitada).
- Comprovante público da entrada e seu QR code: `docs/specs/qrcode-entrada/`.
- Recibo da tela de saída: `docs/specs/saida-localizar-e-pagar/`.
