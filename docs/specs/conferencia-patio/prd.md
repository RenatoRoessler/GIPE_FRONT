# PRD: Conferência de pátio

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-11-04
**Versão:** 1.0

---

## 1. Objetivo

Permitir que o operador confira, placa a placa, se os veículos que o sistema diz estar no pátio estão mesmo lá, resolva as diferenças encontradas na hora e deixe o resultado registrado.

O valor é trocar a conferência feita de cabeça ou no papel por um processo guiado, salvo a cada placa lida, que pode ser retomado de onde parou e que termina com um resumo do que foi ajustado.

## 2. Contexto e Motivação

O sistema registra entradas e saídas, mas nada garante que o pátio físico e o pátio do sistema batem. Carros saem sem baixa, tickets são duplicados, entradas são registradas por engano e carros chegam sem ticket. Hoje essas diferenças só aparecem por acaso, e o gerente não tem como saber quem conferiu o quê.

O modelo de referência é o protótipo `docs/murel-conferencia-patio.html`, que define o fluxo e o visual. A API (`ConferenciaPatio`, swagger local) já está implementada e cobre:

- o resumo do pátio agora (total e divisão em avulsos, mensais e conveniados), a conferência em andamento e a última conferência encerrada;
- iniciar a conferência (por câmera ou por lista), que tira uma "foto" dos veículos no pátio;
- registrar a leitura de uma placa (câmera ou digitada), com resultado conferido, já conferido ou sem entrada;
- marcar um veículo manualmente ("Está no pátio", "Não achei", "Desfazer", "Procurar de novo");
- dar saída num veículo que está no sistema mas não no pátio, com motivo;
- registrar a entrada de uma placa lida sem ticket, ou descartar a leitura errada;
- finalizar a conferência com observação opcional.

A conferência pertence ao caixa aberto: sem caixa aberto não é possível iniciar, e fechar o caixa encerra a conferência como incompleta. Existe uma só conferência aberta por empresa, a mesma para todos os operadores.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Operador / manobrista / caixa | Conferir o pátio andando entre os carros, marcar cada um e resolver as diferenças | No celular, em pé no pátio, às vezes com sol forte e uma mão ocupada |
| Gerente / administrador | Iniciar ou acompanhar a conferência e ver se o pátio bate com o sistema | No celular ou no computador, de vez em quando |

A regra de acesso é a da permissão por módulo; por padrão valem Administrador, Gerente, Caixa e Manobrista. Quem não tem permissão não vê a página.

## 4. Escopo

### Dentro do Escopo
- Entrada "Conferência de pátio" no menu "Mais".
- Tela inicial com o pátio agora (total, avulsos, mensais, conveniados), a última conferência e a escolha do método (câmera ou lista).
- Iniciar uma conferência e continuar a que estiver em andamento.
- Tela de conferência com progresso, lista de veículos, filtros (faltam, conferidos, divergências) e registro por leitura de placa ou placa digitada.
- Marcação manual de cada veículo: está no pátio, não achei, desfazer.
- Tela de divergências: não encontrados (procurar de novo ou dar saída com motivo) e placas sem entrada (registrar entrada ou descartar a leitura).
- Resumo com o que foi conferido, as divergências, os ajustes feitos e observação opcional, e a finalização.
- Tratamento de carregamento, erro, ausência de caixa aberto e conferência já aberta.
- Layout pensado primeiro para o celular.

### Fora do Escopo
- Relatórios de conferências (indicadores, lista por período, detalhe, exportação em CSV e PDF) que aparecem no protótipo: a API ainda não expõe esses dados [A CONFIRMAR se entram em uma versão seguinte].
- Divergência de chave fora do lugar e atualização da posição da chave: o protótipo mostra, mas não há operação na API para isso [A CONFIRMAR].
- Edição de uma conferência já finalizada.
- Conferência de mais de uma empresa ao mesmo tempo.
- Alertas ou notificações sobre conferências pendentes.

## 5. Requisitos Funcionais

### RF-01: Acessar a conferência
**Critério de aceite:**
- Dado um operador com permissão, quando abre o menu "Mais", então vê a opção "Conferência de pátio".
- Dado um operador sem permissão, então a opção não aparece e o acesso direto é bloqueado.

### RF-02: Ver o pátio agora e a última conferência
**Critério de aceite:**
- Dado a tela inicial, então mostra o total de veículos no pátio e a divisão em avulsos, mensais e conveniados.
- Dado que já houve uma conferência encerrada, então mostra quando terminou, quem a encerrou e quantos veículos foram conferidos do total; se encerrou incompleta, o texto diz isso.
- Dado que nunca houve conferência, então a tela diz isso, sem erro.

### RF-03: Iniciar a conferência
**Critério de aceite:**
- Dado que não há conferência aberta e há caixa aberto, quando o operador escolhe o método (câmera ou lista) e inicia, então a conferência começa com todos os veículos do pátio como pendentes.
- Dado que não há caixa aberto, então a tela explica que é preciso abrir o caixa e não oferece iniciar.
- Dado que já existe conferência aberta (mesmo iniciada por outro operador), então a tela oferece "Continuar conferência" em vez de iniciar outra.
- Dado que a conferência começou, então entradas e saídas continuam funcionando normalmente.

### RF-04: Continuar de onde parou
**Critério de aceite:**
- Dado uma conferência em andamento, quando o operador reabre o app ou a tela, então ela é retomada com o progresso salvo, sem botão de pausar.
- Dado que outro operador conferiu placas, então o progresso mostrado inclui as placas dele.
- Dado que o caixa foi fechado com a conferência aberta, então ela deixa de estar em andamento e a tela inicial indica que foi encerrada como incompleta.

### RF-05: Acompanhar o progresso
**Critério de aceite:**
- Dado a conferência aberta, então mostra quantos veículos foram conferidos do total, em número e em barra de progresso.
- Dado a lista, então o operador filtra por "Faltam" e "Conferidos", e vê o filtro "Divergências" quando houver alguma.
- Dado um veículo da lista, então mostra placa, modelo, cor, categoria, o tipo de cliente (avulso, mensal ou conveniado) em texto, e a posição da chave quando existir.
- Dado um veículo que saiu pela saída normal durante a conferência, então ele não conta nos totais.

### RF-06: Registrar uma placa lida
**Critério de aceite:**
- Dado o método câmera, quando o leitor reconhece uma placa, então ela é registrada na hora e a tela mostra o resultado: conferido, já conferido ou sem entrada.
- Dado qualquer método, quando o operador digita uma placa (com ou sem hífen, maiúscula ou minúscula), então ela é registrada do mesmo jeito.
- Dado uma placa em formato inválido, então a tela avisa antes de enviar e nada é registrado.
- Dado um veículo que entrou depois do início da conferência, quando a placa dele é lida, então ele entra na conferência já conferido.
- Dado uma placa que estava como não encontrada, quando é lida depois, então passa a conferida.

### RF-07: Marcar um veículo manualmente
**Critério de aceite:**
- Dado um veículo pendente, quando o operador escolhe "Está no pátio", então ele vira conferido; quando escolhe "Não achei", vira não encontrado.
- Dado um veículo conferido ou não encontrado, quando o operador escolhe "Desfazer" ou "Procurar de novo", então ele volta a pendente.
- Dado que o veículo já foi conferido por alguém, quando é conferido de novo, então continua constando quem conferiu primeiro.

### RF-08: Resolver os não encontrados
**Critério de aceite:**
- Dado um veículo não encontrado, então a tela de divergências oferece "Procurar de novo" e "Dar saída".
- Dado "Dar saída", então o operador informa o motivo (saiu sem baixa, ticket duplicado, entrada registrada por engano ou outro); no motivo "outro" a descrição é obrigatória, com até 300 caracteres.
- Dado que o valor a cobrar é maior que zero, então o operador informa a forma de pagamento; boleto e transferência não são oferecidos.
- Dado que a saída foi concluída, então o veículo deixa de ser divergência e o ajuste fica registrado com o motivo.
- Dado que o cálculo da saída falha ou não há caixa aberto, então a tela explica e o veículo continua como não encontrado.

### RF-09: Resolver placas sem entrada
**Critério de aceite:**
- Dado uma placa lida sem ticket aberto, então ela aparece como divergência "No pátio, sem entrada" e a leitura mostra a opção de registrar a entrada na hora.
- Dado "Registrar entrada", então o operador informa categoria, modelo (até 80 caracteres) e cor (até 50), obrigatórios, e opcionalmente o código do ticket e se é mensalista.
- Dado que a placa não pode entrar como mensalista, então a tela mostra o motivo recebido e permite registrar como avulso.
- Dado a entrada registrada, então a placa sai das divergências, entra na conferência já conferida e o ajuste fica registrado.
- Dado "Leitura errada", então a placa deixa de ser divergência; se for lida de novo, volta a aparecer.

### RF-10: Ver o resumo e finalizar
**Critério de aceite:**
- Dado a conferência aberta, então o resumo mostra conferidos, faltam, não encontrados, sem entrada e a lista de ajustes feitos (saídas e entradas, com a descrição pronta).
- Dado que há divergências ou pendentes, então o resumo avisa e leva às divergências, mas permite finalizar mesmo assim.
- Dado o campo de observação, então aceita até 500 caracteres e é opcional.
- Dado "Finalizar conferência", então os pendentes viram não encontrados, o operador volta ao menu "Mais" e vê a confirmação com quantos veículos foram conferidos do total.

### RF-11: Tratar carregamento, erro e conflitos
**Critério de aceite:**
- Dado o carregamento, então a tela mostra esqueletos no formato do conteúdo, sem saltos de layout.
- Dado um erro da API, então mostra a mensagem em português e permite tentar de novo; erro de permissão não oferece tentar de novo.
- Dado que outra conferência foi aberta ou encerrada por outro operador enquanto esta tela estava aberta, então a tela se atualiza ou avisa, sem perder o que já foi registrado.
- Dado uma leitura que falhou por falta de conexão, então o operador é avisado de que a placa não foi gravada e pode tentar de novo.

### RF-12: Usar no celular
**Critério de aceite:**
- Dado um celular, então não há rolagem horizontal a partir de 320px e as ações principais ficam ao alcance do polegar.
- Dado qualquer botão ou área de toque, então tem pelo menos 44px de altura.
- Dado a câmera sem permissão ou indisponível, então a tela explica e oferece digitar a placa ou usar a lista.

## 6. Requisitos Não-Funcionais

- **Desempenho:** cada leitura é gravada e confirmada em tempo que permita conferir os carros em sequência, sem o operador esperar a tela. A lista continua fluida com o volume de veículos do pátio [A CONFIRMAR o volume máximo].
- **Acessibilidade:** WCAG 2.2 nível AA; resultado da leitura, tipo de cliente e situação sempre em texto, não só cor; mensagens de resultado anunciadas a leitores de tela; foco visível e navegação por teclado.
- **Compatibilidade:** navegadores atuais de celular e computador, nos temas claro e escuro.
- **Consistência:** reutiliza os fluxos e componentes já existentes de saída, entrada, placa e pagamento, sem criar segundos fluxos.
- **Segurança e privacidade:** só aparecem os dados da empresa do operador; o token do comprovante não é exibido como texto.
- **Integridade:** nenhuma leitura ou marcação é perdida ao sair da tela; tudo o que o operador vê como feito já foi gravado.

## 7. Fluxos Principais

### Fluxo 1: Conferir o pátio pela câmera
1. O operador abre Mais → Conferência de pátio e vê o pátio agora e a última conferência.
2. Escolhe "Câmera" e inicia.
3. Aponta a câmera para cada placa; a tela mostra o resultado e o progresso avança.
4. Os que sobram são marcados "Está no pátio" ou "Não achei" na lista.
5. Resolve as divergências e finaliza pelo resumo.

### Fluxo 2: Dar saída em carro que já foi embora
1. Na conferência, um carro fica como "Não achei".
2. Em Divergências, o operador escolhe "Dar saída" e informa o motivo.
3. A saída é registrada e o ajuste aparece no resumo.

### Fluxo 3: Carro no pátio sem ticket
1. O operador lê uma placa que o sistema não conhece no pátio.
2. A leitura mostra "Sem entrada · Registrar agora".
3. Ele informa modelo, cor e categoria e registra a entrada; o carro entra já conferido.

### Fluxo 4: Retomar depois de uma interrupção
1. O operador sai da tela ou fecha o app no meio da conferência.
2. Ao voltar, vê "Continuar conferência" com o progresso salvo.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Conferir o pátio de ponta a ponta sem papel | Não é possível hoje | O operador inicia, confere, resolve divergências e finaliza só pelo app |
| Perda de progresso ao fechar o app | — | Zero: a conferência é retomada do ponto em que parou |
| Divergências resolvidas na própria conferência | Descobertas por acaso | Todas aparecem em uma tela e podem ser resolvidas ali |
| Uso no celular sem rolagem horizontal e com alvos de 44px | Não existe | Atende em 320px |
| Conferências finalizadas por semana | — | [A DEFINIR] |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| O protótipo mostra relatórios e divergência de chave que a API não expõe | Médio | Deixar fora desta versão e combinar com o back quando serão entregues |
| A leitura automática da câmera depende de um leitor de placas no app | Alto | [A CONFIRMAR] se o leitor existente (`leitor-placa`) atende; sem ele, entregar a lista e a placa digitada primeiro |
| Conferência exige caixa aberto e é encerrada no fechamento do caixa | Médio | Avisar na tela inicial e na tela de conferência quando não houver caixa aberto |
| Uma conferência por empresa, compartilhada entre operadores | Médio | Mostrar quem iniciou e continuar a existente em vez de abrir outra |
| Dar saída exige o cálculo e o pagamento da saída normal | Médio | Reaproveitar o cálculo e o pagamento já existentes |
| Categoria, situação e motivos chegam como números | Baixo | Traduzir para texto na tela com as tabelas já usadas em entrada e saída |
| `docs/specs/input.md` contém um JWT real | Alto | Remover ou invalidar o token antes de qualquer commit; nunca copiá-lo para código, testes ou documentos |

## 10. Referências

- Pedido original: `docs/specs/input.md`
- Protótipo: `docs/murel-conferencia-patio.html`
- API: swagger local, grupo `ConferenciaPatio` (`/api/v1/conferencia-patio`)
- Pátio: `docs/specs/patio/prd.md`; saída: `docs/specs/saida-veiculos/prd.md`; entrada: `docs/specs/entrada-veiculos/prd.md`
- Leitor de placa: `docs/specs/leitor-placa/prd.md`; quadro de chaves: `docs/specs/quadro-chaves/prd.md`
