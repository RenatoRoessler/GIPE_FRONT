# PRD: Gestão de Mensalistas

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-15  
**Versão:** 1.0

---

## 1. Objetivo

Permitir que a empresa cadastre e acompanhe seus clientes mensais (mensalistas) e os tipos de mensalidade que oferece, sem sair do sistema. Hoje o sistema só marca uma entrada de veículo como "mensalista", mas não há onde registrar quem são esses clientes, quanto pagam ou quando vence a mensalidade.

## 2. Contexto e Motivação

O estacionamento atende clientes avulsos e mensais. A parte avulsa já tem fluxo completo (entrada, saída, caixa, tabela de preços). Para clientes mensais não existe cadastro: a informação fica fora do sistema. O back já disponibiliza a gestão de mensalistas e de tipos de mensalidade, então a tela é o que falta para o operador usar.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Administrador / gestor da empresa | Cadastrar e manter os tipos de mensalidade (nome, categoria de veículo, valor, horário) e os mensalistas | Configuração do negócio, esporádica |
| Operador com permissão administrativa | Cadastrar um novo mensalista, consultar por documento e desativar quem saiu | Atendimento no balcão, dia a dia |

Mesma regra de acesso das telas administrativas já existentes (Preços e Usuários). Quem não tem permissão não vê a página.

## 4. Escopo

### Dentro do Escopo
- Página "Mensalistas" no menu, com duas abas: **Mensalistas** e **Tipos de mensalidade**.
- Lista de mensalistas com paginação e busca pelo início do CPF/CNPJ.
- Cadastro e edição de mensalista, incluindo ativar/desativar pela edição.
- Lista, cadastro e edição de tipos de mensalidade, incluindo ativar/desativar pela edição.
- Exibir, para cada mensalista, o tipo, a categoria e o valor da mensalidade.
- Mensagens claras para os erros previstos (dados inválidos, tipo inativo ou duplicado, sem permissão).

### Fora do Escopo
- Vincular veículos/placas ao mensalista e usar o cadastro na entrada ou saída de veículos (a marcação "mensalista" na entrada continua como está).
- Cobrança, emissão de boleto, controle de pagamento ou inadimplência da mensalidade.
- Relatórios de mensalistas.
- Exclusão definitiva (só desativar).
- Ativar/desativar direto na linha da lista (feito apenas pela edição).
- Importação em lote de mensalistas.

## 5. Requisitos Funcionais

### RF-01: Acessar a gestão de mensalistas
**Critério de aceite:**
- Dado um usuário com permissão, quando abre o menu, então vê o item "Mensalistas" e acessa a página com as abas Mensalistas e Tipos de mensalidade.
- Dado um usuário sem permissão, quando tenta acessar, então não vê o item no menu e, ao abrir o endereço direto, recebe aviso de acesso negado.

### RF-02: Listar mensalistas
**Critério de aceite:**
- Dado que existem mensalistas, quando abre a aba Mensalistas, então vê a lista com ativos primeiro e, dentro deles, ordenados por nome.
- Dado cada mensalista, então a lista mostra nome, documento, celular, tipo, categoria, valor da mensalidade, dia de vencimento e situação (ativo/inativo).
- Dado mais de 20 mensalistas, quando navega entre as páginas, então vê 20 por página e a página atual indicada.
- Dado que não há mensalistas, então vê um estado vazio com a ação de cadastrar o primeiro.

### RF-03: Buscar mensalista por documento
**Critério de aceite:**
- Dado o campo de busca, quando digita o início de um CPF ou CNPJ (com ou sem máscara), então a lista mostra só os mensalistas cujo documento começa com esse valor.
- Dado um documento completo, quando busca, então encontra o mensalista exato.
- Dado uma busca sem resultado, então vê a mensagem de nenhum mensalista encontrado e a opção de limpar a busca.

### RF-04: Cadastrar mensalista
**Critério de aceite:**
- Dado o formulário de novo mensalista, quando preenche tipo de mensalidade, tipo de pessoa (física ou jurídica), documento, nome, e-mail, celular e dia de vencimento válidos, então o mensalista é criado ativo e aparece na lista.
- Dado tipo de pessoa física, então o documento deve ser um CPF válido; dado jurídica, um CNPJ válido (inclusive alfanumérico). Máscara é opcional.
- Dado um celular, então deve ter DDD + 9 dígitos, com ou sem máscara.
- Dado o dia de vencimento, então aceita de 1 a 31.
- Dado o campo tipo de mensalidade, então só oferece tipos ativos.
- Dado dados inválidos, então cada campo mostra o motivo e nada é salvo.

### RF-05: Editar e ativar/desativar mensalista
**Critério de aceite:**
- Dado um mensalista existente, quando abre a edição, então o formulário vem preenchido com os dados atuais.
- Dado a edição, quando altera os dados e confirma, então a lista reflete a mudança.
- Dado a edição, quando desmarca "ativo" e confirma, então o mensalista passa a aparecer como inativo.
- Dado um mensalista cujo tipo foi desativado, quando edita mantendo o tipo atual, então o salvamento é permitido; trocar para outro tipo inativo não é.

### RF-06: Listar tipos de mensalidade
**Critério de aceite:**
- Dado que existem tipos, quando abre a aba Tipos de mensalidade, então vê todos (ativos e inativos), ativos primeiro e depois por nome e categoria.
- Dado cada tipo, então a lista mostra nome, categoria (ou "Todas" quando for todas), valor da mensalidade, horário de entrada e saída (quando houver) e situação.
- Dado que não há tipos, então vê estado vazio com a ação de criar o primeiro tipo, e a explicação de que é preciso um tipo para cadastrar mensalistas.

### RF-07: Cadastrar tipo de mensalidade
**Critério de aceite:**
- Dado o formulário de novo tipo, quando informa nome (até 100 caracteres), categoria e valor maior que zero, então o tipo é criado ativo.
- Dado a categoria, então pode escolher uma categoria de veículo ou "Todas as categorias".
- Dado horário de entrada e saída, então são opcionais, mas devem ser informados juntos; saída menor que a entrada é aceita (ex.: 19:00 às 07:00).
- Dado o formulário, então o tipo informa os dias da semana em que atende (domingo a sábado); novos tipos começam com todos os dias marcados e é preciso manter ao menos um. A lista de tipos mostra os dias ("Todos os dias", "Seg a Sex" ou a lista).
- Dado um tipo ativo com o mesmo nome e categoria, quando tenta criar outro igual, então vê a mensagem de que o tipo já existe e nada é salvo.

### RF-08: Editar e ativar/desativar tipo de mensalidade
**Critério de aceite:**
- Dado um tipo existente, quando abre a edição, então o formulário vem preenchido.
- Dado a edição, quando altera os dados e confirma, então a lista reflete a mudança.
- Dado a edição, quando desmarca "ativo" e confirma, então o tipo fica inativo e deixa de ser oferecido no cadastro de novos mensalistas.

### RF-09: Feedback e erros
**Critério de aceite:**
- Dado qualquer cadastro ou edição bem-sucedida, então o usuário vê uma confirmação e a lista é atualizada.
- Dado falha de rede ou do servidor ao carregar uma lista, então vê a mensagem de erro e a opção de tentar novamente.
- Dado sessão expirada, então é levado ao login (comportamento já existente no sistema).

## 6. Requisitos Não-Funcionais

- **Performance:** listas carregam paginadas (até 100 itens por requisição); a busca não deve travar a digitação.
- **Acessibilidade:** WCAG 2.2 nível AA; abas, tabela, formulários e modais navegáveis por teclado e com rótulos para leitores de tela.
- **Compatibilidade:** desktop e celular (tabela vira cartões em tela estreita, como nas demais listas do sistema).
- **Segurança:** a página respeita as permissões do perfil; dados pessoais (documento, e-mail, celular) só aparecem para quem tem acesso.

## 7. Fluxos Principais

### Fluxo 1: Preparar os tipos de mensalidade
1. Usuário abre Mensalistas e vai para a aba Tipos de mensalidade.
2. Sistema mostra a lista de tipos (ou o estado vazio).
3. Usuário escolhe "Novo tipo" e preenche nome, categoria, valor e, se quiser, horário.
4. Sistema valida, cria o tipo ativo e o mostra na lista.

### Fluxo 2: Cadastrar um mensalista
1. Usuário abre a aba Mensalistas e escolhe "Novo mensalista".
2. Sistema mostra o formulário com os tipos ativos disponíveis.
3. Usuário preenche tipo, pessoa, documento, nome, e-mail, celular e dia de vencimento.
4. Sistema valida, cria o mensalista ativo e o mostra na lista com a confirmação.

### Fluxo 3: Consultar e desativar um mensalista
1. Usuário digita o início do documento na busca.
2. Sistema filtra a lista.
3. Usuário abre a edição do mensalista, desmarca "ativo" e confirma.
4. Sistema atualiza e o mensalista passa a constar como inativo.

## 8. Critérios de Sucesso

Sem métricas numéricas nesta entrega. A feature é bem-sucedida quando o usuário consegue, sem sair do sistema, cadastrar, editar, desativar e consultar mensalistas e tipos de mensalidade, com as regras de validação aplicadas e erros claros.

| Métrica | Baseline | Meta |
|---------|----------|------|
| Cadastro de mensalistas e tipos feito dentro do sistema | Não existe | Funcional e validado pelos critérios de aceite |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| Endpoint de tipos (`GET /Mensalista/tipo`) devolve todos os tipos sem paginação | Baixo | Lista simples; reavaliar se o volume crescer |
| Perfil exato que acessa a página ainda não confirmado com o back [A DEFINIR] | Médio | Assumido o mesmo perfil de Preços/Usuários; o back responde 403 para quem não pode |
| Permitir editar o documento (CPF/CNPJ) de um mensalista existente [A DEFINIR] | Médio | Assumido que o formulário de edição envia todos os campos, como exige o back; confirmar se o documento pode mudar |
| Dados pessoais dos clientes (documento, e-mail, celular) | Alto | Exibir só a quem tem permissão; não registrar esses dados em logs |
| Mensalista ainda não se conecta à entrada/saída de veículos | Médio | Registrado como fora de escopo; tratar em feature futura |
| Os payloads de exemplo no `input.md` incluem um token de acesso real | Alto | Não copiar o token para specs ou código; recomenda-se revogá-lo/rotacioná-lo |

## 10. Referências

- Contrato dos endpoints: `docs/specs/input.md` (Mensalista: listar, cadastrar, editar; Mensalista/tipo: listar, cadastrar, editar).
- Telas administrativas de referência: Gestão de Preços e Gestão de Usuários (`docs/specs/gerenciamento-precos/`, `docs/specs/gestao-usuarios/`).
