# Design Spec: Quadro de chaves na tela do Pátio

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` e do design já implementado em `docs/specs/quadro-chaves/design.md`. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. Não há tela nova: a lista do Pátio ganha um controle por veículo e um indicador no resumo; a escolha de gancho abre num modal já existente.

## Direção

Modo **Operate**. O Pátio é lido de relance, em pé, no celular. Duas perguntas precisam ter resposta imediata, sem abrir nada:

1. *Onde está a chave deste carro?* — a resposta mora no próprio card.
2. *Quantas chaves estão soltas?* — a resposta mora no resumo do topo.

Gestos visuais, todos contidos:
- **A posição da chave é o próprio botão.** Com gancho, o card mostra "Chave A2" como um controle de toque; tocar nele troca de gancho. Sem gancho, o mesmo lugar mostra **Guardar chave** em destaque discreto. Um só controle, uma só posição na tela, dois estados.
- **"Fora do quadro" é dito em texto e com a cor de atenção (`warn`)**, nunca só em cor. O indicador do topo usa o mesmo rótulo e a mesma cor, para o olho ligar um ao outro.
- **O modal é o mesmo da entrada**: o operador já conhece a grade, a sugestão e o botão "Guardar no gancho X".

## Telas e estados

### 1. Card do veículo (linha da lista do Pátio)

O controle da chave vive na célula **Veículo**, abaixo da linha de categoria. É um botão pequeno (`Button` `secondary`, `size="sm"`), com altura de toque de 44px no celular:

| Estado do veículo | Rótulo do botão | Leitor de tela |
|---|---|---|
| Com gancho | `Chave A2` (com o nome do quadro quando houver mais de um: `Chave Recepção · A2`) | "Trocar a chave de ABC1D23, hoje no gancho A2" |
| Sem gancho | `Guardar chave`, com um ponto de atenção `warn` e o texto "Fora do quadro" ao lado | "Guardar a chave de ABC1D23 no quadro" |
| Sem quadros na empresa | Controle não aparece | — |
| Quadros ainda carregando | Controle não aparece (sem pulo de layout: a altura da célula é a mesma) | — |

- O texto "Chave: A2" que já existe vira esse botão; não há duas versões.
- Em empresa sem quadros, nada de "fora do quadro": o conceito não existe para ela.
- Não há ação de remover a chave do quadro (fora de escopo).

### 2. Indicador "fora do quadro" (resumo do topo)

Mais um item na linha `Resumo`, depois de "Permanência média" e "há 3 dias ou mais", no mesmo estilo dos demais:

- Com carros soltos: `StatusBadge` `tone="warn"` com o texto **`3 fora do quadro`** (singular: `1 fora do quadro`).
- Zero: texto simples em `textMuted`, **`Todas as chaves no quadro`**, sem selo. É confirmação, não alerta.
- Conta o pátio inteiro: não muda com busca e filtros (diferente de "N de M veículos").
- Sem quadros cadastrados: o item não aparece. Quem pode gerenciar quadros vê, no lugar, o link discreto **Configurar quadro de chaves** (leva à tela de quadros).
- Atualiza junto com a lista: ao guardar uma chave ou ao um carro sair, o número muda sem recarregar.
- O indicador não é clicável nesta versão (filtro é fora de escopo): por isso é um selo, não um botão.

### 3. Modal "Guardar chave" (escolha do gancho)

Reaproveita o conteúdo da etapa de gancho da entrada, dentro de um `Modal` (`size="md"`, tela cheia no celular), título **Guardar chave**:

1. Cartão do veículo (`PlateDisplay` + modelo · cor).
2. Seletor de quadro, quando houver mais de um.
3. Sugestão (primeiro livre) já marcada, e a grade de ganchos.
4. Botão principal **Guardar no gancho A2**; secundário **Cancelar** (no lugar de "Escolher depois", que não faz sentido aqui).

Diferenças em relação à entrada:
- Se o veículo já tem gancho, ele vem **pré-selecionado e marcado como "atual"**; o botão principal só habilita ao escolher outro gancho (escolher o mesmo é um no-op desnecessário).
- O gancho atual do próprio veículo aparece como "aqui" (selecionado), e não como ocupado, para não parecer indisponível.
- Sem quadros: o modal não abre.

Estados do modal: carregando (`Skeleton` da grade), erro de carga (`ErrorBanner` + Tentar novamente), enviando ("Guardando…", grade desabilitada), conflito (`ErrorBanner` com a placa que ocupa e a grade recarregada) e sucesso (modal fecha e `Toast` "Chave guardada no A2").

Com o modal aberto, a lista do Pátio **não** se atualiza sozinha (mesma regra do modal de saída): a linha não pode mudar de lugar sob o operador.

## Componentes do design system

### Reaproveitados (sem alteração visual)
`Modal`, `Button` (`secondary`, `sm`), `StatusBadge` (`warn`), `Toast`, `ErrorBanner`, `Skeleton`, `PlateDisplay`; de feature, o conteúdo de `EscolherGancho` e `KeyBoardGrid` (`modo="escolher"`).

### Alterados
- **`EscolherGancho`**: aceita o gancho atual do veículo (pré-selecionado, rótulo "atual") e um rótulo para o botão de adiar (ou nenhum), para servir aos dois usos.
- **Célula Veículo da linha do Pátio**: troca o texto "Chave: A2" pelo botão da tabela acima.
- **Resumo do Pátio**: ganha o indicador.

### Novos
Nenhum componente de design system. O botão da chave e o indicador são composição de `Button` e `StatusBadge` dentro do Pátio.

## Tokens usados

Nenhum token novo. `colors.warn` e `colors.onWarn` (selo e ponto de atenção), `textMuted`, `text`, `border`, `focus`; `space`, `radii`, `fontSizes`, `fontWeights`. Altura de toque de 44px no celular, como os demais botões da linha.

## Responsividade

- **Celular (< `breakpoints.md`)**: a linha é uma grade de quatro faixas. O botão da chave fica na faixa **Veículo**, na terceira linha de texto, com a largura do conteúdo (não da faixa toda) para não competir com **Registrar saída**, que continua na coluna de ações à direita. O indicador quebra para a linha de baixo do resumo quando faltar espaço.
- **Computador**: botão na célula Veículo, sob a categoria; indicador na mesma linha do resumo.
- O botão não aumenta a altura da linha mais de uma linha de texto (~20px a mais; 44px de área de toque no celular).

## Acessibilidade

- Nome acessível completo do botão, com a placa e a posição atual (tabela acima).
- O indicador fica numa região `role="status"` e é anunciado quando o número muda; quando vira "Todas as chaves no quadro", isso também é anunciado.
- O foco volta ao botão da chave ao fechar o modal; se a linha mudou de posição por reordenação, ao botão equivalente do mesmo veículo.
- O texto "Fora do quadro" existe como texto visível no card; o ponto `warn` é decorativo (`aria-hidden`).
- `prefers-reduced-motion`: sem animação no selo ao mudar de número.
