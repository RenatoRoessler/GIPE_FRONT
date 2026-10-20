# PRD: Leitor de placa pela câmera

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-10-20
**Versão:** 1.0

---

## 1. Objetivo

Permitir que o operador preencha a placa de um veículo apontando a câmera para ela, em vez de digitar. O valor para o usuário é registrar entradas e localizar veículos na saída com mais rapidez e menos erros de digitação.

## 2. Contexto e Motivação

Hoje a placa é sempre digitada, nas telas de entrada e de saída. Em horários de pico isso atrasa o atendimento e gera erros (letras e números trocados) que depois dificultam encontrar o veículo. O sistema já usa a câmera para ler o QR code do comprovante na saída, então o operador já está habituado a esse tipo de interação.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Operador do pátio | Registrar entrada e localizar veículo na saída sem digitar a placa | Na guarita ou circulando no pátio, no celular ou no computador com câmera, muitas vezes com pressa |

## 4. Escopo

### Dentro do Escopo
- Botão com ícone de câmera dentro do campo de placa (conforme a imagem de referência, à direita da placa) na **entrada de veículo** e na **busca manual da saída**.
- Leitura automática dos caracteres da placa a partir da câmera, feita sem serviço pago de terceiros.
- Exibição do que foi lido para o operador conferir e corrigir antes de usar.
- Mensagens claras para câmera negada, indisponível ou placa não reconhecida.
- Funcionamento no celular e no computador com webcam.

### Fora do Escopo
- Guardar a foto do veículo ou da placa no registro.
- Leitura em outros campos de placa do sistema (ex.: cadastro de mensalistas).
- Leitura contínua/automática sem ação do operador (ex.: câmera fixa na cancela).
- Serviços externos pagos de reconhecimento de imagem.
- Reconhecer modelo, cor ou categoria do veículo.

## 5. Requisitos Funcionais

### RF-01: Botão de câmera no campo de placa
**Critério de aceite:**
- Dado que o operador está na entrada de veículo ou na busca manual da saída, quando visualiza o campo de placa, então vê um botão com ícone de câmera ao lado da placa, com nome acessível "Ler placa pela câmera".
- Dado que o campo está desabilitado (ex.: durante o envio), quando o operador tenta usar o botão, então ele não responde.

### RF-02: Abrir a câmera
**Critério de aceite:**
- Dado que o operador toca no botão de câmera, quando concede permissão de câmera, então a imagem da câmera é exibida com uma orientação visual de onde posicionar a placa.
- Dado que o operador está em um celular, quando a câmera abre, então é usada preferencialmente a câmera traseira.
- Dado que o operador fecha a câmera sem ler, então volta ao campo de placa sem alterá-lo.

### RF-03: Reconhecer a placa
**Critério de aceite:**
- Dado que a câmera está aberta e a placa está visível e legível, quando o sistema a reconhece, então exibe o texto lido em formato de placa.
- Dado que o texto lido não tem formato válido de placa (antigo ou Mercosul), quando o sistema tenta reconhecer, então não o apresenta como resultado e continua tentando.
- Dado que a leitura levou tempo demais sem sucesso, então o sistema avisa que não conseguiu e orienta digitar a placa ou tentar de novo.

### RF-04: Confirmar ou corrigir antes de usar
**Critério de aceite:**
- Dado que uma placa foi lida, quando o resultado é exibido, então o operador pode confirmar, corrigir o texto ou tentar ler novamente.
- Dado que o operador confirma, então a câmera fecha e o campo de placa é preenchido com o valor confirmado, no mesmo formato da digitação manual.
- Dado que a leitura foi confirmada, então nada é registrado nem pesquisado automaticamente: o operador segue o fluxo normal da tela.

### RF-05: Tratamento de falhas da câmera
**Critério de aceite:**
- Dado que o operador negou a permissão de câmera, quando toca no botão, então vê uma mensagem explicando como liberar o acesso e pode continuar digitando.
- Dado que o aparelho não tem câmera ou o navegador não suporta, então a mensagem informa isso e o campo continua utilizável por digitação.
- Dado que o navegador permite acesso à câmera apenas em conexão segura, quando o sistema está fora dela, então o operador é avisado em vez de ver uma falha sem explicação.

### RF-06: Encerrar a câmera
**Critério de aceite:**
- Dado que a leitura foi confirmada, cancelada ou a tela foi fechada, então a câmera é desligada e o indicador de câmera ativa do aparelho some.

## 6. Requisitos Não-Funcionais

- **Performance:** a placa deve ser reconhecida em poucos segundos, em condições normais de luz, sem travar a tela.
- **Acessibilidade:** WCAG 2.2 nível AA; botão acessível por teclado e leitor de tela; resultado da leitura e erros anunciados.
- **Compatibilidade:** navegadores atuais no Android, iOS, Windows e macOS, com câmera frontal, traseira ou webcam.
- **Segurança e privacidade:** a imagem da câmera é processada no próprio aparelho, não é enviada a terceiros nem armazenada; só o texto da placa confirmado é usado.
- **Custo:** sem cobrança por leitura.

## 7. Fluxos Principais

### Fluxo 1: Ler placa na entrada
1. Operador abre o registro de entrada e toca no ícone de câmera no campo de placa.
2. Sistema pede permissão de câmera (se necessário) e mostra a imagem com a orientação de enquadramento.
3. Operador aponta a câmera para a placa.
4. Sistema reconhece o texto e o exibe para conferência.
5. Operador confirma (ou corrige).
6. Sistema fecha a câmera e preenche o campo de placa; operador continua o registro normalmente.

### Fluxo 2: Ler placa na busca manual da saída
1. Operador abre a busca manual de saída e toca no ícone de câmera.
2. Segue os passos 2 a 5 do fluxo anterior.
3. Sistema preenche o campo de placa; operador aciona a busca como de costume.

### Fluxo 3: Leitura sem sucesso
1. Operador abre a câmera e aponta para a placa.
2. Sistema não consegue reconhecer dentro do tempo esperado.
3. Sistema avisa e oferece tentar de novo ou fechar e digitar.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Tempo para informar a placa | [A DEFINIR] (digitação manual) | Redução perceptível em relação à digitação |
| Leituras confirmadas sem correção | — | [A DEFINIR] (sugestão: maioria em boa iluminação) |
| Custo por leitura | — | Zero |

> Os valores de baseline e meta ainda não foram medidos; definir após um período de uso.

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| Reconhecimento no aparelho pode errar com pouca luz, reflexo, sujeira ou ângulo | Médio | Sempre mostrar o resultado para conferência e permitir digitar |
| Navegador exige conexão segura e permissão para usar a câmera | Alto | Mensagens claras de erro; digitação continua disponível |
| Aparelhos mais antigos podem ter leitura lenta | Médio | Aviso de tempo esgotado e alternativa manual |
| Placas em formatos diferentes (antiga cinza e Mercosul) | Médio | Aceitar ambos os formatos válidos |

## 10. Referências

- Pedido original: `docs/specs/input.md`
- Imagem de referência do botão de câmera no campo de placa: `docs/specs/Captura de tela 2026-10-20 183136.png`
- Leitura de QR por câmera já existente na saída, como referência de experiência para o operador.
