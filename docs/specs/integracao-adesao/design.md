# Design Spec: Integração do Fluxo de Adesão

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Evolui o fluxo existente (`docs/specs/adesao-sistema/design.md`): mesmo `Card`, `Stepper`, `PageBackground` e padrão de formulário, agora com 3 etapas. Não é um redesenho; por isso segue o design system sem proposta visual nova.

## Direção

Fluxo público, usado uma única vez, por quem está conhecendo o produto: prioriza clareza e confiança sobre densidade. A novidade visual é a etapa de horários, que precisa ser rápida de preencher (7 dias) sem virar um formulário pesado.

## Componentes do design system

### Reaproveitados
- **Card**, **PageBackground**, **Stepper** (passa de 2 para 3 passos: "Dados da empresa", "Funcionamento", "Usuário titular"), **Button** (`primary` / `secondary`), **Text**, **Input**, **Select**.
- Campos do `form` (`TextField`) e `Grid`/`GridItem` de `src/components/adesao/shared/FormGrid.styles.ts`.
- `ErrorBanner` do `OnboardingWizard.styles.ts` para o erro do backend.

### Novo
- **Switch** (`src/components/ui/Switch`): toggle com `role="switch"` e `aria-checked`, rótulo visível ao lado. Ligado usa `colors.primary`; desligado usa `colors.border`/`colors.surface`; foco visível com o mesmo anel dos demais campos. O estado também é comunicado pelo rótulo ("Aberto"/"Fechado"), não só por cor. É o mesmo componente previsto em `docs/specs/gestao-usuarios/design.md`; quem for implementado primeiro o cria e o outro reaproveita.

### Tokens
Nenhum novo. Espaçamento, `radii`, `colors.border`, `colors.surface`, `colors.textMuted` e `breakpoints.sm` do tema atual. Mensagens de erro nos campos usam o padrão do `Input` (`error`).

## Telas e estados

### Etapa 1: Dados da empresa
Grade de 2 colunas a partir de `breakpoints.sm`, 1 coluna abaixo.

| Linha | Campos |
|-------|--------|
| 1 | CNPJ (largura total) |
| 2 | Razão social, Nome fantasia |
| 3 | Tipo de empresa, Telefone |
| 4 | CEP, Logradouro |
| 5 | Número, Bairro |
| 6 | Cidade, Estado (`Select` com as 27 UFs) |
| 7 | Vagas de moto, Vagas de carro (`Input` numérico, `inputMode="numeric"`) |

- Telefone e CEP com máscara durante a digitação, como CNPJ e CPF hoje.
- Erros por campo só depois de tocado (padrão atual). "Próximo" valida tudo.

### Etapa 2: Funcionamento (nova)
- Título de apoio: "Quando a empresa funciona?" com texto muted ("Defina os horários de cada dia da semana.").
- Lista de 7 linhas, na ordem Domingo a Sábado. Cada linha tem: nome do dia, `Switch` "Aberto", `Switch` "24 horas", campo "Abertura" e campo "Fechamento" (`Input type="time"`).
- Estados por linha:
  - **Fechado**: "24 horas" e horários desabilitados e esmaecidos.
  - **Aberto 24 horas**: horários desabilitados e esmaecidos.
  - **Aberto com horário**: horários habilitados e obrigatórios; erro inline na linha ("Informe a abertura", "O fechamento deve ser depois da abertura").
- Ação auxiliar acima da lista: `Button secondary` pequeno "Copiar Segunda para os outros dias", que replica o estado da segunda-feira (aberto, 24h e horários) nos demais dias. Reduz o preenchimento repetitivo, que é o principal risco de abandono desta etapa.
- Valores iniciais: segunda a sexta abertos de 08:00 a 18:00; sábado e domingo fechados. O padrão evita uma etapa vazia; o usuário ajusta o que for diferente.
- **Ações**: "Voltar" (`secondary`) e "Próximo" (`primary`).

### Etapa 3: Usuário titular
Grade de 2 colunas a partir de `breakpoints.sm`.

| Linha | Campos |
|-------|--------|
| 1 | Nome completo (largura total) |
| 2 | CPF, Celular |
| 3 | E-mail (largura total) |
| 4 | Senha, Repetir senha |

- **Salvando**: botão "Salvar" vira "Salvando..." e fica desabilitado, junto com "Voltar" e os campos.
- **Erro do backend/rede**: `ErrorBanner` (`role="alert"`) no topo do formulário com a mensagem do `ApiError`; os dados permanecem e o botão volta a ficar disponível.
- **Sucesso**: redireciona para `/login?cadastro=sucesso` (comportamento atual).

## Responsividade
- **Abaixo de `breakpoints.sm`**: formulários em 1 coluna. Na etapa 2, cada dia vira um bloco empilhado, com divisória `colors.border`: nome do dia e os dois `Switch` na primeira linha, Abertura e Fechamento lado a lado na segunda.
- **A partir de `breakpoints.sm`**: cada dia ocupa uma linha de grade com colunas alinhadas (dia, aberto, 24h, abertura, fechamento), para o usuário percorrer a lista com o olho e com Tab.
- Alvos de toque dos `Switch` e dos campos de hora com no mínimo 44px de altura.

## Acessibilidade
- Cada linha de dia é um grupo (`role="group"` com `aria-label` do dia), para leitores de tela saberem a qual dia os controles pertencem.
- Campos de hora rotulados "Abertura de <dia>" e "Fechamento de <dia>" (rótulo visível reduzido em desktop pode ficar apenas no cabeçalho da coluna, mas o `aria-label` completo é obrigatório).
- Desabilitar campos de hora não os remove da ordem lógica; o motivo é comunicado pelo estado dos `Switch`.
- Erros de linha ligados ao campo por `aria-describedby`, como no `Input`.
- Ao avançar de etapa, o foco vai para o título da nova etapa.
