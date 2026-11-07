# PRD: Planos vindos do Back-end na Adesão

## Problema
A etapa de plano da adesão usa uma tabela escrita à mão no sistema: o plano Mensal a R$ 99,90 com preço de lançamento de R$ 69,90 "nos primeiros 12 meses", o prazo "assine até 30/06/2027" e o texto do teste grátis ("30 dias"). Toda mudança de preço, de promoção ou de nome de plano exige alterar o código e publicar de novo, e há risco de o sistema cobrar um valor diferente do que o site mostra. O back-end já expõe os planos (`GET /api/v1/Plano`), com valor de tabela, valor promocional, período da promoção, duração e ordem de exibição. O site (`murel-site`) já passou a consumir esse endpoint; a adesão ainda não.

## Objetivo
Os planos exibidos na etapa de plano da adesão (nome, preço de tabela, preço promocional, validade da promoção, duração e ordem) refletem o que o back-end informa, sem alteração de código para mudar preço ou promoção. O valor mostrado na adesão é o mesmo mostrado no site. Se o back-end estiver indisponível, o usuário é avisado com clareza e consegue tentar de novo, sem seguir com um valor que o sistema não confirmou.

## Usuário-alvo
- Dono de pátio (estacionamento, valet, lava-rápido) que decidiu aderir e preenche o cadastro, em geral no celular.
- Gerente/administrador que faz o cadastro em nome do dono, em geral no computador.
- Time do negócio, que passa a ajustar preço e promoção no back-end e espera ver o resultado na adesão.

## Requisitos funcionais
- RF1: A etapa de plano lista os planos devolvidos pelo back-end, na ordem de exibição que ele informa (`ordemExibicao`). Hoje isso resulta em dois itens: Teste gratuito (Trial) e Mensal.
- RF2: O plano de teste gratuito (tipo `0`, Trial) devolvido pelo back-end continua sendo a opção de teste grátis da adesão. Nome, duração (`validadeDuracaoMeses`) e valor vêm da resposta, não de texto fixo; a redação segue a marca e muda sozinha se o número mudar.
- RF3: Quando o plano está em promoção (`emPromocao`), a opção mostra o preço de tabela (`valor`) riscado e o preço atual (`valorAtual`) em destaque, mais um selo com a data final da promoção (`promocaoFim`). O preço riscado é identificável por leitores de tela (ex.: "de R$ 99,90 por R$ 69,90").
- RF4: Quando o plano não está em promoção, a opção mostra só o preço atual, sem riscado e sem selo. A virada acontece pelo dado do back-end, sem depender de nova publicação.
- RF5: A regra do preço de lançamento deixa de ser "nos primeiros 12 meses" e passa a ser derivada de `promocaoFim`: o preço promocional vale até essa data (ex.: "R$ 69,90/mês até 30/06/2027; depois, R$ 99,90/mês"). A data do selo e a do texto são a mesma, vinda do back-end. Se `promocaoFim` for nulo, nenhuma data é exibida.
- RF6: Os valores são exibidos em reais, no formato brasileiro (R$ 69,90), a partir do número recebido, sem arredondamento que altere o centavo.
- RF7: O plano escolhido é enviado no cadastro no campo `tipoPlanoAdesao`, com o valor de `tipoPeriodoPlano` do plano escolhido (hoje `0` = Trial e `1` = Mensal).
- RF8: Quando a adesão é aberta com `tipoPlanoAdesao` na URL, o plano correspondente já vem selecionado se existir na lista devolvida pelo back-end (`0` abre o fluxo de teste grátis, como hoje). Parâmetro ausente, inválido ou de plano que não existe na lista abre a adesão normalmente, sem plano pré-selecionado e sem mensagem de erro.
- RF9: A conferência final mostra o plano escolhido com o valor atual e, se em promoção, a condição da promoção, com os dados vindos do back-end, e mantém o "Editar" que volta à etapa de plano.
- RF10: Enquanto os planos carregam, a etapa mostra um estado de carregamento que reserva o espaço das opções, sem deslocar o layout quando os dados chegam.
- RF11: Se a consulta falhar, demorar demais ou devolver uma lista sem plano utilizável, a etapa mostra uma mensagem clara, sem jargão técnico, com a ação de tentar de novo. Enquanto não houver planos carregados, não é possível avançar da etapa de plano e nenhum valor é exibido ou enviado a partir de cópia local.
- RF12: Os textos que não são dados (lista das 13 áreas do sistema e o título que a acompanha) permanecem no sistema, seguem o tom de voz da marca e não dependem do back-end.
- RF13: Voltar e avançar entre as etapas não perde o plano escolhido nem os dados já preenchidos. A etapa continua funcionando por teclado e leitor de tela, com o foco indo para o título da etapa ao entrar nela.
- RF14: O visual segue o da etapa de plano atual e o design system do projeto.

## Fora de escopo
- Alterar o back-end ou o contrato de `/api/v1/Plano`.
- Cobrança, pagamento e cartão dentro da adesão; esta versão só registra o plano escolhido.
- Troca de plano depois do cadastro concluído, cancelamento e renovação.
- Cupons, desconto por indicação e condições dos Clientes Fundadores.
- Exibir `diferencaPercentual` (chega nulo; não há porcentagem de desconto nesta versão).
- Painel para editar planos; a edição é feita no back-end.
- Exibir o plano contratado em outras telas do sistema (Minha empresa, etc.).
- Alterações no site (já consome o mesmo endpoint).

## Critérios de aceite
- [ ] Com o back-end devolvendo Trial e Mensal (este em promoção), a etapa de plano mostra os dois, na ordem de `ordemExibicao`, com "R$ 99,90" riscado, "R$ 69,90" em destaque e o selo com a data de `promocaoFim` (30/06/2027), todos vindos da resposta.
- [ ] Alterando `valorPromocional`, `promocaoFim`, `validadeDuracaoMeses` ou `ordemExibicao` no back-end, a adesão reflete a mudança sem novo deploy.
- [ ] Com `emPromocao = true` e `promocaoFim` nulo, a opção mostra o preço de tabela riscado e o promocional, sem nenhuma data de fim.
- [ ] Com `emPromocao = false`, a opção mostra só o `valorAtual`, sem riscado nem selo.
- [ ] A frase da condição do lançamento mostra a data de `promocaoFim` e não fala em "12 meses"; a duração do teste grátis corresponde a `validadeDuracaoMeses` do Trial.
- [ ] O cadastro enviado ao backend leva `tipoPlanoAdesao` igual a `tipoPeriodoPlano` do plano escolhido (verificado para Trial e Mensal).
- [ ] Abrir `/adesao?tipoPlanoAdesao=1` deixa o Mensal selecionado; `?tipoPlanoAdesao=0` abre o fluxo de teste grátis; ausente, `abc` ou um tipo que não está na lista abre sem plano selecionado e sem mensagem de erro.
- [ ] A conferência mostra o plano escolhido com os valores do back-end, e o "Editar" leva à etapa de plano e volta à conferência depois.
- [ ] Durante o carregamento não há salto de layout perceptível.
- [ ] Com o back-end fora do ar, lento ou devolvendo lista vazia, a etapa não quebra, não mostra erro técnico, oferece "tentar de novo" e não permite avançar sem plano carregado.
- [ ] Nenhum valor ou prazo fixo no código (R$ 99,90, R$ 69,90, 30/06/2027, "12 meses", "30 dias") aparece na etapa de plano ou na conferência.
- [ ] Voltar e avançar entre etapas mantém o plano e os dados preenchidos.
- [ ] A etapa é legível a partir de 360 px, sem rolagem horizontal, e usável só com teclado; foco visível e contraste atendem WCAG 2.2 AA (o selo de oferta não depende só de cor).
- [ ] Textos seguem o tom de voz da marca.

## Métricas de sucesso (se aplicável)
- Divergência entre o preço do site e o preço da adesão: zero ocorrências.
- Tempo entre mudança de preço no back-end e reflexo na adesão: [A DEFINIR meta].
- Taxa de sessões de adesão em que a etapa de plano cai no estado de erro: [A DEFINIR; baseline não medido].
- Taxa de conclusão da adesão antes e depois da mudança: [A DEFINIR; baseline não medido].

## Riscos e observações
- **Contingência sem preço local:** a decisão do site foi não manter cópia local de preço, para nunca divergir do que é cobrado. Na adesão a consequência é mais forte, porque o plano é obrigatório no cadastro: com o back-end fora do ar o usuário não avança da etapa de plano. **[Confirmar com o negócio]** se isso é aceitável ou se o teste grátis deve continuar disponível sem a lista.
- **Planos no cadastro:** o contrato aceita os tipos `0` a `4`, mas o endpoint hoje devolve só Trial e Mensal. Se o back-end passar a devolver outros períodos, a etapa os lista sem mudança de código (RF1); o texto de total e economia por período fica fora desta versão.
- **Datas e fuso:** `promocaoInicio` e `promocaoFim` vêm sem fuso. Confirmar se "assine até 30/06/2027" vale até o fim desse dia no horário de Brasília (o site e o sistema hoje tratam assim). **[Confirmar com o negócio]**
- **Promoção fora do período:** definir se a decisão de mostrar a promoção é só `emPromocao` (calculado pelo back-end) ou também confere `promocaoInicio`/`promocaoFim` no cliente. Proposta: confiar em `emPromocao`/`valorAtual` do back-end. **[A DEFINIR no Tech Spec]**
- **Frescor do dado:** quanto tempo a adesão pode manter a lista em memória antes de consultar de novo. Decisão técnica, a definir no Tech Spec.
- **Endereço da API:** mesma API do GIPE; `GET /api/v1/Plano` responde sem autenticação (confirmado no PRD do site).
- Esta feature substitui a origem dos dados definida em `docs/specs/planos-adesao/prd.md` e nas decisões posteriores de plano único e teste grátis (tabela fixa em `src/lib/planos.ts`); as decisões de tom e das 13 áreas continuam valendo.
- Referências: `docs/specs/input.md`, `C:\murel\murel-site\docs\specs\planos-do-backend\prd.md`, `docs/specs/planos-adesao/prd.md`.
