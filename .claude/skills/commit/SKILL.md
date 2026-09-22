---
name: commit
description: Cria commits seguindo Conventional Commits (feat, fix, chore, refactor, docs, style, test, perf, build, ci), separando mudanças de tipos diferentes em commits distintos e gerando mensagens com descrição completa. Use quando o usuário pedir para commitar/fazer commit das mudanças atuais.
---

# Commit

Cria commit(s) das mudanças pendentes seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/), sem nunca commitar automaticamente sem o usuário pedir explicitamente (ver regra global de git).

## Processo

1. Rodar em paralelo: `git status`, `git diff` (staged + unstaged) e `git log --oneline -10` para entender o que mudou e o estilo de mensagens já usado no repo.
2. Agrupar as mudanças por **tipo** e, dentro do tipo, por **assunto/escopo coerente** (ex: mudanças de estilo de um componente vs. uma nova feature não viram o mesmo commit, mesmo que no mesmo tipo).
3. Se as mudanças pendentes cobrem mais de um tipo/assunto, criar **múltiplos commits**, cada um só com os arquivos daquele grupo (`git add <arquivos específicos>` — nunca `git add -A`/`.` quando há mistura de assuntos).
4. Nunca incluir arquivos que pareçam conter segredos (`.env`, credenciais) sem confirmar com o usuário antes.
5. Para cada commit, montar a mensagem no formato abaixo e criar com `git commit -m` via heredoc (evita problemas de escaping).
6. Depois de cada commit, rodar `git status` para confirmar o resultado.
7. Nunca fazer `git push` a menos que o usuário peça isso explicitamente, separado do pedido de commit.

## Tipos (prefixo obrigatório)

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade visível para o usuário/produto |
| `fix` | Correção de bug |
| `refactor` | Mudança de estrutura do código sem alterar comportamento |
| `style` | Formatação, espaçamento, ponto e vírgula — sem mudança de lógica |
| `docs` | Mudanças em documentação (`docs/`, `README`, comentários) |
| `test` | Adição/ajuste de testes |
| `perf` | Melhoria de performance |
| `build` | Mudanças em build, dependências, configuração de bundler |
| `ci` | Mudanças em pipelines/CI |
| `chore` | Manutenção geral que não se encaixa nos anteriores (configs, scripts, tarefas de rotina) |

Usar escopo entre parênteses quando deixar a mensagem mais clara, ex: `feat(home): ...`, `fix(button): ...`. Escopo é opcional, tipo não.

## Formato da mensagem

```
<tipo>(<escopo opcional>): <resumo curto no imperativo, sem ponto final>

<corpo: descrição completa do que mudou e por quê, em 1-3 parágrafos ou
lista com "-", sempre que a mudança não for trivial>

<rodapé de atribuição — ver abaixo>
```

Regras do resumo (primeira linha):
- Imperativo ("adiciona", "corrige", "remove" — não "adicionado"/"adicionando").
- Até ~72 caracteres.
- Sem ponto final.

Regras do corpo:
- Descreve o quê mudou e, principalmente, **por quê** (motivação/contexto), não apenas repetir os nomes de arquivo.
- Se a mudança for realmente trivial (ex: typo, ajuste de config de uma linha), o corpo pode ser omitido.
- Mudança que quebra compatibilidade: adicionar rodapé `BREAKING CHANGE: <explicação>`.

## Rodapé de atribuição
Sempre finalizar a mensagem do commit com a linha de atribuição vigente na sessão (verificar se há uma instrução de sistema com `Co-Authored-By`; se houver, usar exatamente essa linha). Se não houver nenhuma instrução de atribuição ativa, não inventar uma.

## Exemplo de uso
Pedido do usuário: "commita essas mudanças"

Mudanças pendentes: um componente novo (`Hero`) + uma correção de tipagem em `Button` + atualização do `PROCESSO-SPEC-DRIVEN.md`.

→ 3 commits separados:
```
feat(home): adiciona seção hero na página inicial

Cria o componente Hero com título, subtítulo e CTA usando o
Button do design system, substituindo o conteúdo padrão do
create-next-app na rota "/".

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```
```
fix(button): corrige tipagem da prop de variante

A prop `variant` aceitava `string` genérico, permitindo valores
inválidos. Agora usa o union type ButtonVariant.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```
```
docs: atualiza processo spec-driven com exemplo home-hero

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```
