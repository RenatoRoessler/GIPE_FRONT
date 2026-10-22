# Design Spec: Fluxo de entrada e saída de veículos para mensalista

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. Mudança pontual em telas existentes (`EntradaVeiculoModal` e `SaidaVeiculoModal`/`ResumoSaida`): não é um redesenho, então não pede composição nova. O ganho está em **um único card compartilhado** que dá o mesmo recado nas duas telas.

## Direção

Modo **Operate**. O operador está atendendo na portaria e precisa perceber, sem ler muito, que "este veículo é de mensalista, nada a cobrar". O card é um **aviso de contexto**, não uma etapa: aparece sozinho, não pede ação e não bloqueia o fluxo.

Gesto único: o card usa a cor de marca suave (`primarySoft` + borda `primary`) e um ícone de "cartão/assinatura", distinto do vermelho de erro e do verde de sucesso, para não ser confundido com alerta nem com pagamento concluído. O estado é sempre dito em texto ("Mensalista"), nunca só por cor.

## Componentes do design system

### Reaproveitados
`StatusBadge` (tom `info`, já usado no `ResumoSaida`), `Skeleton`, `ErrorBanner`, `Button`, `Modal`, `PlateDisplay`. Estilos da saída (`ValuePanel`, `ValueLabel`, `ValueAmount`, `Notice`) permanecem.

### Novo no design system (`src/components/ui`)
- **`InfoCard`** (ou nome equivalente definido no Tech Spec): bloco de aviso informativo com ícone, título, texto de apoio opcional e `role="status"`. Props: `title`, `children?`, `icon?`, `tone?: "info"`. Fundo `primarySoft`, borda `primary` (1px), `radii.md`, espaçamento `space`. Reaproveita o padrão visual do `Notice`; se o `Notice` puder ser promovido a `ui` sem mudar a saída atual, preferir isso a criar um componente novo (decisão no Tech Spec).

### De feature (`src/components/veiculos`)
- **`CardMensalista`**: usa o `InfoCard` com o conteúdo do mensalista (nome, e uma linha de contexto que muda entre entrada e saída). Um só componente, duas telas.

## Tokens usados

Nenhum token novo. `colors.primary`, `primarySoft`, `text`, `textMuted`, `success` (somente no valor zerado da saída); `space`, `radii.md`, `fontSizes`, `fontWeights`; `typography.display*` no valor da saída, como hoje.

## Entrada de veículos (modal "Registrar entrada")

**Removido:** o campo `Mensalista: Sim/Não` (Switch) no fim do formulário. Os campos restantes, a ordem e o rodapé não mudam. O descarte ("Descartar entrada?") deixa de considerar esse campo.

**Novo:** o `CardMensalista` aparece **entre o campo Placa e o campo Modelo**, logo abaixo do campo que o originou (a consulta da placa já acontece ao sair do campo ou ao ler pela câmera).

Conteúdo do card:
- Ícone + título **"Mensalista"**.
- Linha de apoio: **nome do mensalista**.
- Texto auxiliar: "A entrada será registrada como mensalista."

### Estados (entrada)
- **Sem placa válida / não é mensalista:** nenhum card. O layout não reserva espaço vazio.
- **Consultando:** a dica do campo Placa mostra o estado atual; o card não aparece até haver resposta (sem `Skeleton`, para não piscar um card que talvez nem exista).
- **Mensalista identificado:** card visível; aparece com transição curta de opacidade/altura (sem deslocar o campo em foco). Anunciado por `role="status"` (`aria-live="polite"`).
- **Mensalista fora do plano (aviso de rotativo):** quando o back devolve os dados do mensalista mas a entrada não vale como mensalista (ex.: fora do horário), o `CardMensalista` usa a variante `rotativo`: título **"Mensalista fora do horário"**, apoio com o nome e o texto "A entrada será registrada como rotativo e cobrada normalmente.", e o horário contratado quando houver ("Horário contratado: 07:00 às 19:00"). Mesmo `InfoCard`, mas com ícone de relógio e `role="status"`; a distinção é dita em texto, não só por cor. O recibo não mostra a etiqueta "Mensalista" nesse caso.
- **Placa alterada:** o card some imediatamente e a consulta recomeça; nunca fica um card de uma placa antiga.
- **Falha na consulta:** nenhum card; o operador segue como avulso (regra de negócio a confirmar no PRD, ponto em aberto). Sem mensagem de erro bloqueante.
- **Enviando / recibo:** o card permanece durante o envio. No recibo, a categoria/etiqueta "Mensalista" aparece na linha do veículo com `StatusBadge` `info` (detalhe do conteúdo do recibo no Tech Spec).

## Saída de veículos (modal "Registrar saída")

A tela única existente (visor, busca manual, resumo, pagamento) mantém a estrutura. Mudanças só quando a consulta devolve um mensalista.

**Resumo (`ResumoSaida`):**
- O `StatusBadge` "Mensalista" atual na linha do veículo é mantido.
- **Novo:** o `CardMensalista` entra **logo abaixo do cabeçalho do veículo**, acima das linhas Entrada/Permanência. Título **"Mensalista"**, apoio com o nome, texto "Saída sem cobrança."
- **Valor a cobrar:** `ValuePanel` mostra **"Nada a cobrar"** (comportamento já existente quando `valor` é 0), sem o valor zerado em destaque. Se o valor devolvido pelo back for maior que zero para um mensalista, o Tech Spec decide qual vale; o design assume R$ 0,00 conforme o PRD.

**Pagamento (`PagamentoSaida`):**
- Para mensalista, o bloco de forma de pagamento **não é exibido** (nem tiles, nem "valor recebido" e troco). No lugar, uma linha de texto de apoio em `textMuted`: "Sem pagamento nesta saída."
- O botão principal vira **"Confirmar saída"** (sem valor), habilitado assim que há entrada encontrada. Rodapé e Cancelar não mudam.

### Estados (saída)
- **Buscando:** `Skeleton` atual; o card não aparece até a resposta.
- **Não encontrado:** sem card, como hoje.
- **Mensalista encontrado:** card + "Nada a cobrar" + pagamento ocultado; o botão é "Confirmar saída".
- **Reconsulta que muda a condição** (por exemplo, deixou de ser mensalista): o `Notice` de mudança existente avisa; o card e o bloco de pagamento acompanham a nova resposta, e o botão volta a exigir confirmação.
- **Enviando / erro / sucesso:** iguais ao fluxo atual. O recibo da saída de mensalista mostra "Mensalista" e valor "Sem cobrança" no lugar de forma de pagamento/recebido/troco.

## Acessibilidade

- `CardMensalista` com `role="status"` e `aria-live="polite"`: anuncia "Mensalista, [nome]" uma vez, quando aparece. O ícone é decorativo (`aria-hidden`).
- O estado "mensalista" é dado pelo título em texto e pelo `StatusBadge`; a cor reforça, não substitui.
- Contraste AA do título e do texto sobre `primarySoft` nos quatro temas.
- O foco não é movido pelo aparecimento do card; o operador continua digitando.
- Respeita `prefers-reduced-motion`: sem transição de altura, o card só aparece.
- Ocultar o pagamento na saída: o botão **Confirmar saída** continua alcançável por teclado e o foco inicial permanece como hoje.

## Responsividade

- **Mobile (< `md`):** card em largura total do modal (já em tela cheia), ícone à esquerda e texto em coluna; o nome longo quebra em até duas linhas com reticências e `title` com o texto completo. Sem rolagem horizontal.
- **Desktop:** mesma estrutura, largura do conteúdo do modal; nas duas colunas da saída, o card fica na coluna do resumo.
