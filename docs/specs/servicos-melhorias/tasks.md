# Tasks: Melhorias na Tela de Serviços

Referências: ./prd.md, ./techspec.md (design em ./design.md)

Nota: a tela única de Serviços (com abas Fila e Catálogo) foi separada em duas páginas por `docs/specs/servicos-menu-separado/`: a fila em `/servicos` (`FilaServicosPage`) e o catálogo em `/servicos/catalogo` (`CatalogoServicosPage`). Onde estas tasks falam de `ServicosPage`, leia essas duas páginas; as abas por status dentro da fila (celular) continuam existindo.

Convenções para todas as tasks: seguir as skills `code-best-practices` e `styled-components-best-practices`; nenhum valor visual fora do tema; antes de concluir cada task rodar `npm run lint` e os testes do que foi tocado (`npx vitest run <caminho>`); `npm run build` ao fim de cada bloco. Caminhos abaixo relativos a `src/`.

**Fase A** (T1–T24) não depende do back. **Fase B** (T25–T30) só começa depois que o back confirmar o contrato (techspec, "Dependências de back"). Decisões assumidas até resposta do produto: manter o preço "Todas as categorias" como atalho (T14); sem regra entre duração e tempo grátis, só formato (T13).

## Fase A — Base (funções puras e dados)

- [x] T1 — Tipos da fila e do catálogo preparados para campos opcionais
  - Arquivos: `types/servico.ts`
  - Pronto quando: `PrecoServico` tem `duracaoMinutos` e `tempoPermitidoMinutos` (`number | null`); `ServicoPayload.precos[]` aceita os dois opcionais; `ItemFila` tem `criadoEm`, `iniciadoEm`, `prontoEm` (`string | null`) e `duracaoMinutos` (`number | null`); `npx tsc --noEmit` sem erro (ajustar fixtures de teste que montam esses tipos).

- [x] T2 — Mapper lê os campos novos, tolerando ausência
  - Arquivos: `lib/api/services/servico.mapper.ts`, `lib/api/services/servico.mapper.test.ts`
  - Pronto quando: `fromPreco` lê duração e tempo permitido por categoria (0 vira `null`); `fromItemFila` lê `dataCriacao|criadoEm|adicionadoEm`, `dataHoraInicio|inicioEm|iniciadoEm`, `dataHoraPronto|prontoEm`, `duracaoMinutos`; testes cobrem resposta com e sem os campos (ausente = `null`, nunca erro).

- [x] T3 — Funções puras do catálogo (faixa de preço, duração, grátis, categorias, resumo, busca por descrição)
  - Arquivos: `components/servicos/catalogo.ts`, `components/servicos/catalogo.test.ts`
  - Pronto quando: existem `faixaDePreco`, `faixaDeDuracao`, `gratisDoServico` (texto ou `null`), `categoriasAtendidas`, `resumirCatalogo` (`ativos`, `comTempoGratis`) e `filtrarServicos` com `incluirDescricao` opcional (normalizada, sem acento); testes cobrem preço único, preço por categoria, "Todas" (99), serviço sem duração e busca por descrição.

- [x] T4 — Funções puras da fila (tempos, atraso, "+N no carro", busca, resumo)
  - Arquivos: `components/servicos/fila.ts`, `components/servicos/fila.test.ts`
  - Pronto quando: existem `tempoNaFila`, `decorridoEmExecucao`, `previsaoDeTermino`, `progresso`, `atrasado`, `minutosAtrasado`, `outrosNoCarro`, `filtrarFila` (ignora tudo que não é A-Z0-9; placa por `includes`, prisma por igualdade) e `resumirFila`; todas devolvem `null`/falso quando falta dado (nunca estimam); testes cobrem cada status, dado ausente, atraso e a borda exata da duração.

- [x] T5 — Hook `useAgora` e relógios separados na fila
  - Arquivos: `hooks/useAgora.ts`, `hooks/useAgora.test.tsx`, `components/servicos/FilaServicos/FilaServicos.tsx`
  - Pronto quando: `useAgora(intervaloMs)` devolve `Date.now()` atualizado no intervalo e limpa o timer ao desmontar; `FilaServicos` usa 1 s só para "Atualizado há N s" e 30 s para os tempos; o teste existente de `textoAtualizado` continua passando; sem re-render da lista inteira por segundo (verificar com teste de contagem de render do cartão ou revisão).

- [x] T6 — Modelos de serviço (constantes e aplicação)
  - Arquivos: `components/servicos/modelos.ts`, `components/servicos/modelos.test.ts`
  - Pronto quando: `MODELOS_DE_SERVICO` (lavagem simples, completa, higienização interna, polimento, cera rápida) e `aplicarModelo(modelo)` devolvem valores do formulário (nome, descrição, valor/duração/grátis por categoria, categoria que não recebe quando couber); testes verificam arredondamento de valores e categorias excluídas.

- [x] T7 — Texto do comprovante compartilhado
  - Arquivos: `components/servicos/format.ts`, `components/servicos/format.test.ts` (conferir `components/veiculos/ComprovantePublico`)
  - Pronto quando: `textoComprovante({ duracaoMinutos, tempoPermitidoMinutos })` e `extensoDeMinutos` existem e o comprovante público usa as mesmas funções (ou a prévia usa as do comprovante, se já existirem); testes cobrem "1 hora e 30 minutos", sem previsão e sem tempo grátis.

## Fase A — Formulário: dados e regras

- [x] T8 — Novo formato de valores do formulário (`categorias`) e schema
  - Arquivos: `lib/schemas/servico.ts`, `lib/schemas/servico.test.ts` (criar se não existir)
  - Pronto quando: `ServicoFormValues` tem `categorias: Record<number, { recebe; valor; duracao; gratis }>` mais `precoTodas`; `servicoSchema` valida nome, valor da categoria que recebe, ao menos um preço, minutos inteiros; testes cobrem cada mensagem do design ("Informe o valor de {categoria}", "Preencha o valor de ao menos uma categoria").

- [x] T9 — Valores iniciais e payload com o novo formato
  - Arquivos: `components/servicos/ServicoFormModal/valores.ts`, `lib/schemas/servico.ts` (`toServicoPayload`), testes dos dois
  - Pronto quando: `valoresIniciais(servico)` preenche `categorias` a partir de `precos` (categoria sem preço próprio e sem "Todas" = `recebe: false`); `toServicoPayload` envia só categorias que recebem, valores em reais, mantém `duracaoMinutos`/`tempoPermitidoMinutos` globais e **não** envia campos por categoria enquanto a flag da Fase B estiver desligada (T25); round-trip editar → payload coberto por teste.

- [x] T10 — Duplicidade de nome checada no cliente
  - Arquivos: `components/servicos/ServicoFormModal/validarNome.ts`, teste
  - Pronto quando: `nomeJaExiste(nome, servicos, idEditando?)` compara normalizado entre serviços ativos e ignora o próprio na edição; o formulário mostra "Já existe um serviço ativo com esse nome. Use outro nome ou edite o existente."; o erro do back continua sendo exibido no banner.

- [x] T11 — `repetirPrimeiraLinha` (função pura)
  - Arquivos: `components/servicos/ServicoFormModal/repetir.ts`, `repetir.test.ts`
  - Pronto quando: devolve `{ valores, copiadas, origem }`, copia valor/duração/grátis da primeira categoria que recebe e tem valor para as que recebem e estão vazias; não sobrescreve preenchidas; sem origem devolve erro "Preencha o valor de uma categoria para repetir nas outras".

- [x] T12 — Foco no primeiro campo inválido
  - Arquivos: `hooks/useFocoNoPrimeiroErro.ts`, teste
  - Pronto quando: ao enviar com erro, o foco vai ao primeiro campo com `aria-invalid`; sem erro, não mexe no foco.

## Fase A — Catálogo (lista)

- [x] T13 — `CategoriasAtendidas`
  - Arquivos: `components/servicos/CategoriasAtendidas/*` (componente, styles, index, teste)
  - Pronto quando: mostra as seis categorias (rótulos curtos), as que o serviço não atende riscadas, com `aria-label` em texto ("Atende Moto, Carro pequeno… Não atende Caminhão"); só tokens do tema; teste de acessibilidade do texto.

- [x] T14 — `ServicoCard` no lugar de `ServicoListItem`
  - Arquivos: `components/servicos/ServicoCard/*`, remoção de `ServicoListItem` (e testes que o usam), `ServicosMasterDetail/ServicosMasterDetail.tsx`
  - Pronto quando: o item mostra nome, meta (duração e grátis ou "cobra permanência"), `CategoriasAtendidas`, preço ("a partir de" quando varia) em mono; mantém `aria-current` e a barra do selecionado; `ServicosMasterDetail` usa o novo item sem mudar `?servico=` nem o filtro Ativos/Inativos; testes existentes atualizados.

- [x] T15 — Resumo, busca por descrição e estados da lista
  - Arquivos: `components/servicos/ServicosMasterDetail/ServicosMasterDetail.tsx`, styles e teste
  - Pronto quando: chips "N ativos" e "N com tempo grátis no pátio" com `aria-live="polite"`; busca também por descrição; "sem resultado" com **Limpar busca**; estado vazio "Cadastre o primeiro serviço" com o texto do design e **Novo serviço**; botão flutuante "Novo serviço" no celular respeitando `layout.fabClearance`; testes cobrem os quatro estados.

## Fase A — Cadastro (desktop)

- [x] T16 — `ModelosDeServico`
  - Arquivos: `components/servicos/ModelosDeServico/*`
  - Pronto quando: chips só no cadastro novo; escolher um modelo preenche o formulário (T6) sem bloquear edição; `aria-pressed`; teste.

- [x] T17 — `CategoriaLinha` e grade de categorias
  - Arquivos: `components/servicos/CategoriaLinha/*`, `components/servicos/PrecosPorCategoria` (formulário vs. leitura: separar `PrecosPorCategoria` de leitura do campo de edição)
  - Pronto quando: linha com nome + exemplos, valor (máscara monetária, prefixo R$), duração e grátis (sufixo min — campos visíveis só se T25 ligado, senão ocultos), `Switch` "{categoria} recebe este serviço" e estado "Não faz"; cabeçalho de colunas; foco e rótulos acessíveis; teste de renderização por estado.

- [x] T18 — `PreviaDoServico`
  - Arquivos: `components/servicos/PreviaDoServico/*`
  - Pronto quando: mostra "Como aparece ao lançar no carro" reutilizando `ServicoOpcao` (nome, meta, preço, "a partir de") e "Não aparece para: …"; lê os valores via `useStore(form.store)` e atualiza a cada digitação; sem estado duplicado; teste.

- [x] T19 — Reescrever `ServicoFormModal` (página única)
  - Arquivos: `components/servicos/ServicoFormModal/ServicoFormModal.tsx`, styles, teste
  - Pronto quando: `Modal size="lg"` com seções 1 e 2, modelos (T16), campos globais de duração/tempo permitido mantidos (Fase A), preço "Todas as categorias" como atalho "Mesmo valor para todas" (decisão assumida), grade (T17), "Repetir a 1ª linha nas vazias" com Toast "Copiado de X para N categorias", prévia (T18), validação e foco (T8, T10, T12), Inativar na edição com `ConfirmDialog`, `ErrorBanner` para erro do back, Toast de sucesso; testes do fluxo criar, editar, repetir, nome duplicado e erro 400.

## Fase A — Cadastro (celular, 3 passos)

- [x] T20 — `CategoriaFolha`
  - Arquivos: `components/servicos/CategoriaFolha/*`
  - Pronto quando: `BottomSheet` com `Switch`, valor, chips de duração e de tempo grátis (+ campo "Outro") e caixa "Usar também nas N categorias sem valor"; edita **rascunho local** e só grava no form em Salvar; Fechar descarta; foco volta ao gatilho; teste (inclui `<dialog>` aninhado ao do formulário).

- [x] T21 — `ServicoFormPassos` (passos 1, 2 e 3)
  - Arquivos: `components/servicos/ServicoFormPassos/*`
  - Pronto quando: `Stepper` e "N de 3"; passo 1 dados + modelos; passo 2 lista de categorias com resumo, contador "N de M prontas / K sem valor" e estados pronta, não faz, falta; passo 3 revisão com seletor de categoria e o texto do comprovante (T7); `ActionBar` fixa respeitando `layout.actionBarHeight`; voltar e fechar sem perder dados; Inativar no passo 1 na edição; testes de navegação entre passos e de bloqueio com categoria sem valor.

- [x] T22 — Escolher fluxo por viewport no formulário
  - Arquivos: `components/servicos/ServicoFormModal/ServicoFormModal.tsx`
  - Pronto quando: `useIsMobile()` decide entre página única e passos, compartilhando o mesmo `useAppForm`, schema e payload; trocar de tamanho de tela com o formulário aberto não perde o digitado; teste com os dois modos.

## Fase A — Fila

- [x] T23 — `FilaTempo`, `ResumoDaFila` e `MotivosRapidos`
  - Arquivos: `components/servicos/FilaTempo/*`, `components/servicos/ResumoDaFila/*`, `components/servicos/MotivosRapidos/*`
  - Pronto quando: `FilaTempo` renderiza por status só o que existe de dado (T4), com `ProgressBar` (`aria-label`) e linha de atraso em texto; `ResumoDaFila` mostra chips por status e "N passou da previsão" só com `atrasados > 0`; `MotivosRapidos` são chips `aria-pressed`; testes de cada um, incluindo dado ausente.

- [x] T24 — Reescrever `FilaCard`, `FilaServicos` e `CancelarServicoDialog`
  - Arquivos: `components/servicos/FilaCard/*`, `components/servicos/FilaServicos/*`, `components/servicos/CancelarServicoDialog/*` e testes
  - Pronto quando: cartão com placa, selo de prisma, veículo, serviço, "+N no carro", `FilaTempo`, ação principal grande (≥ `layout.touchTarget`) e correção discreta; borda e texto de atraso quando `atrasado`; `FilaServicos` com cabeçalho "agora HH:MM", `ResumoDaFila`, busca "Placa ou prisma" (maiúsculas automáticas, "Limpar busca", "Busca sem resultado"), mensagens de coluna vazia do design, mantendo desfazer, foco ao vizinho, `?status=`, polling de 15 s e `aria-live`; diálogo de cancelamento com `MotivosRapidos` e título "Cancelar {serviço}?"; o **texto de efeito de cobrança só entra depois da confirmação do back** (até lá, só o resumo placa/modelo); cancelar continua só em Na fila e só com `AREA.ServicosPatio`; testes cobrem busca, atraso, "+N", motivos rápidos e cancelamento oculto para o Lavador.

## Fechamento da Fase A

- [ ] T24b — Verificação da Fase A
  - Andamento: a parte automática passou (tsc, eslint, vitest e build). Falta a conferência com o app rodando: ver `./roteiro-conferencia.md` (seções 2 a 6).
  - Arquivos: todos os tocados
  - Pronto quando: `npm run lint`, `npx vitest run src/components/servicos src/lib/api/services src/lib/schemas src/hooks` e `npm run build` passam; conferência manual em 360px, 768px e ≥1024px, tema claro e escuro, sem rolagem horizontal; critérios de aceite do PRD verificados item a item e os dependentes de Fase B anotados como pendentes.

## Fase B — Depende do back (só iniciar com contrato confirmado)

- [x] T25 — Ligar duração e tempo grátis por categoria no catálogo
  - Arquivos: `components/servicos/catalogo.ts` (flag `RECURSOS.duracaoPorCategoria`), `lib/schemas/servico.ts` (`toServicoPayload`), `ServicoFormModal`, `ServicoFormPassos`, `CategoriaLinha`, `CategoriaFolha`, testes
  - Pronto quando: com a flag ligada, o payload envia `duracaoMinutos` e `tempoPermitidoMinutos` por categoria (0 de grátis omitido), a grade e a folha mostram os campos, a lista, a prévia e o comprovante usam o valor da categoria; com a flag desligada nada muda; testes dos dois modos.

- [x] T26 — Detalhe do serviço com tempos por categoria
  - Arquivos: `components/servicos/ServicoDetalhe/*`, `ServicoDetalheSheet/*`, `PrecosPorCategoria/*`
  - Pronto quando: a tabela de preços mostra duração e grátis por categoria quando existirem, mantendo a leitura atual quando não; teste.

- [x] T27 — Tempos reais da fila
  - Arquivos: `components/servicos/FilaCard/*`, `FilaTempo/*`, `fila.ts`
  - Pronto quando: com os campos do back presentes, o cartão exibe "Na fila há…", início, previsão de término, progresso, atraso e "pronto às…/aguardando retirada"; resumo conta atrasados; com um ou mais campos ausentes, só aquele trecho some; teste com resposta real de exemplo.

- [x] T28 — Otimismo da troca de status com datas
  - Arquivos: `components/servicos/useAtualizarStatusServico.ts`, teste
  - Pronto quando: ao iniciar ou concluir na atualização otimista, o item ganha `iniciadoEm`/`prontoEm` locais até o refetch confirmar; desfazer e erro restauram os valores anteriores; testado.

- [x] T29 — Texto de efeito do cancelamento (após confirmação do back)
  - Arquivos: `components/servicos/CancelarServicoDialog/*`, teste
  - Pronto quando: o texto "O serviço sai do valor e do tempo grátis do carro…" aparece com a redação confirmada pelo back; teste.

- [ ] T30 — Verificação final e QA
  - Andamento: a parte automática passou. Falta a conferência manual e o QA com Playwright: ver `./roteiro-conferencia.md` e a skill `executar-qa`.
  - Arquivos: todos os tocados; `docs/specs/servicos-melhorias/`
  - Pronto quando: lint, vitest e build passam; todos os critérios de aceite do PRD marcados; rodar `executar-qa` nas três telas (desktop e celular, claro e escuro); registrar divergências em `bugs.md` se houver.

## Ordem e dependências

- T1 → T2; T3, T4, T6, T7 independentes depois de T1.
- T5 depende de T4. T8 depende de T1; T9 depende de T8; T10, T11, T12 dependem de T8.
- T13 → T14 → T15 (precisa de T3). T16 depende de T6; T17, T18 dependem de T8 e T7; T19 depende de T9–T12 e T16–T18.
- T20 e T21 dependem de T8, T11, T7; T22 depende de T19 e T21.
- T23 depende de T4 e T5; T24 depende de T23 (e de T1/T2 para os tipos).
- T24b fecha a Fase A. T25–T29 dependem do contrato do back; T25 antes de T26; T27 antes de T28; T30 por último.
