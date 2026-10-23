# PRD: Adicionar nova empresa

## Problema
Quem administra uma empresa de estacionamento no GIPE e abre outra unidade (ou outro negócio) hoje só consegue cadastrá-la refazendo a adesão do zero, com um novo usuário, ou por intervenção fora do sistema. A API já permite que um Administrador adicione uma nova empresa à própria conta, mas não existe tela para isso.

Há também uma dependência que hoje não está resolvida: depois que a conta passa a ter mais de uma empresa, o login devolve uma etapa de escolha da empresa (a API não abre a sessão direto). A tela de login atual só entende "entrou" ou "trocar senha temporária"; com duas empresas, a pessoa não conseguiria entrar.

## Objetivo
Um Administrador consegue cadastrar uma nova empresa a partir do sistema, com os mesmos dados pedidos na adesão (e as formas de pagamento e os horários), e depois consegue acessá-la escolhendo a empresa ao entrar. Quem tem uma única empresa continua entrando como hoje.

## Usuário-alvo
Administrador de uma empresa, que precisa cadastrar outra empresa ligada ao mesmo usuário. Outros perfis não veem nem acessam a tela (a permissão por módulo pode alterar isso).

## Requisitos funcionais

### Cadastro da nova empresa
- RF1: Existe uma tela para adicionar empresa, acessível só a quem tem permissão (Administrador por padrão), com acesso por endereço direto também barrado para os demais perfis.
- RF2: A tela pede os mesmos dados da adesão e de "Minha empresa": CNPJ, razão social, nome fantasia, tipo de empresa, telefone, endereço (CEP, logradouro, número, bairro, cidade, estado), vagas de moto e de carro, meios de pagamento aceitos e horário de funcionamento de cada dia da semana.
- RF3: Os campos usam as mesmas máscaras e validações da adesão (CNPJ, CEP, telefone, vagas inteiras maiores ou iguais a zero, horários coerentes por dia, ao menos um meio de pagamento), e o endereço é preenchido automaticamente pelo CEP, como na adesão.
- RF4: O envio é uma única ação. Enquanto envia, os controles ficam indisponíveis e há indicação de progresso, evitando envio duplicado.
- RF5: Ao concluir com sucesso, o usuário vê a confirmação de que a empresa foi criada e é informado de como acessá-la (entrando de novo e escolhendo a empresa).
- RF6: Se a API recusar (por exemplo, dados inválidos ou CNPJ já cadastrado) ou falhar (rede, tempo esgotado, erro do servidor), o usuário vê uma mensagem clara em português, mantém tudo o que digitou e pode corrigir e reenviar. Falta de permissão (403) também tem aviso próprio.
- RF7: O usuário pode cancelar e voltar sem criar nada, sem perder dados já salvos de nenhuma empresa.

### Acesso à nova empresa (dependência do cadastro)
- RF8: No login, quando o usuário tem mais de uma empresa ativa, a tela mostra a lista de empresas e ele escolhe em qual entrar; só depois a sessão é aberta. Usuário com uma só empresa entra direto, como hoje.
- RF9: A escolha de empresa trata os erros da API (escolha expirada ou recusada, muitas tentativas) com mensagem clara e permite voltar ao login.
- RF10: Quando o usuário também precisa trocar a senha temporária, a troca vem antes, e depois dela vale a regra de uma ou várias empresas (RF8).
- RF11: [A DEFINIR] Como o usuário troca de empresa depois de logado (sair e entrar de novo, ou um seletor no sistema). A API só oferece a escolha no login.

## Fora de escopo
- Editar, desativar ou excluir uma empresa (a edição da empresa logada continua em "Minha empresa").
- Copiar dados de outra empresa (usuários, preços, mensalistas) para a nova.
- Cobrança, plano ou contrato da nova empresa.
- Trocar de empresa sem passar pelo login, salvo o que for decidido em RF11.

## Critérios de aceite
- [ ] Um Administrador abre a tela de adicionar empresa e vê os campos de RF2 em branco, com Dinheiro como único meio de pagamento ligado, como na adesão.
- [ ] Os demais perfis não veem o acesso à tela e, ao abrir o endereço direto, veem o acesso negado.
- [ ] CNPJ, CEP, telefone, vagas, horários e meios de pagamento são validados com as mesmas mensagens da adesão, e o CEP preenche o endereço.
- [ ] Com os dados válidos, o envio cria a empresa e mostra a confirmação; o formulário não pode ser enviado duas vezes seguidas.
- [ ] Com dados recusados pela API (ex.: CNPJ já cadastrado), aparece a mensagem da API e o formulário mantém o que foi digitado.
- [ ] Depois de criar a empresa, ao entrar de novo o usuário vê as duas empresas, escolhe uma e entra nela.
- [ ] Usuário com uma só empresa entra direto, sem a etapa de escolha.
- [ ] Uma escolha de empresa expirada ou recusada mostra mensagem clara e leva de volta ao login.
- [ ] A tela funciona em desktop e mobile, com acessibilidade nível AA (rótulos nos campos, erros associados, foco ao enviar).

## Métricas de sucesso
- Um Administrador adiciona uma empresa e entra nela sem ajuda externa.
- Nenhum usuário com mais de uma empresa fica impedido de entrar.

## Questões em aberto
- **Onde fica o acesso à tela?** Decidido na implementação: botão "Adicionar empresa" em "Minha empresa" (só para quem tem acesso à área Empresa).
- **O que acontece logo depois de criar?** Decidido: painel de confirmação com "Sair e escolher a empresa", sem trocar a sessão sozinho.
- **Troca de empresa dentro do sistema** (RF11): segue como está, sair e entrar de novo; a API só oferece a escolha no login.
- **Troco padrão:** decidido não pedir; a tela não envia `valorTrocoPadrao` e a API o trata como zero (conferido: o cadastro foi aceito sem ele).
- **Como o usuário sabe em qual empresa está?** Em aberto: mostrar o nome da empresa atual no cabeçalho, melhoria à parte.
- **Perfil do criador na nova empresa:** conferido na API real: o criador entra na empresa nova como **Administrador** (role 1).
- **Formato da lista de empresas no login:** conferido na API real; o perfil de cada empresa vem em `perfil` (texto) e `perfilId` (código).
