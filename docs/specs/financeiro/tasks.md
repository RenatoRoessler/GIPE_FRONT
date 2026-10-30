# Tasks: Módulo Financeiro

Referências: ./prd.md, ./techspec.md, ./design.md

- [ ] T1 — Validar os formatos reais de categoria e lançamento no back
  - Situação: **pendente**. As escritas no back (POST/PUT) foram bloqueadas pelo modo de permissão; só as leituras foram validadas (ver techspec). O mapper segue tolerante a nomes alternativos.
  - Arquivos: `docs/specs/financeiro/techspec.md` (só os trechos `[A CONFIRMAR]`)
  - Pronto quando:
    - com autorização do usuário para escrever no back local, criar uma categoria pai e uma filha (despesa) e um lançamento comum, e conferir `GET /Financeiro/categoria`, `GET /Financeiro/lancamento` e `GET /Financeiro/lancamento/{id}`;
    - com turno aberto, criar um lançamento pelo caixa de R$ 1,00 (dinheiro, hoje), editá-lo e cancelá-lo, e anotar as mensagens de erro de cada regra violada (saída acima da gaveta, forma diferente de dinheiro, caixa fechado, nome de categoria repetido, pai inválido);
    - os nomes reais dos campos (inclusive "cancelado por" e se a resposta traz o tipo do lançamento) ficam registrados no Tech Spec, e os tipos de `src/types/financeiro.ts` (T3) seguem esses nomes;
    - sem autorização para escrever, registrar isso e seguir com o mapper tolerante

- [x] T2 — Área `financeiro` nas permissões e item no menu
  - Arquivos: `src/lib/permissoes.ts`, `src/lib/nav.ts`, `src/components/layout/NavIcons/NavIcons.tsx`, `src/components/layout/BottomNav/BottomBarIcons.tsx`, `src/lib/permissoes.test.ts`, `src/lib/nav.test.ts`, `src/components/layout/BottomNav/BottomNav.test.tsx`
  - Pronto quando:
    - `AREA.Financeiro` existe, com padrão Administrador, Gerente e Financeiro, e a rota `/financeiro` pertence à área;
    - o item "Financeiro" aparece depois de "Notas Fiscais", com ícone `finance`, só para quem tem a área, e fora da prioridade da barra inferior;
    - os testes que enumeram áreas e itens estão atualizados e passam;
    - Caixa, Manobrista e perfis de conveniada não veem o item nem acessam a rota

- [x] T3 — Tipos, enums e funções de data do Financeiro
  - Arquivos: `src/types/financeiro.ts`, `src/lib/periodo.ts`, `src/lib/periodoNotas.ts`, `src/lib/periodo.test.ts`, `src/lib/periodoNotas.test.ts`
  - Pronto quando:
    - os tipos e enums do Tech Spec existem (lançamento, categoria, fluxo, filtros, form values);
    - `periodo.ts` tem `formatDataInput`, `mesCorrente(hoje)` (dia 1 ao último dia do mês, inclusive fevereiro e ano bissexto), `mesAnterior`, `anoCorrente` (1º de janeiro a 31 de dezembro) e `validarPeriodo(periodo, { obrigatorio, maxDias })` com as mensagens do design;
    - `periodoNotas.ts` reexporta o que Notas usa, sem mudar comportamento, e seus testes continuam passando;
    - testes cobrem o limite de 366 dias, as datas invertidas e o modo opcional

- [x] T4 — Serviço e mapper do Financeiro
  - Arquivos: `src/lib/api/services/financeiro.ts`, `src/lib/api/services/financeiro.mapper.ts`, `src/lib/api/services/financeiro.test.ts`, `src/lib/api/services/financeiro.mapper.test.ts`
  - Pronto quando:
    - existem `getFluxo`, `listLancamentos`, `getLancamento`, `createLancamento`, `updateLancamento`, `cancelarLancamento` (`PUT .../cancelar` sem corpo), `listCategorias`, `createCategoria` e `updateCategoria`;
    - datas vão sempre como `AAAA-MM-DD` e a query só leva os filtros preenchidos;
    - a leitura é tolerante: datas cortadas em 10 caracteres, valores sem `NaN`, nomes alternativos de "cancelado por", opcionais ausentes como `null`;
    - opcionais vazios viram `null` no envio, `peloCaixa` só é `true` no cadastro, e a edição de lançamento feito pelo caixa reenvia valor, data e forma atuais;
    - testes cobrem cada ponto acima

- [x] T5 — Schemas Zod de lançamento e categoria
  - Arquivos: `src/lib/schemas/financeiro.ts`, `src/lib/schemas/financeiro.test.ts`
  - Pronto quando:
    - lançamento exige categoria, descrição, valor maior que zero, data até hoje ("Só é possível lançar o que já foi pago.") e forma válida;
    - `peloCaixa` só passa com dinheiro e data de hoje;
    - categoria exige nome aparado e tipo 1 ou 2;
    - os testes cobrem data futura, valor zero e "pelo caixa" com Pix ou data diferente de hoje

- [x] T6 — Funções puras da feature
  - Arquivos: `src/components/financeiro/url.ts`, `format.ts`, `composicao.ts`, `regua.ts`, `categorias.ts`, `pelaGaveta.ts` e um `.test.ts` ao lado de cada um
  - Pronto quando:
    - `url.ts` lê e escreve aba e filtros (fluxo: `de`, `ate`, `ver`; lançamentos: `lde`, `late`, `tipo`, `categoria`, `cancelados`, `pagina`), cai no padrão com valor inválido e usa o mês corrente sem datas;
    - `format.ts` dá o valor com sinal "+"/"−", "Pai › Filha" e o rótulo de mês sem deslocamento de fuso;
    - `composicao.ts` agrupa por origem e por categoria pai (pai com a soma dos filhos, pai criado a partir de `categoriaPai` quando só as filhas têm valor), ordena por valor, calcula percentuais e omite linhas zeradas;
    - `regua.ts` calcula escala com negativos, marcas do eixo X (a cada 5 dias até 31 pontos, 1º dia do mês nos longos, todos os meses no mensal), pontos da linha do acumulado e o valor abreviado;
    - `categorias.ts` monta a árvore, as opções de select por tipo (só ativas, mais a atual na edição) e os pais elegíveis (ativos, mesmo tipo, sem pai, exceto a própria);
    - `pelaGaveta.ts` devolve habilitado, motivo e disponível para cada caso (forma, data, sem turno, turno fechado, 403, ok com `calcularGaveta`);
    - os testes cobrem cada caso listado

- [x] T7 — Promover `FiltroPeriodo` para o design system
  - Arquivos: `src/components/ui/FiltroPeriodo/` (componente, estilos e `index.ts`), `src/components/notas/` (importar do novo local; remover a cópia antiga), testes do `FiltroPeriodo`
  - Pronto quando:
    - o componente aceita `obrigatorio`, `maxDias`, `atalhos` e `atalhoAtivo`, com os padrões iguais ao comportamento atual;
    - editar as datas à mão desmarca o atalho;
    - as telas de Notas funcionam como antes e os testes delas passam;
    - estilos só com tokens do tema

- [x] T8 — Hooks de dados e chaves de cache
  - Arquivos: `src/components/financeiro/queryKeys.ts`, `useFluxo.ts`, `useLancamentos.ts`, `useLancamento.ts`, `useCategorias.ts`, `useLancamentoMutations.ts`, `useCategoriaMutations.ts` e testes dos hooks de mutação
  - Pronto quando:
    - as chaves ficam abaixo de `["financeiro"]`, e fluxo e lista usam `keepPreviousData` e `refetchOnWindowFocus: false`;
    - as categorias vêm numa consulta só, e os filtros de tipo e situação são aplicados no cliente;
    - criar, editar e cancelar lançamento invalida `["financeiro"]`, e invalida também `CAIXA_KEY` quando o lançamento é pelo caixa;
    - criar e editar categoria invalida `["financeiro"]`

- [x] T9 — Página `/financeiro` com abas e ação do cabeçalho
  - Arquivos: `src/app/(app)/financeiro/page.tsx`, `src/components/financeiro/FinanceiroPage/`, `src/components/financeiro/Financeiro.styles.ts`
  - Pronto quando:
    - a rota tem `metadata` ("Financeiro — Murel") e `Suspense`;
    - as abas Fluxo de caixa, Lançamentos e Categorias usam `Tabs`, com a aba na URL (`?aba=`) e o fluxo como padrão;
    - o cabeçalho tem "Novo lançamento" nas abas Fluxo e Lançamentos e "Nova categoria" na aba Categorias;
    - a página controla qual modal está aberto e mostra o `Toast`;
    - sem permissão, o acesso direto é negado pelo guarda de rota existente

- [x] T10 — Aba Categorias: lista e modal
  - Arquivos: `src/components/financeiro/CategoriasLista/`, `src/components/financeiro/CategoriaModal/`, testes
  - Pronto quando:
    - a lista separa Receitas e Despesas, com as filhas recuadas e a situação em `StatusBadge`;
    - os filtros de tipo e situação (padrão: ativas) funcionam;
    - estão implementados os estados carregando, vazio, vazio por filtro, erro e 403;
    - o modal cria e edita: tipo travado na edição; pai opcional só entre as elegíveis; pai desabilitado com a dica quando a categoria agrupa outras; "Ativa" só na edição;
    - nome repetido aparece no campo, os demais erros do servidor no `ErrorBanner`, o sucesso fecha e mostra o `Toast`, e fechar com dados pede confirmação de descarte

- [x] T11 — Aba Lançamentos: lista, filtros e detalhe
  - Arquivos: `src/components/financeiro/LancamentosLista/`, `src/components/financeiro/LancamentoDetalhe/`, testes
  - Pronto quando:
    - os filtros de período (opcional), tipo, categoria (pai traz as filhas) e cancelados funcionam, ficam na URL e voltam para a página 1 ao mudar; há "Limpar filtros";
    - a tabela mostra data, descrição com favorecido e documento, "Pai › Filha", forma, valor com sinal e cor, selos "Pelo caixa" e "Cancelado" (valor riscado) e ações editar/cancelar, que não aparecem nos cancelados;
    - a paginação tem 20 por página e corrige página fora do intervalo;
    - estão implementados os estados carregando, atualizando, vazio (com o texto de "sem categoria"), vazio por filtro, erro e 403;
    - no celular, os filtros ficam em `Accordion` com contagem e a tabela vira cartões com menu de ações;
    - o detalhe mostra todos os campos, "—" nos vazios, o selo e quem cancelou, e oferece Editar/Cancelar ou só Fechar

- [x] T12 — Modal de lançamento: cadastro, edição e "pelo caixa"
  - Arquivos: `src/components/financeiro/LancamentoModal/`, testes
  - Pronto quando:
    - o formulário traz tipo, categoria (agrupada por pai, só ativas do tipo, mais a atual na edição), descrição, valor, data (hoje por padrão), forma, favorecido, documento e observação, com o tipo inicial vindo de quem abriu;
    - trocar o tipo limpa a categoria, e o tipo fica fixo na edição;
    - o switch "pelo caixa" segue `estadoPelaGaveta`: desabilitado com o motivo visível, desligado ao mudar forma ou data, e com o aviso "O caixa confere o valor ao salvar." no caso do 403;
    - numa saída ligada ao caixa, mostra o disponível na gaveta e bloqueia o envio quando o valor passa dele;
    - na edição de lançamento feito pelo caixa, valor, data e forma ficam travados com o aviso para cancelar e lançar de novo;
    - estão implementados enviando, erro de campo, erro do servidor no `ErrorBanner`, sucesso (fecha, `Toast`, atualiza lista, fluxo e, se pelo caixa, o Caixa) e descarte com confirmação

- [x] T13 — Cancelar lançamento
  - Arquivos: `src/components/financeiro/CancelarLancamentoDialog/`, testes
  - Pronto quando:
    - o `ConfirmDialog` mostra descrição e valor e avisa que o lançamento sai do fluxo e fica no histórico;
    - num lançamento pelo caixa, avisa que o valor volta para a gaveta (saída) ou sai dela (entrada);
    - o erro do back (por exemplo, caixa já fechado) aparece no diálogo e desabilita a confirmação;
    - o sucesso mostra o `Toast` e atualiza lista e fluxo

- [x] T14 — Aba Fluxo de caixa: período, saldo e composição
  - Arquivos: `src/components/financeiro/FluxoCaixa/`, `SaldoPeriodo/`, `ComposicaoFluxo/`, testes
  - Pronto quando:
    - abre no mês corrente agrupado por dia; os atalhos (Este mês, Mês anterior, Este ano), as datas e o "Ver por Dia | Mês" funcionam e vão para a URL;
    - o período é validado antes de buscar (obrigatório, ordem e até 366 dias), com a mensagem sob o campo;
    - no celular, as datas ficam num `Accordion` "Personalizar período";
    - o saldo aparece em destaque, com o sinal "−" e `danger` quando negativo, mais entradas e saídas e o período por extenso;
    - os cartões Entradas | Saídas mostram origens e categorias com barras e percentuais, e as linhas de categoria levam aos Lançamentos filtrados;
    - estão implementados carregando, atualizando, sem movimento, erro e 403, e a nota da regra de sangria e suprimento

- [x] T15 — Régua do saldo e tabela por período
  - Arquivos: `src/components/financeiro/ReguaSaldo/`, `src/components/financeiro/TabelaPeriodos/`, testes
  - Pronto quando:
    - a régua desenha as colunas de entradas e saídas e a linha do saldo acumulado, com sombra de `dangerSoft` quando fica negativo, a partir de CSS e SVG, sem biblioteca;
    - mouse, toque e foco mostram o balão com data, entradas, saídas, saldo e acumulado, e o teclado (←/→/Home/End) anda pelas colunas com o texto anunciado em `aria-live`;
    - o eixo X e as marcas do eixo Y seguem `regua.ts`;
    - com mais de 92 pontos aparece "Período longo: ver por mês", e no celular com mais de 31 pontos a régua rola na horizontal, começando pelo fim;
    - período sem movimento mostra só a linha zero e a mensagem;
    - a tabela recolhível lista todos os períodos, inclusive os sem movimento, com valores negativos em `danger` e sinal

- [ ] T16 — Verificação final
  - Situação: **parcial**. Feitos: `npm run lint` (0 erros), `npm test` (3013 testes) e `npm run build`; conferido no navegador, como Administrador, em 1280px e 375px, nos temas claro e escuro, as três abas e o fluxo com dados reais (só leitura). Pendentes: Gerente e Financeiro no navegador; cadastro, edição, cancelamento e "pelo caixa" contra o back real (dependem da T1); remover o token JWT de `docs/specs/input.md` antes de qualquer commit.
  - Arquivos: nenhum alterado (salvo correções)
  - Pronto quando:
    - `npm run lint`, `npm test` e `npm run build` passam;
    - conferido no navegador em 1280px e 375px, nos dois temas, com Administrador, Gerente e Financeiro: fluxo (período, atalhos, dia e mês, régua e teclado), lançamentos (filtros, cadastro, edição, cancelamento, "pelo caixa" com e sem turno aberto) e categorias;
    - Caixa e Manobrista não veem o módulo nem acessam `/financeiro`, e o Caixa continua igual;
    - sangria e suprimento não aparecem no fluxo, e um lançamento cancelado sai do fluxo;
    - o token JWT foi removido de `docs/specs/input.md` antes de qualquer commit
