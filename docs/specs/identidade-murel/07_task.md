# Task 07: Telas da área logada e varredura final de tokens

**Status:** ✅ Concluída  
**Dependências:** Tasks 05, 06

## Objetivo

> Fechar a migração visual nas telas: usos restantes de `primary` como texto vão para `accent`, valores soltos viram tokens, e os tokens obsoletos saem do tema.

## Contexto Técnico

**Arquivos a editar:**
- Estilos em `src/components/**` e `src/app/**` que ainda usam `colors.primary` como texto/ícone/borda (cerca de 60 arquivos usam `primary`: triar com `grep -rn "colors.primary" src`).
- Hex soltos fora de `theme.ts`: `ComprovantePublico.styles.ts` (Task 10), `QrCode`, `PlateDisplay`, `BottomNav.styles.ts`; manter só cores reais de placa e QR.
- `src/components/precos/FaixasPreview/FaixasPreview.styles.ts`, `Card.styles.ts`, `DiscButton.styles.ts` — remover uso de `glass`, `glow`, `onSign`, `signEdge`.
- `src/styles/theme.ts` — remover `glass`, `glassBorder`, `shadows.glow`, `onSign`, `signEdge` e os campos de tipografia sem uso.
- Telas de dados (caixa, mensalistas, pátio, preços, usuários, notas fiscais, minha empresa, relatórios): valores em `fontFamilies.mono` com `tabular-nums`, selos de cliente e de forma de pagamento com as cores novas onde já existe a distinção.

## Critérios de Aceite

- [x] `grep` por `glass`, `glassBorder`, `shadows.glow`, `onSign`, `signEdge` retorna zero fora de testes.
- [x] Nenhum `colors.primary` usado como cor de texto/ícone/borda; só preenchimento.
- [ ] Cada tela tem no máximo um botão primário amarelo; amarelo fora de ação principal, item ativo ou símbolo é corrigido. (pendente: ver registro da execução)
- [x] Horários, placas, valores e códigos usam a fonte mono.
- [ ] As telas principais ficam legíveis nos dois temas (contraste AA). (pendente: ver registro da execução)

## Testes

- [x] Suíte completa (`npm test`) passa.
- [x] Testes de snapshot/estilo afetados atualizados.
- [ ] Revisão visual por tela (lista de telas conferidas nas notas da task) em claro e escuro. (pendente: ver registro da execução)
- [x] `npm run lint` e `npm run build` passam.

## Notas de Implementação

> Techspec "Riscos": amarelo como texto no claro é defeito. Fazer a varredura por área e registrar o que foi revisado.

## Registro da execução

- Varredura mecânica em `src/components`: todo `outline` de foco virou `colors.focus` (2px) e todo `primary` usado como borda ou traço virou `accent` (33 arquivos); `primary` ficou só como preenchimento. `IndicadoresPatio` e `ChangelogList` (texto) também foram para `accent`.
- Preenchimentos de dados passaram a `accent`, porque o amarelo sobre o giz do tema claro não chega a 3:1: barras e colunas de `Graficos`, trecho retirável da `GavetaResumo`, segmentos de `PrecoSemana` e barra de progresso do `Contrato`. Continuam `primary` os preenchimentos de controle com borda em `accent` (aba atual de `PrecoEtapasNav`, células de `GradeHorarios`, chips de `PrecoCategoriasStepFields`, avatar do `UserMenu`, faixa do item ativo da barra).
- Tipo de cliente: `RoscaMensalistas` e a barra de proporção do `PatioView` usam `cliente.mensal` e `cliente.avulso` (texto asfalto). Os selos de tipo de cliente em `StatusBadge` seguem sem uso nas telas: nenhuma tela mostra o tipo como selo hoje.
- `FaixasPreview` (placa tarifária) deixou o visual de sinalização: fundo `surface`, contorno `accent`, divisórias tracejadas, faixa da diária em `warn`.
- Removidos de `theme.ts`: `glass`, `glassBorder`, `shadows.glow`, `onSign`, `signEdge`. `DiscButton` e `FaixasPreview` eram os últimos usuários. Acrescentei `onSuccess` (e `onDanger` já existia) para o `Toast` ler sobre verde e vermelho nos dois temas; `ErrorBanner` e o fundo do `Modal` perderam os `rgba` fixos.
- Fonte mono (JetBrains Mono 600) em valores e horários: `IndicadoresPatio`, `RoscaCentro`, `PlateField`, `SimuladorCobranca` (valor), hora do `ComprovantePublico`, valor do `ReciboPublico`, da `NotaFiscalModal` e do `ReciboEntradaStep`. Os pesos carregados da mono são 500 e 600, por isso `semibold`.
- Não mexi em `typography.displayTransform/displayTracking/displaySize`: 20 arquivos os usam como valores válidos (sem caixa alta, tracking `-0.02em`), então permanecem no tema.
- Novo `src/styles/tokens.test.ts` (3 testes) trava regressões: nenhum uso dos tokens removidos, `primary` nunca como cor de texto/borda/contorno e foco sempre em `focus`.
- Deixado para a Task 10: `ComprovantePublico` (cabeçalho com `primary`/`onPrimary` e o eyebrow em `warn`, que sobre amarelo some) e `ReciboPublico`, que têm layout próprio.
- Verificado: `tsc` sem erros; ESLint com 0 erros e 94 avisos (os mesmos de antes); `npm run build` compila; suíte completa com 2318 passando e 2 falhas por tempo esgotado em `MensalistaModal.veiculos.test.tsx` (a instabilidade de sempre; passa isolado).
- Não feito: revisão visual por tela nos dois temas e a auditoria de "um botão amarelo por tela". Nenhuma captura de tela foi feita; as telas da área logada só foram conferidas por código e testes. Fica para a Task 11.
