# Tasks: Redesenho mobile-first da Gestão de Preços (Modelo A · Cockpit)

Referências: ./prd.md, ./techspec.md, ./design.md, ./layouts.html

Convenções: toda task termina com `npm run lint` limpo e os testes da área passando (`npx vitest run <caminho>`); ao fim do bloco de UI, `npm run build`. Antes de mexer em rotas, ler o guia relevante em `node_modules/next/dist/docs/` (AGENTS.md). Estilo com tokens do tema, nunca valor solto. Verificar sempre com captura da **janela visível** (360 × 640), não de página inteira.

## Bloco 1 — Fundações (design system e tema)

- [x] T1 — Tokens de layout `dockHeight` ("72px") e `placaMiniWidth` ("152px") em `shared.layout`.
  - Arquivos: `src/styles/theme.ts`
  - Pronto quando: os dois tokens existem e são tipados em `AppTheme`; nenhum teste existente quebra; lint limpo.

- [x] T2 — `Tabs` com variante segmentada (`variant?: "linha" | "segmentada"`, padrão "linha").
  - Arquivos: `src/components/ui/Tabs/Tabs.tsx`, `Tabs.styles.ts`, `Tabs.test.tsx`
  - Pronto quando: a variante segmentada tem a aparência do mock (fundo `surfaceMuted`, aba ativa em `surface`), mantém setas/Home/End e `role="tab"`; alvo de toque ≥ 44 px; testes cobrem as duas variantes; usos atuais não mudam.

- [x] T3 — Componente `BottomSheet` sobre `<dialog>` (padrão de `ui/Modal`).
  - Arquivos: `src/components/ui/BottomSheet/{BottomSheet.tsx,BottomSheet.styles.ts,index.ts,BottomSheet.test.tsx}`
  - Pronto quando: abre/fecha por `open`; foco preso, Esc e clique no fundo fecham; foco volta a quem abriu; no celular sobe do rodapé acima do menu inferior (usa `bottomNavReserved`); em ≥ 768 px vira painel lateral; `aria-labelledby` no título; testes de abrir, fechar por Esc/fundo e devolução do foco.

- [x] T4 — Componente `DockBar` (barra fixa acima do menu) que publica `--dock-altura`.
  - Arquivos: `src/components/ui/DockBar/{DockBar.tsx,DockBar.styles.ts,index.ts,DockBar.test.tsx}`
  - Pronto quando: posicionada em `bottom: calc(bottomNavReserved + env(safe-area-inset-bottom))`; escondida em ≥ 1024 px (opção `mostrarNoDesktop`); define `--dock-altura` no contêiner enquanto montada e remove ao desmontar; some enquanto o teclado de toque está aberto (usa `--teclado-altura`); teste confirma a variável e o atributo de ocultação.

## Bloco 2 — Dados e utilitários da consulta

- [x] T5 — Utilitário `resumoPreco` (valor-resumo de um `PrecoView`) e seus testes.
  - Arquivos: `src/components/precos/resumoPreco.ts`, `resumoPreco.test.ts`
  - Pronto quando: devolve "R$ 15 a 1 h · diária R$ 100" para tabela com faixas e diária; "Sem valores" sem faixas; omite a diária quando for 0/ausente; usa `formatBRL`/`formatMinutos`; testes cobrem os 3 casos e `tipoRegra` nulo.

- [x] T6 — `usePrecosUrlState` com o parâmetro `lista=1` (lista completa aberta).
  - Arquivos: `src/components/precos/PrecosMasterDetail/usePrecosUrlState.ts` (e `usePrecosUrlState.test.tsx`)
  - Pronto quando: `listaAberta` e `abrirLista()/fecharLista()` existem; `lista=1` entra no endereço só quando aberta; abrir usa `push`, fechar e trocar de tabela usam `replace`; `preco`, `q`, `situacao`, `pagina`, `salvo` continuam como antes; testes cobrem o novo parâmetro e o link antigo `?preco=ID`.

- [x] T7 — `useSelecaoPrecos` com seleção sempre presente (remove `detalheAberto`).
  - Arquivos: `src/components/precos/PrecosMasterDetail/useSelecaoPrecos.ts` (e `useSelecaoPrecos.test.tsx`)
  - Pronto quando: sem `preco` no endereço, a seleção é a padrão (primeira vigente, senão a primeira) sem gravar no endereço; `inexistente` e o fluxo `salvo=criado` (maior id) continuam; testes atualizados e passando.

## Bloco 3 — Consulta (celular e computador)

- [x] T8 — `PlacaMini` e `EsteiraPlacas` (esteira horizontal de miniplacas).
  - Arquivos: `src/components/precos/EsteiraPlacas/{EsteiraPlacas.tsx,PlacaMini.tsx,EsteiraPlacas.styles.ts,index.ts,*.test.tsx}`
  - Pronto quando: cada miniplaca mostra nome, tipo (com o nome em texto), selo de situação e 2–3 degraus + diária (fallback "Sem valores"); rolagem com `scroll-snap` e a próxima placa parcialmente visível; roving tabindex com ←/→/Home/End; selecionada com `aria-current` e levada ao centro ao trocar; `aria-label` na região; testes de seleção, teclado e fallback.

- [x] T9 — `PrecoListaCompleta`: busca, chips que quebram linha, lista com valor-resumo e paginação, extraídos de `PrecosMasterDetail`.
  - Arquivos: `src/components/precos/PrecoListaCompleta/{PrecoListaCompleta.tsx,PrecoListaCompleta.styles.ts,index.ts,*.test.tsx}`, `src/components/precos/PrecoListItem/*` (mostra `resumoPreco`)
  - Pronto quando: todos os chips de situação visíveis sem corte (quebram linha) a 360 px; contagem em `aria-live`; estados carregando/erro/vazio/sem resultado como hoje; escolher um item fecha a lista e seleciona a tabela; testes migrados dos de `PrecosMasterDetail` passando.

- [x] T10 — `DockSimulador` (linha fixa com resultado + folha com `SimuladorCobranca`).
  - Arquivos: `src/components/precos/DockSimulador/{DockSimulador.tsx,DockSimulador.styles.ts,index.ts,*.test.tsx}`
  - Pronto quando: o dock mostra categoria, permanência e o valor estimado de `estimarCobranca`; **Ajustar** abre `BottomSheet` com o `SimuladorCobranca` (categoria, permanência, explicação, aviso "Estimativa. O valor real é calculado no momento da saída."); `key={rotatividadeId}` zera ao trocar de tabela; resultado em `aria-live="polite"`; mensagem de "não atende a categoria" preservada; testes de abrir a folha e de troca de tabela.

- [x] T11 — `PrecoDetalhe` compacto (título + Editar na mesma linha, abas segmentadas, sem simulador no corpo no celular).
  - Arquivos: `src/components/precos/PrecoDetalhe/PrecoDetalhe.tsx`, `PrecoDetalhe.styles.ts`, `PrecoDetalhe.test.tsx`
  - Pronto quando: sem `BackButton "Preços"` no celular; abas Tarifa/Horários/Informações com `Tabs` segmentada; a placa e **Editar** aparecem na primeira tela a 360 × 640; ≥ 768 px mantém o simulador em coluna ao lado da placa (sem dock); estados carregando/erro/inexistente preservados; testes atualizados.

- [x] T12 — `PrecosCockpit` (monta tudo) substituindo `PrecosMasterDetail`.
  - Arquivos: `src/components/precos/PrecosCockpit/{PrecosCockpit.tsx,PrecosCockpit.styles.ts,index.ts,PrecosCockpit.test.tsx}`; `src/components/precos/PrecosMasterDetail/*` (remover ao final); `src/app/(app)/precos/page.tsx`; export em `src/components/precos`
  - Pronto quando: barra do módulo compacta (título, Buscar, + Novo) ; esteira + detalhe + `DockSimulador` no celular; "Ver todas (N)" e Buscar abrem a lista completa (folha lateral ≥ 768 px, tela no celular); `Toast` de salvo, vazio ("Nenhuma tabela de preço cadastrada." + Novo preço), erro, sem permissão e tabela inexistente funcionando; conteúdo com folga `--dock-altura` no fim; ≥ 768 px esteira vira faixa de cartões e simulador lateral; testes migrados (`PrecosMasterDetail.test.tsx` → novo) passando e a pasta antiga removida sem referências quebradas.

## Bloco 4 — Cadastro e edição (só apresentação)

- [x] T13 — Correção do resumo: "Faixas" só conta como preenchida quando editada ou vinda de tabela existente (RF14).
  - Arquivos: `src/components/precos/PrecoResumoAoVivo/PrecoResumoAoVivo.tsx` (+ teste), `src/components/precos/PrecoWizard/PrecoWizardForm.tsx` (apenas a passagem do sinal "faixas editadas")
  - Pronto quando: no cadastro novo, o resumo não mostra "7 degraus · diária —" como feito; ao editar faixas ou abrir tabela existente, mostra normalmente; o painel pode ser renderizado sem o título (para a folha); testes cobrem novo e edição.

- [x] T14 — `PrecoEtapasBarra` (3 segmentos compactos no celular).
  - Arquivos: `src/components/precos/PrecoEtapasBarra/{PrecoEtapasBarra.tsx,PrecoEtapasBarra.styles.ts,index.ts,*.test.tsx}`
  - Pronto quando: mesmo contrato de `PrecoEtapasNav` (`etapas`, `atual`, `onSelect`); cada segmento mostra ✓/!/atual e o estado é dito em texto no nome acessível; clique/toque navega para qualquer etapa; alvo de toque ≥ 44 px; testes de estado e navegação.

- [x] T15 — `DockCadastro` (resumo curto + ação principal) e folha "Sua tabela".
  - Arquivos: `src/components/precos/PrecoWizard/DockCadastro.tsx` (+ estilos e teste)
  - Pronto quando: mostra "Faltam: …" a partir das pendências da etapa, "Pronta para salvar" quando completa e "Alterações não salvas" na edição; o botão principal reflete Avançar/Salvar com os mesmos `disabled` de hoje; tocar no resumo abre `BottomSheet` com `PrecoResumoAoVivo` e `FaixasPreview`; testes dos três textos e do botão.

- [x] T16 — Integrar no `PrecoWizardForm`: barra de etapas e dock no celular, layout atual preservado em ≥ 768 px.
  - Arquivos: `src/components/precos/PrecoWizard/PrecoWizardForm.tsx`, `PrecoWizard.styles.ts`, `PrecoWizard.tsx`
  - Pronto quando: no celular a barra de segmentos substitui os 3 cartões e a legenda "Etapa N de 3" não parece um campo; `Actions` vai para o dock; o último campo nunca fica atrás do dock (folga `--dock-altura`); validação, salvar, diff, `beforeunload`, confirmação de cancelar e `ErrorDialog` inalterados; `PrecoWizard.test.tsx`, `PrecoWizardForm`/`NovaEmpresa`-style testes existentes passam; a ≥ 768 px o resultado é igual ao de hoje.

## Bloco 5 — Fechamento

- [x] T17 — Revisão visual e de acessibilidade a 360 × 640, 320 × 568, 768 e 1280.
  - Arquivos: ajustes pontuais em `src/components/precos/**` e `src/components/ui/{DockBar,BottomSheet,Tabs}`
  - Pronto quando: capturas da janela visível (login com a conta de teste do projeto) confirmam: valores e Editar na primeira tela do detalhe (RF12), nenhum chip de filtro cortado (RF13), nada atrás do menu ou do dock (RF11), cadastro com ação e resumo à vista (RF14), sem rolagem horizontal fora da esteira; foco visível, alvos ≥ 44 px, resultado do simulador anunciado; temas claro e escuro sem texto ilegível.

- [x] T18 — Regressão e entrega.
  - Arquivos: `docs/specs/precos-redesign-mobile/*` (marcar tasks), changelog se o projeto exigir
  - Pronto quando: `npm run lint`, `npx vitest run src/components/precos src/components/ui` e `npm run build` passam; todos os critérios de aceite do PRD marcados; modelos B e C registrados como descartados em `design.md`.

## Desvios em relação ao Tech Spec (decididos na execução)
- **T9 / T12:** a lista completa abre numa folha (`BottomSheet`) também no celular, não numa tela cheia; os hooks `usePrecos`, `usePrecosUrlState` e `useSelecaoPrecos` foram movidos para `PrecosCockpit/`. A correção de página fora do intervalo ficou no `PrecosCockpit`, que está sempre montado.
- **T10:** o resultado do dock não tem `aria-live`; quem anuncia é o simulador da folha (evita anúncio duplicado). O `SimuladorCobranca` ganhou o modo controlado (`valor` / `onChange`).
- **T11:** no celular o cabeçalho do detalhe não mostra tipo, situação e vigência (já estão na miniplaca selecionada e na aba Informações); a placa usa o tamanho `md` e o título "Tarifa" some sob a aba de mesmo nome. O simulador lateral e o dock se alternam em `md`.
- **T12:** a busca virou um botão de ícone na barra do módulo (nome acessível "Buscar ou ver todas as tabelas (N)") e "Novo preço" virou "+ Novo" no celular; a miniplaca mostra o primeiro degrau e a diária (dois degraus quando não há diária).
- **T14:** em vez de um componente novo `PrecoEtapasBarra`, o `PrecoEtapasNav` ficou responsivo (3 segmentos compactos no celular), para não duplicar o DOM do indicador de etapas.
- **T16:** o botão principal fica no dock no celular (envia o formulário pelo atributo `form`) e no formulário em telas grandes; o painel "Sua tabela" fica na página só em ≥ 1024 px.
- **Cadastro (revisão pedida depois da entrega):** a grade de horários passou a caber na tela do celular (horas nas linhas e 7 dias nas colunas, sem rolagem horizontal; a partir de `md` volta a 7 linhas × 24 colunas), e cada degrau da etapa "Quanto cobra" ficou mais baixo (horas, minutos e valor na mesma linha, com os nomes acessíveis completos mantidos).
- **DockBar:** ganhou `ocultarDe` ("md" ou "lg") e `folgaDaBarra(corte)` virou função.

## Verificação (T17 / T18)
- Capturas da janela visível em 360 × 640, 320 × 568, 768 × 1024 e 1280 × 800, tema claro e escuro; sem rolagem horizontal (`scrollWidth` igual à largura da janela).
- `npm run lint`: 0 erros (95 avisos já existentes). `npm run build`: passou. `npx vitest run`: 4055 testes passam; 3 falham fora deste módulo (testes de 403 em Minha Empresa, Usuários e Caixa esperam o link `/dashboard`, e `ErroSemPermissao` aponta para `/`; não foram tocados nesta feature).
- Não verificado: leitor de tela real (só os papéis ARIA e o teclado, por testes) e dispositivos físicos (iOS Safari).
