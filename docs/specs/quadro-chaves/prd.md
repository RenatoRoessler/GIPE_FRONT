# PRD: Quadro de Chaves

## Problema
No pátio, as chaves dos veículos ficam penduradas em quadros físicos (ganchos organizados em linhas e colunas, ex.: parede da recepção). Hoje o sistema não sabe onde cada chave está: o manobrista precisa lembrar ou procurar a chave manualmente na hora da saída, o que gera atraso, erro de veículo entregue e perda de chave. Além disso, cada estabelecimento tem quadros diferentes (tamanho, quantidade, posições inutilizadas), e não há como representá-los no sistema.

## Objetivo
Cada empresa consegue cadastrar os quadros de chaves físicos do seu pátio (nome, linhas, colunas e posições fora de uso) e, ao dar entrada em um veículo, registrar em qual gancho a chave foi pendurada. A posição fica associada ao veículo enquanto ele estiver no pátio e é liberada automaticamente na saída.

## Usuário-alvo
- **Administrador e Gerente**: configuram, ampliam e removem quadros (setup feito poucas vezes, geralmente no celular ou tablet).
- **Manobrista e Caixa**: escolhem o gancho da chave durante a entrada do veículo, de forma rápida, em pé no pátio, normalmente no celular.

## Requisitos funcionais

### Configurar quadros (Mais › Quadros de chaves)
- RF1: Listar os quadros ativos da empresa, cada um com nome e quantidade de ganchos. Empresa sem quadros vê um estado vazio com chamada para criar o primeiro.
- RF2: Criar um quadro informando nome (obrigatório, até 100 caracteres, único entre os quadros ativos, sem diferenciar maiúsculas/minúsculas), número de linhas e número de colunas.
- RF3: As linhas são nomeadas por letras em sequência (A, B, C…) e as colunas por números a partir de 1; o ajuste de linhas e colunas deve mostrar o intervalo resultante (ex.: "5 · A–E", "6 · 1–6").
- RF4: Exibir uma prévia do quadro com todos os ganchos gerados e o total (ex.: "Prévia · 30 ganchos"), atualizada ao alterar linhas/colunas.
- RF5: Permitir marcar ganchos da prévia como "fora de uso" (ex.: gancho quebrado). Ganchos fora de uso não são criados e não aparecem como opção na entrada de veículos.
- RF6: Permitir acrescentar novas posições a um quadro já existente; posições que já existem são mantidas sem duplicar.
- RF7: Permitir excluir uma posição individual, somente se nenhum veículo no pátio estiver com a chave nela.
- RF8: Permitir inativar um quadro inteiro, somente se nenhum veículo no pátio estiver com chave em alguma posição dele; em caso de bloqueio, informar as placas envolvidas. Após inativar, o nome fica disponível para um novo quadro.
- RF9: Permitir cadastrar mais de um quadro no mesmo fluxo ("+ Adicionar outro quadro").
- RF10: Apenas Administrador e Gerente (ou perfis com permissão equivalente por módulo) podem criar, ampliar, excluir posição ou inativar quadro.

### Escolher o gancho na entrada do veículo
- RF11: Após registrar a entrada, exibir a tela "Quadro de chaves" com a identificação do veículo (placa, modelo, cor e vaga, quando houver).
- RF12: Mostrar o quadro como grade (cabeçalho de colunas e rótulo de linhas) em que cada gancho aparece como livre, ocupado (com a placa do veículo que o ocupa, quando disponível), fora de uso ou selecionado.
- RF13: Sugerir automaticamente um gancho livre (o primeiro livre na ordem do quadro) já pré-selecionado e destacado, explicando que é uma sugestão; o usuário pode tocar em outro gancho livre para trocar. Ganchos ocupados e fora de uso não são selecionáveis.
- RF14: Quando a empresa tiver mais de um quadro, permitir escolher o quadro antes de escolher o gancho.
- RF15: Confirmar a escolha por um botão que cita a posição ("Guardar no gancho A2") e orientar o usuário ("Pendure a chave no A2").
- RF16: Se o gancho for ocupado por outro veículo entre a abertura da tela e a confirmação, informar o erro (posição, quadro e placa que a ocupa) e atualizar a grade para nova escolha.
- RF17: Escolher a mesma posição novamente não gera erro; escolher outra posição para um veículo que já tinha gancho libera a posição anterior (de qualquer quadro).
- RF18: A posição escolhida aparece no card do veículo no pátio (ex.: "A2" ou "Recepção · A2").
- RF19: Quando o veículo sai do pátio, o gancho volta a ficar livre automaticamente.
- RF20: Empresa sem quadros cadastrados não é bloqueada: a entrada segue normalmente sem a etapa de gancho (com atalho para configurar quadros, para quem tem permissão).

## Fora de escopo
- Nomear ganchos apenas por número ("Só número · 1 a 30") em vez de letra + número — a opção aparece no layout de referência, mas depende de definição junto ao backend (ver perguntas em aberto).
- Impressão de etiquetas/QR dos ganchos.
- Renomear ou editar um quadro existente (alterar nome, remover várias posições de uma vez).
- Registro de chaves de veículos fora do pátio (ex.: chaves de mensalistas sem veículo no pátio).
- Histórico/auditoria de movimentação de chaves.

## Perguntas em aberto
- A opção "Só número · 1 a 30" será suportada? O backend hoje recebe a linha como texto e as colunas como números; é preciso confirmar como representar numeração contínua.
- A listagem de quadros hoje informa apenas se cada posição está livre ou não, sem a placa do veículo que a ocupa. Exibir a placa nos ganchos ocupados (RF12) exige esse dado no backend; sem ele, ocupados aparecem apenas como indisponíveis.
- A tela de escolha do gancho é obrigatória na entrada ou pode ser pulada ("escolher depois")?

## Critérios de aceite
- [ ] Administrador/Gerente cria um quadro "Recepção" com 5 linhas × 6 colunas e vê a prévia com 30 ganchos (A1–E6).
- [ ] Ao marcar B6 como fora de uso e salvar, o quadro é criado com 29 ganchos e B6 não é selecionável na entrada de veículos.
- [ ] Nome de quadro vazio, com mais de 100 caracteres ou já usado por outro quadro ativo exibe mensagem de erro clara e não salva.
- [ ] Perfis sem permissão (ex.: Manobrista) não veem as ações de criar, ampliar, excluir ou inativar quadros, mas conseguem escolher gancho na entrada.
- [ ] Ao concluir a entrada de um veículo, o gancho livre sugerido vem pré-selecionado e o usuário consegue trocá-lo por outro livre com um toque.
- [ ] Ganchos ocupados e fora de uso não podem ser selecionados.
- [ ] Ao confirmar, a posição aparece no card do veículo no pátio.
- [ ] Ao dar saída ao veículo, o gancho dele volta a aparecer como livre na entrada do próximo veículo.
- [ ] Tentar excluir uma posição ou inativar um quadro com chave de veículo no pátio é bloqueado com mensagem informando o motivo.
- [ ] Conflito de gancho (ocupado por outro veículo) mostra a placa ocupante e atualiza a grade.
- [ ] Empresa sem quadros conclui a entrada de veículos normalmente.
- [ ] A tela funciona e é utilizável em celular (largura ~390px), com alvos de toque adequados para os ganchos.

## Métricas de sucesso
- Percentual de entradas de veículos com gancho registrado nas empresas que cadastraram quadro (meta inicial: > 90%).
- Tempo médio da etapa de escolha do gancho (meta: poucos segundos, aceitando a sugestão na maioria dos casos).
- Redução de relatos de chave não localizada na saída do veículo.
