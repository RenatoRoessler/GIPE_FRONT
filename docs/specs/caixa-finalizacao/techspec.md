# Tech Spec: Finalização do Caixa

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só mapeia a decisão para código)
- Contrato da API: `docs/specs/input.md` (swagger do módulo Caixa)
- Spec anterior da tela: `docs/specs/caixa/` (esta spec a corrige e estende)

## Design
- **Telas/estados**: `/caixa` redesenhada (gaveta, turno por forma de pagamento, abas Movimentos / Linha do tempo / Gráficos), modais ajustados ao contrato, resumo com comprovante, `/caixa/historico` e `/caixa/historico/[caixaId]`. Estados de carregamento, vazio, erro e 403 em cada uma, conforme `design.md`.
- **Componentes do design system reaproveitados** (`src/components/ui`): `Button`, `Text`, `Modal`, `Table`, `StatusBadge`, `Skeleton`, `ErrorBanner`, `Toast`, `Tabs`, `Pagination`, `Select`, `Input`, `OptionGroup`, `Link`. Também `ErroSemPermissao` (`src/components/layout`) e o padrão de gráficos de `src/components/patio/graficos`.
- **Componentes novos** (todos em `src/components/caixa`, nenhum em `ui`): `GavetaResumo`, `FormasPagamentoTabela`, `MovimentosLista`, `LinhaDoTempo`, `GraficosCaixa`, `ResumoFechamento`, `HistoricoCaixasPage`, `ExtratoCaixaPage`. Detalhe na seção de arquitetura.
- **Tokens de tema**: nenhum obrigatório. Se a barra de entradas precisar de fundo suave, adicionar `successSoft` em `src/styles/theme.ts` (claro e escuro).

## Arquitetura da solução

### 1. Contrato com a API — `src/lib/api/services/caixa.ts` (editar)

Correções do que existe (RF1, RF2):
- `fecharCaixa`: passa a `api.put("/Caixa/fechar", { conferencias, valorFundoCaixa, observacao })`. Assinatura nova: `fecharCaixa(input: { conferencias: Conferencia[]; valorFundoCaixa?: number | null; observacao?: string })`. Remove o comentário `[A DEFINIR]`.
- `passarTurno`: o corpo usa `valorFundoCaixa` (hoje `valorInicial`). O tipo `PassagemTurnoInput` renomeia `valorInicial` → `valorFundoCaixa`; `null` continua significando "a API assume".
- `abrirCaixa`: corpo `{ valorFundoCaixa }` já bate com `AbrirCaixaRequestDto`; só remove o `[A DEFINIR]`.
- `registrarSangria`: sem mudança de corpo (`{ valor, observacao }`).

Funções novas (RF7 a RF9):
- `listMovimentos(): Promise<Movimento[]>` → `GET /Caixa/movimentos`; 404 vira `[]` (sem caixa aberto), como `listTurnos` trata a ausência.
- `listHistoricoCaixas(params: { dataInicio?: string; dataFim?: string; pagina?: number; tamanhoPagina?: number }): Promise<Pagina<CaixaFechado>>` → `GET /Caixa/historico` com `params` em `yyyy-MM-dd`. 400 de datas invertidas sobe como `ApiError` (a tela valida antes).
- `listMovimentosCaixa(caixaId: number): Promise<Movimento[]>` → `GET /Caixa/historico/{caixaId}/movimentos`.

**Formato das respostas é provisório.** O swagger só descreve as respostas em texto. Seguindo o padrão do repositório (`*.mapper.ts` com DTO tolerante), cada resposta nova passa por um mapper em `src/lib/api/services/caixa.mapper.ts` que normaliza nomes e nulos e concentra as suposições. As suposições (nomes de campo) ficam só nesse arquivo e em `src/types/caixa.ts`; quando a API for consultada de verdade, o ajuste é local.

### 2. Tipos — `src/types/caixa.ts` (editar)

Alinhar `Turno` e `Caixa` aos campos descritos no swagger, sem inventar cálculo: `valorFundoCaixa` do turno (hoje `valorInicial`), `saldoCaixa`, `totalSaida`, `saldoCaixaInformado`, `totalDiferenca`, `observacao`, `disponivelSangria` (agora "esperado em dinheiro menos o fundo do caixa"), e `valorFundoCaixaFechamento` no caixa fechado. Remover `trocoPadrao` da lógica da tela (o campo pode continuar no tipo como opcional enquanto a API o devolver). Tipos novos:

```ts
export type TipoMovimento = "entrada" | "saida" | "sangria";   // derivado de tipo/origem do movimento
export type Movimento = {
  movimentoId: number;
  dataHora: string;
  tipo: TipoMovimento;
  valor: number;
  formaPagamento: FormaPagamentoId | null;
  turnoId: number | null;
  usuario: string;
  motivo: string | null;
};
export type CaixaFechado = Caixa & { abriu: string; fechou: string; /* totais do fechamento: conforme resposta real */ };
export type Pagina<T> = { itens: T[]; page: number; totalPages: number; totalRecords: number; pageSize: number };
```

Qualquer campo cuja existência dependa da resposta real fica opcional/`null` até a validação (ver riscos).

### 3. Regras puras e testáveis — `src/components/caixa/` (novos arquivos `.ts`)

Concentram a lógica para a UI ficar fina:
- `movimentos.ts`: `filtrarMovimentos(lista, { tipo, turnoId })`, `contarPorTipo`, `paginar(lista, page, size)` (a lista vem completa).
- `agregados.ts`: `totaisPorForma(movimentos)` (entradas/saídas por forma, em reais), `totaisPorHora(movimentos)` (24 posições, entradas e saídas), `picoDeEntradas(...)`.
- `eventosCaixa.ts`: `montarLinhaDoTempo(caixa, turnos, movimentos): EventoCaixa[]` — abertura, sangrias (movimentos de tipo sangria), passagens (turno que começa depois do primeiro), fechamento; ordenada do mais recente ao mais antigo.
- `gaveta.ts`: `calcularGaveta(turno)` → `{ naGaveta, fundo, retiravel }` **somente com campos que a API entrega** (`disponivelSangria` e o esperado em dinheiro); sem recalcular regra de negócio. Se a API não devolver algum, o bloco mostra "—".
- `exportCsv.ts`: `movimentosParaCsv(movimentos): string` (cabeçalho em português, separador `;`, decimal com vírgula, BOM UTF-8 para abrir bem no Excel) e `baixarCsv(nome, conteudo)` (Blob + link temporário).
- `format.ts` (editar): `rotuloTipoMovimento`, `describeDiferenca` já existe (reusar).

### 4. PDFs — `src/components/caixa/pdf/` (novo)
Geração no navegador com `jspdf`, que já está nas dependências e já é usado em `src/components/veiculos/ReciboPublico/reciboSaidaPdf.ts` e `ComprovantePublico/pdfCupom.ts`. Reaproveitar as constantes e o `toLatin1` de `pdfCupom.ts` (ou extrair para um módulo comum de PDF se a dependência cruzada incomodar; decisão na task).
- `comprovanteTurnoPdf.ts`: fechamento e passagem de turno (A4): empresa, período, responsáveis, tabela esperado/informado/diferença por forma, observação, linhas de assinatura.
- `extratoPdf.ts`: cabeçalho do caixa e a tabela de movimentos, paginando em A4.
- `jspdf` é importado dinamicamente (`await import("jspdf")`) ao clicar em "Baixar", para não pesar o bundle da tela. Só o tipo é importado estaticamente.
- **Cabeçalho com razão social e CNPJ**: `GET /Empresa` é só do Administrador. Para os demais perfis o cabeçalho usa o que o token/sessão tem (nome do usuário) e omite empresa se não houver; ver riscos.

### 5. Hooks e cache — `src/components/caixa/`
- `useCaixa.ts` (editar): sem mudança de contrato, mas expõe também `movimentosQuery` (`CAIXA_KEY, "movimentos"`), habilitada com o caixa aberto, `refetchOnWindowFocus: true`, sem polling.
- `useHistoricoCaixas.ts` (novo): `useQuery` com chave `["caixa","historico",{dataInicio,dataFim,pagina}]`, `placeholderData: keepPreviousData`.
- `useMovimentosCaixa.ts` (novo): para o extrato (`["caixa","historico",caixaId,"movimentos"]`).
- **Invalidação**: abrir, retirada, passar turno e fechar invalidam `CAIXA_KEY` inteiro (prefixo), o que já cobre turno, turnos e movimentos. Fechar também invalida `["caixa","historico"]`.
- Erros: `ApiError.kind === "forbidden"` → `ErroSemPermissao`; 400 de regra de negócio exibe `error.message` (a mensagem da API), com o texto padrão de `DEFAULT_MESSAGES` quando vazia (já é o comportamento de `normalizeError`).

### 6. Componentes (Client Components, todos `"use client"` por usarem estado, query ou DOM)
- `CaixaPage/CaixaPage.tsx` (editar): nova composição `Cabeçalho → GavetaResumo → TurnoAtual → Abas`. `SaldoCards` deixa de existir (substituído por `GavetaResumo`); `TurnoAtual` passa a usar `FormasPagamentoTabela`.
- `GavetaResumo.tsx`, `FormasPagamentoTabela.tsx`, `MovimentosLista.tsx`, `LinhaDoTempo.tsx`, `GraficosCaixa.tsx`, `ResumoFechamento.tsx`: conforme `design.md`.
- Aba ativa: `AbasCaixa` lê/escreve `?aba=` com `useSearchParams`/`useRouter` (padrão de `src/components/notas/aba.ts`: `movimentos` é o padrão e fica sem parâmetro).
- `CaixaHeader.tsx` (editar): botão "Histórico de turnos" **deixa de depender de `AREA.CaixaHistorico`** (correção da regressão, RF6); `Retirada` continua com `AREA.CaixaSangria`; novo `Link` "Caixas anteriores" só com `AREA.CaixaHistorico`.
- `SangriaModal.tsx`, `PassarTurnoModal.tsx`, `FecharCaixaModal.tsx`, `ConferenciaFields.tsx`, `useConferencia.ts` (editar): textos e campos do `design.md`; `valorInicial` → `fundoCaixa`/`valorFundoCaixa`; novo campo opcional de fundo contado no fechamento; resumo pós-sucesso via `ResumoFechamento` com botão de PDF.
- `src/lib/schemas/caixa.ts` (editar): `createSangriaSchema` sem referência a troco padrão e com a mensagem de limite do design; `conferenciaSchema` renomeia `valorInicial` → `fundoCaixa`; `fecharCaixaSchema` com `fundoContado` opcional e não negativo; `periodoSchema` (`dataInicio <= dataFim`) para o histórico.
- `HistoricoCaixasPage.tsx` e `ExtratoCaixaPage.tsx` (novos): páginas das duas rotas novas. O estado do filtro de período fica na URL (`?de=&ate=&pagina=`) para link e voltar funcionarem.

### 7. Rotas e permissões
- `src/app/(app)/caixa/historico/page.tsx` e `src/app/(app)/caixa/historico/[caixaId]/page.tsx` (Server Components finos: `metadata` + componente). Ler `node_modules/next/dist/docs/` sobre `params` assíncronos (versão do Next deste projeto) antes de escrever a página dinâmica.
- `src/lib/permissoes.ts` (editar): `areaDaRota` hoje resolve por prefixo na ordem da tabela, e `/caixa/historico` cairia em `AREA.Caixa` (liberada a Caixa e Manobrista). Acrescentar `["/caixa/historico", AREA.CaixaHistorico]` e fazer a busca escolher o **prefixo mais longo**, não o primeiro. Teste em `permissoes.test.ts`: `/caixa/historico` e `/caixa/historico/12` → `CaixaHistorico`; `/caixa` → `Caixa`; Caixa e Manobrista são redirecionados pelo proxy.
- `src/proxy.ts` não muda (usa `areaDaRota`/`podeAcessar`); acrescentar casos de teste em `proxy.test.ts`.
- `src/lib/nav.ts`: sem item novo no menu (o histórico é acessado de dentro de `/caixa`).

## Decisões e trade-offs
- **Lista completa no cliente para movimentos do caixa aberto**: a API não pagina `GET /Caixa/movimentos`, então filtrar e paginar em memória é o que a API permite. Se o volume de um caixa crescer demais, a mudança é só do hook (pedir paginação à API).
- **Histórico paginado no servidor**: a API pagina `GET /Caixa/historico`; paginar no cliente seria desperdício.
- **PDF e CSV no navegador**: a API não oferece exportação. `jspdf` já está no projeto e é carregado sob demanda; evita um serviço novo.
- **`GavetaResumo` só exibe o que a API entrega**: o esperado em dinheiro e o `disponivelSangria` vêm prontos; não recalculamos "esperado − fundo" no front, para a regra não divergir da API. O front não duplica regra financeira.
- **Mappers de resposta tolerantes**: como o esquema real não foi visto, isolar as suposições em um único lugar reduz o custo da correção.
- **`useCan` / `areaDaRota` em vez de `if` por perfil**: reaproveita o mecanismo da feature de permissões; evita regra espalhada.
- **Sem polling**: `refetchOnWindowFocus` e invalidação após cada ação bastam; o outro operador do mesmo caixa vê o estado novo ao voltar à janela, que é o comportamento atual do turno.
- **Não promover gráficos a `ui` agora**: criar `GraficosCaixa` em `caixa` com apresentação própria (valores em reais, duas séries) e reaproveitar só `Graficos.styles.ts`/convenções do pátio; extrair para `ui` quando houver um terceiro consumidor.

## Riscos / pontos de atenção
- **Esquemas de resposta não validados** (turno, caixa, movimentos, histórico): é o maior risco. Mitigação: mappers isolados e as tasks de serviço marcadas como dependentes da consulta real à API (acesso a liberar) ou de JSON de exemplo. Até lá, os componentes dependem dos tipos e rodam sobre dados de teste.
- **Divergência já conhecida no código**: `POST` vs `PUT` no fechamento e `valorInicial` vs `valorFundoCaixa` na passagem; corrigir antes de qualquer outra coisa, com testes do corpo enviado, para não perder dado em produção.
- **Cabeçalho do PDF sem dados da empresa para quem não é Administrador** (`GET /Empresa` restrito). Alternativa: guardar razão social e CNPJ no token/sessão (back-end) ou omitir. Decisão com o produto.
- **Diferença de arredondamento**: somas de movimentos para gráficos usam `number`; arredondar a 2 casas ao exibir e nunca comparar igualdade de reais sem tolerância.
- **Fuso horário**: datas chegam sem fuso; `parseApiDate` já trata como horário local. O agrupamento por hora usa a hora local; documentar no código.
- **Volume**: caixa muito movimentado pode ter milhares de movimentos; a tabela pagina em 20 e o gráfico agrega. Medir antes de otimizar.
- **Concorrência**: dois operadores no mesmo caixa; após cada ação invalida-se o cache e erros 400 ("turno já é do usuário logado") são mostrados como vieram.
- **Permissão por módulo (`overrides`)** pode, no futuro, liberar histórico para outros perfis; as rotas e o `Link` já passam por `podeAcessar`.
- **PDF em dispositivos móveis**: o download via Blob funciona na maioria dos navegadores; testar no tablet do balcão.

## Fora de escopo técnico
- Exportação consolidada de vários caixas e relatórios gerenciais.
- Edição ou estorno de movimentos.
- Atualização em tempo real (WebSocket ou polling).
- Geração de PDF/CSV no servidor.
- Mudanças no pátio, mensalistas ou notas fiscais, além de invalidar o cache do caixa quando uma saída de veículo for paga (já acontece pelos fluxos existentes; apenas conferir).
