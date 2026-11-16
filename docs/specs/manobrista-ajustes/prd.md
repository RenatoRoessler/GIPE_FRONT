# PRD: Ajustes de agilidade no app do manobrista

> Origem: revisão do app em produção (celular, 15/11/2026), documento "Murel – App do Manobrista: ajustes de agilidade". Os ajustes mantêm o que já funciona bem (ver "Preservar").

## Problema
Na operação de pátio o manobrista registra entradas e saídas de pé, com o celular apontado para o carro, muitas vezes com pressa e fila. A revisão do app encontrou pontos que geram toques extras, espera e erros:

- Placa que já está no pátio mostra aviso, mas o botão principal segue sendo "Registrar entrada", que não serve nesse caso.
- Na saída em dinheiro, o operador precisa digitar o valor recebido mesmo quando o cliente paga exato ou com nota redonda.
- O erro "Placa inválida" aparece em vermelho enquanto a placa ainda está sendo digitada.
- Com a câmera negada, a tela fica parada num aviso até o operador achar o botão "Digitar".
- A câmera leva cerca de 0,7 s para mostrar imagem após tocar em Entrada, com quadro vazio e teclado inútil por baixo.
- Com o teclado aberto, as categorias ficam cortadas e é preciso rolar.
- Itens de menu do turno ficam misturados com configurações; botões sem nome acessível; sem confirmação física de leitura pela câmera.

## Objetivo
Reduzir toques, espera e ruído visual nos fluxos de entrada e saída, de modo que uma saída em dinheiro exato leve 2 toques, a câmera apareça sem quadro vazio e nenhuma tela exija rolagem ou procura de botão no caso comum.

## Usuário-alvo
Manobristas e operadores de caixa usando o app no celular durante o turno; administradores aparecem apenas no ajuste do menu "Mais". Contexto: uso em pé, uma mão, ambiente externo, pressa.

## Requisitos funcionais

### Primeira entrega (prioridade alta)

**Ajuste 1 – Placa já no pátio vira atalho para a saída**
- RF1: Quando a placa digitada ou lida já está no pátio, o botão principal passa a ser "Dar saída · R$ valor" e leva direto à tela "Confirmar saída" do ticket.
- RF2: O aviso mostra valor a cobrar, data/hora de entrada e permanência; modelo, cor e categoria deixam de ser exibidos (não há entrada a registrar).
- RF3: Existe a ação "Corrigir placa", que limpa a placa e devolve o teclado, para leitura errada.
- RF4: Não existe mais o estado com "Registrar entrada" desabilitado para placa já no pátio.

**Ajuste 2 – Atalhos de valor recebido na saída em dinheiro**
- RF5: Com "Dinheiro" selecionado, exibir atalhos "Exato" e as próximas notas redondas acima do valor cobrado (ex.: R$ 220 → Exato, R$ 250, R$ 300), mais "Outro". Nunca mostrar valor menor que o cobrado.
- RF6: Tocar num atalho preenche o valor recebido e mostra o troco em destaque (grande, verde); "Exato" mostra "Sem troco".
- RF7: "Outro" abre o campo "Valor recebido" já focado, com teclado numérico, sem toque extra no campo.
- RF8: Em "Outro", o troco é calculado enquanto digita; valor menor que o cobrado deixa o campo vermelho e mostra quanto falta; tocar em outro atalho troca o valor e fecha o teclado.
- RF9: "Confirmar saída" só é liberado com valor recebido igual ou maior que o cobrado.
- RF10: Pix, crédito e débito continuam sem campo de valor recebido.
- RF11: Entrada e permanência aparecem numa linha só, para a tela caber sem rolar.

**Ajuste 3 – "Placa inválida" só com a placa completa**
- RF12: Durante a digitação, mostrar apenas "Faltam N caracteres", em cinza.
- RF13: O erro vermelho só aparece com 7 caracteres fora do padrão (antigo ABC1234 ou Mercosul ABC1D23) ou ao tocar em "Registrar entrada".

**Ajuste 4 – Câmera negada abre o teclado sozinha**
- RF14: Permissão negada ou erro de câmera na Entrada abre direto o formulário com o teclado da placa, sem toque extra.
- RF15: Uma faixa discreta explica a situação e oferece "Tentar câmera"; as instruções de como religar a permissão ficam atrás dessa ação.

**Ajuste 8 – Câmera instantânea ao tocar em Entrada (somente a opção "b" do PDF)**
- RF16: A imagem da câmera deve aparecer assim que o aparelho a liberar, sem quadro vazio e sem esperar o leitor de placa carregar; "Preparando leitura…" vira aviso pequeno sobre a imagem, e o operador já pode enquadrar a placa enquanto o leitor carrega. A leitura começa quando o leitor termina de carregar.
- Fora desta versão (ficam para depois): manter a câmera ligada entre entradas, pré-carregar tela e leitor, ligar a câmera no início do toque, pedido direto com resolução ideal e `deviceId` salvo, e esconder o teclado durante a leitura pela câmera (antigos RF17–RF20).

**Ajuste 9 – Mais espaço na entrada digitada**
- RF21: Remover o rótulo "Placa"; a caixa da placa sobe para logo abaixo do título.
- RF22: Com o teclado aberto, placa, modelo e as 6 categorias ficam visíveis sem rolar; os botões "Registrar entrada" e "Cancelar" ficam ocultos (cancelar segue possível pelo "‹" do topo).
- RF23: Ao completar 7 caracteres o teclado fecha sozinho e os botões voltam. O mesmo vale para o teclado do celular ao digitar o modelo.
- RF24: Voltar com dados preenchidos continua pedindo confirmação.

### Segunda entrega (prioridade baixa)

**Ajuste 5 – Menu "Mais" (somente o cartão do operador)**
- RF25: Topo do menu mostra quem está logado: nome, perfil e se há caixa aberto.
- RF26: A ordem e o agrupamento dos itens do menu **não mudam** (Quadros de Chaves e Mensalistas continuam em Configurações).
- RF27: A filtragem de itens por perfil não muda.

**Ajuste 6 – Confirmação ao ler pela câmera**
- RF28: Leitura certa (placa e QR da saída): uma vibração, bip curto, borda verde, e segue sozinho ao formulário em ~0,5 s.
- RF29: Leitura de baixa confiança: duas vibrações, sem bip, borda amarela e caractere em dúvida destacado; o operador corrige no teclado.
- RF30: O som pode ser desligado pelas configurações do aparelho.

**Ajuste 7 – Nomes acessíveis**
- RF31: Todos os botões da barra inferior têm nome acessível: "Pátio", "Caixa", "Registrar entrada", "Registrar saída", "Mais".
- RF32: As opções de categoria da entrada são anunciadas pelo nome ("Carro médio"), não pelo código; o código fica só no valor enviado à API.

## Preservar (já funciona bem)
- Entrada abre direto na câmera.
- Teclado da placa alterna sozinho entre letras e números conforme a posição (padrão antigo e Mercosul).
- Placa conhecida vem com modelo, cor e categoria preenchidos.
- Placa que já está no pátio é detectada na hora.
- Saída busca sozinha com 7 caracteres e aceita QR, token ou sequencial.
- Cancelar entrada com dados preenchidos pede confirmação.

## Fora de escopo
- Mudança de layout final além do descrito (as telas da revisão são ilustrativas).
- Entrada de mensalista, saída de veículo com carimbo de convênio e serviços do lava-rápido.
- Alterações de back-end/API (a primeira entrega é só front; o valor "Exato"/troco usa dados já disponíveis na tela).
- Mudança nas regras de permissão por perfil.
- Ajuste 5: reordenar o menu ou mover Quadros de Chaves e Mensalistas para Operação.
- Ajuste 8: itens a, c, d, e, f do PDF (ver RF16).
- Validação em produção de leitura por câmera de placa/QR (câmera bloqueada no navegador da revisão): tratada nos critérios abaixo como a verificar em aparelho real.

## Critérios de aceite
- [x] Digitar ou ler uma placa que está no pátio e tocar no botão principal leva direto a "Confirmar saída"; não existe "Registrar entrada" desabilitado.
- [x] Saída em dinheiro com valor exato conclui com 2 toques ("Exato" e "Confirmar saída").
- [x] Atalhos de dinheiro nunca mostram valor menor que o cobrado; troco aparece sem toque extra (ex.: R$ 230 recebido para R$ 220 → troco R$ 10,00).
- [x] "Outro" abre o teclado numérico sem tocar no campo; valor menor deixa o campo vermelho e mostra "Faltam R$ X"; "Confirmar saída" só libera com recebido ≥ cobrado.
- [x] Pix, crédito e débito não exibem campo de valor recebido.
- [x] Nenhuma mensagem vermelha de placa aparece antes de 7 caracteres; antes disso só "Faltam N caracteres" em cinza.
- [ ] Com a câmera bloqueada, tocar em Entrada mostra o teclado da placa em até 1 s, sem toque extra, com faixa "Tentar câmera". _(Coberto por teste: o leitor fecha, o campo da placa recebe foco e a faixa aparece. Falta medir em aparelho com a câmera bloqueada: "em até 1 s" e o teclado abrindo de fato.)_
- [ ] Ao tocar em Entrada, a imagem da câmera aparece assim que o aparelho a libera, mesmo com o leitor ainda carregando, com "Preparando leitura…" como aviso pequeno sobre a imagem e sem quadro vazio. _(Coberto por teste no hook e no modal. Falta ver em aparelho real, e medir o tempo toque→imagem com `performance.mark`, se desejado.)_
- [ ] Com o teclado aberto, placa, modelo e as 6 categorias aparecem sem rolar; botões "Registrar entrada"/"Cancelar" só aparecem com o teclado fechado; teclado fecha sozinho ao completar 7 caracteres. _(Coberto por teste: rodapé some com o teclado de placa e com o teclado do sistema, e volta ao fechar. Falta conferir em 360×640 se placa, modelo e as 6 categorias cabem sem rolar.)_
- [x] (2ª entrega) Menu "Mais": cartão do usuário no topo (nome, perfil, caixa aberto/fechado); ordem e itens do menu idênticos aos de hoje.
- [ ] (2ª entrega) Leitura aceita vibra uma vez; leitura duvidosa vibra duas vezes com borda amarela e caractere destacado. _(Coberto por teste: 1 vibração e bip na leitura certa, 2 vibrações na duvidosa, mira verde e caractere em destaque. Falta conferir vibração e som em aparelho real; a "dúvida" vem da divergência entre quadros, não da confiança do OCR.)_
- [x] (2ª entrega) Leitor de tela anuncia o nome de cada botão da barra e de cada categoria; testes automáticos localizam os botões pelo nome. _(Já era assim no código; coberto por testes novos. Decidido não renomear a barra para "Registrar entrada/saída".)_

## Métricas de sucesso
- Toques para saída em dinheiro exato: de digitação do valor + confirmação para 2 toques.
- Tempo toque→imagem da câmera: menor que o atual (~0,7 s), conferido em aparelho com `performance.mark`; sem meta numérica fixa nesta versão.
- Redução de erros/retrabalho de placa (placa corrigida após erro de leitura) e de entradas tentadas para placas já no pátio.
- Queda no tempo médio de atendimento por veículo na entrada e na saída, comparado ao período anterior à entrega.

## Ordem de entrega
1. **Primeira entrega (só front):** ajustes 1, 2, 3, 4, 8 e 9.
2. **Segunda entrega:** ajustes 5, 6 e 7.

## Próximo passo
Após aprovação do PRD, seguir para `claude-design` (spec de UI/UX) e `criar-techspec`.
