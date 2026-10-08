# PRD: Preparação da Comunicação com o Backend

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-06  
**Versão:** 1.0

---

## 1. Objetivo

Deixar o GIPE preparado para conversar com o backend real, de forma padronizada e segura, para que as futuras features de integração (login, usuários, preços, movimentação etc.) possam ser construídas sobre uma base única, sem que cada tela precise resolver por conta própria endereço da API, autenticação e tratamento de falhas.

O valor entregue é interno ao time: reduzir o esforço e o risco das próximas tasks de integração e garantir que o sistema aponte para o backend correto em cada ambiente.

## 2. Contexto e Motivação

Hoje todas as telas (login, gestão de usuários etc.) operam com dados mockados. O backend já está disponível em `https://api.gipepark.com.br/api/v1/` e a próxima etapa é integrá-lo. Antes disso, é necessário estabelecer a base de comunicação, evitando retrabalho e inconsistências entre as integrações futuras.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Pessoa desenvolvedora do GIPE | Consumir o backend de forma simples, consistente e tipada | Ao implementar tasks de integração de cada feature |
| Time de DevOps/Entrega | Apontar a aplicação para o backend correto em homologação, Azure e produção sem alterar código | Ao fazer build/deploy em cada ambiente |
| Usuário final do GIPE (indireto) | Receber mensagens claras quando algo falha na comunicação | Ao usar o sistema após a integração |

## 4. Escopo

### Dentro do Escopo
- Definição de 3 ambientes: **homologação (hml)**, **Azure (azl)** e **produção (prod)**, cada um com seu próprio endereço de backend configurável.
- Endereço do backend inicialmente igual nos 3 ambientes: `https://api.gipepark.com.br/api/v1/`.
- Mecanismo para escolher o ambiente ativo sem alterar código, com arquivos de configuração separados por ambiente.
- Serviço central de comunicação com o backend (cliente HTTP via axios), com endereço base e tempo limite padrão.
- Envio automático do token de autenticação da sessão nas requisições.
- Tratamento padronizado de erros (sessão expirada, sem permissão, erro do servidor, falha de rede, tempo esgotado) em um formato único.
- Tipos base para respostas e erros da API.
- Integração da camada de serviço com o padrão de dados já adotado no projeto (TanStack Query), pronta para uso em consultas e mutações.
- Documentação curta de como configurar ambientes e criar um novo serviço de API.

### Fora do Escopo
- Migrar telas existentes (login, gestão de usuários etc.) dos mocks para o backend real — será uma task futura.
- Criar endpoints ou alterar o backend.
- Definir as URLs finais de hml, azl e prod diferentes (ficam como [A DEFINIR]; por ora todas usam a mesma).
- Configuração de pipeline de deploy/CI.
- HTTPS/certificados para o endereço do backend.
- Renovação automática (refresh) de token.

## 5. Requisitos Funcionais

### RF-01: Configuração por ambiente
**Critério de aceite:**
- Dado que existem configurações para hml, azl e prod, quando o ambiente ativo é selecionado, então a aplicação usa o endereço de backend daquele ambiente.
- Dado que nenhum ambiente foi definido, quando a aplicação inicia, então um ambiente padrão de desenvolvimento é usado e o fato é sinalizado de forma clara.
- Dado que o endereço do backend está ausente ou inválido para o ambiente ativo, quando a aplicação inicia, então um erro explícito indica qual configuração está faltando.
- Dado que os três ambientes têm hoje o mesmo endereço, quando um deles for alterado no futuro, então basta mudar sua configuração, sem mexer em código.

### RF-02: Serviço central de comunicação
**Critério de aceite:**
- Dado que um serviço de API precisa chamar o backend, quando usa o cliente central, então a requisição vai para o endereço base do ambiente ativo sem repetir a URL.
- Dado que o backend não responde dentro do tempo limite padrão, quando a requisição expira, então o sistema retorna um erro de "tempo esgotado" padronizado.

### RF-03: Autenticação automática
**Critério de aceite:**
- Dado que há uma sessão autenticada com token, quando qualquer requisição é enviada, então o token é anexado automaticamente.
- Dado que não há sessão, quando uma requisição é enviada, então ela segue sem token, sem erro.
- Dado que o backend responde "não autorizado" (401), quando a resposta é recebida, então o erro é sinalizado de forma padronizada para que a aplicação possa tratar a sessão expirada.

### RF-04: Erros padronizados
**Critério de aceite:**
- Dado qualquer falha (401, 403, 404, 422, 5xx, rede, tempo esgotado), quando ocorre, então quem consome o serviço recebe um erro em formato único, com tipo identificável e mensagem legível em português.
- Dado que o backend devolve uma mensagem de erro própria, quando o erro é normalizado, então essa mensagem é preservada no formato padrão.
- Dado uma falha inesperada, quando ocorre, então nenhum dado sensível (token, cabeçalhos) é exposto na mensagem.

### RF-05: Pronto para uso com TanStack Query
**Critério de aceite:**
- Dado que uma pessoa desenvolvedora cria um novo serviço de API, quando o usa em consultas ou mutações, então os erros padronizados chegam ao estado de erro da consulta sem adaptação adicional.
- Dado que o projeto já usa TanStack Query, quando a nova camada é adicionada, então não há conflito com a camada de dados existente.

### RF-06: Tipos base e documentação
**Critério de aceite:**
- Dado que um serviço novo é escrito, quando se define o retorno, então há tipos base reutilizáveis para resposta e erro da API.
- Dado que alguém novo entra no projeto, quando lê a documentação, então consegue configurar um ambiente e criar um serviço de exemplo sem ajuda.

## 6. Requisitos Não-Funcionais

- **Performance:** tempo limite padrão definido para evitar requisições penduradas (valor a definir na Tech Spec).
- **Acessibilidade:** WCAG 2.2 nível AA (aplicável às mensagens de erro exibidas ao usuário nas features futuras).
- **Compatibilidade:** navegadores modernos já suportados pelo projeto.
- **Segurança:** endereços e configurações por ambiente fora do código-fonte; token nunca registrado em logs ou mensagens de erro. **Atenção:** o backend usa HTTP (sem criptografia) e IP direto; tratar como risco (ver seção 9).
- **Manutenibilidade:** um único ponto de configuração para endereço, tempo limite e autenticação.

## 7. Fluxos Principais

### Fluxo 1: Pessoa desenvolvedora consome um endpoint
1. Pessoa desenvolvedora cria um serviço usando o cliente central.
2. Sistema envia a requisição ao backend do ambiente ativo com o token da sessão.
3. Backend responde com sucesso.
4. Sistema entrega os dados tipados à consulta/mutação.

### Fluxo 2: Falha na comunicação
1. Usuário executa uma ação que chama o backend.
2. Backend responde com erro (ou não responde).
3. Sistema converte a falha em um erro padronizado.
4. A feature exibe uma mensagem clara e, em caso de sessão expirada, a aplicação pode encaminhar o usuário ao login.

### Fluxo 3: Troca de ambiente no deploy
1. Time de entrega seleciona o ambiente (hml, azl ou prod) no build/deploy.
2. Sistema carrega a configuração correspondente.
3. Aplicação passa a apontar para o backend daquele ambiente.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Ambientes configuráveis sem alterar código | 0 | 3 (hml, azl, prod) |
| Serviços de API que repetem URL/token/tratamento de erro | n/a | 0 (tudo via cliente central) |
| Tipos de falha cobertos pelo erro padronizado | 0 | 100% (401, 403, 404, 422, 5xx, rede, timeout) |
| Esforço para a task de integração do login ser iniciada sem trabalho de infraestrutura | Alto | Nenhum |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| Backend em HTTP e IP direto (sem TLS) | Alto | Registrar como risco; recomendar HTTPS antes de produção. Endereço configurável permite trocar sem código |
| Possível bloqueio de conteúdo misto (app em HTTPS chamando API em HTTP) e CORS | Alto | Validar na Tech Spec; avaliar proxy no servidor da aplicação |
| URLs de hml, azl e prod ainda iguais | Médio | Marcadas como [A DEFINIR]; configuração separada já pronta |
| Contrato do token (formato, local de armazenamento) ainda não definido pelo backend | Médio | Alinhar com o time de backend; tratar na Tech Spec |
| Formato de erro do backend desconhecido | Médio | Normalização tolerante, com mensagem padrão quando o formato for inesperado |

## 10. Referências

- `docs/specs/input.md` (descrição original)
- Backend: `https://api.gipepark.com.br/api/v1/`
- Specs relacionadas: `docs/specs/refactor-base-tecnica/`, `docs/specs/login-funcional/`, `docs/specs/autenticacao/`
