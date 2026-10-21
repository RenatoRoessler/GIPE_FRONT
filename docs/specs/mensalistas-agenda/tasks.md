# Tasks: Agenda de vencimentos dos mensalistas

Referências: ./prd.md, ./design.md, ./techspec.md

Antes de começar: conferir `node_modules/next/dist/docs/` conforme o `AGENTS.md` (a feature só toca em `useRouter` e `useSearchParams` de `next/navigation`). Toda task termina com `npm run lint` passando e os testes dela verdes (`npm run test`).

Ordem: T1 e T2 (em qualquer ordem) → T3 e T4 (em qualquer ordem) → T5 → T6 → T7 → T8 → T9 → T10. A T10 depende de homologação e dados de teste.

## Base (tema, regras, dados, abas)

- [x] T1 — Token `dangerSoft` e tom `danger` do `StatusBadge`
  - Arquivos: `src/styles/theme.ts`, `src/components/ui/StatusBadge/StatusBadge.styles.ts`, `StatusBadge.test.tsx` (novo ou existente)
  - Pronto quando:
    - `ThemeColors` ganha `dangerSoft` e os quatro temas (claro, escuro e os dois de sinalização) o definem: `rgba(226, 61, 78, 0.12)` no claro e `rgba(255, 107, 107, 0.16)` no escuro; os de sinalização reaproveitam o valor do par correspondente;
    - `StatusBadgeTone` aceita `"danger"`: fundo `dangerSoft`, texto na cor `text` e um ponto de 8px em `colors.danger` antes do texto;
    - o texto nunca usa `colors.danger` (contraste de cerca de 4,2:1, abaixo do mínimo para texto pequeno);
    - `npx tsc --noEmit` passa com os quatro temas.
  - Testes: o tom `danger` renderiza o texto e o ponto (o ponto é decorativo, `aria-hidden`); os demais tons não mudam.

- [x] T2 — Regras puras da agenda
  - Arquivos: `src/types/mensalista.ts`, `src/components/mensalistas/agenda.ts`, `agenda.test.ts`
  - Pronto quando:
    - existem os tipos `AgendaGrupoId`, `AgendaItemData`, `AgendaGrupoData`, `AgendaResumoData` e `Agenda` (Tech Spec §2);
    - `fimDaSemana(hoje)` devolve o domingo (o próprio dia se hoje é domingo) e `diasEntre(de, ate)` conta dias de calendário sem horas;
    - `montarAgenda(items, situacaoDe, hoje)` classifica pela tabela do Tech Spec §4: `sem-pagamento`, fora da agenda (desativado), `emDia`, `atrasados` (com `diasAtraso`), `hoje` e `semana`;
    - a data de vencimento é lida como dia local a partir dos 10 primeiros caracteres, sem passar por `new Date("AAAA-MM-DD")`;
    - a ordenação segue o Tech Spec (atrasados do mais antigo ao mais recente; hoje e semana por data e nome; `sem-pagamento` por tipo de situação e nome, com `localeCompare("pt-BR")`);
    - o resumo soma `hoje` + `semana` (quantidade e `valorMensalidade`) e informa `ate = fimDaSemana(hoje)`; grupos vazios não aparecem;
    - `filtrarAgenda(agenda, busca)` casa nome (sem acento e sem diferenciar caixa), placa (sem hífen) e documento (só dígitos, por prefixo) e recalcula o resumo.
  - Testes: cada linha da classificação; hoje sendo segunda, sábado e domingo; virada de mês e de ano; `dataProximoVencimento` nula e com horário (`...T00:00:00`); inativo desativado fora; ordenação de cada grupo; resumo e `emDia`; `diasEntre` atravessando horário de verão; busca com acento, placa com e sem hífen, documento mascarado, sem resultado, termo vazio.

- [x] T3 — Carregar todos os cadastros
  - Arquivos: `src/lib/api/services/mensalista.ts`, `src/components/mensalistas/useAgendaMensalistas.ts`, testes (`mensalista.agenda.test.ts`, `useAgendaMensalistas.test.tsx`)
  - Pronto quando:
    - `listAllMensalistas({ tamanhoPagina?, maxPaginas? })` busca a página 1 e as demais em paralelo (`Promise.all`), junta os itens em ordem de página e devolve `{ items, totalRecords, truncado }`;
    - os padrões são `tamanhoPagina = 100` e `maxPaginas = 10`; as páginas seguintes usam o `pageSize` devolvido pela primeira;
    - `truncado` é `true` quando `totalPages > maxPaginas`; um erro em qualquer página rejeita tudo;
    - `useAgendaMensalistas` usa `queryKey: [...MENSALISTAS_QUERY_KEY, "agenda"]`, `staleTime: 30_000`, `refetchOnWindowFocus: false` e `placeholderData: keepPreviousData`.
  - Testes (serviço mockado): uma página; várias páginas em ordem; corte por `truncado`; erro em uma página; uso do `pageSize` devolvido; a chave está sob o prefixo e é invalidada junto com os mensalistas.

- [x] T4 — Abas e URL
  - Arquivos: `src/components/mensalistas/aba.ts`, `aba.test.ts`, `MensalistasPage/MensalistasPage.tsx`, `MensalistasList/MensalistasList.tsx` (+ testes)
  - Pronto quando:
    - `ABAS` passa a `agenda`, `lista` e `tipos`, com `agenda` como padrão; `parseAba` aceita `{ temPagina }` e devolve `lista` quando há `pagina` e não há `aba`;
    - `MensalistasPage` navega para `/mensalistas` (agenda), `/mensalistas?aba=lista` e `/mensalistas?aba=tipos`; por enquanto a aba agenda mostra um espaço reservado simples (substituído na T6);
    - `MensalistasList` pagina com `?aba=lista&pagina=N` (e `?aba=lista` na página 1) e limpa a busca voltando para `?aba=lista`;
    - o texto das abas é "Agenda", "Lista" e "Tipos de mensalidade".
  - Testes: `parseAba` (padrão, válidas, inválida, `pagina` sem `aba`); troca de aba atualiza a URL sem rolar a página; as URLs de paginação da lista; a aba padrão é a agenda.

## Agenda (A, B, C)

- [x] T5 — Itens, grupos e resumo
  - Arquivos: `src/components/mensalistas/AgendaView/AgendaItem.tsx`, `AgendaGrupo.tsx`, `AgendaResumo.tsx`, `AgendaView.styles.ts`, `index.ts`, testes
  - Pronto quando:
    - `AgendaItem` (`li`) mostra, na grade de cinco colunas a partir de `breakpoints.md`: vencimento (data em `fontSizes.lg` e `tabular-nums`; abaixo "hoje", o dia da semana ou o atraso em `StatusBadge tone="danger"`), o nome como botão que chama `onVerFicha`, tipo e categoria, até duas placas e `+N`, o valor e a ação;
    - abaixo de `breakpoints.md`, o item vira duas linhas (nome e ação na primeira; placa, vencimento e valor na segunda), com a ação ocupando as duas e `min-height: 44px` no nome e na ação;
    - a ação segue o Tech Spec §5: "Receber" quando `podeRegistrarPagamento(situacao).pode` e (grupo ≠ `sem-pagamento` ou `situacao.kind` = `aguardando-pagamento`); "Reenviar" ou "Enviar contrato" para `aguardando-aceite`, `link-vencido` e `sem-contrato`; nenhuma enquanto `carregando`; primária em atrasados e hoje, secundária em esta semana;
    - em `sem-pagamento` o selo no lugar da data diz "1º pagamento" (`info`), "Contrato" (`warn`) ou "Link vencido" (`danger`), com a linha de fato de `apresentarSituacao`;
    - `AgendaGrupo` é uma `section` com `aria-labelledby`, título, contagem (em `StatusBadge tone="danger"` nos atrasados), `ul` e "Ver os outros N" em `semana` e `sem-pagamento` (cinco visíveis); atrasados e hoje mostram todos;
    - `AgendaResumo` escreve a frase "Até domingo, 25/10: N mensalistas vencem, somando R$ X." (singular quando N = 1; "Nenhum mensalista vence até domingo, 25/10." quando N = 0), com contagem e valor em negrito e `tabular-nums`, em `role="status"`;
    - nomes de ação citam o mensalista ("Receber de {nome}", "Reenviar contrato para {nome}", "Ver ficha de {nome}").
  - Testes: dados do item (data, atraso em texto, tipo, placas, valor); mensalista sem veículos; ação por situação; peso da ação por grupo; "Ver os outros N"; frase do resumo nos três casos; nomes acessíveis.
  - Depende de: T1 e T2.

- [x] T6 — Tela da agenda e estados
  - Arquivos: `src/components/mensalistas/AgendaView/AgendaView.tsx`, `AgendaView.styles.ts`, `MensalistasPage/MensalistasPage.tsx` (+ testes)
  - Pronto quando:
    - `AgendaView` usa `useAgendaMensalistas`, `useContratosMensalistas` (sobre os itens carregados) e `derivarSituacao` para montar a agenda com `useMemo`, e substitui o espaço reservado da T4;
    - a busca (`Input`, "Nome, placa ou documento") filtra com debounce de 250 ms, mantém os grupos e anuncia "N encontrados" ou "Nada encontrado para "{termo}"" com "Limpar busca"; o termo fica só em estado local;
    - **carregando:** esqueletos no formato dos grupos (título e três linhas), `role="status"` "Carregando a agenda"; **vazio:** "Nenhum mensalista para atender até domingo." com "Ver todos os mensalistas"; **erro:** `ErrorBanner role="alert"` com a mensagem do back e "Tentar novamente", sem o botão em erro de permissão; **atualizando:** conteúdo anterior com opacidade reduzida e `aria-busy`;
    - a linha tracejada de "em dia" mostra a contagem e "Ver todos", que leva à aba Lista; quando `truncado`, aparece a nota "Mostrando os primeiros N mensalistas. Use a Lista para os demais." e o resumo diz "nesta carga".
  - Testes (serviços mockados): grupos na ordem e sem os vazios; cada estado; busca por nome, placa e documento; "Ver todos" leva à Lista; nota de `truncado`; erro com e sem "Tentar novamente".
  - Depende de: T3, T4 e T5.

- [x] T7 — Ações a partir da agenda
  - Arquivos: `src/components/mensalistas/AgendaView/AgendaView.tsx`, `AgendaItem.tsx`, `MensalistasPage/MensalistasPage.tsx` (+ testes)
  - Pronto quando:
    - "Receber" chama `onReceberPagamento(mensalista, situacao)` e abre o `PagamentoMensalistaModal` direto; o nome abre o `MensalistaFichaModal`; os dois callbacks vêm de `MensalistasPage`, os mesmos que a lista usa;
    - "Reenviar" usa `useReenviarContrato` com o mesmo toast da lista, desabilita só o item em andamento e mostra "Reenviando…";
    - depois do pagamento a agenda se atualiza sem recarregar a página, o item sai do grupo e o foco vai (nesta ordem) para o botão-nome do item que ocupa o lugar, o título do grupo ou o campo de busca;
    - uma região `role="status"` oculta anuncia "{nome} saiu de {grupo}."; o toast de pagamento continua o do modal.
  - Testes: "Receber" abre o pagamento com a situação certa; o nome abre a ficha; reenvio desabilita só o item e mostra o toast; depois do pagamento o item some, o foco cai no lugar certo e o anúncio é lido.
  - Depende de: T6.

- [x] T8 — Celular
  - Arquivos: `src/components/mensalistas/MensalistasPage/MensalistasPage.tsx`, `Mensalistas.styles.ts`, `AgendaView.styles.ts` (+ testes)
  - Pronto quando:
    - abaixo de `breakpoints.md`, o botão "Novo mensalista" do cabeçalho some e entra um botão flutuante "+ Novo" (`position: fixed`, canto inferior direito, 48px de altura, `shadows.md`), deslocado pela área segura do aparelho (`env(safe-area-inset-*)`);
    - o conteúdo da página ganha `padding-bottom` para o último item não ficar atrás do botão;
    - sem rolagem horizontal de 320px a 1024px; o resumo cabe em uma linha curta ("Até domingo: N vencem, R$ X"); a busca ocupa a largura toda; as abas rolam na horizontal;
    - botões, nome do item e abas têm pelo menos 44px de altura; nome e tipo longos cortam com reticências; o texto não fica abaixo de 14px.
  - Testes: o botão flutuante aparece só no celular e abre o cadastro; o botão do cabeçalho aparece só no computador (via `matchMedia` simulado ou classes testáveis, no padrão dos testes existentes). Conferência manual no navegador em 320px, 390px e tablet (item do roteiro da T10).
  - Depende de: T6.

- [x] T9 — Busca por nome e placa na Lista
  - Arquivos: `src/components/mensalistas/MensalistasList/MensalistasList.tsx`, `useMensalistas.ts`, `src/components/mensalistas/format.ts` (se precisar), testes
  - Pronto quando:
    - a Lista continua buscando por documento pelo servidor, com a máscara atual;
    - quando o termo digitado contém letras, ou não parece um documento, a Lista usa o conjunto completo (`useAgendaMensalistas`) filtrado no cliente por nome e placa, com paginação local de 20 itens, e mostra o mesmo estado de "sem resultado";
    - o rótulo e a dica do campo passam a ser "Buscar por nome, placa, CPF ou CNPJ";
    - trocar do modo documento para o modo nome/placa e vice-versa volta à página 1, e o termo continua só em estado local.
  - Testes: busca por documento continua chamando o serviço com o documento; busca por nome e por placa não chama a listagem paginada e filtra o conjunto completo; paginação local; sem resultado; volta à página 1.
  - Depende de: T3 e T4.

## Verificação final

- [ ] T10 — Verificação final e validação contra a API real
  - Arquivos: `docs/specs/mensalistas-agenda/prd.md` (critérios de aceite), `docs/specs/mensalistas-agenda/techspec.md` (seção "Resultados da execução"), `agenda.ts` e o serviço (ajustes pelos dados reais)
  - Pronto quando:
    - `npm run lint`, `npm run test` e `npm run build` passam;
    - **roteiro manual** executado em homologação, com dados de teste combinados, registrando o resultado de cada item:
      1. conferir `dataProximoVencimento` e `diasAteProximoVencimento` de atrasados, de hoje e do futuro, e como a API marca o atraso (ajustar `classificar` se for diferente da data);
      2. conferir o tamanho máximo de página aceito e o tempo de carga com o volume real;
      3. pagar um atrasado e conferir que sai do grupo, o foco e o anúncio (depende do `usuarioId` do pagamento);
      4. reenviar o contrato de um item da agenda;
      5. conferir no celular (320px, 390px e tablet) os alvos de 44px, a rolagem das abas e o botão flutuante com o teclado aberto;
      6. conferir os temas claro e escuro, incluindo o selo `danger`;
    - o resultado e os formatos reais ficam registrados no Tech Spec;
    - cada critério de aceite do `prd.md` (RF-01 a RF-10) foi conferido, ou tem pendência registrada;
    - `docs/specs/input.md` sem JWT real antes de qualquer commit.
  - Depende de: T1 a T9 e de ambiente de homologação com dados de teste.
  - **Status (2026-10-21):** parcial. Feitos: `npm run lint`, `npm run test` (1241 testes) e `npm run build` verdes, e a seção "Resultados da execução" no Tech Spec. Pendentes (precisam de login válido, homologação e dados de teste): o roteiro manual de 6 itens, a confirmação de como a API marca o atraso e o tamanho máximo de página, e a conferência dos critérios de aceite do PRD contra a API real. A conferência visual no celular (320px, 390px e tablet) e nos dois temas também não foi feita no navegador.
