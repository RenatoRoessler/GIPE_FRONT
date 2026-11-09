# Design Spec: Campo prisma na entrada de veículos

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. Não há tela nova: a feature acrescenta o campo **Prisma** aos formulários de entrada (já previsto em `../config-entrada-empresa/design.md`, aqui com a regra de 1 a 999) e um item **Prisma** no ticket do pátio, com edição em um pequeno modal.

## Direção

Modo **Operate**. O prisma é um número curto, digitado com a fila andando. A decisão visual é fazer o campo parecer exatamente o que é: um número de 1 a 999, com teclado numérico no celular, regra dita em texto e erro dito em texto. Na edição, o padrão é o que o ticket já usa para a chave: valor à vista com um link-botão "Alterar", que abre um modal curto.

Princípios:
- A regra (1 a 999) é dita antes do erro, no texto de apoio do campo; o erro repete a regra.
- Só aparece quando a empresa usa o prisma (a configuração está ligada); com a opção desligada, nenhum rastro na tela.
- Reaproveita o que existe: `Input` com teclado numérico, `Modal`, `Button`, `ErrorBanner`, `Toast`, e o padrão item + `LinkBotao` do quadro de chaves.
- Mobile primeiro (360×640), alvos de toque de 44px ou mais.

## Componentes do design system

### Reaproveitados
`Input` via `TextField` (teclado `TECLADO_INTEIRO`, `inputMode="numeric"`), `Modal`, `Button`, `ErrorBanner`, `Toast`, `Text`; o item de ticket (`Item`, `Mono`, `LinkBotao`) do `TicketView`.

### Novos
- **`PrismaField`** (de feature, `components/veiculos`): o campo Prisma dos dois formulários de entrada, com texto de apoio e filtro de dígitos, para o pátio e a conferência não repetirem a mesma configuração. Props: o formulário (campo `prisma`) e `disabled`.
- **`EditarPrismaModal`** (de feature, `components/patio`): modal de edição aberto pelo ticket, no padrão do `GuardarChaveModal`.

Nenhum token novo no tema.

## Campo Prisma nos formulários de entrada

- Rótulo **"Prisma"**; texto de apoio `muted` (via `hint` do `Input`): "Número de 1 a 999."
- Entrada só de dígitos (qualquer outro caractere é descartado ao digitar), no máximo 3 caracteres; teclado numérico no celular e o teclado do sistema (`TECLADO_INTEIRO`) quando o projeto o usa no campo.
- Posição: depois de Cor, no fim do formulário, onde já fica o campo quando a configuração o exige. Na conferência, antes de "Código do ticket (opcional)".
- Obrigatório fora de mensalista; para mensalista o campo some (regra já em vigor).
- Alvo de toque do campo: 44px ou mais, como os demais campos.

Estados e mensagens (aparecem depois que o usuário sai do campo ou tenta registrar, como os outros campos):

| Situação | Mensagem |
| --- | --- |
| Vazio e obrigatório | "Informe o prisma (de 1 a 999)" |
| 0 ou acima de 999 | "Use um número de 1 a 999" |
| Válido | Sem mensagem; o apoio "Número de 1 a 999." continua |

O rodapé de pendências do formulário continua dizendo "Falta: prisma." enquanto estiver vazio.

## Ticket do pátio: item Prisma

No bloco de detalhes (`TicketItens`), depois de "Registrado por" e antes de "Quadro de chaves":

- Aparece só quando a empresa usa o prisma **ou** o veículo já tem um prisma gravado (mesmo critério do gancho: não esconde um valor que existe).
- `dt` **"Prisma"**; `dd` com o número em fonte mono (`Mono`) quando existe, ou "—" quando não.
- Link-botão ao lado (`LinkBotao`): **"Alterar"** se há valor, **"Informar"** se não há. `aria-label`: "Alterar prisma de ABC1D23" / "Informar prisma de ABC1D23".
- Só aparece o link quando a empresa usa o prisma (sem a opção ligada, o valor antigo é mostrado, mas não editável).

## Modal "Prisma" (edição)

Modal pequeno (`size="sm"`), título **"Prisma · {placa}"**.

- Um campo "Prisma" com o apoio "Número de 1 a 999." e o valor atual já preenchido; foco no campo ao abrir (`data-autofocus`).
- Rodapé: **Cancelar** (secundário) e **Salvar**. Salvar fica desabilitado enquanto o valor é inválido ou igual ao atual; durante o envio mostra "Salvando…" e trava o campo e o Cancelar.
- Pressionar Enter no campo salva (se válido).
- Fechar com alterações não salvas descarta sem confirmação (é um campo só).
- Obrigatório fora de mensalista; para mensalista, apagar o valor é permitido e "Salvar" grava a ausência.

Estados:

| Estado | O que o usuário vê |
| --- | --- |
| Padrão | Campo com o valor atual (ou vazio) e Salvar desabilitado. |
| Valor inválido | Mensagem do campo (tabela acima) e Salvar desabilitado. |
| Salvando | Campo e botões desabilitados, "Salvando…". |
| Sucesso | O modal fecha; `Toast` "Prisma atualizado."; o item do ticket mostra o novo valor. |
| Erro ao salvar | `ErrorBanner` `role="alert"` no topo do modal com a mensagem; o valor digitado é mantido e o botão volta a ficar habilitado. |
| Veículo já saiu | `ErrorBanner` com "Este carro não está mais no pátio." e só o botão Fechar; Salvar some. |

## Responsividade

- 360×640: modal em largura de tela com margem do sistema (padrão do `Modal`), botões empilhados com Salvar em cima; sem rolagem horizontal.
- A partir de `md`: modal centralizado pequeno, botões lado a lado à direita.
- Tema escuro herdado do tema; nenhum valor fixo de cor.

## Acessibilidade

- O campo tem rótulo visível e o texto de apoio ligado por `aria-describedby`; o erro vai em `role="alert"` e o campo recebe `aria-invalid`.
- O modal devolve o foco ao link "Alterar" ao fechar.
- O número do prisma no ticket é lido pelo leitor de tela junto do rótulo ("Prisma 45").
- Alvos de toque de 44px ou mais; foco visível.
