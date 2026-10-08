# Tasks: Logs de Atualizações

Referências: ./prd.md, ./techspec.md

- [x] T1 — Criar os tipos do changelog
  - Arquivos: `src/types/changelog.ts`
  - Pronto quando: `ChangelogType`, `ChangelogEntry`, `ChangelogData` e `VersionInfo` estão exportados conforme a seção 3 do techspec e o typecheck passa.

- [x] T2 — Criar o script que gera os JSON a partir do git
  - Arquivos: `scripts/generate-changelog.mjs`
  - Pronto quando: exporta `parseGitLog(raw)` (pura) e `generateChangelog()`; lê `git log --format=%H%x1f%aI%x1f%s%x1f%b%x1e` numa única chamada; versão de cada commit = `1.0.(total - índice)`; entram só `feat`/`fix` (com ou sem escopo e `!`); rodapés `Co-Authored-By`/`Signed-off-by` são removidos e autor/e-mail não são exportados; tenta `git fetch --unshallow` se o repositório for raso e marca `complete: false` se continuar raso; sem git ou `.git` mantém os JSON existentes ou cria o estado incompleto/vazio; grava de forma atômica (arquivo temporário + rename) e só quando o conteúdo muda; nunca lança exceção. Rodar o script gera `src/generated/version.json` e `changelog.json` com `total` igual a `git rev-list --count HEAD`.

- [x] T3 — Ignorar os arquivos gerados e disparar a geração no `next.config.ts`
  - Arquivos: `.gitignore`, `next.config.ts`, `package.json`
  - Pronto quando: `/src/generated` está no `.gitignore`; o `next.config.ts` chama `generateChangelog()` no topo do módulo; existe o script `generate:changelog` (`node scripts/generate-changelog.mjs`); `yarn next build` e `yarn dev` geram os JSON sem erro e a configuração do styled-components continua igual.

- [x] T4 — Criar o acesso aos dados e a formatação de data
  - Arquivos: `src/lib/changelog.ts`
  - Pronto quando: `getVersionInfo()` e `getChangelog()` importam os JSON tipados e `formatChangelogDate(iso)` retorna a data em pt-BR no fuso `America/Sao_Paulo`; o typecheck passa.

- [x] T5 — Criar o componente `ChangelogList`
  - Arquivos: `src/components/atualizacoes/ChangelogList/{ChangelogList.tsx,ChangelogList.styles.ts,index.ts}`
  - Pronto quando: cada entrada é um `<article id="v{version}">` com versão, selo de tipo em texto (Novidade/Correção), escopo opcional, data, título em `h2` e descrição renderizada como texto com quebras de linha; o destaque usa `:target` com `scroll-margin-top`; lista vazia mostra "Nenhuma atualização registrada até o momento."; só tokens do tema; contraste adequado nos dois temas.

- [x] T6 — Criar a página `/atualizacoes`
  - Arquivos: `src/app/(app)/atualizacoes/page.tsx`
  - Pronto quando: Server Component com `metadata.title = "Atualizações — GIPE"`, cabeçalho com texto de apoio sobre a contagem de versões, `ErrorBanner` quando `complete` for falso (ainda listando entradas parciais, se houver) e `ChangelogList`; a rota exige login e não aparece no menu lateral.

- [x] T7 — Criar o `AppFooter` e encaixá-lo no `AppShell`
  - Arquivos: `src/components/layout/AppFooter/{AppFooter.tsx,AppFooter.styles.ts,index.ts}`, `src/components/layout/AppShell/AppShell.tsx`
  - Pronto quando: o rodapé aparece depois do `Main`, mostra `v1.0.N` como link para `/atualizacoes#v{highlight}` (ou `/atualizacoes` sem entradas); com `complete: false` mostra "Versão indisponível" com link para a página; usa o `Link` do design system, foco visível por teclado e só tokens do tema; não aparece em login, adesão, recuperar e alterar senha.

- [x] T9 — Revisão: JSON versionados e regenerados pela skill `commit`
  - Arquivos: `scripts/generate-changelog.mjs`, `next.config.ts`, `.gitignore`, `.claude/skills/commit/SKILL.md`
  - Pronto quando: o script grava `src/generated/*.json` só com repositório completo e aceita `--next` (idempotente se o `HEAD` for `chore(changelog)`); o `next.config.ts` não chama mais o script; `src/generated` não está no `.gitignore`; a skill `commit` termina cada chamada com o commit `chore(changelog)`; a versão gravada é igual ao total de commits depois desse commit.

- [ ] T8 — Verificação final
  - Arquivos: —
  - Pronto quando: `npm run lint` e `yarn next build` passam; `version` = `1.0.<git rev-list --count HEAD>`; no navegador (desktop e 375px, temas claro e escuro) o rodapé aparece em todas as telas logadas, o clique abre a página com a entrada mais recente destacada, recarregar mantém a página, a lista vazia e o estado "indisponível" (simulando `complete: false`) funcionam, e a navegação por teclado funciona; o JSON gerado não contém autor nem e-mail. Pendente fora do código: validar a contagem em um deploy de preview na Vercel (histórico raso).
