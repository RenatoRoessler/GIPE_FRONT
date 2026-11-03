# PRD: Teste Grátis na Adesão

## Problema
O site da Murel passou a oferecer um teste grátis de 30 dias, com todas as funcionalidades, sem cartão e sem compromisso. Todas as chamadas do teste levam o visitante à adesão (`/adesao`) com `tipoPlanoAdesao=0` (Trial). Hoje a adesão trata o valor `0` como inválido: abre sem plano, descarta o parâmetro e obriga a escolher um dos quatro planos pagos (Mensal a Anual) antes de concluir. Quem veio pelo teste grátis é tratado como quem vai pagar, vê preços e uma escolha de periodicidade que o site disse que não precisava fazer, e o backend recebe um plano pago em vez de Trial. A promessa do site não se cumpre.

## Objetivo
Quem chega à adesão pelo teste grátis conclui o cadastro sem escolher plano nem ver cobrança, e a empresa é criada como Trial. Quem chega por plano pago ou sem parâmetro continua com o fluxo atual.

## Usuário-alvo
- Dono de pátio (estacionamento, valet, lava-rápido) que quer ver o sistema no próprio pátio antes de pagar. Preenche o cadastro em geral no celular, entre tarefas.
- Gerente/administrador que faz o cadastro de teste em nome do dono, em geral no computador.

## Requisitos funcionais
- RF1: Quando a adesão é aberta com `tipoPlanoAdesao=0` na URL, o fluxo entra em modo teste grátis. Esse modo fica definido na abertura e não muda se o usuário navegar entre etapas.
- RF2: No modo teste, a etapa de escolha de plano não aparece. O fluxo fica Empresa, Horários, Titular e Conferir, e o indicador de etapas reflete essas quatro.
- RF3: No modo teste, o cadastro é enviado ao backend com `tipoPlanoAdesao` igual a `0`. Nenhum plano pago é enviado.
- RF4: No modo teste, a conferência mostra no lugar do plano um resumo do teste: "Teste grátis por 30 dias", com as garantias do site (todas as funcionalidades, sem cartão de crédito, sem compromisso) e o aviso de que o plano é escolhido no fim do teste. Não mostra valor mensal nem total. Não há "Editar" para essa linha.
- RF5: No modo teste, nenhuma tela do fluxo pede cartão ou dado de pagamento de assinatura, nem mostra preço de plano.
- RF6: O fluxo de plano pago não muda: `tipoPlanoAdesao` 1 a 4 pré-seleciona o plano; ausente ou inválido (`9`, `abc`, vazio) abre sem plano e exige escolha na etapa, sem mensagem de erro. O valor `0` deixa de ser tratado como inválido.
- RF7: Quem está no modo teste não consegue enviar um plano pago por engano, e quem está no fluxo pago não consegue enviar `0`. A etapa de plano (fluxo pago) oferece o teste grátis como primeira opção, sem preço; quem o escolhe ali envia `0`, mantém as cinco etapas e pode voltar para trocar de plano pelo "Editar" da conferência.
- RF8: Os textos do teste seguem o tom de voz da marca (direto, próximo, sem jargão, sem exageros, sem emojis) e repetem apenas as condições que o site já promete.
- RF9: A conclusão do cadastro leva ao login, como hoje (`/login?cadastro=sucesso`). A mensagem de sucesso do login, no modo teste, informa que o teste de 30 dias começou. [A CONFIRMAR: se a mensagem muda ou se mantém a atual.]

## Fora de escopo
- Mudanças no site (`murel-site`); o envio de `tipoPlanoAdesao=0` já é responsabilidade dele.
- Cobrança, cartão e contratação dentro da adesão.
- Regras do backend para o fim do teste: pausa do acesso, retenção dos dados por 30 dias, conversão em plano pago e lembretes por e-mail.
- Tela ou fluxo, depois do cadastro, para o cliente em teste escolher um plano e assinar.
- Mostrar o tempo restante do teste em outras telas do sistema.
- Prorrogação do teste, prazo diferente de 30 dias ou teste por tipo de operação.
- Permitir trocar o modo (de teste para plano pago, ou o inverso) dentro do fluxo.

## Critérios de aceite
- [ ] Abrir `/adesao?tipoPlanoAdesao=0` mostra o fluxo de quatro etapas (Empresa, Horários, Titular, Conferir), sem etapa de plano.
- [ ] Nesse fluxo não aparece preço, periodicidade nem pedido de cartão em nenhuma etapa.
- [ ] A conferência no modo teste mostra "Teste grátis por 30 dias" e as garantias, sem valores de plano.
- [ ] O cadastro enviado ao backend no modo teste leva `tipoPlanoAdesao: 0` (verificado no payload).
- [ ] Voltar e avançar entre as etapas mantém os dados preenchidos e o modo teste.
- [ ] Abrir `/adesao?tipoPlanoAdesao=1`, `2`, `3` e `4` continua selecionando Mensal, Trimestral, Semestral e Anual, com cinco etapas e o plano enviado correto.
- [ ] Abrir `/adesao` sem parâmetro, ou com `9` ou `abc`, continua abrindo sem plano e sem mensagem de erro, com a etapa de plano obrigatória.
- [ ] Concluir o cadastro no modo teste cria a empresa e o administrador, e esse usuário consegue entrar pela tela de login.
- [ ] O foco vai para o título da etapa ao trocar de etapa, também no modo teste.
- [ ] Legível a partir de 360 px, sem rolagem horizontal, usável só com teclado, com foco visível e contraste WCAG 2.2 AA.
- [ ] Nenhum texto promete algo que o sistema não faz (ver pontos a confirmar).

## Métricas de sucesso
- Adesões concluídas por tipo de plano, com Trial separado dos pagos: [A DEFINIR meta; baseline zero, o Trial não é enviado hoje].
- Taxa de conclusão da adesão no modo teste em relação ao fluxo pago: [A DEFINIR; baseline não medido].
- Conversão de teste para plano pago: [A DEFINIR; depende de regras do backend e do fluxo de assinatura].

## Riscos e observações
- **O backend aceita `tipoPlanoAdesao=0`**, segundo o PRD `planos-adesao`, mas isso não foi confirmado para este fluxo. Confirmar que o cadastro com Trial funciona sem nenhum dado de cobrança e que a empresa criada recebe o período de teste de 30 dias.
- **Regras do teste sem fonte no sistema** (herdadas do site): não pede cartão; nada é cobrado automaticamente; sem escolher plano o acesso é pausado e os dados ficam 30 dias; o que foi cadastrado continua valendo ao assinar; cancelamento a qualquer momento. A adesão só deve afirmar o que o backend cumpre. Por isso o resumo do teste na conferência (RF4) usa só as três garantias e o aviso de escolha do plano ao fim, sem prometer retenção de dados.
- **Sem caminho de assinatura depois do teste:** esta versão só abre o acesso de teste. Quem precisar assinar ao fim dos 30 dias depende de um fluxo que ainda não existe no sistema (fora de escopo). Vale especificar em PRD próprio antes de o primeiro teste expirar.
- **Decisão assumida:** no modo teste o plano não é pedido na adesão, porque o site promete "escolha do plano no fim do teste" e "sem compromisso". Se o negócio preferir coletar a intenção de plano já na adesão, o requisito RF2 e RF3 mudam.
- **Valor ausente ou inválido** continua sendo tratado como "sem parâmetro" (fluxo pago com escolha obrigatória), como decidido em `planos-adesao`. Quem digitar `tipoPlanoAdesao=0` à mão também entra no modo teste; não há como distinguir dos cliques do site.
- **Preço público duplicado** não muda: os valores dos planos pagos continuam nos dois lugares.
- Referências: `docs/specs/input.md`, `docs/specs/planos-adesao/prd.md`, e no site `C:\murel\murel-site\docs\specs\teste-gratis\prd.md` e `techspec.md`.
