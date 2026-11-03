# Design Spec: Teste Grátis na Adesão

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. É um ajuste pontual no fluxo existente de adesão (`Stepper`, `AdesaoShell`, `ConferirStep`, `CredencialEmpresa`), não um redesenho de tela: segue o design system sem proposta visual nova, por isso não passa pela skill `impeccable`.

## Direção

Quem vem do teste grátis foi prometido "sem cartão, sem compromisso, escolhe o plano no fim". A adesão precisa confirmar isso em silêncio: menos uma etapa, nenhum preço à vista, e na conferência uma linha clara dizendo o que a pessoa está levando. A única peça visual nova é esse resumo do teste; todo o resto é o fluxo atual com uma etapa a menos.

## Componentes do design system

### Reaproveitados
- **AdesaoShell**, **Stepper**, **Button** (`primary` / `secondary`), **ErrorBanner**, **CredencialEmpresa**: sem mudança de estrutura.
- **ConferirStep**: mantém `Secoes`, `Secao`, `SecaoCabecalho`, `SecaoTitulo`, `Lista`, `Termo` e `Detalhe`. O bloco "Plano" é trocado por "Teste grátis" no modo teste.
- Check de `PlanoStepFields` (SVG de traço, 14px, `aria-hidden`) para marcar cada garantia. Se o mesmo SVG já aparecer em três lugares, extrair para `ui` na implementação.

### Novo
- **ResumoTeste**, bloco interno do `ConferirStep` (não vai para `ui` enquanto só existir ali): mesma `Secao` dos outros blocos, com realce de teste.
  - Cabeçalho: `SecaoTitulo` "Teste grátis por 30 dias". **Sem botão "Editar"** (não há o que editar). Para o leitor de tela, a seção mantém `aria-label="Teste grátis por 30 dias"`.
  - Corpo: uma frase e uma lista de três garantias.
  - Realce: `border-color: colors.primary` e `background-color: colors.primarySoft` no lugar de `border` e `surface`. É decorativo; o significado está no título e no texto, nunca só na cor.

### Tokens
Nenhum novo. Usa `colors.primary`, `colors.primarySoft`, `colors.success` (check), `colors.textMuted`, `radii.lg`, `space`, `fontSizes.sm` e `fontSizes.md`, `fontWeights` do tema. Conferir o contraste do texto sobre `primarySoft` nos dois temas (claro e escuro) na implementação.

## Telas e estados

### Fluxo no modo teste
| # | Etapa | Muda? |
|---|-------|-------|
| 1 | Dados da empresa | Não |
| 2 | Quando a empresa funciona? | Não |
| 3 | Usuário titular | Só o botão: "Próximo: Conferir" |
| 4 | Confira os dados | Troca o bloco "Plano" pelo resumo do teste |

- O `Stepper` mostra quatro passos: Empresa, Horários, Titular, Conferir. A etapa "Plano" não existe nem como passo desabilitado.
- O número exibido da etapa final é 4 (de 4), não 5. O Tech Spec decide como mapear isso sem quebrar as posições fixas de `ETAPA`.
- A etapa de plano nunca é exibida no modo teste, nem ao voltar com "Voltar" ou pelo `Stepper`.

### Conferir no modo teste
Ordem dos blocos igual à de hoje, com o último substituído:

1. Empresa
2. Endereço e capacidade
3. Pagamentos (são os meios que a empresa aceita dos clientes dela; não é cobrança da Murel, e o rótulo "Meios aceitos" já deixa isso claro)
4. Horários
5. Titular
6. **Teste grátis por 30 dias** (novo, sem "Editar")

Conteúdo do bloco 6:
- Frase: "Use o sistema completo por 30 dias. No fim do teste, você escolhe o plano que fizer mais sentido." Texto `fontSizes.sm`, cor de texto padrão.
- Lista (`ul`, sem marcadores nativos, check à esquerda):
  - Todas as funcionalidades
  - Sem cartão de crédito
  - Sem compromisso
- Sem valor por mês, sem total, sem periodicidade.

Estados do botão principal na conferência: iguais aos atuais ("Criar conta" / "Criando conta…"), e erro do backend no `ErrorBanner` do topo.

### Textos que mudam no modo teste
| Onde | Texto |
|------|-------|
| Título da etapa 4 | "Confira os dados" (igual) |
| Descrição da etapa 4 | "Revise antes de criar a conta. Dá para corrigir qualquer seção." (igual) |
| Rótulo do botão da etapa 3 | "Próximo: Conferir" (o rótulo vem do nome da próxima etapa) |
| Credencial da empresa, linha do plano | "Plano: Teste grátis · 30 dias" |

Os textos do fluxo pago não mudam. Nenhum texto do modo teste cita preço, cartão como exigência ou retenção de dados (ver riscos do PRD).

### Credencial da empresa
Hoje mostra "Plano: <nome> · R$/mês" ou traço quando não há plano. No modo teste mostra "Plano: Teste grátis · 30 dias" desde a primeira etapa (o modo já é conhecido na abertura), nunca o traço de "plano pendente".

### Fluxo pago e sem parâmetro
Sem mudança visual. `tipoPlanoAdesao` ausente, inválido ou de 1 a 4 mantém as cinco etapas e a etapa de plano exatamente como estão.

## Responsividade
- Abaixo de `breakpoints.sm`: o resumo do teste é um bloco de uma coluna; as garantias empilham, uma por linha, com alvo de leitura de pelo menos 44px de altura de linha somando espaçamento.
- A partir de `breakpoints.sm`: as garantias podem ficar em linha, quebrando para a próxima se não couberem (`flex-wrap`), com `gap` do tema.
- Sem rolagem horizontal a partir de 360 px.

## Acessibilidade
- O bloco é uma `section` com `aria-label` igual ao título, como os demais da conferência.
- A lista de garantias é uma lista real (`ul` com `li`); os checks são `aria-hidden`. O significado não depende de cor nem do ícone.
- Sem controle interativo no bloco, então não entra na ordem de tab; o foco continua indo para o título da etapa ao trocar de etapa.
- Contraste do texto sobre `primarySoft` e do check (`success`) sobre o fundo atende WCAG 2.2 AA nos dois temas.
- O `Stepper` anuncia quatro etapas, não cinco, no modo teste.
