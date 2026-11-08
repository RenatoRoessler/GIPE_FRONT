# Tech Spec: Faturas otimizado para celular

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para lá e fixa o que muda de implementação)
- Módulo atual: `src/components/faturas/*`, spec original em `../faturas/` (a regra de negócio, o contrato com o back e os tipos **não mudam**)

## Design
- **Telas/estados:** como em `design.md` §2 a §6. Lista e detalhe ganham arranjo próprio abaixo de `breakpoints.md`; os três fluxos (emitir, pagar, cancelar) mudam só no que está listado nas seções 4 a 6 do design.
- **Componentes do design system reaproveitados:** `Modal`, `Button`, `Select`, `Textarea`, `OptionGroup`, `Accordion`/`AccordionItem`, `StatusBadge`, `PlateDisplay`, `InfoCard`, `ErrorBanner`, `Skeleton`, `Pagination`, `Toast`, `BackButton`, `Text`; campos de formulário `OptionField`, `SelectField`, `TextField`, `TextareaField`.
- **Componentes novos (todos em `src/components/faturas`, nenhum em `ui`):** `FaturaCard`, `SaidaCard`, `VencimentoAviso`, `FiltrosFaturas`, `AcoesFatura`, `ObservacaoFatura`, mais as funções puras de `vencimento.ts`.
- **Alterações em componentes compartilhados (pequenas, retrocompatíveis):** `Modal` (rodapé com área segura), `Pagination` (alvo de toque), `Select` (prop para ocultar o rótulo), `OptionField` (prop `columns`).
- **Tokens de tema:** nenhum valor visual novo. Um token em `layout`: `fabClearance`. Nenhuma cor nova.

## Arquitetura da solução

### Princípio
**Uma implementação, dois arranjos.** Os dados e os formatadores são os mesmos; o que muda é a apresentação, escolhida com o hook que o projeto já tem, `useIsMobile()` (`src/hooks/useMediaQuery.ts`, abaixo de `breakpoints.md`). Isso renderiza **um só** arranjo por vez (sem DOM duplicado para leitores de tela, como pede o design §9) e segue o precedente de Mensalistas e do Financeiro. Estilo puramente responsivo (espaçamentos, larguras) continua em media queries do styled-components.

Consequência: o servidor e a primeira renderização do cliente usam o arranjo de computador (`useMediaQuery` devolve `false` sem `matchMedia`). Como lista e detalhe só mostram dados depois de uma consulta no cliente (começam em `Skeleton`), o arranjo certo já está resolvido quando o conteúdo aparece. Os esqueletos são escolhidos pelo mesmo hook.

### Funções puras novas: `src/components/faturas/vencimento.ts` (+ `vencimento.test.ts`)
Sem React, sem `Date` implícito: todas recebem `hoje` como texto `AAAA-MM-DD` (o vencimento é só data; obtém-se `hoje` com `formatDataInput(new Date())` de `@/lib/periodo`, fuso local do aparelho).

```ts
export const LIMITE_PERTO_DE_VENCER_DIAS = 3;

// Dias entre hoje e o vencimento (negativo = já passou). Usa Date.UTC das partes, sem horário de verão.
export function diasParaVencer(vencimento: string, hoje: string): number;

export type AvisoVencimento = {
  // vencida e hoje: tom de perigo; proxima: ênfase; futura: neutro.
  tipo: "vencida" | "hoje" | "proxima" | "futura";
  texto: string; // "Vencida há 3 dias" | "Vencida ontem" | "Vence hoje" | "Vence amanhã · 10/11" | "Vence em 2 dias · 10/11" | "Vence em 10/12"
};

// Só fatura aberta recebe aviso; paga e cancelada devolvem null (o vencimento deixou de importar).
export function avisoVencimento(fatura: Pick<Fatura, "situacao" | "vencimento">, hoje: string): AvisoVencimento | null;

// Atalhos do modal de emissão: hoje + N dias, e qual atalho o valor atual representa (ou "").
export const ATALHOS_VENCIMENTO_DIAS = [7, 15, 30] as const;
export function vencimentoEm(hoje: string, dias: number): string;
export function atalhoSelecionado(vencimento: string, hoje: string): string;
```

`avisoVencimento` e `atalhoSelecionado` não guardam estado: o atalho marcado é **derivado** do valor do campo (se o usuário digita uma data fora dos atalhos, nenhum fica marcado, sem estado extra).

### Lista (`FaturasPage`, `FaturasLista`)

| Arquivo | Mudança |
|---|---|
| `FiltrosFaturas/FiltrosFaturas.tsx` (**novo**) | Extrai o bloco de filtros de `FaturasPage`. Recebe `filtros`, `conveniadas` (a consulta) e `onChange(proximo)`. Em computador renderiza exatamente o que `FaturasPage` renderiza hoje. No celular: `OptionGroup` de situação em 4 colunas, `Select` com `hideLabel` e primeira opção "Todas as conveniadas", e, se houver filtro ativo, a linha "Filtrando: Abertas · Auto Peças Sul" com o botão de texto "Limpar" (chama `onChange(SEM_FILTROS)`). |
| `FaturasPage/FaturasPage.tsx` | Usa `FiltrosFaturas`. No celular não mostra o botão do cabeçalho e mostra o `EmitirFlutuante` (exceto no vazio sem filtro, que já tem o botão no `EmptyState`; para isso `FaturasLista` informa o estado via `onEstadoVazio`/prop derivada, ou a página lê o mesmo `useFaturas(filtros)` — mesma chave de consulta, sem nova requisição). Reserva `fabClearance` no fim da página no celular. |
| `FaturasLista/FaturasLista.tsx` | Abaixo de `md`, troca a `Table` por uma lista de `FaturaCard`; paginação e estados (carregando, vazio, erro, 403, atualizando) inalterados. Esqueleto no celular: 4 blocos com a altura do cartão. Ao trocar de página, rola ao topo (`window.scrollTo`). |
| `FaturaCard/FaturaCard.tsx` (**novo**) | Cartão do §2.2: `<li>` com o número como âncora esticada (`NextLink` com `::after { inset: 0 }`, o mesmo padrão de link de linha do projeto; o clique em qualquer ponto vai ao detalhe e nenhum `onClick` de linha é necessário). Recebe `fatura` e `hoje`. Nome acessível completo via `aria-label` do link ("Fatura 12, Auto Peças Sul, R$ 1.250,00, aberta, vence em 2 dias"). Usa `StatusBadge`, `VencimentoAviso`, `formatBRL`, `quantidadeSaidas`. Fundo `dangerSoft` para `vencida`/`hoje`. |
| `VencimentoAviso/VencimentoAviso.tsx` (**novo**) | Recebe `aviso: AvisoVencimento`; renderiza o ícone (SVG inline, decorativo, `aria-hidden`) e o texto. Perigo (`danger`), ênfase (`text`, bold) ou neutro (`textMuted`). Usado em `FaturaCard` e no herói. |
| `Faturas.styles.ts` | Segue com o que já existe. Os estilos novos vão para `FaturasMobile.styles.ts` (**novo**) para não inchar o arquivo: `ListaCartoes`, `CartaoFatura`, `CartaoSaida`, `EmitirFlutuante`, `BarraAcoes`, `LinhaFiltrando`. |

`hoje` é calculado **uma vez** por montagem em quem renderiza a lista (`useState(() => formatDataInput(new Date()))`, o mesmo idioma dos modais) e passado aos cartões; não se recalcula por cartão.

`EmitirFlutuante`: `styled(Button)` com o mesmo desenho de `NovoFlutuante` (Mensalistas): `position: fixed`, `right: max(space[3], env(safe-area-inset-right))`, `bottom: calc(space[3] + layout.bottomNavReserved + env(safe-area-inset-bottom))`, `z-index: 10`, `min-height: 48px`, `radii.full`, `shadows.md`.

### Detalhe (`FaturaDetalhe`, `ItensFatura`, `CicloFatura`)

| Arquivo | Mudança |
|---|---|
| `FaturaDetalhe/FaturaDetalhe.tsx` | Lê `useIsMobile()`. Herói: acrescenta `VencimentoAviso` no lugar de "vence em …" (aberta) e `ObservacaoFatura`. Ações: no celular, `AcoesFatura` dentro de `BarraAcoes` (último filho da `Page`); em `md` ou mais, `AcoesFatura` dentro do herói como hoje. Ciclo: no celular `Accordion` > `AccordionItem` (`title="Ciclo da fatura"`, `summary={resumoCiclo(fatura)}`, fechado por padrão, estado local `cicloAberto`) com `CicloFatura` no painel; em `md` ou mais, o `Cartao` do ciclo como hoje. Modais e Toast inalterados. |
| `AcoesFatura/AcoesFatura.tsx` (**novo**) | Os dois botões ("Cancelar fatura" secundário, "Registrar pagamento" primário) e suas regras `podePagar`/`podeCancelar`, extraídos do herói para serem renderizados nos dois lugares sem duplicar a lógica. Props: `fatura`, `onPagar`, `onCancelar`. Não renderiza nada se a fatura não está aberta (a `BarraAcoes` também não é montada). |
| `BarraAcoes` (em `FaturasMobile.styles.ts`) | `position: sticky; bottom: calc(layout.bottomNavReserved + env(safe-area-inset-bottom, 0px)); z-index: 5;` com margem lateral negativa de `space[3]` (cancela o padding do `Main`) e fundo `surface` com borda superior `border`, o **mesmo desenho do rodapé de Conferência** (`Conferencia.styles.ts`). Botões em linha: "Cancelar fatura" `flex: 1`, "Registrar pagamento" `flex: 2`, ambos com `min-height: layout.touchTarget`. O `z-index` fica abaixo da barra de navegação (`20`). Por ser `sticky` no fluxo, não precisa de reserva de espaço no fim da página. |
| `ObservacaoFatura/ObservacaoFatura.tsx` (**novo**) | Mostra "Obs.: …" com `-webkit-line-clamp: 3` e botão de texto "Ver mais"/"Ver menos" (`aria-expanded`). O botão só aparece se o texto passa de 120 caracteres (aproximação de 3 linhas; não se mede o DOM). Em `md` ou mais mostra o texto inteiro sem botão. |
| `format.ts` | Novo `resumoCiclo(fatura)`: "Emitida em 08/11 por Renato R." / "Paga em 12/11 · Pix · R$ 1.250,00" / "Cancelada em 15/11 por Renato R." (reaproveita `formaPagamentoLabel`, `formatDataBr`, `formatBRL`). Teste junto de `format.test.ts`. |
| `ItensFatura/ItensFatura.tsx` | Abaixo de `md`: cabeçalho da seção com "N saídas · R$ total", lista de `SaidaCard` e o rodapé de total (mesma `Rodape`, dentro de um cartão). Em `md` ou mais, a tabela atual intacta. Fatura cancelada e lista vazia mantêm os avisos. |
| `SaidaCard/SaidaCard.tsx` (**novo**) | Cartão do §3.4 com as 4 linhas e o rodapé "Total … · Cliente …". Reaproveita `PlateDisplay`, `formatDateTime`, `formatarMinutos`, `rotuloCategoria`, `regraConveniada`, `formatBRL`. Não é interativo: `<li>` sem papel de botão e sem estado pressionado. |

`Cartao` e `DetalheGrid` seguem como estão; no celular o herói é um `Cartao` e o ciclo vai para o `Accordion`.

### Fluxos

| Arquivo | Mudança |
|---|---|
| `EmitirFaturaModal.tsx` | No celular: `OptionGroup` "Prazo" com os atalhos 7/15/30 dias logo abaixo do campo Vencimento (`value = atalhoSelecionado(values.vencimento, hoje)`, `onChange` faz `form.setFieldValue("vencimento", vencimentoEm(hoje, Number(valor)))` e `emitir.reset()`); `TextareaField` com 3 linhas (`rows={3}`, se `Textarea` aceitar a prop; senão, a menor altura mínima que ele já suporta). O banner de erro passa a ser rolado até a vista (`useRolarAteAviso`). Nada muda em computador. |
| `PagarFaturaModal.tsx` | No celular: forma de pagamento com `field.OptionField` (`columns={2}`, `legend="Forma de pagamento"`, opções de `FORMA_PAGAMENTO_OPTIONS`; erro do campo já tratado por `OptionField`) no lugar de `SelectField`; `InfoCard` "Este pagamento não entra no caixa" logo abaixo do `Resumo`; data do pagamento recolhida atrás do botão de texto "Data: agora · Alterar" (estado local `alterandoData`; ao abrir mostra o `TextField type="date"`). Em computador, nada muda (inclusive a posição do aviso). Banner de erro com `useRolarAteAviso`. |
| `CancelarFaturaDialog.tsx` | Sem mudança de lógica. Os botões empilhados e de largura total no celular já são o comportamento do `Footer` do `Modal`; o desenho só exige conferir a ordem (o "Manter fatura", com foco, vem primeiro no código e fica em cima porque `column-reverse` o põe por último — **verificar** e, se ficar embaixo do botão de perigo, inverter a ordem dos filhos apenas no celular). |
| `useRolarAteAviso.ts` (**novo**) | `useRolarAteAviso(ativo: boolean)` devolve uma `ref` para um `<div>` que embrulha o `ErrorBanner`; quando `ativo` vira `true`, chama `scrollIntoView({ block: "nearest" })`. Sem animação, o que dispensa tratar `prefers-reduced-motion`. |

### Componentes compartilhados alterados

| Arquivo | Mudança | Impacto |
|---|---|---|
| `ui/Modal/Modal.styles.ts` | `Footer`: `padding-bottom: calc(space[3] + env(safe-area-inset-bottom, 0px))`. | Todos os modais em tela cheia ganham a área segura; em aparelhos sem ela (e em computador) o valor é o mesmo de hoje. |
| `ui/Pagination/Pagination.styles.ts` | `Controls > button { min-height: layout.touchTarget }` dentro de `@media (pointer: coarse)`. | Alvo de 44 px em telas de toque, sem mudar o computador. O layout já cabe em 320 px (a `Nav` quebra a linha). |
| `ui/Select/Select.tsx` e `Select.styles.ts` | Nova prop opcional `hideLabel?: boolean`; o `Label` aplica o mesmo recorte visual usado em `Table.styles.ts` (cabeçalho oculto). O rótulo continua ligado ao campo por `htmlFor`. | Retrocompatível (padrão `false`). |
| `form/OptionField.tsx` | `OptionFieldProps` passa a incluir `columns` (`Pick<…, "legend" \| "options" \| "disabled" \| "columns">`). | Retrocompatível. |
| `styles/theme.ts` | `layout.fabClearance: "88px"` (folga que o conteúdo reserva para o botão flutuante). Mensalistas **não** é migrado nesta entrega. | Um token a mais. |

### Tipos e dados
Nenhum tipo em `src/types` muda; `Fatura`, `FaturaItem`, `FaturaFiltros` e os contratos de API ficam como estão. Os tipos novos (`AvisoVencimento`) vivem em `vencimento.ts`. Nenhuma chamada à API é criada ou alterada.

### Server vs Client Component
Tudo é Client Component (`"use client"`), como o resto do módulo: dependem de `useRouter`, `useSearchParams`, TanStack Query e `matchMedia`. As rotas `app/.../faturas/*` não mudam. `vencimento.ts` é módulo puro, sem `"use client"`.

## Decisões e trade-offs
- **`useIsMobile` em vez de dois DOMs com CSS.** Evita que leitores de tela leiam a tabela e os cartões; custa um segundo render no cliente quando a tela é pequena. Aceitável porque os dados chegam depois de uma consulta e os esqueletos já usam o arranjo certo. O mesmo hook é o precedente do projeto.
- **`BarraAcoes` `sticky`, não `fixed`.** Segue o rodapé de Conferência: reaproveita o cálculo de `bottomNavReserved`, não exige reservar espaço no fim da página e dispensa estender o `ActionBar`, que é do fluxo de adesão. Contra: só gruda enquanto o contêiner estiver na tela, o que é verdade aqui (a barra é filha direta da página).
- **`EmitirFlutuante` local, sem extrair um componente de `ui`.** Seria o segundo uso do padrão (Mensalistas é o primeiro). Extrair agora obrigaria a mexer em Mensalistas e seus testes; fica como melhoria futura. O token `fabClearance` já deixa a folga pronta para essa migração.
- **Vencimento calculado no cliente, sem nova situação.** Decisão do PRD (ponto em aberto). Isolado em `vencimento.ts` para trocar o limite (`LIMITE_PERTO_DE_VENCER_DIAS`) ou ligar o destaque também à tabela de computador sem tocar nos componentes.
- **Atalhos de vencimento derivados do valor do campo.** Sem estado paralelo, não dessincroniza com a digitação nem com a validação do formulário.
- **Observação longa por contagem de caracteres.** Medir o DOM exigiria `ResizeObserver` e deixaria o teste frágil; 120 caracteres aproxima 3 linhas num celular de 360 px, e o pior caso é um "Ver mais" que expande pouco.
- **O que só muda no celular fica no celular.** Atalhos de prazo, forma de pagamento em opções, data recolhida e aviso no topo do pagamento não aparecem em computador, para o PRD ("a versão de computador não muda") e para os testes de hoje continuarem valendo.
- **Sem paginar as saídas.** O back devolve todas; o cabeçalho da seção com o total orienta quem rola uma lista longa.

## Riscos / pontos de atenção
- **Teclado nativo (`100dvh`).** O `Modal` encolhe com `--teclado-altura` (teclado de toque do app), mas não com o teclado nativo de iOS/Android; no iOS o `dvh` não acompanha o teclado. Só **observação** e **data** abrem o teclado nativo. Verificar nos dois sistemas no QA; se o rodapé ou o campo ficarem cobertos, tratar no `Modal` (visualViewport) como alteração compartilhada separada. Não bloqueia esta entrega: o corpo do modal rola e o campo focado é levado à vista pelo navegador.
- **Voltar do detalhe preserva a posição?** Filtros e página estão na URL, então o conteúdo volta certo. A rolagem depende da restauração do Next; como `useFaturas` mantém o cache, a lista renderiza na hora, mas confirmar no QA se a rolagem volta ao ponto. Se não voltar, tratar com `scroll` salvo em `sessionStorage` por chave de URL (fora desta entrega salvo se o QA reprovar RF11).
- **Barra sticky e botão central da navegação.** O botão de Entrada sobressai 20 px; a barra ancorada em `bottomNavReserved` fica acima dele. Conferir que não há faixa de fundo estranha entre a barra e a navegação nos dois temas.
- **Hidratação.** Quem usa celular vê o arranjo de computador por um instante antes da primeira renderização do cliente; como o conteúdo é carregado no cliente, o risco é só visual e coberto pelo esqueleto. Não usar o arranjo em `generateMetadata` ou em Server Components.
- **Testes dependem de `matchMedia`.** Sem `matchMedia` o hook devolve `false` (computador); os testes de celular precisam do stub (`vi.stubGlobal("matchMedia", …)`, padrão de `VeiculosResumo.test.tsx`). Os testes atuais seguem passando sem alteração.
- **Constante de 3 dias e fuso.** `hoje` vem do relógio do aparelho; um aparelho com data errada mostra aviso errado. Aceito (é destaque visual, não regra).
- **Next.js desta versão.** `AGENTS.md` avisa que a versão tem mudanças de API. Esta entrega usa só APIs já em uso no módulo (`useRouter`, `useSearchParams`, `NextLink`); antes de implementar qualquer arquivo novo, conferir `node_modules/next/dist/docs/` para o que for tocar em roteamento.

## Estratégia de testes (Vitest + Testing Library, como no módulo)
- `vencimento.test.ts`: limites (ontem, hoje, amanhã, 3 dias, 4 dias), virada de mês e de ano, horário de verão, paga e cancelada sem aviso, `atalhoSelecionado` com e sem correspondência.
- `FaturaCard.test.tsx`: textos de situação e de vencimento por tipo, link para o detalhe, nome acessível.
- `SaidaCard.test.tsx`: todos os dados do RF10 presentes.
- `FiltrosFaturas.test.tsx` (computador e celular): troca de filtros chama `onChange` com página 1; "Filtrando…" e "Limpar" só com filtro ativo.
- `FaturasLista.test.tsx`, `FaturaDetalhe.test.tsx`, `ItensFatura.test.tsx`: casos novos no celular (cartões, botão flutuante, barra de ações só para fatura aberta, ciclo recolhido com resumo); os casos de computador existentes ficam intactos.
- `EmitirFaturaModal.test.tsx` e `PagarFaturaModal.test.tsx`: no celular, atalhos de prazo preenchem a data; forma de pagamento por opções; data recolhida e envio sem data; aviso do caixa presente antes do botão de confirmar. Regras de validação inalteradas.
- Compartilhados: `Select` (`hideLabel` mantém o nome acessível), `OptionField` (`columns`).
- QA (skill `executar-qa`): fluxo completo no celular em 360 e 390 px, temas claro e escuro, teclado aberto em cada campo.

## Fora de escopo técnico
- Mudar regras de negócio, contratos de API ou tipos.
- Migrar Mensalistas para o token `fabClearance` ou extrair um botão flutuante em `ui`.
- Restaurar a posição de rolagem da lista com armazenamento próprio (só se o QA reprovar RF11).
- Tratar o teclado nativo no `Modal` com `visualViewport` (só se o QA reprovar RF13 e RF15).
- Aplicar o destaque de vencimento à tabela de computador (decisão em aberto no PRD; `vencimento.ts` já permite fazê-lo depois).
- Pontos em aberto do PRD sobre valor pago diferente do total e demais regras de pagamento.
