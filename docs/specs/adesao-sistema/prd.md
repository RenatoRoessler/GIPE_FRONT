# PRD: Adesão ao Sistema

## Problema
Novas empresas (estacionamentos, lava-rápidos, etc.) precisam de uma forma de se cadastrar no GIPE e criar seu usuário administrador inicial para começar a usar o sistema. Hoje não existe fluxo de onboarding/adesão.

## Objetivo
Uma empresa consegue se cadastrar no GIPE em um fluxo guiado de 2 etapas: primeiro os dados da empresa, depois a criação do usuário administrador, ficando pronta para logar e operar o sistema.

## Usuário-alvo
Responsável pela empresa (estacionamento, lava-rápido, etc.) que está aderindo ao GIPE pela primeira vez.

## Requisitos funcionais

### Step 1 — Dados da empresa
- RF1: Campo CNPJ.
- RF2: Campo razão social.
- RF3: Campo nome fantasia.
- RF4: Campo endereço.
- RF5: Campo telefone.
- RF6: Campo tipo de empresa, select com as opções: 1 = Estacionamento, 2 = Lava-rápido, 3 = Valet, 4 = Estacionamento + Lava-rápido.
- RF7: Botão "próximo" avança para o step 2, validando os campos obrigatórios do step 1.

### Step 2 — Usuário administrador
- RF8: Campo nome.
- RF9: Campo sobrenome.
- RF10: Campo e-mail.
- RF11: Campo CPF.
- RF12: Campo senha.
- RF13: Campo repetir senha (deve ser igual ao campo senha).
- RF14: Botão "salvar" que finaliza a adesão, criando a empresa e seu usuário administrador (perfil admin).

## Fora de escopo
- Cobrança/plano comercial da adesão.
- Aprovação manual da empresa por um time interno antes da liberação de acesso.
- Confirmação de e-mail do usuário administrador criado.

## Critérios de aceite
- [ ] O fluxo tem exatamente 2 steps: dados da empresa e usuário administrador.
- [ ] Não é possível avançar do step 1 para o step 2 sem preencher os campos obrigatórios.
- [ ] CNPJ e CPF são validados (formato/dígito verificador) antes de avançar/salvar.
- [ ] Senha e repetir senha precisam ser iguais para o botão salvar funcionar.
- [ ] Ao salvar, a empresa é criada e o usuário informado é criado como administrador dessa empresa.
- [ ] Após a adesão concluída, o usuário criado consegue logar normalmente pela tela de login.
- [ ] Telas funcionam de forma responsiva em desktop e mobile.

## Métricas de sucesso
- Taxa de conclusão do fluxo de adesão (quantos iniciam o step 1 e concluem o step 2).
- Tempo médio para concluir a adesão.
