---
description: Cria commit(s) no padrão do projeto — tipo(FID-XXXX): descrição
---

Crie um ou mais commits das mudanças atuais seguindo o padrão do projeto.

## Padrão da mensagem

```
<tipo>(FID-XXXX): <descrição do que foi ajustado>

- <detalhe objetivo do que mudou, um bullet por mudança relevante>
- <outro detalhe, se houver>
```

- **tipo**: `feat` (nova funcionalidade), `fix` (correção), `refactor`, `style`, `test`, `docs`, `chore`.
- **FID-XXXX**: número da task. **Derive automaticamente do nome da branch** (ex: branch `feature/FID-7538` → `FID-7538`). Se a branch não tiver um `FID-XXXX`, pergunte o número ao usuário antes de commitar.
- **descrição** (linha de assunto): em **PT-BR**, curta, no infinitivo/substantivo descrevendo o que foi ajustado (ex: `ajustes para lançamento`, `correção de textos de carrossel`).
- **corpo** (bullets): em **PT-BR**, detalha objetivamente o que foi desenvolvido/alterado — componentes, hooks, telas ou regras de negócio afetadas. Baseie-se estritamente no `git diff`, um bullet por mudança logicamente distinta. Omita o corpo apenas se a mudança for trivial o suficiente para caber inteiramente na linha de assunto (ex: ajuste de um texto, um `chore` pontual).

Exemplos reais do projeto (linha de assunto, sem corpo detalhado):
- `feat(FID-7358): ajustes para lançamento`
- `fix(FID-7502): correção de textos de carrossel`
- `feat(FID-7513): ajustes layout final`

Exemplo com corpo detalhado:
```
feat(FID-7538): adiciona card de corrida com contagem regressiva

- Cria o componente CorridaCard e o hook useCorridaCard para orquestrar o estado da corrida
- Adiciona lógica de contagem regressiva baseada na data de encerramento vinda da API
- Trata o estado de corrida encerrada exibindo mensagem alternativa no card
```

## Passos

1. Rode `git status` e `git diff` (e `git diff --staged`) para entender exatamente o que mudou.
2. Extraia o `FID-XXXX` da branch atual (`git branch --show-current`). Se não houver, pergunte ao usuário.
3. Decida o(s) `tipo(s)` com base na natureza das mudanças. Se as mudanças forem heterogêneas (ex: uma feature + uma correção não relacionada), proponha **agrupar em commits separados** por escopo lógico e faça o `git add` seletivo de cada grupo.
4. Escreva a linha de assunto em PT-BR resumindo objetivamente o que foi feito. Em seguida, escreva o corpo em bullets detalhando o que foi desenvolvido/alterado (componentes, hooks, telas, regras de negócio) — baseie-se estritamente no diff, não invente nem generalize demais. Pule o corpo apenas para mudanças triviais.
5. Mostre ao usuário a(s) mensagem(ns) completas propostas (assunto + corpo) e confirme antes de commitar.
6. Faça o commit. Se já houver arquivos em stage, respeite o que está staged; caso contrário, faça `git add` do que for pertinente ao commit.

$ARGUMENTS

## Regras

- **Não** faça `push` — apenas commit. O push fica a cargo do `/pr` ou do usuário.
- **Nunca** use `--no-verify` nem pule hooks, a menos que o usuário peça explicitamente.
- Se os hooks de commit falharem, investigue e corrija a causa em vez de contornar.
- **Não** adicione linhas de co-autoria (`Co-Authored-By`) nem qualquer assinatura extra. O commit deve aparecer apenas com o usuário do git que está logado e commitando.
