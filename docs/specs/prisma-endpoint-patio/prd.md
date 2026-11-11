# PRD: Endpoint de alteração do prisma no pátio

Complementa `../campo-prisma/prd.md`: aquela feature criou a edição do prisma no ticket com um contrato **assumido**. Esta confirma o contrato real com o back (origem: `../input.md`).

## Problema
A edição do prisma de um veículo no pátio foi construída sobre uma rota e um corpo supostos. O back definiu o contrato final: o prisma é alterado em `/api/v1/Patio/{idPatio}/prisma` com o corpo `{ "prisma": 0 }`, e "sem prisma" é representado por `0`, não por `null`. Com o contrato suposto, apagar o prisma de um mensalista não funcionaria.

## Objetivo
Alterar ou apagar o prisma de um veículo no pátio funciona com o contrato oficial do back, e os perfis corretos conseguem fazê-lo.

## Usuário-alvo
Administrador, Gerente, Caixa e Manobrista (padrão; a permissão por módulo pode alterar), que operam o pátio.

## Requisitos funcionais
- RF1: Alterar o prisma de um veículo envia o novo número (1 a 999) para `/api/v1/Patio/{idPatio}/prisma`, no corpo `{ "prisma": <número> }`.
- RF2: Apagar o prisma (campo vazio, só permitido a mensalista) envia `{ "prisma": 0 }`.
- RF3: Os perfis Administrador, Gerente, Caixa e Manobrista podem editar o prisma por padrão; quem perder o acesso ao módulo Pátio na permissão por módulo não edita.
- RF4: O comportamento visível não muda: mesmas regras de validação (1 a 999; vazio só para mensalista), mesmas mensagens de erro e confirmação "Prisma atualizado.".
- RF5: Um veículo cujo prisma volta do back como `0` aparece como "sem prisma".

## Fora de escopo
- Mudar a validação do campo ou aceitar `0` como valor digitado pelo operador.
- Alterar a entrada de veículos (o prisma na entrada segue como está).
- Histórico de alterações e unicidade do prisma.

## Critérios de aceite
- [ ] Salvar um prisma (ex.: 45) chama `/Patio/{id}/prisma` com `{ prisma: 45 }`.
- [ ] Apagar o prisma de um mensalista chama a mesma rota com `{ prisma: 0 }`.
- [ ] Os quatro perfis acessam o Pátio e a edição por padrão; sem o módulo, a rota é bloqueada.
- [ ] Prisma `0` vindo do back mostra o ticket sem prisma.
- [ ] Erros (veículo fora do pátio, validação, rede) seguem com a mensagem atual.

## Questões em aberto
- O verbo HTTP não consta no `input.md`; segue `PUT` até confirmação com o back.
