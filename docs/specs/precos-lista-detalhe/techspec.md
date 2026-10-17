# Tech Spec: Gestão de Preços em lista e detalhe

**Status:** Rascunho
**Data:** 2026-10-17
**PRD:** [./prd.md](./prd.md) · **Design:** [./design.md](./design.md)

Segue as convenções do projeto (Next 16 App Router, styled-components, TanStack Query, vitest), como aplicadas em `docs/specs/gerenciamento-precos/` e `docs/specs/editar-preco/`. Esta etapa só especifica; nada é implementado aqui.

## Referências
- PRD: ./prd.md
- Design: ./design.md e a seção "Design" abaixo
- Base existente: `PrecosList`, `PrecoWizard`, `FaixasPreview`, `src/lib/api/services/preco*.ts`

## Design

- **Telas/estados:** lista e detalhe em duas colunas (desktop) e em telas alternadas (celular); carregando, erro, vazio, sem resultado e não encontrada, como no design.
- **Reaproveitados:** `Tabs`, `Pagination`, `StatusBadge`, `Select`, `Input`, `Button`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`; da feature, `FaixasPreview`, `format.ts` e `situacao.ts`.
- **Novos (de feature, em `src/components/precos`):** `PrecosMasterDetail`, `PrecoListItem`, `PrecoDetalhe`, `PrecoSemana`, `SimuladorCobranca`.
- **Tokens:** nenhum novo.

## Achados no código que moldam a solução

1. **A listagem já traz a tabela completa.** `GET /rotatividade` devolve, em cada item, regras (horários), faixas e categorias (ver `PrecoDto` e `fromPrecoResponse`). O detalhe, portanto, **não precisa de endpoint nem de chamada própria**: ele lê o item selecionado da própria lista. Hoje `getPreco` já usa essa propriedade (não existe endpoint por id).
2. **A API de listagem só aceita `pagina` e `tamanhoPagina`.** Não há parâmetro de busca nem de situação (a situação, aliás, é calculada no cliente por `getSituacao`). Por isso busca e filtro **não podem ser feitos no servidor** hoje.
3. **O wizard invalida `["precos"]` por prefixo e volta para `/precos?salvo=...`.** Esse fluxo é reaproveitado, com um pequeno ajuste para devolver a seleção.
4. **`findCachedPage` no wizard** assume que o cache `["precos", pagina]` guarda um `Paginado<PrecoView>`. A nova chave não terá essa forma e esse trecho precisa mudar.

## Arquitetura da solução

### Decisão central: carregar todas as tabelas e paginar no cliente
Para entregar busca por descrição, filtro de situação, contagem e paginação coerentes com a API atual, a tela carrega **todas as tabelas** (percorrendo as páginas da API) uma vez e faz busca, filtro, ordenação por servidor-original e paginação **em memória**, com 20 itens por página como hoje.

- Cabe bem no volume esperado (dezenas de tabelas por empresa) e dá resposta instantânea.
- Se a API ganhar busca e filtro no servidor, a troca fica isolada em `usePrecos` (ver abaixo).
- Custo: uma carga inicial maior (várias chamadas encadeadas se houver muitas páginas) e dados "congelados" até a revalidação. Mitigado com carregamento progressivo (a primeira página aparece assim que chega) e revalidação ao voltar do wizard.

### Arquivos
```
src/
├── app/(app)/precos/page.tsx                    # troca PrecosList por PrecosMasterDetail (Suspense mantido)
├── lib/api/services/
│   ├── preco.ts                                 # + listAllPrecos(); getPreco sem paginaInicial por cache
│   └── preco.test.ts                            # novo/ampliado
├── components/precos/
│   ├── PrecosMasterDetail/                      # novo (contêiner, URL, alternância mobile)
│   │   ├── PrecosMasterDetail.tsx
│   │   ├── PrecosMasterDetail.styles.ts
│   │   ├── usePrecosUrlState.ts
│   │   ├── usePrecos.ts                         # carga completa + filtro/busca/página
│   │   └── *.test.ts(x)
│   ├── PrecoListItem/                           # novo
│   ├── PrecoDetalhe/                            # novo (cabeçalho, abas, simulador)
│   ├── PrecoSemana/                             # novo (grade semanal)
│   ├── SimuladorCobranca/                       # novo
│   │   ├── SimuladorCobranca.tsx
│   │   ├── estimarCobranca.ts                   # função pura
│   │   └── estimarCobranca.test.ts
│   ├── semana.ts                                # novo: regras -> 7 linhas para exibição
│   ├── filtros.ts                               # novo: busca e filtro de situação (puros)
│   ├── PrecosList/                              # REMOVIDO (substituído)
│   └── PrecoWizard/PrecoWizard.tsx, PrecoWizardForm.tsx   # ajustes pontuais (ver "Fluxo de edição")
```

Todos Client Components, como o restante da feature (estado, URL e query). A página continua Server Component fina.

## Tipos e contratos

Nenhum contrato novo de API. Novos tipos locais:

```ts
// filtros.ts
export type FiltroSituacao = "todas" | SituacaoPreco;

// estimarCobranca.ts
export type Estimativa =
  | { tipo: "nao_aplica" }
  | { tipo: "sem_regra" }
  | {
      tipo: "valor";
      valor: number;               // já com desconto de conveniada, quando houver
      bruto: number;               // antes do desconto
      descontoPercentual: number | null;
      explicacao: string;          // "Degrau até 3 h", "Dentro da tolerância de entrada (10 min)", ...
    };

export function estimarCobranca(preco: PrecoView, categoria: TipoCategoria, minutos: number): Estimativa;
```

```ts
// semana.ts
export type LinhaSemana = {
  dia: { codigo: number; label: string };
  tipo: "sem_cobranca" | "dia_inteiro" | "intervalo";
  inicio?: string; fim?: string;          // "HH:mm"
  trilho?: { de: number; ate: number };    // frações de 0 a 1 para o trilho de 24 h
  inativa: boolean;
  periodo?: string;                        // "de 01/12 a 31/01"
};
export function montarSemana(regras: PrecoRegraView[]): LinhaSemana[];   // sempre 7 linhas, domingo a sábado
```

### Contrato de listagem completa
```ts
// preco.ts
const TAMANHO_PAGINA_CARGA = 50;   // ajustar ao máximo aceito pela API [A CONFIRMAR]
export async function listAllPrecos(): Promise<PrecoView[]>;   // percorre totalPages e concatena, ordem da API
```
Reaproveita `listPrecos`. `getPreco(id)` passa a procurar na mesma carga completa (sem o parâmetro `paginaInicial`).

## Componentes

### `usePrecos` (dados e filtragem)
```ts
function usePrecos(estado: { q: string; situacao: FiltroSituacao; pagina: number }): {
  status: "carregando" | "erro" | "pronto";
  erro?: string; refetch: () => void;
  todas: PrecoView[];            // sem filtro
  filtradas: PrecoView[];        // busca + situação
  pagina: { itens: PrecoView[]; page: number; totalPages: number; totalRecords: number; pageSize: 20 };
  contagem: string;              // "7 tabelas" / "3 vigentes"
};
```
- `useQuery({ queryKey: ["precos", "todas"], queryFn: listAllPrecos, refetchOnWindowFocus: false })`; a chave fica sob o prefixo `["precos"]`, que o wizard já invalida.
- Situação calculada por `getSituacao` com um `agora` único por render (como hoje na lista).
- Busca: normaliza (minúsculas, sem acento) e procura a descrição; trim; vazio = sem filtro.
- Página fora do intervalo é ajustada para a última válida (mesmo comportamento atual).

### `usePrecosUrlState`
Lê e escreve os parâmetros `preco`, `q`, `situacao`, `pagina` com `router.replace(..., { scroll: false })`.
- `q` tem estado local imediato e escreve na URL com **debounce de 300 ms**; mudar `q` ou `situacao` zera `pagina`.
- Valores inválidos (`situacao` desconhecida, `pagina` não numérica, `preco` não numérico) são ignorados com valor padrão.
- `salvo=criado|atualizado` continua sendo lido uma única vez para o `Toast` e removido da URL, como hoje.

### Seleção
- **Selecionada efetiva (desktop):** `preco` da URL, se existir na lista completa; senão a primeira **vigente da página atual**; senão o primeiro item da página; senão nenhuma. A seleção padrão **não é escrita** na URL.
- **Detalhe aberto (celular):** só quando `preco` está explícito na URL. Assim a lista é a tela inicial no celular sem criar um estado extra.
- Selecionar um item grava `preco` na URL com `replace`; **Voltar** no celular remove `preco` (e o botão voltar do navegador devolve a lista porque a seleção veio de `push`/`replace`: usar **`push`** ao abrir o detalhe no celular para o histórico funcionar, e `replace` no desktop).
- Item selecionado que desaparece da lista completa → o detalhe mostra "Esta tabela de preço não existe mais." e o botão para a primeira da lista.

### `PrecosMasterDetail`
Estrutura de duas colunas em CSS Grid; em `< md` mostra uma coluna por vez conforme `preco` na URL (via `data-detalhe`), sem JavaScript de media query. Cada coluna com `overflow: auto` e altura limitada ao espaço disponível. Contém: busca, filtro, `PrecoListItem`s, `Pagination`, `PrecoDetalhe`, `Toast`.

### `PrecoListItem`
Botão com `aria-current="true"` quando selecionado; descrição (quebra de linha, sem truncar), tipo com marcador colorido (cores do design por `tipoRegra`), `StatusBadge` da situação. Setas cima e baixo movem o foco entre itens (lista com `roving tabindex`); Enter e Espaço selecionam.

### `PrecoDetalhe`
- Cabeçalho com título, tipo, `StatusBadge`, vigência (`formatVigencia`) e **Editar** (`Link` para `/precos/{id}/editar`).
- `Tabs` com `tarifa | horarios | informacoes`; a aba ativa fica em estado local e é mantida ao trocar de tabela.
- **Tarifa:** `FaixasPreview` (com `diaria`) e a lista de tolerâncias e categorias. `FaixasPreview` ganha a prop opcional `conveniadaPercentual` para o selo "Conveniada −x%" quando houver, e uma variante de tamanho maior (`size="lg"`), sem alterar o uso atual no wizard.
- **Horários:** `PrecoSemana` com `montarSemana`.
- **Informações:** lista rótulo/valor (`format.ts`).
- Abaixo das abas, `SimuladorCobranca` com a tabela atual.

### `montarSemana` (regras → linhas)
- Agrupa as regras por `diaSemana` (código 1 = domingo, como `DIAS_SEMANA_PRECO`); sem regra no dia → `sem_cobranca`.
- Regra com `horaInicio` e `horaFim` → `intervalo` (trilho de `de/24` a `ate/24`); regra com horários nulos → `dia_inteiro` (premissa do PRD, trilho de 0 a 1).
- Vários intervalos no mesmo dia → desenha todos no trilho e lista os textos separados por vírgula.
- Regra `ativo = false` → linha esmaecida com texto "Inativa"; com `dataInicio`/`dataFim` → `periodo` ("de 01/12 a 31/01").

### `SimuladorCobranca` e `estimarCobranca`
Estado local: categoria (padrão: primeira da tabela; "Carro médio" quando "Todas") e permanência em minutos (0 a 900, passo 5). A função pura segue, nesta ordem:

1. Categoria não atendida (nem "Todas" nem a escolhida) → `nao_aplica`.
2. `minutos <= toleranciaEntradaMinutos` → valor 0, "Dentro da tolerância de entrada (N min)".
3. Primeira faixa com `minutos <= minutosLimite + toleranciaAlteracaoFaixaMinutos` → o valor da faixa; "Degrau até X".
4. Passou do último degrau e há diária (`valorDiaria > 0` e `periodoDiaria > 0`): até o período → a diária; depois → diária + `ceil((minutos − período) / 60)` × adicional; "Diária" ou "Diária mais N h de adicional".
5. Sem faixa e sem diária → `sem_regra` ("Esta tabela ainda não tem valores para essa permanência.").
6. Desconto: se `tipoRegra` é Convênio e a faixa usada tem `percentualConveniada`, aplica `valor × (1 − p/100)` e informa "com desconto de p% da conveniada" (a diária não recebe desconto).

Todos os cálculos de dinheiro em **centavos inteiros** para evitar erro de ponto flutuante; o resultado volta em reais com duas casas. A função **não considera dia da semana nem horário**. Ela existe só para a tela e nunca é usada para cobrar.

A região de resultado usa `aria-live="polite"` e só é atualizada quando o controle deslizante é solto ou a digitação para (debounce de 400 ms), para não anunciar a cada passo.

### Fluxo de edição e criação (ajustes pontuais)
- `PrecoWizardForm`: depois de salvar, `router.push` passa a incluir a tabela salva: na edição `/precos?salvo=atualizado&preco={id}`; na criação, `/precos?salvo=criado` (o back não devolve o id).
- Na criação, `usePrecosUrlState` trata `salvo=criado` selecionando, depois de a lista recarregar, a tabela de **maior `rotatividadeId`** (premissa: ids crescem com o tempo) e grava `preco` na URL. [A CONFIRMAR]
- `PrecoWizard.tsx`: remove `findCachedPage` (a nova chave de cache não tem o formato antigo); `getPreco(id)` passa a buscar na carga completa. A invalidação `["precos"]` por prefixo continua cobrindo a chave `["precos", "todas"]`.
- `PrecosList` e seus testes e estilos saem. `ROW_CLICK_TARGET` deixa de existir, e o clique em um item nunca abre a edição.

## Gerenciamento de estado
- Servidor: TanStack Query com a chave `["precos", "todas"]` (e `["preco", id]` do wizard, inalterada).
- URL (fonte da verdade da navegação): `preco`, `q`, `situacao`, `pagina`.
- Local: texto da busca (antes do debounce), aba ativa e estado do simulador.
- Sem Zustand nem Context novo.

## Decisões técnicas e trade-offs

| Decisão | Alternativas | Motivo |
| --- | --- | --- |
| Carregar todas as tabelas e paginar no cliente | Busca no servidor; busca só na página atual | A API só aceita `pagina` e `tamanhoPagina`; a busca e o filtro corretos exigem ver todas. Volume é pequeno; a troca por servidor fica isolada em `usePrecos` |
| Detalhe lê do item da lista | Endpoint por id | Não existe e o item já vem completo |
| Seleção na URL (`preco`) | Estado local | Recarregar, compartilhar e o botão Voltar do navegador no celular |
| Seleção padrão não escrita na URL | Escrever no primeiro render | No celular, escrever abriria o detalhe em vez da lista |
| Alternância de telas por CSS e `data-detalhe` | `useMediaQuery` | Sem JavaScript de viewport, sem flash na hidratação |
| `estimarCobranca` pura e em centavos | Calcular no componente; ponto flutuante | Testável isoladamente e sem erro de arredondamento |
| Estimativa aplica as duas tolerâncias e ignora dia/hora | Ignorar a tolerância de faixa; simular horário | O PRD pede as tolerâncias; dia e hora exigiriam entrada extra e a regra completa do back-end |
| Setas movem o foco, Enter seleciona | Seleção acompanha o foco | Evita reescrever a URL a cada seta e continua acessível |
| Seleção após criar = maior id | Pedir ao back o id criado | O POST não devolve o registro; ajuste de contrato fica como ponto a confirmar |
| Mantém o wizard como está | Edição inline no detalhe | Escopo do PRD |

## Estratégia de testes

Ferramenta: **vitest + Testing Library**, com `next/navigation` mockado como nos testes do wizard.

| Camada | O que testar |
| --- | --- |
| `estimarCobranca` | categoria não atendida; "Todas"; tolerância de entrada (zero); cada degrau na fronteira (limite exato e limite + 1); tolerância de alteração de faixa; passou do último degrau (diária, adicional por hora iniciada, múltiplas horas); sem diária e sem faixa; desconto de conveniada só em Convênio e só na faixa; arredondamento em centavos |
| `montarSemana` | sete linhas sempre; dia sem regra; intervalo com trilho; horário nulo como dia inteiro; vários intervalos; regra inativa; período específico |
| `filtros` | busca sem acento e sem diferenciar caixa; busca vazia; cada situação; busca e situação juntas |
| `listAllPrecos` | percorre todas as páginas; uma página só; falha numa página propaga o erro; `getPreco` acha em qualquer página e dá `not_found` |
| `usePrecos` / `usePrecosUrlState` | paginação em memória (20 por página); página fora do intervalo; contagem; `q` com debounce zera a página; parâmetros inválidos ignorados; seleção efetiva (URL, primeira vigente da página, primeiro item, nenhuma); `salvo=criado` seleciona o maior id e some da URL |
| `PrecoListItem` | seleção por clique e por Enter; `aria-current`; setas movem o foco |
| `PrecoDetalhe` | abas e aba mantida ao trocar de tabela; Tarifa com placa, tolerâncias, categorias e selo de conveniada; Horários; Informações; **Editar** aponta para `/precos/{id}/editar` |
| `SimuladorCobranca` | controles, resultado e explicação; aviso fixo de estimativa; "não se aplica"; anúncio só ao soltar |
| `PrecosMasterDetail` (integração) | duas colunas com a primeira vigente selecionada; clicar seleciona sem abrir a edição; busca e filtro reduzem a lista e mostram "sem resultado" com **Limpar busca**; paginação mantém busca e filtro; carregando, erro com **Tentar novamente**, vazio; tabela removida mostra o aviso; celular: lista primeiro, detalhe com `preco`, **Voltar** devolve busca, filtro e página; toast "criada" e "atualizada" |
| Wizard | depois de salvar volta com `preco` na edição; criação com `salvo=criado`; `getPreco` sem `findCachedPage` |
| Manual | volume real de tabelas; celular (alternância e botão Voltar do navegador); leitor de tela; `prefers-reduced-motion`; temas claro e escuro |

Rodar `npm run lint`, `npm test` e `npm run build` ao final.

## Riscos / pontos de atenção

| Risco | Prob. | Mitigação |
| --- | --- | --- |
| Muitas tabelas tornam a carga completa lenta | Baixa a média | Tamanho de página de carga maior (confirmar o máximo da API), carregamento progressivo e, se preciso, busca no servidor quando a API suportar (isolada em `usePrecos`) |
| Estimativa diverge do valor real (regras do back-end) | Média | Rótulo permanente de estimativa, função pura documentada, regras listadas no PRD como ponto em aberto; não é usada para cobrar |
| Maior id nem sempre é a tabela recém-criada | Baixa | Fica como ponto a confirmar; o pior caso é selecionar outra tabela depois de criar |
| `findCachedPage` quebra com a nova forma do cache | Alta se esquecido | Removido na task do wizard; teste do wizard cobre |
| Dois tipos de dado sob o prefixo `["precos"]` | Média | A chave antiga `["precos", pagina]` deixa de existir; `["precos", "todas"]` é a única |
| Seleção na URL quebra o botão Voltar | Média | `push` ao abrir o detalhe no celular e `replace` no desktop; teste de integração |
| Foco e acessibilidade da lista com setas | Média | Padrão de lista com `roving tabindex` e testes por teclado |
| Perfis sem permissão para ver preços | Baixa | Mesmo controle de acesso da tela atual (`proxy` e menu) |

## Fora de escopo técnico
- Busca e filtro no servidor, ou qualquer mudança de contrato da API de preços.
- Mudanças no wizard além do redirecionamento com a seleção.
- Simulação oficial, cálculo no back-end, simulação por dia e hora.
- Ordenação interativa, filtros por tipo de regra e por categoria.
- Linha do tempo de vigências e avisos de sobreposição.
- Duplicar, excluir ou ativar e desativar tabelas.

## Pontos a confirmar antes de implementar
1. O tamanho máximo de página que `GET /rotatividade` aceita (define `TAMANHO_PAGINA_CARGA`).
2. Se a API pode passar a aceitar busca por descrição e filtro de situação (hoje a tela os faz no cliente).
3. As regras reais de cobrança para a estimativa: tolerância de alteração de faixa, o que vale depois do último degrau e se o adicional é por hora iniciada.
4. Se os ids crescem com o tempo, para selecionar a tabela recém-criada, ou se o POST pode devolver o id.
5. Que horário nulo significa "dia inteiro".
