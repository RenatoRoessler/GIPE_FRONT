# Design Spec: Aceite de Termos de Uso e Política de Privacidade na Adesão

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. É um acréscimo pontual à etapa final de conferência do fluxo de adesão (`ConferirStep`), não um redesenho de tela: segue o design system sem proposta visual nova, por isso não passa pela skill `impeccable`.

## Direção

O aceite é o último gesto antes de criar a conta e precisa ser inequívoco, mas não pode parecer burocracia nem competir com a conferência dos dados. Dois blocos curtos, no mesmo vocabulário visual dos blocos de resumo, logo depois do último deles e logo acima do botão "Criar conta". Cada bloco diz o que é, dá acesso ao documento completo e tem seu próprio checkbox. Nada vem marcado, e o botão principal só reage quando as duas caixas estão marcadas (o erro explica o que falta).

## Componentes do design system

### Reaproveitados
- **Checkbox** (`ui`): caixa, rótulo, `error` e `aria-invalid` já resolvidos. Cada aceite usa uma instância; o `error` aparece no lugar da dica, junto da caixa.
- **Link** (`ui`): leva ao documento. Abre em nova aba (`target="_blank"` com `rel="noopener noreferrer"`) para o usuário não perder o preenchimento.
- **ConferirStep**: reaproveita `Secao`, `SecaoCabecalho` e `SecaoTitulo` para os dois blocos, que ficam depois de "Plano"/"Teste grátis".
- **ErrorBanner / botão "Corrigir ..."** do topo: já usados para recusa do backend; o alvo de correção passa a poder ser o bloco de aceite.
- **Button**: sem mudança ("Criar conta" / "Criando conta…").

### Novo
- **BlocoAceite**, bloco interno do `ConferirStep` (não vai para `ui` enquanto só existir ali):
  - `section` com `aria-label` igual ao título ("Termos de Uso" / "Política de Privacidade").
  - `SecaoTitulo` com o nome do documento, sem botão "Editar" (não há dado a editar).
  - Uma linha curta explicando o documento, seguida do `Link` "Ler Termos de Uso" / "Ler Política de Privacidade".
  - Abaixo, o `Checkbox` com o rótulo de aceite.
- Precisa ser avaliado no Tech Spec: `Checkbox.label` hoje é `string`, então o link fica fora do rótulo (no corpo do bloco), nunca dentro dele. Isso também evita que clicar no link marque a caixa.

### Tokens
Nenhum novo. Usa `colors.border`, `colors.surface`, `colors.link`, `colors.textMuted`, `colors.danger` (via `error` do `Checkbox`), `radii.lg`, `space`, `fontSizes.sm`/`md`, `fontWeights`, `layout.touchTarget` do tema. O bloco com erro mantém a borda padrão; o destaque de erro vem da mensagem e da caixa (nunca só da cor).

## Telas e estados

### Posição na conferência
Ordem dos blocos na etapa final (nos dois modos):

1. Empresa
2. Endereço e capacidade
3. Pagamentos
4. Horários
5. Titular
6. Plano (ou Teste grátis por 30 dias)
7. **Termos de Uso** (novo)
8. **Política de Privacidade** (novo)

O título e a descrição da etapa ("Revise antes de criar a conta. Dá para corrigir qualquer seção.") não mudam; os blocos 7 e 8 se explicam sozinhos.

### Conteúdo dos blocos
| Bloco | Título | Texto de apoio | Link | Rótulo do checkbox |
|-------|--------|----------------|------|--------------------|
| 7 | Termos de Uso | "As regras para usar o Murel." | Ler Termos de Uso | "Li e aceito os Termos de Uso" |
| 8 | Política de Privacidade | "Como cuidamos dos dados da sua empresa e dos seus clientes." | Ler Política de Privacidade | "Li e aceito a Política de Privacidade" |

### Estados de cada bloco
- **Padrão**: caixa desmarcada, sem mensagem.
- **Marcado**: caixa marcada. Dentro da mesma sessão, o estado é mantido ao voltar a etapas anteriores e retornar.
- **Erro de validação**: ao tentar criar a conta sem o aceite, a mensagem aparece junto da caixa do bloco pendente (via `error` do `Checkbox`): "Aceite os Termos de Uso para continuar." / "Aceite a Política de Privacidade para continuar." Se os dois faltam, os dois mostram erro. O foco vai para a primeira caixa pendente.
- **Erro limpo**: a mensagem some assim que a caixa é marcada.
- **Enviando**: caixas ficam desabilitadas junto do botão ("Criando conta…"); sem envio duplicado.
- **Recusa do backend relacionada ao aceite**: `ErrorBanner` no topo com a mensagem e botão "Corrigir Termos" / "Corrigir Política de Privacidade" que rola e foca a caixa correspondente, sem perder o preenchimento.

### Botão "Criar conta"
Fica habilitado o tempo todo (a validação é nossa, com erro junto do campo e foco no primeiro inválido, como no restante do fluxo). Não usamos botão desabilitado, porque ele não explicaria o que falta.

## Responsividade
- Abaixo de `breakpoints.sm`: cada bloco ocupa a largura toda; texto de apoio, link e checkbox empilham em uma coluna. O link tem alvo de toque de pelo menos `layout.touchTarget`.
- A partir de `breakpoints.sm`: mesma composição, com o texto de apoio e o link na mesma linha quando couberem; o checkbox continua abaixo.
- Sem rolagem horizontal a partir de 320 px; textos longos quebram linha.
- Os dois blocos usam o mesmo espaçamento (`space[3]`) dos demais blocos de conferência.

## Acessibilidade
- Cada bloco é uma `section` com `aria-label` igual ao título, como os demais da conferência.
- O `Checkbox` é um `input` nativo com rótulo visível; o erro é ligado via `aria-describedby` e `aria-invalid`, e anunciado quando aparece.
- O link indica que abre em nova aba (texto visível ou `aria-label` complementar, como "abre em nova aba") e tem foco visível (`colors.focus`).
- A ordem de tab segue a ordem visual: link do Termos → caixa do Termos → link da Política → caixa da Política → "Criar conta".
- Navegação completa por teclado; marcar com Espaço.
- Estado marcado/erro perceptível sem depender só de cor (ícone de check e texto de erro).
- Contraste de texto, link e mensagem de erro atende WCAG 2.2 AA nos dois temas.
