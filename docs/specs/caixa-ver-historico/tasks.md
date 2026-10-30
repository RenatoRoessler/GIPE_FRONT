# Tasks: Ver histórico do caixa

Referências: ./prd.md, ./techspec.md, ./design.md

- [x] T1 — Renomear `VerMovimentos` para `AcessoRapido` e criar o container `Acessos`
  - Arquivos: `src/components/caixa/CaixaResumo.styles.ts`, `src/components/caixa/CaixaPage/CaixaPage.tsx` (só o import e o uso, até a T2)
  - Pronto quando: `AcessoRapido` mantém o CSS atual (escondido abaixo de `breakpoints.lg`); `Acessos` é um container flex alinhado à direita, com `gap` do tema, `display: none` por padrão e `display: flex` a partir de `breakpoints.lg`; só tokens do tema; `tsc` e os testes de `CaixaPage` passam

- [x] T2 — Criar `AcessosCaixa` com "Ver Histórico" (por permissão) e "Ver movimentos" e usá-lo na `CaixaPage`
  - Arquivos: `src/components/caixa/AcessosCaixa.tsx`, `src/components/caixa/CaixaPage/CaixaPage.tsx`
  - Pronto quando:
    - com `useCan(AREA.CaixaHistorico)`, a faixa mostra "Ver Histórico" (`/caixa/historico`) e depois "Ver movimentos" (`/caixa/movimentos`); sem a permissão, só "Ver movimentos";
    - o texto é exatamente "Ver Histórico";
    - `CaixaPage` renderiza `<AcessosCaixa />` no ramo de caixa aberto, no lugar do link solto de movimentos, acima de `AberturaCaixa`;
    - nada aparece com caixa fechado, carregando, erro ou sem permissão no Caixa

- [x] T3 — Acrescentar "Ver Histórico" ao `CaixaFechado` e esconder "Caixas anteriores" em tela grande
  - Arquivos: `src/components/caixa/CaixaFechado.tsx`, `src/components/caixa/CaixaResumo.styles.ts` (ou `Caixa.styles.ts`, onde ficar o styled do link)
  - Pronto quando:
    - sob `podeVerCaixasAnteriores`, o painel mostra o link "Caixas anteriores" (visível por padrão, `display: none` a partir de `breakpoints.lg`) e o `AcessoRapido` "Ver Histórico" (visível só a partir de `breakpoints.lg`), ambos para `/caixa/historico`;
    - sem permissão, nenhum dos dois aparece;
    - "Abrir caixa" segue como ação principal do painel

- [x] T4 — Testes
  - Arquivos: `src/components/caixa/AcessosCaixa.test.tsx` (novo), `src/components/caixa/CaixaPage/CaixaPage.test.tsx`, `src/components/caixa/CaixaFechado.test.tsx`
  - Pronto quando cobrem:
    - Administrador (1) e Gerente (2) veem "Ver Histórico" com `href="/caixa/historico"` e "Ver movimentos"; Caixa (4) e Manobrista (3) veem só "Ver movimentos";
    - na `CaixaPage` com caixa aberto a faixa aparece e com caixa fechado não;
    - no `CaixaFechado`, Administrador e Gerente têm o botão e o link; Caixa e Manobrista não têm nenhum dos dois;
    - os elementos escondidos por breakpoint são achados por texto (`getByText(...).closest("a")`), porque o jsdom não aplica a media query;
    - os testes antigos de "Caixas anteriores" continuam passando

- [ ] T5 — Confirmar a pendência do RF6 com o produto e, se a decisão for manter os dois acessos no caixa fechado, ajustar a T3
  - Arquivos: `docs/specs/caixa-ver-historico/prd.md`, `design.md`, `techspec.md` (e `CaixaFechado.tsx` se mudar)
  - Pronto quando: a decisão (substituir o link em tela grande ou manter os dois) está registrada no PRD e o código reflete o que foi decidido

- [ ] T6 — Verificação final
  - Arquivos: nenhum alterado (salvo correções)
  - Pronto quando: `npm run lint` (sem erros), `tsc`, os testes de `src/components/caixa` e `npm run build` passam; conferido no navegador em 1280px (faixa com os dois botões para Administrador/Gerente; só "Ver movimentos" para Caixa; caixa fechado com "Ver Histórico" e sem o link) e em 375px (nenhum botão; link "Caixas anteriores" no caixa fechado); o clique leva à tela de histórico com filtro e paginação funcionando; o token JWT foi removido de `docs/specs/input.md` antes de qualquer commit
