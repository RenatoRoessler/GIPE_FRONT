# Tasks: Ver movimentos do caixa

Referências: ./prd.md, ./techspec.md, ./design.md

- [x] T1 — Ler a documentação do Next.js em `node_modules/next/dist/docs/` sobre `page.tsx`, `metadata` e `Link` (exigência do AGENTS.md) e anotar qualquer diferença em relação ao padrão já usado em `caixa/historico/[caixaId]/page.tsx`
  - Arquivos: nenhum alterado
  - Pronto quando: as convenções usadas nas tasks seguintes estão confirmadas (ou o techspec é ajustado se algo divergir)

- [x] T2 — Extrair `somarMovimentos` (hoje `somar`, privada) para `movimentos.ts` e usá-la no extrato
  - Arquivos: `src/components/caixa/movimentos.ts`, `src/components/caixa/ExtratoCaixaPage/ExtratoCaixaPage.tsx`, teste de `movimentos` (criar caso de soma: entradas, saídas e sangrias contam como saída, valor não finito conta como 0, arredondado)
  - Pronto quando: o extrato se comporta igual a antes, `ExtratoCaixaPage.test.tsx` passa sem alteração de expectativa e o novo teste da função passa

- [x] T3 — Criar `MovimentosCaixaPage` (Client Component) com estados externos, painel de resumo e `MovimentosLista`
  - Arquivos: `src/components/caixa/MovimentosCaixaPage/MovimentosCaixaPage.tsx`, `src/components/caixa/MovimentosCaixaPage/index.ts`
  - Pronto quando:
    - usa `useCaixa()` (sem consulta nova);
    - título `h1` "Movimentos do caixa" e `Link` "Voltar ao caixa" para `/caixa`;
    - carregando → `CaixaSkeleton` ou esqueleto equivalente; 403 → `ErroSemPermissao`; erro → `ErrorBanner` + "Tentar novamente"; `caixa === null` → "Não há caixa aberto." + `Link` "Ir para o caixa";
    - painel com Aberto em, Entradas e Saídas e retiradas (totais só depois de os movimentos carregarem);
    - lista ordenada por `dataHora` decrescente, com `movimentoId` desempatando, sem mutar o array do cache;
    - `MovimentosLista` com `vazio="Ainda não há movimentos neste caixa."`, `turnos` derivados e `onRetry` refazendo a consulta de movimentos, sem `renderAcoes`;
    - só tokens do tema, sem valores visuais soltos

- [x] T4 — Criar a rota `/caixa/movimentos`
  - Arquivos: `src/app/(app)/caixa/movimentos/page.tsx`
  - Pronto quando: a página renderiza `MovimentosCaixaPage` com `metadata.title = "Movimentos do caixa — Murel"` e `AREA_POR_ROTA` já a cobre como `AREA.Caixa` (conferir com um teste de `areaDaRota("/caixa/movimentos")` em `permissoes`, se ainda não existir)

- [x] T5 — Adicionar o link "Ver movimentos" à `CaixaPage`, visível só em tela grande e só com caixa aberto
  - Arquivos: `src/components/caixa/CaixaResumo.styles.ts` (styled `VerMovimentos`), `src/components/caixa/CaixaPage/CaixaPage.tsx`
  - Pronto quando:
    - o link aponta para `/caixa/movimentos`, usa `Link` do design system com visual de botão `secondary`;
    - fica acima de `AberturaCaixa`, alinhado à direita, fora de `AcoesCaixa`, e não depende do turno;
    - tem `display: none` por padrão e `display: inline-flex` a partir de `theme.breakpoints.lg` (media query `min-width`);
    - não aparece com caixa fechado, carregando, erro ou sem permissão;
    - Fechar caixa continua com o maior destaque

- [x] T6 — Testes de `MovimentosCaixaPage` e do link na `CaixaPage`
  - Arquivos: `src/components/caixa/MovimentosCaixaPage/MovimentosCaixaPage.test.tsx`, teste de `CaixaPage` (existente ou novo)
  - Pronto quando cobrem:
    - ordem da lista (mais recente primeiro) com dados do exemplo da API;
    - entradas = soma das entradas e saídas = soma do restante, batendo com o "valor em caixa" da tela do Caixa para os mesmos dados;
    - carregando, vazio, erro com tentar de novo, 403 e sem caixa aberto;
    - link presente no DOM com caixa aberto, ausente com caixa fechado, com `href="/caixa/movimentos"`

- [ ] T7 — Validar com a API real as duas dúvidas do techspec e ajustar o que for preciso
  - Arquivos: possivelmente `src/lib/api/services/caixa.mapper.ts` e `caixa.mapper.test.ts`; `techspec.md` se algo mudar
  - Pronto quando: está confirmado (a) o que significa `origem: 2` para a saída com observação "compra de material de limpeza" (despesa vs. sangria) e o rótulo está correto; (b) se `GET /Caixa/movimentos` devolve só o caixa aberto, e, se não, o filtro foi definido (backend ou por `turnoId`); resultado registrado no techspec

- [ ] T8 — Verificação final
  - Arquivos: nenhum alterado (salvo correções)
  - Pronto quando: `npm run lint`, os testes (`vitest`) e `npm run build` passam; conferido no navegador em 1280px (botão visível, navegação, lista) e em 375px (botão oculto; `/caixa/movimentos` aberto por URL funciona sem rolagem horizontal); o token JWT foi removido de `docs/specs/input.md` antes de qualquer commit
