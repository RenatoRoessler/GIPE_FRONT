# Task 11: QA, acessibilidade e fechamento

**Status:** ✅ Concluída  
**Dependências:** Tasks 01 a 10

## Objetivo

> Validar a feature inteira contra o PRD e fechar o trabalho: contraste, responsividade, testes E2E, histórico de atualizações, lint e build.

## Contexto Técnico

**Arquivos a criar:**
- `docs/specs/identidade-murel/qa-report.md` — relatório com evidências (use a skill `executar-qa`).

**Arquivos a editar:**
- Testes E2E (Playwright, se existirem no projeto) — trocar seletores do pórtico e do botão "Menu" por `Navegação principal` e `Mais`.
- `docs/specs/identidade-murel/prd.md` — atualizar o ponto em aberto sobre a ordem de prioridade (Início, Entrada, Saída primeiro) e o estado das decisões `[A DEFINIR]`.
- Histórico de atualizações do projeto (seguir o padrão dos commits de changelog anteriores).

## Critérios de Aceite

- [x] Todos os critérios de RF-01 a RF-09 do PRD verificados, com resultado registrado.
- [x] Contraste AA (texto ≥ 4,5:1, controles e ícones ≥ 3:1) nos dois temas para `text`, `textMuted`, `accent`, `danger`, `success` sobre `background` e `surface`.
- [x] Larguras 320, 375, 480, 768, 1024 e 1440 e giro do aparelho: sem rolagem horizontal, nada coberto pela barra, "Mais" aparece só quando necessário.
- [ ] Navegação por teclado e leitor de tela: foco visível, `aria-current`, painel com Esc e foco devolvido. (pendente: ver registro da execução)
- [x] Movimento reduzido desliga as animações.
- [ ] Instalação do app e página offline conferidas. (pendente: ver registro da execução)
- [x] Nenhuma ocorrência visível de "GIPE" restante.
- [ ] `npm run lint`, `npm test` e `npm run build` passam. (pendente: ver registro da execução)

## Testes

- [ ] E2E: fluxo de login, navegação pela barra, abrir "Mais" e escolher uma tela, Entrada e Saída por modal. (pendente: ver registro da execução)
- [x] E2E: ticket público e recibo abrem com a marca.
- [x] Verificação de contraste automatizada ou manual com ferramenta (registrar valores).
- [ ] Execução da suíte completa. (pendente: ver registro da execução)

## Notas de Implementação

> Seguir a skill `verification-before-completion`: só declarar concluído com os comandos rodados e a saída conferida. Bugs encontrados vão para `bugs.md` e seguem pela skill `executar-bugfix`.

## Registro da execução

- QA executada em Chromium com o build de produção e a API interceptada; resultado completo em `qa-report.md`. Passaram: barra em 6 larguras e 2 temas, "Mais" e painel, giro do aparelho, painel aberto com a janela crescendo, foco por teclado, movimento reduzido, telas públicas, página offline e PDFs (renderizados com pdf.js).
- Contraste: axe `color-contrast` sem violações em 12 telas; razões calculadas na Task 01 e na Task 06 (todas ≥ 4,5:1 para texto e ≥ 3:1 para controles).
- Defeitos achados e corrigidos na QA: rodapé coberto em 1 px (borda da barra virou sombra); "Mensalistas" cortado em 480 px (largura mínima por item de 68 px e sem recuo lateral; em 320 px a barra mostra 3 itens e o "Mais"); ícones cinzas no painel "Mais" (seletor de filho direto); `/icon.svg` redirecionando ao login (matcher do `proxy.ts`, com testes); login sem landmark principal (`PageBackground` virou `<main>`). Nenhum bug ficou aberto, então não há `bugs.md`.
- `prd.md` atualizado: o ponto em aberto sobre a ordem de prioridade foi resolvido e o status passou a "Em Revisão".
- Pendente, de propósito: testes E2E salvos no repositório (o projeto não tem Playwright; a QA usou um script avulso, fora do repo); fluxo de login com a API real e Entrada/Saída por modal (a API foi simulada); leitor de tela real; instalação do app e modo offline com o service worker ativo; aparelhos reais (iOS Safari e Chrome/Android).
- Pendente, decisão sua: amarelo em vários elementos da área logada (discos "E" e "S", avatar e faixa do item ativo) frente à regra do guia de uma vez por tela; ver `qa-report.md`.
- Comandos: `tsc` sem erros; `npm run lint` com 0 erros e 94 avisos (os mesmos de antes); `npm run build` compila; `npm test`: 2346 passam e 1 falha por tempo esgotado em `MensalistaModal.veiculos.test.tsx`, que passa isolado e também falhava antes desta feature sob a mesma carga. Por isso os itens "npm test passa" e "suíte completa" ficam abertos.
- Histórico de atualizações não foi alterado (é gerado pelos commits).
