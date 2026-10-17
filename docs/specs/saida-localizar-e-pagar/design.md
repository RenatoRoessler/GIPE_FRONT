# Design Spec: Saída de veículos em duas fases (localizar, depois pagar)

Insumo de UI/UX para o Tech Spec, a partir de `prd.md` e do design já implementado em `docs/specs/melhoria-fluxo-saida/design.md`. Segue o design system (`src/styles/theme.ts` + `src/components/ui`) e o contexto de `PRODUCT.md`. Não há tela nova: o modal **Registrar saída** passa a mostrar um conjunto diferente de blocos em cada fase.

## Direção

Modo **Operate**. Antes, tudo ficava na mesma tela. Agora a tela faz **uma pergunta por vez**, e a resposta de uma fase abre a outra:

1. *Qual veículo?* — só leitura de QR e busca manual.
2. *Quanto e como pagou?* — só o veículo, o valor e o pagamento.

Gestos visuais, todos contidos:
- **Troca de fase sem botão**: o veículo encontrado leva direto para a fase 2. O conteúdo da fase 2 entra com um fade curto, para a mudança não parecer um "pulo" de tela.
- **O botão de voltar mora no rodapé**, ao lado de **Confirmar Saída**. O rodapé do modal já é fixo no celular, então o caminho de volta nunca sai da tela, mesmo com o corpo rolando.

Sem ornamento novo: tipografia, bordas e cores do tema. Estado dito em texto, nunca só em cor.

## Componentes do design system

### Reaproveitados (sem alteração visual)
`Modal` (`size="lg"`, `closeOnBackdrop={false}`, tela cheia no mobile), `Button` (`secondary` e `primary`), `ConfirmDialog`, `ErrorBanner`, `Skeleton`, `OptionGroup` (pagamento), `PlateDisplay`, `StatusBadge`; de feature: `LeitorQrSaida`, `BuscaManualSaida`, `ResumoSaida`, `PagamentoSaida`, `ReciboSaidaStep`, e os estilos de `Saida.styles` e `SaidaVeiculoModal.styles` (`Layout`, `Column`).

### Alterados
- **`LeitorQrSaida`**: perde o estado "lido" e o botão **Limpar e ler novamente**, porque ler com sucesso agora troca de fase e a leitura reinicia ao voltar. Mantém visor, mira, varredura, mensagens de câmera e aviso de QR inválido.
- **`BuscaManualSaida`**: deixa de ter o modo "bloqueado por QR" (os campos nunca ficam mostrando um veículo lido). Mantém o bloqueio mútuo entre campos, as dicas e o aviso da consulta.

### Novos
Nenhum componente de design system. A barra de ações de cada fase é composição de `Button` no rodapé do `Modal`.

## Tokens usados

Nenhum token novo. `colors.text`, `textMuted`, `border`, `surface`, `primary`, `onPrimary`, `warn` (mira), `success`, `danger`; `space`, `radii`, `fontSizes`, `fontWeights`; `typography.display*` para o valor.

## Fase 1 — Localizar o veículo

Título do modal: **Localizar veículo**. Duas colunas no desktop (leitura | busca manual) e uma coluna no celular, na ordem em que o operador age:

1. **Visor de leitura** (`LeitorQrSaida`): igual ao atual, sem a linha do token e sem o botão Limpar.
2. **Divisor** "ou informe sem QR Code".
3. **Busca manual** (`BuscaManualSaida`): Placa, Token e Sequencial, com dica de apoio e área de aviso.

Não há resumo, valor, pagamento nem espaço reservado para eles. Rodapé: só **Cancelar** (secundário).

Estados:
- *Ocioso*: câmera tentando abrir; busca manual disponível desde o início.
- *Buscando* (QR lido ou campo válido): visor e campos desabilitados, aviso `role="status"` "Buscando veículo…". O visor mostra a mira em `success` por um instante, em vez de um "lido" que fica parado.
- *Não encontrado / QR inválido / token sem ticket / falha de rede*: a mensagem aparece na área de aviso (`danger`, `aria-live="polite"`), os campos voltam a ficar editáveis, a câmera continua ligada. O operador corrige e tenta de novo, sem sair da fase.
- *Encontrado*: troca imediata para a fase 2.

## Fase 2 — Dados e pagamento

Título do modal: **Confirmar saída**. Duas colunas no desktop (resumo | pagamento) e uma coluna no celular, na ordem de leitura:

1. **Aviso de atualização** (só quando necessário): `Notice` de "valor mudou" ou aviso discreto de "não foi possível atualizar o valor", acima do resumo.
2. **Resumo** (`ResumoSaida`): placa, modelo e cor, categoria, indicação de mensalista, entrada, permanência e o bloco **Valor a cobrar**, como hoje.
3. **Erro de registro** (`ErrorBanner`, `role="alert"`), quando houver.
4. **Pagamento** (`PagamentoSaida`): Dinheiro, Crédito, Débito e Pix; Dinheiro marcado; valor recebido e troco em Dinheiro.

Rodapé (fixo no celular, lado a lado no desktop):
- **Voltar para a pesquisa** (secundário, ícone de seta à esquerda): sempre visível e com altura de toque mínima de 44px. No celular fica em segundo plano visual, abaixo do botão principal, na mesma ordem do rodapé atual.
- **Confirmar Saída · R$ x** (principal), com os mesmos rótulos de hoje ("Confirmar novo valor · R$ x", "Registrando…").

Não há botão **Cancelar** nesta fase: fechar é pelo X do modal (com confirmação), e desistir do veículo é **Voltar para a pesquisa**.

Estados:
- *Pronto*: botão principal desabilitado até o pagamento ser válido (Dinheiro com recebido suficiente).
- *Valor mudou*: `Notice` com o valor antigo riscado e o novo; botão vira "Confirmar novo valor".
- *Atualização falhou em segundo plano*: mantém o último resumo e mostra o aviso discreto.
- *Enviando*: tiles, campo e os dois botões desabilitados; modal não fecha.
- *Erro de registro*: `ErrorBanner` acima do pagamento; dados mantidos; **Voltar para a pesquisa** continua disponível.

## Recibo

Sem mudança visual. Título **Saída registrada**; ações **Imprimir** e **Concluir**. O botão **Voltar para a pesquisa** não existe aqui.

## Transição entre fases

- Fase 1 → 2: o conteúdo anterior sai sem animação e o novo entra com fade de ~150 ms. Com `prefers-reduced-motion` a troca é instantânea.
- Fase 2 → 1: idem. A busca volta vazia, a câmera reabre e o foco vai para o visor (ou para o campo Placa se a câmera não estiver disponível).
- O título do modal muda junto com a fase. Uma região `aria-live="polite"` anuncia "Veículo encontrado. Dados e pagamento." e, na volta, "Pesquisa de veículo.". O foco vai para o início do conteúdo da nova fase (cabeçalho do resumo na fase 2).
- O modal mantém `size="lg"` nas duas fases, para a largura não pular na troca.

## Fechar o modal

- Fase 1: fecha direto se não houver nada digitado, lido ou em busca; senão pede confirmação.
- Fase 2: sempre pede confirmação ("Cancelar a saída?").
- Em qualquer caso a câmera é desligada.

## Acessibilidade

- Cada fase tem um título único; o botão **Voltar para a pesquisa** tem texto, não só ícone.
- Foco: fase 2 → resumo; fase 1 (volta) → visor ou Placa. Nunca fica em elemento que sumiu.
- Anúncios de busca, erro e mudança de fase em regiões `aria-live` únicas; o tick de permanência e valor não é anunciado.
- Alvos de toque ≥ 44px; contraste AA nos quatro temas; nenhum estado só por cor.
- Teclado: Enter nos campos da busca consulta; Tab percorre a ordem visual de cada fase; Esc segue a regra de fechar.

## Responsividade

- **Mobile** (< `md`): modal em tela cheia, uma coluna. Fase 1: visor, divisor e busca. Fase 2: resumo e pagamento. Rodapé fixo, botão principal em cima e **Voltar para a pesquisa** abaixo, ambos na largura toda.
- **Desktop**: modal `lg` centrado, duas colunas em cada fase; rodapé com **Voltar para a pesquisa** à esquerda e **Confirmar Saída** à direita.
- A fase 2 não mostra nenhum bloco da fase 1, então o corpo não passa da altura útil no celular na maioria dos casos (resumo + pagamento), sem rolar até o pagamento.
