# PRD: Escolha de Plano no Fluxo de Adesão

## Problema
O site da Murel passou a mostrar quatro planos (mensal, trimestral, semestral e anual) e leva o visitante à adesão com o plano escolhido. O fluxo de adesão do sistema não sabe disso: ele tem quatro etapas (Empresa, Horários, Titular e Conferir) e nenhuma delas trata de plano. O plano que o visitante escolheu no site se perde, e quem chega à adesão por outro caminho não tem como escolher. O backend já aceita o campo `tipoPlanoAdesao` no cadastro, mas o sistema não o envia.

## Objetivo
O fluxo de adesão passa a ter uma etapa para escolher o plano. Quem vem do site encontra o plano já selecionado e pode confirmar ou trocar; quem vem por outro caminho escolhe na própria etapa. O plano escolhido é enviado no cadastro e aparece na conferência final.

## Usuário-alvo
- Dono de pátio (estacionamento, valet, lava-rápido) que decidiu aderir e preenche o cadastro, em geral no celular, entre tarefas do pátio.
- Gerente/administrador que faz o cadastro em nome do dono, em geral no computador.

## Requisitos funcionais
- RF1: O fluxo de adesão ganha uma etapa para escolher o plano, com as quatro opções do site, nesta ordem: Mensal, Trimestral, Semestral e Anual. A etapa vem depois do Titular e antes da Conferir.
- RF2: A escolha segue o que foi definido no site (PRD e Tech Spec de `planos-adesao` do `murel-site`): mesmos nomes, mesmos valores, mesmo destaque do Anual como recomendado e a mesma lista das 13 áreas do sistema, com os mesmos textos, sob o título "Tudo isso em todos os planos".
  - Mensal: R$ 149,90/mês
  - Trimestral: R$ 134,90/mês (total R$ 404,70; economia de R$ 45,00, 10%)
  - Semestral: R$ 119,90/mês (total R$ 719,40; economia de R$ 180,00, 20%)
  - Anual: R$ 79,90/mês (total R$ 958,80; economia de R$ 840,00, 47%)
- RF3: O plano escolhido é enviado no cadastro no campo `tipoPlanoAdesao`, com os valores 0 = Trial, 1 = Mensal, 2 = Trimestral, 3 = Semestral e 4 = Anual.
- RF4: Quando a adesão é aberta com `tipoPlanoAdesao` válido (1 a 4) na URL, o plano correspondente já vem selecionado na etapa de plano. O usuário pode trocar.
- RF5: Quando o parâmetro está ausente ou é inválido, a adesão abre normalmente, sem plano pré-selecionado, e o usuário escolhe na etapa. Nenhum erro é mostrado por causa do parâmetro.
- RF6: Não é possível concluir a etapa de plano sem ter um plano escolhido.
- RF7: A etapa de Conferir mostra o plano escolhido, com valor por mês e total do período, e permite voltar à etapa de plano para trocar (mesmo padrão de "Editar" das outras etapas).
- RF8: Voltar e avançar entre as etapas não perde o plano escolhido nem os dados já preenchidos.
- RF9: O plano Anual aparece em destaque como o recomendado, com um indicador que não depende só de cor.
- RF10: A etapa funciona por teclado e leitor de tela, e o foco vai para o título da etapa ao entrar nela, como nas demais.
- RF11: O texto segue o tom de voz da marca (direto, próximo, sem jargão, sem exageros, sem emojis).

## Fora de escopo
- Cobrança, pagamento e cartão dentro da adesão; esta versão só registra o plano escolhido.
- Troca de plano depois do cadastro concluído, cancelamento e renovação.
- Cupons, desconto por indicação e preços diferentes por quantidade de pátios.
- Alterações no site (o envio do parâmetro na URL já é responsabilidade do `murel-site`).
- Planos por tipo de operação e níveis Essencial/Profissional/Premium.
- Exibir o plano contratado em outras telas do sistema (Minha empresa, etc.).

## Critérios de aceite
- [ ] O fluxo de adesão tem uma etapa de plano, depois do Titular, com as quatro opções, nos valores do RF2, e os totais e economias conferem.
- [ ] A etapa de plano lista as 13 áreas do sistema com os mesmos textos do site.
- [ ] Abrir `/adesao?tipoPlanoAdesao=1`, `2`, `3` e `4` deixa Mensal, Trimestral, Semestral e Anual selecionados, respectivamente.
- [ ] Abrir `/adesao` sem parâmetro, ou com valor fora de 1 a 4 (ex.: `0`, `9`, `abc`), abre sem plano selecionado e sem mensagem de erro.
- [ ] Não é possível avançar da etapa de plano sem escolher uma opção.
- [ ] O cadastro enviado ao backend leva `tipoPlanoAdesao` com o valor do plano escolhido (verificado nos quatro planos).
- [ ] A conferência mostra o plano escolhido e o link/botão de editar leva à etapa de plano e volta à conferência depois.
- [ ] Voltar e avançar entre etapas mantém o plano e os dados preenchidos.
- [ ] O Anual se distingue como recomendado sem depender só de cor.
- [ ] A etapa é legível a partir de 360 px, sem rolagem horizontal, e usável só com teclado.
- [ ] Foco visível e contraste atendem WCAG 2.2 AA; o foco vai para o título da etapa ao entrar nela.
- [ ] Textos seguem o tom de voz da marca.

## Métricas de sucesso (se aplicável)
- Adesões concluídas com plano informado, em relação ao total de adesões: [A DEFINIR meta; baseline zero, o campo não é enviado hoje].
- Distribuição das adesões por tipo de plano: [A DEFINIR].
- Taxa de conclusão da adesão antes e depois da nova etapa: [A DEFINIR; baseline não medido].

## Riscos e observações
- **Posição da etapa:** decidido que o plano vem depois do Titular e antes da Conferir (Empresa, Horários, Titular, Plano, Conferir). O plano vindo da URL fica guardado até lá.
- **Trial (valor 0):** decidido que a etapa não oferece Trial. O backend aceita o valor 0, mas o sistema só envia 1 a 4, e exige uma escolha (RF6).
- **Cobrança do plano Anual:** decidido que o total é cobrado de uma vez (R$ 958,80). O texto do total na etapa deve dizer isso, igual ao do site ("a cada 12 meses" vale para o Anual).
- **Preço público duplicado:** os valores existem no site e passam a existir no sistema. Quando um preço mudar, é preciso alterar nos dois lugares; vale registrar essa dependência.
- **Contrato do backend:** `tipoPlanoAdesao` é obrigatório no cadastro, por isso a etapa não deixa avançar sem plano (RF6). A resposta do backend para valor inválido não deve ocorrer, pois só 1 a 4 são enviados.
- Referências: `docs/specs/input.md`, `C:\murel\murel-site\docs\specs\planos-adesao\prd.md` e `techspec.md`.
