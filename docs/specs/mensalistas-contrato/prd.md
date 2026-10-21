# PRD: Finalização do fluxo de mensalista (veículos, contrato e aceite)

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-10-20
**Versão:** 1.0

---

## 1. Objetivo

Completar o ciclo do mensalista, do cadastro até a liberação para o primeiro pagamento. O operador cadastra o mensalista com seus veículos (e, para empresas, quem está autorizado a dirigir cada um). O mensalista recebe o contrato por e-mail, lê e aceita pela internet, sem ir ao balcão. O operador acompanha quem já aceitou e reenvia o link quando necessário.

O valor é tirar do papel o contrato do mensalista, com registro de aceite confiável, e deixar o cadastro completo o bastante para o mensalista ser reconhecido pelas placas.

## 2. Contexto e Motivação

A gestão de mensalistas (lista, cadastro e edição de mensalistas e de tipos de mensalidade) já existe no sistema, conforme `docs/specs/mensalistas/prd.md`. Naquela entrega ficaram de fora os veículos do mensalista, e o contrato ainda não existia.

O back-end evoluiu:
- O cadastro passou a aceitar a lista de veículos e, para pessoa jurídica, os condutores autorizados de cada veículo.
- Ao cadastrar, o sistema gera o contrato a partir de um modelo padrão e envia ao mensalista um e-mail com link para o aceite eletrônico, válido por 7 dias.
- O aceite registra evidências (data e hora, IP, navegador, documento informado e uma identificação do texto aceito), envia a confirmação por e-mail e libera o primeiro pagamento.

Falta a tela onde o mensalista aceita o contrato (hoje o link do e-mail aponta para uma página de teste fora do GIPE) e falta o operador conseguir informar veículos e acompanhar o contrato.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Administrador / operador com permissão administrativa | Cadastrar o mensalista com veículos e condutores; saber se o contrato foi aceito; reenviar o link | No balcão ou na configuração do negócio, no computador ou no celular |
| Mensalista (pessoa física ou representante da empresa) | Ler o contrato e aceitá-lo de forma simples e segura, sem login | Pelo celular, ao abrir o link recebido por e-mail |

A regra de acesso das telas internas segue a da gestão de mensalistas existente. A página de aceite é pública: não exige login.

## 4. Escopo

### Dentro do Escopo
- Veículos no cadastro e na edição do mensalista: placa, modelo, cor e categoria de cada veículo, podendo não haver nenhum.
- Condutores por veículo para pessoa jurídica: nome e CPF de cada pessoa autorizada, ao menos um por veículo.
- Veículos e condutores visíveis na lista ou no detalhe do mensalista.
- Situação do contrato de cada mensalista (pendente, aceito, link vencido) visível ao operador.
- Reenvio do e-mail do contrato com um novo link, pelo operador.
- Página pública de aceite no próprio GIPE, aberta pelo link do e-mail: mostra o contrato, pede o documento do mensalista e registra o aceite.
- Mensagens claras para os erros previstos (dados inválidos, placa de outro mensalista, categoria diferente da do tipo, link vencido ou inválido, documento que não confere, muitas tentativas).
- Validação do fluxo contra a API real: cadastro, listagem, edição, consulta e aceite do contrato.

### Fora do Escopo
- Registrar pagamento, ativar ou reativar o mensalista. Após o aceite, o mensalista continua inativo até o primeiro pagamento (fluxo de pagamento em entrega separada).
- Editar o texto ou o modelo do contrato.
- Assinatura digital com certificado (ICP-Brasil). O aceite é eletrônico simples, com evidências.
- Usar veículos e condutores na entrada e saída de veículos (reconhecer mensalista pela placa).
- Cobranças, boletos e inadimplência.
- Exclusão definitiva de mensalista.

## 5. Requisitos Funcionais

### RF-01: Cadastrar veículos do mensalista
**Critério de aceite:**
- Dado o cadastro ou a edição de um mensalista, quando o operador adiciona um veículo, então informa placa, modelo, cor e categoria.
- Dado um tipo de mensalidade com categoria específica, quando o operador escolhe a categoria do veículo, então só a categoria do tipo é aceita; dado um tipo "todas as categorias", então qualquer categoria é aceita, exceto "todas".
- Dado que o operador informou a mesma placa duas vezes no mesmo mensalista, quando tenta salvar, então vê um aviso e o cadastro não é salvo.
- Dado que a placa já pertence a outro mensalista da empresa, quando tenta salvar, então vê uma mensagem dizendo isso.
- Dado um mensalista sem veículos, quando salva, então o cadastro é aceito.
- Dado a edição de um mensalista, quando o operador remove um veículo e salva, então o veículo deixa de constar no cadastro dele.

### RF-02: Cadastrar condutores para pessoa jurídica
**Critério de aceite:**
- Dado um mensalista pessoa jurídica, quando o operador adiciona um veículo, então precisa informar ao menos um condutor com nome e CPF válido.
- Dado um veículo de pessoa jurídica, quando o operador repete o mesmo CPF no mesmo veículo, então vê um aviso e não consegue salvar.
- Dado uma pessoa autorizada em mais de um veículo, quando o operador a informa em cada um, então o cadastro é aceito.
- Dado um mensalista pessoa física, então o campo de condutores não aparece.

### RF-03: Ver veículos e condutores do mensalista
**Critério de aceite:**
- Dado um mensalista com veículos, quando o operador consulta a lista, então vê as placas do mensalista e consegue ver modelo, cor, categoria e, para pessoa jurídica, os condutores.

### RF-04: Acompanhar a situação do contrato
**Critério de aceite:**
- Dado um mensalista cadastrado, quando o operador consulta a lista, então vê se o contrato está pendente, aceito (com data do aceite) ou com o link vencido.
- Dado um contrato aceito, então o operador entende que o mensalista ainda depende do primeiro pagamento para ficar ativo.

### RF-05: Reenviar o contrato
**Critério de aceite:**
- Dado um contrato pendente ou com link vencido, quando o operador pede o reenvio, então o mensalista recebe um novo e-mail com link válido por 7 dias e o operador vê a confirmação.
- Dado um contrato já aceito, então a opção de reenvio não é oferecida.

### RF-06: Abrir o contrato pelo link do e-mail
**Critério de aceite:**
- Dado um link válido, quando o mensalista o abre, então vê o nome da empresa, o próprio nome, o título, a versão e o texto do contrato com as quebras de linha preservadas, sem precisar de login.
- Dado um link vencido de contrato pendente, quando o mensalista o abre, então vê uma mensagem explicando que o link venceu e que deve pedir um novo ao estacionamento.
- Dado um link inválido ou incompleto, quando o mensalista o abre, então vê uma mensagem clara, sem detalhes técnicos.
- Dado um contrato já aceito, quando o mensalista abre o link, então vê o contrato e a informação de que já foi aceito, com a data, sem opção de aceitar de novo.

### RF-07: Aceitar o contrato
**Critério de aceite:**
- Dado um contrato pendente aberto pelo link, quando o mensalista marca que leu e concorda e informa o próprio CPF (ou CNPJ, para empresa), então o aceite é registrado e ele vê a confirmação com a data do aceite.
- Dado que o documento informado não confere com o do cadastro, quando tenta aceitar, então vê uma mensagem dizendo que o documento não confere e pode corrigir.
- Dado muitas tentativas seguidas, quando o limite é atingido, então vê uma mensagem pedindo para aguardar um pouco antes de tentar de novo.
- Dado que o aceite foi registrado, então a confirmação informa que uma cópia foi enviada por e-mail e que o cadastro será ativado após o primeiro pagamento.

## 6. Requisitos Não-Funcionais

- **Performance:** a página de aceite abre rapidamente em conexão móvel comum.
- **Acessibilidade:** WCAG 2.2 nível AA, inclusive na página pública; o texto do contrato é legível no celular, sem zoom.
- **Compatibilidade:** navegadores atuais de celular e computador; a página de aceite é pensada primeiro para o celular.
- **Segurança e privacidade:** a página pública mostra só os dados do contrato daquele link; não expõe outros dados do mensalista nem da empresa; o documento digitado no aceite não é exibido depois; a página não deve ser indexada por buscadores.
- **Confiabilidade jurídica:** o mensalista vê exatamente o texto que está aceitando antes de confirmar.

## 7. Fluxos Principais

### Fluxo 1: Cadastrar mensalista com veículos
1. Operador abre o cadastro de mensalista e preenche os dados e o tipo de mensalidade.
2. Operador adiciona os veículos e, se for pessoa jurídica, os condutores de cada um.
3. Sistema valida e salva; o mensalista aparece na lista como inativo, com contrato pendente.
4. Mensalista recebe o e-mail com o link do contrato.

### Fluxo 2: Aceitar o contrato
1. Mensalista abre o link do e-mail no celular.
2. Sistema mostra o contrato.
3. Mensalista lê, marca que concorda e informa o próprio documento.
4. Sistema registra o aceite e mostra a confirmação.
5. Mensalista recebe a cópia por e-mail; o operador passa a ver o contrato como aceito.

### Fluxo 3: Link vencido
1. Mensalista abre um link com mais de 7 dias.
2. Sistema informa que o link venceu e orienta a pedir um novo ao estacionamento.
3. Operador pede o reenvio na lista de mensalistas.
4. Mensalista recebe um novo e-mail e segue o Fluxo 2.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Fluxo completo (cadastro com veículos e aceite pelo e-mail) feito sem ajuda do suporte | Não existe hoje | Operador e mensalista concluem sozinhos |
| Contratos aceitos antes de o link vencer | — | [A DEFINIR] |
| Pedidos de reenvio por contrato | — | [A DEFINIR] |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| O link do e-mail hoje aponta para uma página de teste fora do GIPE; o back precisa apontar a configuração do link de aceite para a nova página do GIPE (`/contrato?t=<token>`) em cada ambiente | Alto | Combinar com o back antes de liberar; validar o link recebido em um cadastro de teste |
| Não está documentado se a listagem de mensalistas traz a situação do contrato (pendente, aceito, vencido) | Alto para RF-04 | [A CONFIRMAR] com o back; se não trouxer, a API precisa expor essa informação |
| Validar o fluxo contra a API real cria registros e envia e-mails de verdade | Médio | Usar dados e e-mail de teste combinados, preferencialmente em ambiente de homologação |
| O mensalista pode estranhar continuar inativo após o aceite | Médio | Explicar na confirmação e na lista que a ativação acontece no primeiro pagamento |
| Regras de veículo (categoria do tipo, placa de outro mensalista, condutores para PJ) são numerosas e podem gerar erros no salvar | Médio | Validar na tela o que for possível antes de enviar e traduzir as mensagens do back |

## 10. Referências

- Pedido original: `docs/specs/input.md`
- Gestão de mensalistas existente: `docs/specs/mensalistas/prd.md`
- Página pública de comprovante (referência de página sem login): `docs/specs/qrcode-entrada/prd.md`
- Endpoints do back descritos em `docs/specs/input.md`: listagem, cadastro e edição de mensalista; consulta e aceite do contrato pelo cliente; reenvio do contrato; tipos de mensalidade.
