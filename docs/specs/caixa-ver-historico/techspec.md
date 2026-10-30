# Tech Spec: Ver histórico do caixa

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e fixa o que o código precisa)

## Design
- Telas/estados: (1) caixa aberto: faixa de acessos no topo com "Ver Histórico" (permissão de histórico) e "Ver movimentos"; (2) caixa fechado: em tela grande "Ver Histórico" no lugar do link "Caixas anteriores", em tela pequena o link continua. Carregando, erro e sem permissão: nenhum acesso aparece. A tela de histórico não muda.
- Componentes do design system reaproveitados: `Link` (`src/components/ui/Link`), `Text`, `EmptyPanel`/`PanelTitle` (já em `Caixa.styles`).
- Componentes novos necessários: nenhum em `src/components/ui`. Um styled genérico `AcessoRapido` (renomeia `VerMovimentos`) e um container `Acessos`, ambos em `src/components/caixa/CaixaResumo.styles.ts`.
- Tokens de tema usados/criados: só os existentes (`space`, `colors.borderStrong`, `colors.primarySoft`, `colors.text`, `radii.lg`, `fontSizes.md`, `fontWeights.extrabold`, `breakpoints.lg`).

## Arquitetura da solução

### Arquivos
| Arquivo | Mudança |
|---|---|
| `src/components/caixa/CaixaResumo.styles.ts` | Renomear `VerMovimentos` para `AcessoRapido` (mesmo CSS). Criar `Acessos` (container flex, `justify-content: flex-end`, `gap: space[2]`, `flex-wrap: wrap`) que some em tela pequena (`display: none`, `display: flex` a partir de `breakpoints.lg`). Criar o modificador para esconder o link "Caixas anteriores" a partir de `breakpoints.lg` (ver abaixo). |
| `src/components/caixa/CaixaPage/CaixaPage.tsx` | Envolver os acessos em `<Acessos>`. Trocar `VerMovimentos` por `AcessoRapido`, que sai do corpo da página e vai para dentro de um componente pequeno `AcessosCaixa` (ver abaixo). |
| `src/components/caixa/AcessosCaixa.tsx` | **Novo.** Client Component: lê `useCan(AREA.CaixaHistorico)` e renderiza a faixa: "Ver Histórico" (`/caixa/historico`, só com permissão) e "Ver movimentos" (`/caixa/movimentos`). Isola a permissão para `CaixaPage` não ganhar mais hooks de perfil. |
| `src/components/caixa/CaixaFechado.tsx` | Mantém o link "Caixas anteriores", agora escondido a partir de `breakpoints.lg`, e acrescenta o `AcessoRapido` "Ver Histórico" (visível só a partir de `breakpoints.lg`), ambos sob `podeVerCaixasAnteriores`. |
| Testes | `AcessosCaixa.test.tsx` (novo); ajustes em `CaixaPage.test.tsx` (link de movimentos continua; novo caso de "Ver Histórico" por perfil) e `CaixaFechado.test.tsx` (botão por perfil). |

Nenhuma mudança em `src/lib/api`, `src/types`, `src/lib/permissoes.ts`, `HistoricoCaixasPage` nem nas rotas. A API (`GET /Caixa/historico` com `dataInicio`, `dataFim`, `pagina`, `tamanhoPagina`) e a tela já existem.

### Faixa de acessos
- Ordem: Ver Histórico, Ver movimentos.
- `AcessosCaixa` renderiza `<Acessos>` com os dois filhos. Quem não tem a permissão de histórico vê só "Ver movimentos". `Acessos` é sempre `display: none` abaixo de `lg`, então não deixa espaço em branco no celular.
- Para o rótulo, usa o texto exato pedido: "Ver Histórico".

### Caixa fechado
- Dois elementos com o mesmo destino, alternados só por CSS (mobile-first):
  - `Link` "Caixas anteriores": visível por padrão; `display: none` em `min-width: lg`.
  - `AcessoRapido` "Ver Histórico": `display: none` por padrão (como já faz `AcessoRapido`); `inline-flex` em `min-width: lg`.
- O modificador do link vem de um styled local (`styled(Link)` com a media query) em vez de uma prop, já que a decisão é só de CSS.

### Server vs Client
Tudo Client Component (já dentro de `CaixaPage`/`CaixaFechado`, que usam hooks). `AcessosCaixa` usa `useCan`.

## Decisões e trade-offs
- **Dois elementos alternados por CSS, não `matchMedia`.** Sem hidratação divergente nem `useEffect`; o custo é um nó escondido no DOM. É o mesmo padrão já adotado em "Ver movimentos".
- **`AcessosCaixa` separado.** `CaixaPage` já orquestra modais e estados; a permissão de histórico fica no componente que a usa, como em `CaixaFechado`.
- **Renomear `VerMovimentos` para `AcessoRapido`.** Evita duplicar CSS e deixa o nome certo quando há dois usos. Só `CaixaPage` o importa hoje.
- **Não reativar `CaixaHeader`.** É código órfão do layout anterior (não é usado por `CaixaPage`); mexer nele seria escopo alheio. Remoção entra, se for o caso, na limpeza listada em `docs/specs/caixa-refactor`.
- **Sem mudar a tela de histórico**, já atendida pelos RF3 a RF5.

## Riscos / pontos de atenção
- **Testes em jsdom:** o jsdom não aplica media query, e `display: none` tira o elemento da árvore de acessibilidade; testar "Ver Histórico" e "Ver movimentos" por texto (`getByText(...).closest("a")`), como foi feito em `CaixaPage.test.tsx`. O link "Caixas anteriores" continua visível no jsdom (esconde só em `lg`), então os testes atuais não quebram.
- **Permissão por módulo:** `useCan` já considera overrides; o botão herda isso. Conferir em teste com perfil Caixa (4) e Manobrista (3) sem o botão.
- **Texto "Ver Histórico" vs "Ver movimentos":** a caixa alta diferente é pedido do input; não normalizar.
- **Pendência de produto (RF6):** a troca de "Caixas anteriores" por "Ver Histórico" em tela grande no caixa fechado é proposta do design; se for decidido manter os dois, basta não esconder o link.
- **Token real em `docs/specs/input.md`:** remover antes de commitar o arquivo.
- **Next.js diferente do conhecido** (AGENTS.md): sem rota nova nesta feature, risco baixo; `Link` já é o do design system.

## Fora de escopo técnico
- Alterar `HistoricoCaixasPage`, filtros, paginação, extrato ou API.
- Mudar permissões por perfil.
- Versão do botão para celular.
- Remover o código órfão (`CaixaHeader` e relacionados).
