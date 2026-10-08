# PRD: Logs de Atualizações

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-10-08
**Versão:** 1.0

---

## 1. Objetivo

Permitir que quem usa o GIPE saiba em que versão do sistema está e consulte o que mudou em cada atualização, sem precisar perguntar ao time de desenvolvimento. O valor para o usuário é transparência: ver novidades e correções entregues e conseguir informar a versão exata ao reportar um problema.

## 2. Contexto e Motivação

O sistema evolui a cada commit, mas não há como o usuário saber qual versão está usando nem o que foi alterado. Isso dificulta o suporte (não se sabe em que versão ocorreu um problema) e esconde as melhorias entregues. O histórico de commits do projeto já descreve cada mudança e serve como fonte do que será exibido.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Usuário logado do sistema (administrador da empresa e demais perfis) | Saber a versão em uso e ler as novidades e correções | Durante o uso normal, ao notar uma mudança ou ao falar com o suporte |
| Time de desenvolvimento e suporte | Identificar a versão que o usuário está usando | Atendimento de chamados e validação de entregas |

## 4. Escopo

### Dentro do Escopo
- Rodapé nas telas da área logada exibindo a versão atual do sistema.
- Página de logs de atualizações listando as mudanças do tipo novidade (`feat`) e correção (`fix`), com a descrição completa de cada uma.
- Clique na versão do rodapé levando à página de logs.
- Regra de numeração: a versão no formato `1.0.N`, em que `N` é o total de commits do projeto e aumenta em 1 a cada novo commit.

### Fora do Escopo
- Exibir na página os commits de outros tipos (documentação, refatoração, manutenção, estilo, testes, build, CI, performance).
- Rodapé ou página de logs nas telas públicas (login, adesão, recuperar e alterar senha).
- Versionamento semântico por tags, notas de versão escritas manualmente ou "o que há de novo" em pop-up.
- Filtros, busca, paginação avançada ou exportação dos logs.
- Notificar usuários quando uma nova versão for publicada.
- Edição dos textos dos logs pelo usuário.

## 5. Requisitos Funcionais

### RF-01: Rodapé com a versão
**Critério de aceite:**
- Dado que estou logado e em qualquer tela da área logada, quando a tela é exibida, então vejo um rodapé com a versão no formato `v1.0.N`.
- Dado que estou em uma tela pública (login, adesão, recuperar ou alterar senha), quando a tela é exibida, então o rodapé de versão não aparece.
- Dado que uma nova versão do sistema foi publicada, quando abro o sistema, então o rodapé mostra o número da versão atual.

### RF-02: Numeração da versão
**Critério de aceite:**
- Dado que o projeto tem N commits, quando a versão é exibida, então o número é `1.0.N`.
- Dado que um novo commit é adicionado ao projeto, quando o sistema é publicado novamente, então a versão exibida aumenta em 1.
- Dado que o commit adicionado não é de novidade nem de correção (ex.: documentação), quando o sistema é publicado, então a versão ainda aumenta em 1, mas a página de logs não ganha nova entrada.

### RF-03: Acesso à página de logs pelo rodapé
**Critério de aceite:**
- Dado que vejo a versão no rodapé, quando clico nela, então sou levado à página de logs de atualizações.
- Dado que a versão é um link, quando navego por teclado, então ela recebe foco visível e abre a página com Enter.
- Dado que estou na página de logs, quando recarrego a página, então continuo nela (a página tem endereço próprio).

### RF-04: Lista de logs de atualizações
**Critério de aceite:**
- Dado que abro a página de logs, quando ela carrega, então vejo as entradas de novidades e correções da mais recente para a mais antiga.
- Dado que uma entrada é exibida, quando a leio, então ela mostra: número da versão correspondente, tipo (novidade ou correção), título, descrição completa (corpo do commit, quando houver) e data.
- Dado que existem commits de outros tipos, quando a lista é exibida, então eles não aparecem.
- Dado que a lista é longa, quando rolo a página, então consigo ver todas as entradas anteriores até a primeira.
- Dado que ainda não há nenhuma novidade ou correção, quando abro a página, então vejo uma mensagem informando que não há atualizações registradas.

### RF-05: Destaque da versão atual
**Critério de aceite:**
- Dado que cheguei à página de logs pelo rodapé, quando a página abre, então a entrada correspondente à versão atual (ou a mais recente de novidade/correção até ela) aparece destacada e visível sem precisar rolar.
- Dado que a versão atual é de um commit que não aparece na lista, quando a página abre, então o destaque vai para a entrada mais recente anterior a ela.

### RF-06: Proteção de acesso
**Critério de aceite:**
- Dado que não estou logado, quando tento abrir a página de logs, então sou levado à tela de login.

### RF-07: Leitura em qualquer dispositivo
**Critério de aceite:**
- Dado que uso o sistema no celular ou no computador, quando vejo o rodapé e a página de logs, então ambos ficam legíveis, sem rolagem horizontal, e funcionam nos modos de tema claro e escuro.

## 6. Requisitos Não-Funcionais

- **Performance:** a página de logs abre sem espera perceptível, mesmo com centenas de entradas.
- **Acessibilidade:** WCAG 2.2 nível AA (contraste do rodapé nos dois temas, foco visível no link da versão, hierarquia de títulos na lista).
- **Compatibilidade:** navegadores atuais em desktop e mobile, nos temas claro e escuro.
- **Segurança:** a página só é acessível a usuário logado. O conteúdo exibido vem do histórico de commits e não deve expor informação sensível; mensagens de commit devem ser revisadas com esse cuidado. **[A DEFINIR]** se haverá revisão ou filtro das mensagens antes de exibir.

## 7. Fluxos Principais

### Fluxo 1: Consultar a versão e as novidades
1. Usuário entra no sistema e navega por qualquer tela da área logada.
2. Sistema mostra no rodapé a versão atual (ex.: `v1.0.41`).
3. Usuário clica na versão.
4. Sistema abre a página de logs com a entrada da versão atual destacada.
5. Usuário rola a lista para ver as atualizações anteriores.

### Fluxo 2: Informar a versão ao suporte
1. Usuário encontra um problema.
2. Usuário lê a versão no rodapé.
3. Usuário informa a versão ao suporte, que identifica o que já estava incluído naquela versão.

### Fluxo 3: Nova versão publicada
1. Time adiciona um novo commit e o sistema é publicado.
2. Sistema passa a exibir a versão incrementada no rodapé.
3. Se o commit for novidade ou correção, a página de logs ganha a nova entrada no topo.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Chamados de suporte que informam a versão do sistema | Não medido | A maioria dos chamados com versão informada |
| Usuários que acessam a página de logs | Não existe | Acompanhar acessos após o lançamento |
| Versão exibida igual à versão publicada | Não existe | 100% das publicações |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| O histórico completo de commits precisa estar disponível no ambiente onde o sistema é publicado; sem ele a contagem e a lista ficam incorretas | Alto | Garantir o histórico completo no processo de publicação; definir comportamento de contingência |
| Mensagens de commit escritas para desenvolvedores podem ser técnicas demais ou conter detalhes internos para usuários finais | Médio | Padronizar mensagens de `feat`/`fix` em linguagem clara; **[A DEFINIR]** revisão antes de publicar |
| Commits que não são `feat`/`fix` aumentam a versão sem aparecer na lista, o que pode parecer "salto" | Baixo | Explicar na própria página que a versão conta todas as alterações do sistema |
| Reescrita do histórico (rebase, squash) muda a contagem e as entradas | Médio | Evitar reescrever o histórico da branch principal |
| Sem contingência definida quando o histórico não puder ser lido | Médio | **[A DEFINIR]** o que exibir (ex.: versão indisponível e página com aviso) |

## 10. Referências

- Pedido original: `docs/specs/input.md`.
- Padrão de mensagens: Conventional Commits, conforme a skill `commit` do projeto.
- **[A DEFINIR]** idioma e tom das mensagens exibidas ao usuário (hoje em português, escritas para o time).
