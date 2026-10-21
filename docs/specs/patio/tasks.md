# Tasks: Tela de pátio

Referências: ./prd.md, ./design.md, ./techspec.md

Antes de começar: conferir `node_modules/next/dist/docs/` conforme o `AGENTS.md` (a feature cria a rota `/patio` e usa só `next/link` e `useRouter`). Toda task termina com `npm run lint` passando e os testes dela verdes (`npm run test`). **Nunca copiar o token de `docs/specs/input.md` para código, testes ou documentos**: os testes montam dados fictícios com os mesmos campos.

Ordem: T1 e T2 (em qualquer ordem) → T3 → T4 e T5 (em qualquer ordem) → T6 → T7 → T8 → T9. A T9 depende de homologação e dados de teste.

## Base (tipos, serviço, regras, dados)

- [x] T1 — Tipos, serviço e leitor da API
  - Arquivos: `src/types/patio.ts` (novo), `src/lib/api/services/patio.ts`, `src/lib/api/services/patio.list.test.ts` (novo), `src/components/patio/patioKeys.ts` (novo)
  - Pronto quando:
    - existem `PatioVeiculo`, `PatioFiltroTipo`, `PatioFiltros` e `PatioResumo` (Tech Spec §2);
    - `PATIO_QUERY_KEY = ["patio"] as const` fica em `patioKeys.ts`, sem importar nada das telas de veículos (evita ciclo com a saída e a entrada);
    - `listPatio()` chama `GET /Patio` e mapeia cada item com `fromPatioResponse`: números e textos lidos de forma tolerante, placa normalizada (`normalizePlaca`), `codigoTicket` como número, texto numérico ou `null`, `modelo` e `cor` vazios como `null`, `token` como texto não vazio ou `null`, e **sem ler** `quadroChaves`;
    - resposta que não é lista vira lista vazia; erros sobem como `ApiError`.
  - Testes: mapeia todos os campos; `modelo` e `cor` nulos e vazios; `codigoTicket` nulo, numérico e em texto; placa com hífen e em minúsculas; `token` vazio; campo `quadroChaves` ignorado; corpo que não é lista; erro da API.

- [x] T2 — Regras puras do pátio
  - Arquivos: `src/components/patio/patio.ts`, `patio.test.ts`
  - Pronto quando:
    - `ordenarPatio` ordena por `minutosPermanencia` decrescente e, no empate, pela placa, sem alterar a lista recebida;
    - `filtrarPatio` aplica juntos busca, tipo (`todos`, `mensalistas`, `avulsos`) e categoria (número ou `todas`); a busca ignora acento e caixa e casa:
      - **placa:** o termo reduzido a letras e números, em maiúsculas, aparece na placa (com ou sem hífen, a partir de 2 caracteres);
      - **modelo:** todas as palavras digitadas aparecem no modelo, em qualquer ordem;
      - **ticket e sequencial:** termo só com dígitos casa, por prefixo, o `sequencial` ou o `codigoTicket`;
    - `resumirPatio(todos, visiveis)` devolve `{ total, mostrados }`;
    - `rotuloCategoria(n)` devolve o rótulo de `CATEGORIA_VEICULO_OPTIONS` ou "Categoria N" para valor desconhecido;
    - `corDoVeiculo(cor)` devolve `{ texto, amostra }`: amostra só para cores de `CORES_VEICULO` (via `matchCor`); texto livre sem amostra; vazia como "—".
  - Testes: ordem e desempate; cada tipo de busca (placa parcial e com hífen, modelo com acento e várias palavras, ticket e sequencial); termo vazio; mensalista × avulso; categoria; filtros combinados; resumo; cor conhecida, livre ("teste") e vazia; categoria desconhecida.

- [x] T3 — Hook `usePatio`
  - Arquivos: `src/components/patio/usePatio.ts`, `usePatio.test.tsx`
  - Pronto quando:
    - `usePatio({ pausado })` usa `queryKey: PATIO_QUERY_KEY`, `staleTime: 30_000`, `placeholderData: keepPreviousData` e `refetchOnWindowFocus: true`;
    - `refetchInterval` é `60_000` e vira `false` quando `pausado` é verdadeiro; `refetchIntervalInBackground` é falso (não atualiza com a aba escondida);
    - invalidar `PATIO_QUERY_KEY` recarrega a lista.
  - Testes (serviço mockado, relógio falso): carrega a lista; recarrega a cada 60 s; não recarrega com `pausado`; invalidar a chave recarrega; erro da API chega ao hook.
  - Depende de: T1.

## Menu, página e fluxos existentes

- [x] T4 — Menu e página
  - Arquivos: `src/lib/nav.ts`, `src/components/layout/NavSign/NavIcons.tsx`, `src/app/(app)/patio/page.tsx` (novo), testes dos menus (`Gantry` e `MobileNav`, se existirem; senão, um teste de `nav.ts`)
  - Pronto quando:
    - `NavIconId` ganha `"yard"` e `NAV_ITEMS` ganha `{ label: "Pátio", href: "/patio", icon: "yard" }` entre "Saída de Veículos" e "Caixa";
    - `YardIcon` (quadrado com a letra P em traço, 20px, `strokeWidth` 1.8, como os demais) está em `ICONS`;
    - o item aparece no menu do computador e no do celular e fica ativo em `/patio` e nas rotas filhas;
    - a página `/patio` renderiza o título "Pátio" e a descrição, no padrão de `veiculos/saida/page.tsx`, com um espaço reservado simples no lugar da tela (substituído na T7);
    - `npx tsc --noEmit` passa (o `Record<NavIconId, …>` exige o ícone novo).
  - Testes: o item na ordem certa; estado ativo em `/patio`; o ícone novo renderiza; a página mostra o título.

- [x] T5 — Saída direta e invalidação do pátio
  - Arquivos: `src/components/veiculos/SaidaVeiculoModal/SaidaVeiculoModal.tsx`, `useSaidaFlow.ts`, `src/components/veiculos/EntradaVeiculoModal/EntradaVeiculoModal.tsx` (+ testes existentes e novos)
  - Pronto quando:
    - `SaidaVeiculoModalProps` ganha `buscaInicial?: SaidaBusca` e `useSaidaFlow({ buscaInicial })` começa com essa busca e com `buscaValues.placa` preenchido;
    - com `buscaInicial`, a fase é `pagamento` mesmo antes de a consulta chegar (resumo vazio e pagamento inativo, como os componentes já suportam), e o **leitor de QR não é montado**, então a câmera não é pedida;
    - se a consulta falha (veículo que saiu em outro terminal), a fase cai em `pesquisa` com o aviso que o fluxo já mostra e a placa preenchida;
    - "Voltar para a pesquisa" (`limpar`) desliga o modo direto e volta de verdade à pesquisa;
    - sem `buscaInicial`, o comportamento atual não muda (os testes existentes passam sem alteração);
    - registrar a saída (`tipo: "registrada"`) e registrar a entrada passam a chamar `invalidateQueries({ queryKey: PATIO_QUERY_KEY })`.
  - Testes: abre direto em "Confirmar saída"; a consulta da placa acontece uma vez; o leitor de QR **não** é montado; falha da consulta cai na pesquisa com o aviso e a placa preenchida; "Voltar para a pesquisa" volta; sem `buscaInicial` tudo como antes; a saída e a entrada invalidam o pátio.
  - Depende de: T1.

## Tela do pátio

- [x] T6 — Tabela e itens
  - Arquivos: `src/components/patio/PatioView/PatioTabela.tsx`, `PatioLinha.tsx`, `PatioView.styles.ts`, `index.ts`, testes
  - Pronto quando:
    - **computador (a partir de `breakpoints.md`):** `Table` de sete colunas, com cabeçalho `th scope="col"`:
      - *placa:* `PlateDisplay size="md"` e, abaixo, `StatusBadge tone="info"` "Mensalista" (avulso não leva selo);
      - *veículo:* modelo, cor (amostra e texto só para cor conhecida) e `CategoriaIcon` com o rótulo (o ícone só para categoria conhecida);
      - *entrada:* `formatDateTime`, "Seq. N" e "Ticket N" quando existir;
      - *permanência:* o texto de `permanencia`, em negrito e `tabular-nums`;
      - *tabela de preço e operador:* duas linhas com reticências e `title` com o texto completo;
      - *ações:* "Registrar saída" (`Button size="sm"`, primário) e o ícone de comprovante;
    - **celular (abaixo de `breakpoints.md`):** a mesma árvore vira itens de quatro linhas (placa e ação; modelo, cor e categoria; permanência e entrada; tabela de preço e operador), no padrão do `ListaRow` de mensalistas, com o botão de comprovante abaixo de "Registrar saída" e `min-height: 44px` nos botões; sem rolagem horizontal;
    - o comprovante é `<a href="/comprovante/{token}" target="_blank" rel="noopener noreferrer">` com aparência de `IconButton` (44px) e nome "Ver comprovante de {placa} (abre em nova aba)"; sem token, o ícone não é renderizado; o token nunca aparece como texto;
    - modelo, cor, tabela de preço e operador ausentes mostram "—";
    - o botão de saída tem o nome "Registrar saída de {placa}" e chama `onRegistrarSaida(veiculo)`.
  - Testes: dados de cada coluna; traços para campos ausentes; selo só em mensalista; ticket só quando existe; cor conhecida e livre; categoria desconhecida; link do comprovante (href, target, rel, nome) e ausência sem token; o token não aparece no DOM como texto; o clique em "Registrar saída" entrega o veículo.
  - Depende de: T1 e T2.

- [x] T7 — Tela do pátio, busca, filtros e estados
  - Arquivos: `src/components/patio/PatioView/PatioView.tsx`, `PatioFiltros.tsx`, `PatioView.styles.ts`, `src/app/(app)/patio/page.tsx` (+ testes)
  - Pronto quando:
    - `PatioView` usa `usePatio`, `ordenarPatio` e `filtrarPatio` (em `useMemo`) e substitui o espaço reservado da T4;
    - o resumo diz "N veículos no pátio" (ou "M de N veículos" com busca ou filtro), em `role="status"`; "Atualizado às HH:mm" (de `dataUpdatedAt`) **não** é região viva; "Atualizar" chama `refetch()` e mostra "Atualizando…" desabilitado enquanto `isFetching`;
    - `PatioFiltros`: `Input` "Buscar por placa, modelo ou ticket" (debounce de 250 ms, só em estado local, fora da URL) e dois `Select` ("Tipo": Todos, Mensalistas, Avulsos; "Categoria": Todas e as sete categorias), e "Limpar filtros" só com filtro ativo;
    - mostra as primeiras 100 linhas e "Mostrar mais 100"; mudar busca ou filtro volta o limite a 100;
    - **estados:** carregando (esqueletos e `role="status"` "Carregando o pátio"); sem veículos ("Nenhum veículo no pátio." com "Registrar entrada", um `Link` para `/veiculos/entrada`); sem resultado ("Nada encontrado para “…”." e/ou "Nenhum veículo com esses filtros.", com "Limpar busca" e "Limpar filtros"); erro (`ListError`, sem "Tentar novamente" em 403); atualizando (opacidade reduzida e `aria-busy`);
    - a barra de busca continua visível enquanto a lista recarrega.
  - Testes (serviço mockado): resumo e horário; lista ordenada; busca por placa, modelo e ticket; filtros por tipo e categoria e combinados; "M de N"; "Limpar"; sem veículos; sem resultado; carregando; erro com e sem "Tentar novamente"; "Atualizar" e "Atualizando…"; "Mostrar mais 100" e volta a 100 ao filtrar.
  - Depende de: T3, T4 e T6.

- [x] T8 — Registrar saída e foco
  - Arquivos: `src/hooks/useFocoAposRemocao.ts` (novo) e `useFocoAposRemocao.test.tsx`, `src/components/patio/PatioView/PatioView.tsx` (+ testes)
  - Pronto quando:
    - "Registrar saída" define o veículo e renderiza `<SaidaVeiculoModal buscaInicial={{ tipo: "placa", valor: placa }} … />`, com o `Toast` de `useToast` ao concluir; `usePatio` fica `pausado` com o modal aberto;
    - `useFocoAposRemocao` guarda o item acionado e seus vizinhos e, quando o bloqueio (modal) termina e o item não está mais na lista, devolve o foco ao próximo vizinho que existe, ou a um alvo de reserva (o campo de busca) e devolve o texto do aviso; se o item continua (saída cancelada ou falha), não mexe no foco;
    - uma região `role="status"` oculta anuncia "{placa} saiu do pátio.";
    - cancelar o modal mantém o veículo na lista e a busca e os filtros intactos; depois da saída, busca e filtros continuam como estavam.
  - Testes: "Registrar saída" abre o modal com a placa; a saída concluída tira o veículo, o foco vai ao vizinho e o aviso é lido; sem vizinhos, o foco vai à busca; cancelar mantém tudo; a atualização automática não roda com o modal aberto; o hook isoladamente (vizinho, reserva, item que continua).
  - Depende de: T5 e T7.

## Verificação final

- [ ] T9 — Verificação final e validação contra a API real
  - Arquivos: `docs/specs/patio/prd.md` (critérios de aceite), `docs/specs/patio/techspec.md` (seção "Resultados da execução"), `patio.ts` e o serviço (ajustes pelos dados reais)
  - Pronto quando:
    - `npm run lint`, `npm run test` e `npm run build` passam;
    - **roteiro manual** em homologação, com dados de teste combinados, registrando o resultado de cada item:
      1. abrir o Pátio e conferir contagem, ordem, tabela de preço e operador;
      2. conferir `modelo` e `cor` nulos, o formato de `permanencia` abaixo de um dia e o tamanho máximo da lista;
      3. buscar por placa, modelo e ticket;
      4. registrar a saída a partir da lista e conferir que o veículo sai, o foco e o aviso, e que a câmera **não** é pedida;
      5. abrir o comprovante de um veículo do pátio e o de um que já saiu;
      6. registrar uma entrada em outra aba e conferir que a lista a mostra na próxima atualização;
      7. conferir 320px, 390px e tablet, os dois temas e o tempo de carga com o volume real;
    - o resultado e os formatos reais ficam registrados no Tech Spec;
    - cada critério de aceite do `prd.md` (RF-01 a RF-11) foi conferido, ou tem pendência registrada;
    - `docs/specs/input.md` sem JWT real antes de qualquer commit.
  - Depende de: T1 a T8 e de ambiente de homologação com dados de teste.
  - **Status (2026-10-21):** parcial. Feitos: `npm run lint`, `npm run test` (1339 testes) e `npm run build` verdes, a conferência visual do computador (1280px) e do celular (390px) num navegador e a seção "Resultados da execução" no Tech Spec. Pendentes (precisam de login válido, homologação e dados de teste): o roteiro manual de 7 itens (formato de `permanencia` abaixo de um dia, tamanho máximo da lista, saída pela lista, comprovante de quem já saiu, entrada em outra aba), 320px, tablet e o tema escuro.
