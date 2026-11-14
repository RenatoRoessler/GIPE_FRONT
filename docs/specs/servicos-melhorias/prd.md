# PRD: Melhorias na Tela de Serviços

## Problema
O módulo de Serviços já permite cadastrar o catálogo, acrescentar serviços ao veículo e acompanhar a fila, mas o uso real no pátio mostra atritos:

- **Cadastro lento e propenso a erro**: o serviço tem preço, duração e tempo grátis por categoria (6 categorias), e o administrador preenche tudo do zero, linha por linha, sem referência de como o cliente vai enxergar o resultado.
- **Fila pouco útil para quem executa**: o lavador não vê há quanto tempo o carro espera, quando o serviço deve terminar nem se já passou da previsão; precisa de toques precisos em telas pequenas, com o carro e as mãos molhadas.
- **Celular é o contexto principal** do lavador e do administrador em campo, mas as telas foram pensadas primeiro para desktop.
- Cancelar ou voltar um status por engano não tem saída rápida.

## Objetivo
Cadastrar e manter serviços fica rápido e previsível (com pré-visualização do que o cliente vê), e a fila de serviços passa a dizer ao lavador, de relance, o que fazer agora, quanto tempo falta e o que está atrasado — com a mesma qualidade de uso em desktop e celular.

## Usuário-alvo
- **Administrador / Gerente**: cadastra e edita serviços, em desktop ou celular.
- **Lavador**: trabalha a fila no celular, no pátio; não cancela serviços.
- **Caixa / Manobrista**: acompanham a fila e cancelam serviços quando o cliente desiste.

O acesso a cada ação continua seguindo a permissão por perfil/módulo existente.

## Requisitos funcionais

### Catálogo (lista)
- RF1: A lista de serviços mostra, por serviço, nome, faixa de preço ("a partir de" quando varia por categoria), faixa de duração e o tempo grátis no pátio (ou a indicação de que cobra permanência), além de quais categorias recebem ou não o serviço.
- RF2: Busca na lista por nome (e descrição no desktop) com resposta imediata, e mensagem clara quando nada é encontrado.
- RF3: Resumo no topo da lista com quantidade de serviços ativos e quantos têm tempo grátis no pátio.
- RF4: Estado vazio orientado ("Cadastre o primeiro serviço") com ação direta para criar.

### Cadastro e edição de serviço
- RF5: Ao criar, o usuário pode partir de um modelo pronto (ex.: lavagem simples, lavagem completa, higienização interna, polimento, cera rápida) e ajustar nome, descrição e valores.
- RF6: Para cada categoria de veículo, o usuário define valor, duração prevista (minutos) e tempo grátis no pátio (minutos), ou marca que a categoria **não recebe** o serviço.
- RF7: Ação para repetir os valores da primeira categoria preenchida nas categorias ainda vazias, informando quantas foram preenchidas.
- RF8: Pré-visualização em tempo real de como o serviço aparece ao ser lançado no carro e, no celular, do texto que o cliente verá no comprovante para cada categoria (valor, "finaliza em cerca de…", "pode ficar … no pátio sem pagar estacionamento").
- RF9: Validação com mensagem junto ao campo: nome obrigatório e sem duplicidade entre serviços ativos; ao menos uma categoria com valor; todas as categorias ativas com valor; duração coerente com o tempo grátis quando aplicável.
- RF10: No celular, o cadastro é conduzido em passos curtos (dados → categorias → revisão), com indicação do passo atual, contador de categorias prontas e edição de cada categoria em uma folha própria com opções rápidas de duração e de tempo grátis, além de campo livre.
- RF11: Editar um serviço existente reutiliza o mesmo fluxo; inativar o serviço continua disponível na edição, com confirmação.
- RF12: Feedback de sucesso ou erro após salvar, com mensagens compreensíveis para erro de validação, sessão expirada e falta de permissão.

### Fila de serviços
- RF13: A fila é organizada por status (Aguardando, Em execução, Pronto): em desktop, as três colunas visíveis ao mesmo tempo com contagem em cada; no celular, uma aba por status com contagem, mostrando um status por vez.
- RF14: Cada cartão mostra placa, prisma, modelo, cor, categoria, nome do serviço e quantos outros serviços o mesmo carro tem na fila.
- RF15: O cartão informa o tempo conforme o status: em Aguardando, há quanto tempo está na fila e a duração prevista; em Execução, hora de início, tempo decorrido, previsão de término e barra de progresso; em Pronto, hora em que ficou pronto e há quanto tempo aguarda retirada.
- RF16: Serviço em execução que passou da duração prevista é destacado como atrasado, informando quanto passou, e o total de atrasados aparece no resumo da fila.
- RF17: Cada cartão tem uma ação principal grande e óbvia para avançar o status (Iniciar → Marcar pronto), e uma ação secundária para voltar ao status anterior.
- RF18: Após mudar o status, o usuário recebe confirmação com opção de **desfazer** por alguns segundos.
- RF19: Busca da fila por placa ou prisma.
- RF20: Cancelar um serviço pela fila exige motivo, oferece motivos rápidos (ex.: cliente desistiu, cliente com pressa, sem horário hoje, lançado por engano) e explica o efeito sobre o valor e o tempo grátis do carro. A ação não é oferecida ao perfil Lavador.
- RF21: A fila se atualiza sozinha periodicamente, sem o usuário recarregar a página.
- RF22: Cada coluna/aba vazia mostra mensagem própria explicando o estado.

### Transversais
- RF23: Layout responsivo com experiência de primeira classe em desktop e celular; alvos de toque grandes no celular e suporte a tema claro e escuro, mantendo a identidade visual do produto.
- RF24: Acessibilidade: ações e estados compreensíveis por leitor de tela, foco visível e contraste adequado nos estados (aguardando, em execução, pronto, atrasado).

## Fora de escopo
- Alterar regras de cobrança, preço ou tempo grátis no fechamento da saída (apenas exibir e editar os dados já existentes).
- Relatórios e métricas de produtividade/faturamento por serviço.
- Agendamento de serviços e notificações push ao cliente.
- Mudanças no menu principal e no shell do sistema além do necessário para a tela.
- Alternadores de visualização (desktop/celular) e troca de perfil presentes nos protótipos: são apenas recursos de demonstração.
- Painéis "Para o desenvolvedor" exibidos nos protótipos.
- Exclusão definitiva de serviços.

## Critérios de aceite
- [ ] A lista mostra faixa de preço, duração, tempo grátis e categorias atendidas, filtra por busca e exibe estado vazio orientado.
- [ ] É possível criar um serviço a partir de um modelo e ajustar os valores antes de salvar.
- [ ] A ação de repetir a primeira linha preenche somente categorias vazias e informa quantas foram preenchidas.
- [ ] A pré-visualização muda em tempo real conforme nome, valores e tempos são editados.
- [ ] Nome duplicado, categoria sem valor e dados inválidos exibem mensagem junto ao campo e impedem salvar.
- [ ] No celular, o cadastro segue os 3 passos e cada categoria é editada em folha própria com opções rápidas.
- [ ] A fila mostra o tempo adequado a cada status; serviço em execução além da previsão aparece destacado e contado no resumo.
- [ ] Iniciar, marcar pronto e voltar status funcionam em um toque e podem ser desfeitos logo após.
- [ ] Busca por placa ou prisma filtra os cartões nas três colunas/abas.
- [ ] Cancelar exige motivo, oferece motivos rápidos e não aparece para o Lavador.
- [ ] A fila atualiza sozinha sem recarregar a página.
- [ ] Telas utilizáveis em celular (largura ≥ 360px) e desktop, em tema claro e escuro.

## Métricas de sucesso
- Redução do tempo médio para cadastrar um serviço novo com todas as categorias preenchidas.
- Lavadores operam a fila apenas pelo celular, sem consultar o caixa; serviços "atrasados" ficam visíveis e tratados.
- Menos cancelamentos por engano (uso do desfazer) e 100% dos cancelamentos com motivo.
