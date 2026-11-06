# PRD: Aceite de Termos de Uso e Política de Privacidade na Adesão

## Problema
Hoje a empresa conclui a adesão sem manifestar ciência nem concordância com os Termos de Uso e com a Política de Privacidade do GIPE. Isso deixa o produto sem registro de que o responsável aceitou as condições de uso e o tratamento de dados antes de criar a conta. O backend passou a exigir esse aceite no cadastro (indicando aceite e a versão dos termos aceita), então o fluxo precisa coletá-lo.

## Objetivo
Ao concluir a adesão, o responsável pela empresa precisa ter lido (ou tido acesso fácil para ler) e aceitado explicitamente, de forma separada, os Termos de Uso e a Política de Privacidade; sem os dois aceites o cadastro não avança. O aceite e a versão dos termos vigentes são registrados junto com o cadastro.

## Usuário-alvo
Responsável pela empresa (estacionamento, lava-rápido, valet) que está se cadastrando pela primeira vez, em desktop ou celular, tanto no fluxo com plano quanto no teste grátis.

## Requisitos funcionais
- RF1: A adesão apresenta duas seções distintas de aceite: uma para os **Termos de Uso** e outra para a **Política de Privacidade**.
- RF2: Cada seção tem seu próprio aceite explícito; o usuário precisa aceitar **as duas** para prosseguir. Aceitar uma não aceita a outra, e nenhuma vem pré-marcada.
- RF3: Cada seção oferece acesso ao documento completo correspondente (Termos de Uso e Política de Privacidade), de modo que o usuário possa lê-lo sem perder o que já preencheu na adesão.
- RF4: Enquanto qualquer um dos dois aceites estiver pendente, o usuário não consegue concluir o cadastro; ao tentar, é informado de qual aceite falta, com mensagem objetiva junto da respectiva seção.
- RF5: O cadastro enviado ao backend inclui o aceite (confirmado) e a versão dos termos vigente (atualmente "v1.0").
- RF6: A experiência vale para os dois modos de adesão (com escolha de plano e teste grátis).
- RF7: Se o usuário voltar a etapas anteriores e retornar, os aceites já dados continuam marcados dentro da mesma sessão de preenchimento.
- RF8: Se o backend recusar o cadastro por causa do aceite, o usuário é informado e conduzido até a seção correspondente, sem perder o restante do preenchimento.

## Fora de escopo
- Redação ou revisão jurídica dos textos dos Termos de Uso e da Política de Privacidade (os documentos são fornecidos prontos).
- Aceite de termos por usuários já cadastrados (novas versões, reaceite no login) e histórico de aceites na interface.
- Aceite em outros fluxos (criação de usuário, nova empresa, mensalistas).
- Gestão/edição das versões dos termos pelo próprio sistema.
- Alterar etapas, campos ou regras de negócio da adesão além do aceite.

## Critérios de aceite
- [ ] A adesão exibe duas seções separadas, uma de Termos de Uso e outra de Política de Privacidade, cada uma com seu aceite, ambos desmarcados inicialmente.
- [ ] Cada seção dá acesso ao documento completo correspondente, sem fazer o usuário perder o preenchimento.
- [ ] Com um ou nenhum aceite marcado, não é possível concluir o cadastro, e a mensagem indica exatamente qual aceite falta.
- [ ] Com os dois aceites marcados, o cadastro é enviado e criado com sucesso, e a requisição leva o aceite confirmado e a versão "v1.0".
- [ ] Os dois modos de adesão (plano e teste grátis) exigem os aceites.
- [ ] Ao navegar entre etapas, os aceites marcados são mantidos na sessão.
- [ ] Uma recusa do backend relacionada ao aceite é exibida junto da seção, sem perda de dados.
- [ ] Os aceites são utilizáveis por teclado e leitor de tela (rótulo claro, foco visível, erro anunciado), com alvos de toque confortáveis no celular, atendendo WCAG 2.2 AA.
- [ ] Layout coerente com o restante do fluxo, sem rolagem horizontal em ~320px.

## Métricas de sucesso
- 100% dos cadastros concluídos após o lançamento têm aceite registrado com a versão dos termos.
- A taxa de conclusão da adesão não cai de forma relevante em relação ao baseline atual.

## Premissas a confirmar
- O aceite fica na etapa final de conferência, antes de confirmar o cadastro (hoje a última etapa), por ser o momento de confirmação do cadastro. Se preferir outra posição, ajustar antes do design.
- Os documentos finais (Termos de Uso e Política de Privacidade, em HTML) precisam ser disponibilizados pelo projeto em endereço público; hoje existem apenas como arquivos locais fornecidos pelo time.
