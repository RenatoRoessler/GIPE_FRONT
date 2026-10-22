# PRD: Integração da Gestão de Usuários

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-22  
**Versão:** 1.0

> Este PRD substitui, no que conflitar, o PRD `docs/specs/gestao-usuarios/prd.md` (versão mockada, com sobrenome e perfis 1–4). Aquele documento fica como histórico.

---

## 1. Objetivo

Permitir que o Administrador da empresa gerencie quem tem acesso ao GIPE usando a API real de usuários: consultar um CPF, dar acesso a uma pessoa, mudar o perfil dela e ativar ou inativar o acesso. Qualquer usuário logado também deve conseguir trocar a própria senha.

## 2. Contexto e Motivação

A gestão de usuários existia apenas com dados mockados. A API de Usuário agora está disponível e traz regras que a versão mockada não cobria:

- Uma pessoa (CPF) tem um único cadastro no GIPE, e pode ter acesso a várias empresas, com um perfil por empresa.
- Se o CPF já existe, o cadastro na empresa só concede acesso. Os dados pessoais e a senha continuam sendo da pessoa.
- Se o CPF é novo, o usuário é criado com uma senha temporária enviada por e-mail e é obrigado a trocá-la no primeiro acesso.
- A empresa nunca pode ficar sem um Administrador ativo.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Administrador | Dar, alterar e retirar acessos dos funcionários da empresa | Ao contratar, mudar a função ou desligar alguém |
| Qualquer usuário logado (Administrador, Gerente, Manobrista, Caixa, Financeiro) | Trocar a própria senha | Quando quiser renovar a senha ou suspeitar que ela vazou |
| Pessoa com acesso em mais de uma empresa | Usar o mesmo CPF e a mesma senha nas empresas | Ao receber acesso a uma empresa nova |

## 4. Escopo

### Dentro do Escopo
- Listagem dos usuários com acesso à empresa.
- Consulta de CPF antes do cadastro.
- Cadastro de usuário novo e concessão de acesso a pessoa já cadastrada no GIPE.
- Alteração de perfil de um usuário na empresa.
- Ativação e inativação de um usuário na empresa.
- Troca da própria senha por qualquer usuário logado.
- Perfis: Administrador, Gerente, Manobrista, Caixa e Financeiro.
- Evolução das telas `/usuarios` e `/usuario/editar` já existentes.

### Fora do Escopo
- Exclusão definitiva de usuário (a inativação cobre o caso).
- Edição de nome, e-mail ou celular de outra pessoa (só o próprio usuário altera esses dados).
- Fluxo de primeiro acesso e troca da senha temporária (tratado pela autenticação).
- Recuperação de senha esquecida.
- Regras finas de permissão por menu (PRD de Permissões).
- Reenvio da senha temporária.

## 5. Requisitos Funcionais

### RF-01: Listar usuários da empresa
**Critério de aceite:**
- Dado que sou Administrador, quando abro a gestão de usuários, então vejo uma tabela com nome, CPF, e-mail, celular, perfil, status (ativo/inativo) e data de criação.
- Dado que a lista está carregando, quando aguardo, então vejo um estado de carregamento.
- Dado que a consulta falha, quando a tela tenta carregar, então vejo uma mensagem de erro e posso tentar novamente.
- Dado que o perfil é exibido, quando leio a tabela, então o perfil aparece com o nome em português (ex.: "Administrador"), nunca como número.

### RF-02: Consultar CPF antes de cadastrar
**Critério de aceite:**
- Dado que inicio um novo cadastro, quando informo um CPF (com ou sem máscara), então o sistema valida o dígito verificador antes de consultar.
- Dado um CPF válido, quando a consulta termina, então o sistema indica se a pessoa já tem cadastro no GIPE.
- Dado um CPF já cadastrado e já vinculado a esta empresa, quando a consulta termina, então o sistema informa que a pessoa já tem acesso e não permite cadastrar de novo.
- Dado um CPF inválido, quando tento avançar, então vejo a mensagem de erro e a consulta não é feita.

### RF-03: Dar acesso a pessoa já cadastrada no GIPE
**Critério de aceite:**
- Dado um CPF encontrado e não vinculado à empresa, quando a consulta termina, então vejo nome, e-mail e celular somente para conferência, sem poder editá-los.
- Dado os dados conferidos, quando escolho o perfil e confirmo, então a pessoa passa a ter acesso à empresa com esse perfil.
- Dado que o acesso foi concedido, quando a operação termina, então vejo a confirmação de que a pessoa foi avisada do novo acesso por e-mail e o usuário aparece na lista.
- Dado esse fluxo, quando concluo, então a senha e os dados pessoais da pessoa permanecem os que ela já tinha.

### RF-04: Cadastrar usuário novo
**Critério de aceite:**
- Dado um CPF não encontrado, quando a consulta termina, então o formulário pede nome, e-mail, celular e perfil, todos obrigatórios.
- Dado o formulário preenchido corretamente, quando confirmo, então o usuário é criado e vejo a confirmação de que uma senha temporária foi enviada por e-mail.
- Dado algum campo obrigatório vazio ou com formato inválido (e-mail, celular), quando tento confirmar, então vejo o erro no campo e nada é enviado.
- Dado que a operação foi concluída, quando volto à lista, então o novo usuário aparece nela.

### RF-05: Alterar perfil
**Critério de aceite:**
- Dado um usuário da lista, quando escolho outro perfil e confirmo, então o perfil é atualizado para esta empresa.
- Dado que a mudança só vale a partir do próximo login do usuário, quando salvo, então a tela avisa isso.
- Dado que o usuário é o último Administrador ativo, quando tento rebaixar o perfil dele, então o sistema impede e explica o motivo.

### RF-06: Ativar e inativar usuário
**Critério de aceite:**
- Dado um usuário ativo, quando peço para inativar e confirmo, então ele perde o acesso apenas a esta empresa, e as outras empresas dele não mudam.
- Dado um usuário inativo, quando peço para reativar, então o acesso à empresa é restabelecido.
- Dado que a mudança vale a partir do próximo login, quando salvo, então a tela avisa isso.
- Dado que o usuário é o último Administrador ativo, quando tento inativá-lo, então o sistema impede e explica o motivo.
- Dado que peço para inativar, quando a tela abre a confirmação, então ela deixa claro quem será afetado antes de eu confirmar.

### RF-07: Alterar a própria senha
**Critério de aceite:**
- Dado que estou logado com qualquer perfil, quando informo a senha atual e uma nova senha com ao menos 6 caracteres e diferente da atual, então a senha é alterada e sigo logado.
- Dado que a senha atual está incorreta, quando confirmo, então vejo o erro sem perder o que digitei nos outros campos.
- Dado que a nova senha tem menos de 6 caracteres ou é igual à atual, quando tento confirmar, então vejo o erro antes do envio.
- Dado que a senha é da pessoa, quando é alterada, então a tela informa que ela vale para todas as empresas do usuário.

### RF-08: Erros e feedback
**Critério de aceite:**
- Dado qualquer operação acima, quando a API retorna erro, então o usuário vê uma mensagem clara em português e pode tentar de novo.
- Dado qualquer operação em andamento, quando o usuário aguarda, então os botões de ação ficam indisponíveis para evitar envio duplicado.

## 6. Requisitos Não-Funcionais

- **Performance:** a lista exibe o estado de carregamento imediatamente e a consulta de CPF responde de forma perceptível como instantânea para o usuário (**[A DEFINIR]** meta numérica).
- **Acessibilidade:** WCAG 2.2 nível AA, com campos rotulados, erros associados aos campos, foco gerenciado em modais e ações da tabela com nome acessível.
- **Compatibilidade:** desktop e mobile (telas responsivas), navegadores atuais.
- **Segurança:** a gestão de usuários é restrita ao Administrador; a troca de senha nunca exibe nem registra a senha; o CPF e os dados pessoais só são exibidos a quem tem permissão de gestão.

## 7. Fluxos Principais

### Fluxo 1: Dar acesso a pessoa nova no GIPE
1. Administrador abre a gestão de usuários e escolhe novo usuário.
2. Informa o CPF.
3. Sistema não encontra cadastro e mostra o formulário.
4. Administrador preenche nome, e-mail, celular e perfil e confirma.
5. Sistema cria o usuário, avisa que a senha temporária foi enviada por e-mail e atualiza a lista.

### Fluxo 2: Dar acesso a pessoa já cadastrada
1. Administrador informa o CPF.
2. Sistema encontra a pessoa, não vinculada à empresa, e mostra nome, e-mail e celular para conferência.
3. Administrador escolhe o perfil e confirma.
4. Sistema concede o acesso, avisa que a pessoa foi notificada por e-mail e atualiza a lista.

### Fluxo 3: Mudar perfil ou inativar
1. Administrador escolhe um usuário na lista.
2. Altera o perfil ou o status e confirma.
3. Sistema salva, avisa que vale no próximo login do usuário e atualiza a lista.
4. Se for o último Administrador ativo, o sistema impede e explica.

### Fluxo 4: Trocar a própria senha
1. Usuário abre a troca de senha.
2. Informa senha atual e nova senha.
3. Sistema valida, altera a senha e mantém o usuário logado.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Cadastro de usuário concluído sem apoio do suporte | Sem fluxo real hoje | 100% dos cadastros feitos pelo próprio Administrador |
| Empresas sem Administrador ativo | — | 0 |
| Tentativas de cadastro duplicado para o mesmo CPF na empresa | — | 0 (bloqueadas na consulta de CPF) |
| Tempo médio para dar acesso a um usuário | **[A DEFINIR]** | **[A DEFINIR]** |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| API de Usuário (`/api/v1/Usuario` e subrotas) disponível e estável | Alto | Isolar toda a comunicação em um único serviço, no padrão dos demais serviços de integração |
| E-mail de senha temporária ou de aviso de acesso não chega | Médio | Informar na tela que o e-mail foi enviado e orientar a conferir o endereço |
| Mudança de perfil ou inativação só vale no próximo login | Médio | Avisar na tela; sessão atual do usuário não é derrubada |
| Remover o último Administrador ativo | Alto | Regra aplicada pela API; a tela também previne e explica |
| Perfil Financeiro (8) sem permissões definidas nos menus | Médio | Alinhar com o PRD de Permissões antes de liberar o perfil |
| Divergência com o PRD antigo (sobrenome, perfis 1–4) | Baixo | Este PRD prevalece; telas existentes precisam ser ajustadas |
| Restrição de acesso à gestão apenas a Administrador é uma suposição | Médio | **[A DEFINIR]** confirmar se Gerente também gerencia usuários |

## 10. Referências

- `docs/specs/input.md` (contrato dos endpoints: listagem, cadastro, consulta de CPF, perfil, ativo e senha)
- `docs/specs/gestao-usuarios/prd.md` (versão mockada anterior)
- `docs/specs/permissoes/prd.md` e `docs/specs/autenticacao/prd.md`
- Telas existentes: `src/app/(app)/usuarios/page.tsx` e `src/app/(app)/usuario/editar/page.tsx`
