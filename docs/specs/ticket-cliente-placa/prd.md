# PRD: Ticket do Cliente por Placa e Cartaz do Ticket

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-11-11  
**Versão:** 1.0

---

## 1. Objetivo

Permitir que o cliente do estacionamento encontre o próprio ticket digital sozinho, sem login: ele lê um QR code afixado no estacionamento, digita a placa do veículo e é levado ao comprovante. Para isso, o operador ganha um botão que gera o cartaz impresso com esse QR code.

## 2. Contexto e Motivação

Hoje o cliente só chega ao comprovante digital se o operador mostrar ou enviar o link do ticket. Um cartaz no estacionamento ("Seu ticket está no celular") elimina essa etapa: o cliente consulta por conta própria, sem baixar app, sem cadastro e sem papel. O back agora oferece uma consulta pública do comprovante por empresa e placa, e o cadastro da empresa passou a devolver um identificador público (`empresaGuid`) que identifica o estacionamento no QR code.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Cliente do estacionamento | Ver hora de entrada, tempo e valor do próprio veículo no celular, sem ajuda do operador | Dentro do estacionamento, depois de estacionar, lendo o QR do cartaz |
| Operador / gestor da empresa | Obter e imprimir o cartaz com o QR code da própria empresa | Na Home e na tela da empresa, para afixar na entrada, no caixa ou no pátio |

A tela de consulta é pública: quem tiver o link ou o QR abre, sem login.

## 4. Escopo

### Dentro do Escopo
- Tela pública de consulta do ticket por placa, que recebe a empresa pelo link.
- Campo de placa e botão Buscar.
- Abertura do comprovante do cliente quando o veículo é encontrado.
- Mensagem clara quando o veículo não é encontrado.
- Botão "Gerar Cartaz do Ticket" na Home e na tela da empresa.
- Cartaz em A4 retrato, pronto para impressão, com o QR code que aponta para a tela de consulta da empresa.

### Fora do Escopo
- Alterar o comprovante público do ticket (a tela já existente em `app.murel.com.br/comprovante/{token}`).
- Consultar saídas, recibos ou veículos que já saíram do pátio.
- Envio do link por e-mail ou WhatsApp.
- Personalizar o cartaz (cores, textos, logotipo da empresa); o layout é o da referência.
- Gerar ou trocar o `empresaGuid`: ele já vem pronto do cadastro da empresa.

## 5. Requisitos Funcionais

### RF-01: Tela pública de consulta por placa
**Critério de aceite:**
- Dado um link com o identificador da empresa, quando o cliente o abre, então vê a tela de consulta sem ser levado ao login.
- Dado um link sem o identificador da empresa, ou com um identificador inválido, quando a tela abre, então mostra uma mensagem de link inválido orientando procurar o estacionamento, sem permitir a busca.
- Dado a tela aberta em celular ou computador, então ela se ajusta ao tamanho da tela.
- Dado a tela pública, quando um buscador a encontra, então ela não deve ser indexada.

### RF-02: Digitar a placa e buscar
**Critério de aceite:**
- Dado a tela de consulta, então há um campo para digitar a placa e um botão "Buscar".
- Dado uma placa digitada em minúsculas ou com hífen/espaço (ex.: `qqq-5z8`), quando o cliente busca, então a placa é normalizada antes da consulta.
- Dado o campo vazio ou com placa incompleta, quando o cliente tenta buscar, então vê uma orientação para informar a placa completa e nenhuma consulta é feita.
- Dado que a consulta está em andamento, então o botão indica o carregamento e não permite um segundo envio; o estado é anunciado a leitores de tela.

### RF-03: Abrir o comprovante
**Critério de aceite:**
- Dado que a consulta encontrou o veículo, quando a resposta chega, então o cliente é levado ao comprovante do ticket daquele veículo (`https://app.murel.com.br/comprovante/{token}`, usando o `token` da resposta).
- Dado que o cliente voltou do comprovante para a tela de consulta, então o campo de placa não traz o resultado anterior como se fosse uma nova busca em andamento.

### RF-04: Veículo não encontrado
**Critério de aceite:**
- Dado que a consulta devolve 404 (placa inexistente no pátio daquela empresa ou fora do prazo de consulta), quando a resposta chega, então a tela mostra "Ticket não encontrado" com orientação curta (conferir a placa ou falar com o operador), sem mostrar erro técnico.
- Dado uma falha de rede ou do servidor, quando a resposta chega, então a tela mostra que não foi possível consultar e permite tentar de novo, mantendo a placa digitada.

### RF-05: Botão "Gerar Cartaz do Ticket"
**Critério de aceite:**
- Dado a Home, então há o botão "Gerar Cartaz do Ticket".
- Dado a tela da empresa, então há o mesmo botão.
- Dado que o botão foi acionado, quando o cartaz está pronto, então a impressão do navegador é aberta com o cartaz em A4 retrato.
- Dado que a empresa não tem `empresaGuid` disponível, quando o usuário aciona o botão, então vê uma mensagem de que o cartaz não pode ser gerado agora, sem abrir a impressão com QR inválido.
- Dado que o usuário acessa o botão, então ele respeita as permissões já existentes para a Home e a tela da empresa [A CONFIRMAR: se algum perfil não deve ver o botão].

### RF-06: Conteúdo do cartaz
**Critério de aceite:**
- Dado o cartaz impresso, então segue o layout da referência (`docs/specs/Cartaz Ticket Digital · A4 retrato@1x.png`): cabeçalho com marca Murel e selo "Ticket digital", título "Seu ticket está no celular.", texto de apoio, três passos (apontar a câmera, digitar a placa, acompanhar), faixa "Sem baixar app · Sem cadastro · Sem papel", orientação para falar com o operador e rodapé com a marca.
- Dado o espaço reservado ao QR code na referência ("Cole aqui o QR Code do estacionamento"), então o cartaz impresso traz o QR code real no lugar do espaço reservado, sem o texto de "cole aqui".
- Dado o QR code, quando lido pela câmera do celular, então abre a tela de consulta (RF-01) já com a empresa correta.
- Dado a impressão, então só o cartaz sai no papel (sem menu, cabeçalho do sistema ou botões) e cabe em uma única folha A4, com fundo e cores preservados.

## 6. Requisitos Não-Funcionais

- **Performance:** a tela de consulta carrega só o necessário (sem menu e sem o restante da área logada) e responde em poucos segundos em rede móvel comum.
- **Acessibilidade:** WCAG 2.2 nível AA; contraste adequado, leitura por leitor de tela, alvos de toque de pelo menos 44px.
- **Compatibilidade:** celulares (principal uso do cliente) e computadores; temas claro e escuro conforme a preferência do aparelho na tela de consulta. O cartaz é sempre impresso no tema claro da referência.
- **Segurança e privacidade:** a tela exige empresa e placa; não lista veículos, não expõe dados além do necessário para abrir o comprovante, e não registra a placa em lugar nenhum além do necessário. O `empresaGuid` é público por natureza (está no QR) e não dá acesso a dados sem a placa.

## 7. Fluxos Principais

### Fluxo 1: Cliente consulta o ticket pelo cartaz
1. Cliente aponta a câmera para o QR code do cartaz.
2. Abre a tela pública de consulta da empresa.
3. Digita a placa e toca em Buscar.
4. Sistema encontra o veículo e abre o comprovante do ticket.

### Fluxo 2: Placa não encontrada
1. Cliente digita uma placa que não está no pátio (ou digitou errado).
2. Sistema recebe 404.
3. Tela mostra "Ticket não encontrado" e orienta conferir a placa ou falar com o operador.

### Fluxo 3: Operador gera o cartaz
1. Operador toca em "Gerar Cartaz do Ticket" na Home ou na tela da empresa.
2. Sistema monta o cartaz com o QR code da empresa e abre a impressão.
3. Operador imprime e afixa o cartaz no estacionamento.

## 8. Critérios de Sucesso

Sem métricas numéricas nesta entrega. A feature é bem-sucedida quando o cliente consegue, a partir do cartaz, abrir o próprio ticket no celular sem ajuda do operador, e quando o operador consegue imprimir o cartaz em uma folha A4 a partir da Home e da tela da empresa.

| Métrica | Baseline | Meta |
|---------|----------|------|
| Cliente abre o próprio ticket pela placa, sem login | Não existe | Funcional e validado pelos critérios de aceite |
| Cartaz com QR da empresa impresso a partir do sistema | Não existe | Funcional nos dois pontos de acesso |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| O campo `empresaGuid` precisa vir no retorno do endpoint de empresa (informado como já adicionado) [A CONFIRMAR: nome exato e presença em todas as empresas] | Alto | Sem o campo, o botão avisa e não gera QR (RF-05) |
| Regra do 404 por tempo: o pedido diz "caso tenha passado 8 minutos ou a placa não exista" [A CONFIRMAR com o back: 8 minutos contados a partir de quê, e se o 404 vale para veículo que já saiu] | Médio | A tela só reage ao 404 e mostra a mesma mensagem nos dois casos (RF-04) |
| Consulta pública por placa permite descobrir se um veículo está em determinado estacionamento | Médio | Exige empresa e placa exatas; sem listagem; página fora dos buscadores; limitação de tentativas fica a cargo do back [A CONFIRMAR] |
| O link do comprovante tem endereço fixo (`app.murel.com.br`) | Baixo | Usar o endereço do comprovante já adotado pelo sistema; confirmar se muda entre ambientes |
| Cartaz depende da impressão do navegador (margens e fundo) | Baixo | Critério de caber em uma folha A4 com cores preservadas (RF-06) |
| O exemplo do `input.md` inclui um token de comprovante | Baixo | Não copiar o token para specs ou código |

## 10. Referências

- Pedido original: `docs/specs/input.md`.
- Layout do cartaz: `docs/specs/Cartaz Ticket Digital · A4 retrato@1x.png`.
- Consulta pública: `patio/comprovante/cliente/placa?empresa={empresaGuid}&placa={placa}` (resposta: empresa, veículo, entrada, permanência, valor atual e `token`).
- Comprovante público da entrada e seu QR code: `docs/specs/qrcode-entrada/`.
- Recibo público da saída (padrão de página pública): `docs/specs/recibo-publico/`.
