# PRD: Lembrar Senha no Login

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-15  
**Versão:** 1.0

---

## 1. Objetivo

Permitir que o usuário opte por guardar seu CPF e senha no navegador, para que, nas próximas visitas à tela de login, os campos já venham preenchidos e ele entre com menos esforço.

## 2. Contexto e Motivação

Hoje o usuário digita CPF e senha a cada acesso ao GIPE. Para quem usa o sistema diariamente no mesmo dispositivo (ex.: operador de caixa/estacionamento), isso é repetitivo. A opção "Lembrar senha" é um recurso comum de telas de login e foi solicitada para agilizar o acesso.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Usuário recorrente do GIPE | Entrar rapidamente sem redigitar CPF e senha | Acessa o sistema todos os dias no mesmo computador/navegador |
| Usuário em dispositivo compartilhado | Não deixar credenciais salvas | Deve poder não marcar a opção, ou removê-la ao sair |

## 4. Escopo

### Dentro do Escopo
- Checkbox "Lembrar senha" na tela de login.
- Salvar CPF e senha no navegador (armazenamento local, persistente) quando a opção estiver marcada e o login for bem-sucedido.
- Preencher automaticamente CPF e senha ao abrir a tela de login, se houver dados salvos.
- Remover os dados salvos quando o login for feito com a opção desmarcada.
- Remover os dados salvos ao clicar em "Sair".

### Fora do Escopo
- Manter a sessão ativa por mais tempo / login automático sem passar pela tela.
- Sincronizar credenciais entre dispositivos ou navegadores.
- Mudanças nas telas de recuperação/redefinição de senha.
- Gestão de múltiplas contas salvas (apenas um par CPF/senha é lembrado).
- Alterações no fluxo de autenticação em si (validação, token, redirecionamento).

## 5. Requisitos Funcionais

### RF-01: Checkbox "Lembrar senha"
**Critério de aceite:**
- Dado que o usuário está na tela de login, quando a tela é exibida, então há um checkbox rotulado "Lembrar senha", acessível por teclado e associado ao seu rótulo.
- Dado que não há dados salvos, quando a tela é exibida, então o checkbox aparece desmarcado.

### RF-02: Salvar credenciais após login com sucesso
**Critério de aceite:**
- Dado que o checkbox está marcado, quando o usuário envia CPF e senha válidos e o login é bem-sucedido, então CPF e senha ficam salvos no navegador.
- Dado que o checkbox está marcado, quando o login falha (credencial inválida ou erro), então nada é salvo.

### RF-03: Preencher campos automaticamente
**Critério de aceite:**
- Dado que há CPF e senha salvos, quando o usuário abre a tela de login, então os campos CPF e senha aparecem preenchidos com os valores salvos e o checkbox "Lembrar senha" aparece marcado.
- Dado que os dados salvos foram preenchidos, quando o usuário clica em "Entrar", então o login segue o fluxo normal.
- Dado que os dados salvos foram preenchidos, quando o usuário altera algum campo, então a alteração é aceita normalmente.

### RF-04: Desmarcar remove os dados salvos
**Critério de aceite:**
- Dado que há dados salvos, quando o usuário desmarca o checkbox e faz login com sucesso, então CPF e senha salvos são removidos do navegador.
- Dado que o checkbox foi desmarcado, quando o usuário volta à tela de login, então os campos aparecem vazios.

### RF-05: Sair remove os dados salvos
**Critério de aceite:**
- Dado que há dados salvos, quando o usuário clica em "Sair" no menu do usuário, então CPF e senha salvos são removidos do navegador.
- Dado que o usuário saiu, quando abre a tela de login, então os campos estão vazios e o checkbox desmarcado.

### RF-06: Tolerância a falha do armazenamento
**Critério de aceite:**
- Dado que o navegador bloqueia ou não dispõe de armazenamento local, quando o usuário usa a tela de login, então o login funciona normalmente, sem mensagem de erro, apenas sem lembrar os dados.

## 6. Requisitos Não-Funcionais

- **Performance:** o preenchimento dos campos não deve atrasar a exibição da tela nem causar "piscada" perceptível de campos vazios para preenchidos.
- **Acessibilidade:** WCAG 2.2 nível AA (rótulo associado, foco visível, operável por teclado).
- **Compatibilidade:** navegadores modernos (Chrome, Edge, Firefox, Safari) em desktop e mobile.
- **Segurança:** guardar a senha no navegador é um risco aceito pelo produto. A senha não deve ser armazenada em texto puro legível (deve ser ofuscada/cifrada no armazenamento), nunca deve aparecer em logs ou URL, e a remoção em "Sair" e ao desmarcar deve ser completa. Deve-se informar ao usuário, de forma discreta, que a opção não é recomendada em computadores compartilhados. **[A DEFINIR]:** nível de proteção do armazenamento — a cifra feita no navegador só dificulta leitura casual, não protege contra quem tem acesso ao dispositivo.

## 7. Fluxos Principais

### Fluxo 1: Primeiro login lembrando a senha
1. Usuário abre a tela de login (campos vazios, checkbox desmarcado).
2. Usuário preenche CPF e senha e marca "Lembrar senha".
3. Usuário clica em "Entrar".
4. Sistema autentica, salva CPF e senha no navegador e redireciona ao dashboard.

### Fluxo 2: Retorno com dados salvos
1. Usuário abre a tela de login.
2. Sistema preenche CPF e senha e marca o checkbox.
3. Usuário clica em "Entrar" e é autenticado.

### Fluxo 3: Parar de lembrar
1. Usuário abre a tela de login com dados salvos.
2. Usuário desmarca "Lembrar senha" e clica em "Entrar".
3. Sistema autentica e remove os dados salvos.

### Fluxo 4: Sair
1. Usuário logado clica em "Sair".
2. Sistema encerra a sessão e remove os dados salvos.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Usuários que retornam e entram sem redigitar credenciais (com opção marcada) | 0% | 100% dos que marcaram a opção |
| Credenciais restantes no navegador após "Sair" ou desmarcar | n/a | 0 |
| Regressão no login sem a opção marcada | n/a | Nenhuma |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| Senha guardada no navegador pode ser lida por quem tem acesso ao dispositivo ou por script malicioso (XSS) | Alto | Cifrar/ofuscar, aviso ao usuário, remoção em "Sair" e ao desmarcar; considerar no futuro lembrar só o CPF |
| Dispositivos compartilhados | Médio | Opção desligada por padrão; aviso discreto |
| Navegador bloqueia armazenamento (modo privado) | Baixo | RF-06: falha silenciosa |
| Conflito com o preenchimento do gerenciador de senhas do navegador | Baixo | Validar comportamento na tela de login existente |

## 10. Referências

- `docs/specs/input.md` (pedido original)
- `docs/specs/login-funcional/prd.md` (login atual)
- `src/components/auth/LoginForm/LoginForm.tsx`
