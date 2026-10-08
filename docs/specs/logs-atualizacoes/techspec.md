# Tech Spec: Logs de Atualizações

**Status:** Rascunho
**Autor:** Renato Roessler
**Data:** 2026-10-08
**PRD:** [./prd.md](./prd.md)

> Adaptações em relação ao template da skill `cria-techspec`: o projeto não usa `src/features`, Zustand, Jest nem prefixo `I` em interfaces (ver `CLAUDE.md` e `src/types/adesao.ts`). A spec segue a estrutura real do repositório (`src/components`, `src/lib`, `src/types`, styled-components) e o fluxo de testes descrito em "Estratégia de testes". Não há `GUIDELINE.md` no repositório; valeram `AGENTS.md`, `CLAUDE.md` e a documentação do Next.js em `node_modules/next/dist/docs/`.

---

## 1. Visão Técnica

O número da versão (`1.0.N`) e a lista de logs vêm do **histórico de commits do git, lidos em tempo de build**. Um script Node (`scripts/generate-changelog.mjs`), chamado de dentro do `next.config.ts`, executa `git log` e grava dois arquivos JSON em `src/generated/` (ignorados pelo git):

- `version.json`: pequeno, usado pelo rodapé (entra no bundle do cliente).
- `changelog.json`: lista completa de entradas `feat`/`fix`, usada apenas pela página de logs.

Com isso:

- Nada de git em produção: o servidor só serve dados já gerados.
- A página `/atualizacoes` é estática (Server Component que lê o JSON) e o rodapé é um link para ela.
- A versão aumenta a cada commit simplesmente porque `N` é a contagem total de commits no momento do build.

A hospedagem é a **Vercel**, que clona de forma rasa (cerca de 10 commits) por padrão. O script precisa ler o histórico completo (`git fetch --unshallow`) e, se não conseguir, marcar os dados como **incompletos** e exibir "versão indisponível" em vez de um número errado.

## 2. Estrutura de Pastas

```
scripts/
└── generate-changelog.mjs            # NOVO: lê o git e gera os JSON (puro Node, sem dependências)

next.config.ts                        # chama generateChangelog() ao carregar a configuração

src/
├── generated/                        # NOVO, no .gitignore
│   ├── version.json                  # { version, total, highlight, complete }
│   └── changelog.json                # { complete, entries: ChangelogEntry[] }
├── types/
│   └── changelog.ts                  # NOVO: ChangelogEntry, VersionInfo, ChangelogData
├── lib/
│   └── changelog.ts                  # NOVO: getVersionInfo(), getChangelog(), formatChangelogDate()
├── app/(app)/atualizacoes/
│   └── page.tsx                      # NOVO: Server Component, rota /atualizacoes
└── components/
    ├── layout/
    │   ├── AppFooter/
    │   │   ├── AppFooter.tsx         # NOVO: rodapé com a versão (link)
    │   │   ├── AppFooter.styles.ts
    │   │   └── index.ts
    │   └── AppShell/AppShell.tsx     # MODIFICADO: renderiza <AppFooter /> após <Main>
    └── atualizacoes/
        └── ChangelogList/
            ├── ChangelogList.tsx     # NOVO: lista de entradas com destaque (:target)
            ├── ChangelogList.styles.ts
            └── index.ts

.gitignore                            # MODIFICADO: ignora /src/generated
package.json                          # MODIFICADO: script "generate:changelog" (uso manual/CI)
```

A rota fica em `(app)`, portanto já é protegida pelo `proxy.ts` (qualquer rota fora de `PUBLIC_PATHS` exige login) e herda o `AppShell`. Nenhuma mudança em `proxy.ts` nem em `NAV_ITEMS` (a página não aparece no menu, apenas no rodapé).

## 3. Interfaces e Tipos

```ts
// src/types/changelog.ts
export type ChangelogType = "feat" | "fix";

export interface ChangelogEntry {
  version: string;        // "1.0.38" (sem o "v")
  type: ChangelogType;
  scope: string | null;   // "empresa" em "feat(empresa): ..."
  title: string;          // resumo sem o prefixo "feat(escopo): "
  description: string;    // corpo do commit, sem rodapés (Co-Authored-By etc.); "" se não houver
  date: string;           // ISO 8601 do commit
}

export interface ChangelogData {
  complete: boolean;      // false quando o histórico estava incompleto no build
  entries: ChangelogEntry[]; // da mais recente para a mais antiga
}

export interface VersionInfo {
  complete: boolean;
  version: string | null;   // "1.0.39"; null quando incompleto
  total: number;            // N (commits contados)
  highlight: string | null; // versão da entrada mais recente listada; âncora do link
}
```

Regras de derivação (feitas pelo script):

- `total` = número de commits retornados por `git log` na branch atual (todos, inclusive merges, para bater com `git rev-list --count HEAD`).
- Para o commit na posição `i` da lista (0 = mais recente), `version = "1.0." + (total - i)`.
- Entram em `entries` somente commits cujo assunto casa com `/^(feat|fix)(\(([^)]+)\))?(!)?:\s*(.+)$/`.
- `description` = corpo do commit sem linhas de rodapé (`Co-Authored-By:`, `Signed-off-by:`, `BREAKING CHANGE:` permanece) e sem linhas em branco nas pontas. **Autor e e-mail não são exportados.**
- `highlight` = `entries[0]?.version ?? null`. Como todas as entradas são ≤ à versão atual, a primeira é sempre a "mais recente de novidade/correção até a versão atual" exigida no RF-05.

## 4. Contratos de API

Não há endpoint HTTP novo e nenhuma chamada ao backend. Os "contratos" são os arquivos gerados no build.

### `src/generated/version.json`
```json
{ "complete": true, "version": "1.0.39", "total": 39, "highlight": "1.0.38" }
```
Incompleto (histórico raso que não pôde ser completado):
```json
{ "complete": false, "version": null, "total": 10, "highlight": null }
```

### `src/generated/changelog.json`
```json
{
  "complete": true,
  "entries": [
    {
      "version": "1.0.38",
      "type": "feat",
      "scope": "empresa",
      "title": "adiciona a tela Minha Empresa",
      "description": "Nova rota /minha-empresa, com item no menu, que carrega os dados...",
      "date": "2026-10-08T14:03:11-03:00"
    }
  ]
}
```

### Comando git usado
```
git log --format=%H%x1f%aI%x1f%s%x1f%b%x1e
```
Campos separados por `\x1f` e registros por `\x1e` (o corpo pode conter quebras de linha e dois-pontos). Uma única chamada fornece contagem e conteúdo, evitando divergência entre `total` e a lista.

## 5. Componentes

### `AppFooter` (`src/components/layout/AppFooter/`)
**Responsabilidade:** faixa discreta ao final da área de conteúdo com a versão atual como link para `/atualizacoes`.
**Tipo:** Client Component (styled-components; segue o padrão dos demais componentes de `layout`); importa apenas `version.json` (poucos bytes).
```ts
// sem props: lê getVersionInfo()
```
Comportamento:
- `complete` e `version` presentes: `<Link href="/atualizacoes#v{highlight}">v1.0.39</Link>`. Sem `highlight` (nenhuma entrada), o link vai para `/atualizacoes`.
- `complete: false`: texto "Versão indisponível" com link para `/atualizacoes` (a página explica).
- Usa `Link` de `@/components/ui/Link` (design system), foco visível herdado, cores `textMuted`/`primary` do tema; sem valores hardcoded.
- Posição: dentro de `Content`, após `Main` (RF-01). Em mobile ocupa a largura toda com o mesmo padding lateral do `Main`.

### `ChangelogList` (`src/components/atualizacoes/ChangelogList/`)
**Responsabilidade:** renderizar as entradas, da mais recente para a mais antiga.
**Tipo:** Client Component (styled-components), recebe os dados por props do Server Component.
```ts
export interface ChangelogListProps {
  entries: ChangelogEntry[];
}
```
- Cada entrada é um `<article id="v{version}">` com: versão, selo de tipo ("Novidade" ou "Correção"), escopo (opcional), data (`formatChangelogDate`, pt-BR, fuso `America/Sao_Paulo` fixo para não divergir entre servidor e cliente), título (`<h2>`) e descrição (texto preservando quebras de linha, **sempre como texto**, nunca HTML).
- Destaque da versão atual (RF-05) por CSS `:target` (`&:target { border-color: primary; background: primarySoft }`) e `scroll-margin-top`. Não exige JavaScript nem estado, e funciona ao recarregar a URL com `#`.
- Lista vazia: mensagem "Nenhuma atualização registrada até o momento." (RF-04).
- Selo de tipo usa cor **e** texto (não depende só de cor); `success` para Novidade, `primary` para Correção.

### Página `src/app/(app)/atualizacoes/page.tsx`
**Tipo:** Server Component, estática (lê JSON em build).
- `metadata.title = "Atualizações — GIPE"`.
- Cabeçalho "Atualizações" com texto de apoio: "A versão conta todas as alterações do sistema; aqui aparecem as novidades e correções." (mitiga o "salto" de numeração do PRD).
- Se `complete === false`: `ErrorBanner` (de `@/components/ui/ErrorBanner`) com "Não foi possível determinar a versão e o histórico completo desta publicação." e, se houver entradas parciais, ainda lista o que existir.
- Depois renderiza `<ChangelogList entries={...} />`.

### `src/lib/changelog.ts`
- `getVersionInfo(): VersionInfo` e `getChangelog(): ChangelogData` com `import` direto dos JSON (tipados por `resolveJsonModule`, já habilitado pelo template do Next).
- `formatChangelogDate(iso: string): string` com `Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" })`.

## 6. Gerenciamento de Estado

**Estratégia:** nenhuma. Sem Zustand, Context ou React Query: os dados são estáticos por build e chegam por import/props. O destaque da entrada atual usa o fragmento da URL (`:target`). Isso elimina estado de carregamento/erro e é o motivo de a página abrir sem espera perceptível (RNF de performance).

## 7. Fluxo de Dados

```
git log (build) ──► scripts/generate-changelog.mjs ──► src/generated/{version,changelog}.json
                                                              │                   │
                                                  getVersionInfo()        getChangelog()
                                                              │                   │
                                                       AppFooter (link)   /atualizacoes (page.tsx)
                                                                                  │
                                                                         ChangelogList (UI)
```

### Script `generate-changelog.mjs`
1. Se `git rev-parse --is-shallow-repository` retornar `true`, executar `git fetch --unshallow --quiet`. Falha (sem remote, sem rede ou permissão) é capturada e **não derruba o build**.
2. Reconsultar `--is-shallow-repository`. Se ainda raso, `complete = false`.
3. Executar `git log` (formato acima), parsear, calcular `total`, versões, filtrar `feat`/`fix` e montar os dois JSON.
4. **Gravação segura:** escrever em arquivo temporário e renomear; gravar apenas se o conteúdo mudou (evita rebuild/loop em `next dev`, que observa arquivos importados).
5. **Sem git ou sem `.git`** (ex.: `next start` num ambiente que só recebeu o build): se os JSON já existem, **mantém**; se não existem, cria os valores `complete: false` / lista vazia, para que o import nunca quebre.
6. Executa de forma síncrona e determinística; qualquer exceção inesperada é capturada e vira o estado do passo 5 (nunca impede `dev`/`build`).

`next.config.ts` chama a função uma vez, no topo do módulo, antes de exportar a configuração. Como o arquivo de configuração é carregado em `dev`, `build` e `start`, os scripts existentes (`build:hml`, `build:azl`, `build:prod`) funcionam sem alteração. Em `dev` a versão só atualiza ao reiniciar o servidor (aceito: o número serve para o ambiente publicado).

## 8. Estratégia de Testes

O projeto **não tem runner de testes** configurado (nem Jest nem Vitest em `package.json`). Esta spec não o introduz; a lógica de parsing fica isolada em uma função pura exportada (`parseGitLog(raw, total?)`) para ser testada quando houver runner (a skill `vitest` está disponível no repositório).

| Camada | Ferramenta | O que verificar |
| ------ | ---------- | --------------- |
| Parsing (função pura) | Futuro: Vitest | Regex de `feat`/`fix` com e sem escopo e com `!`; commits de outros tipos ignorados; versão = `total - índice`; remoção de `Co-Authored-By`; corpo vazio; mensagem com `:` e quebras de linha |
| Manual, build | `npm run build` | Gera `src/generated/*.json`; `version` = `1.0.<git rev-list --count HEAD>` |
| Manual, UI | Navegador (desktop e 375px, temas claro e escuro) | Rodapé em todas as telas logadas e ausente em login/adesão/recuperar/alterar senha; clique abre `/atualizacoes#v...` com a entrada destacada visível; recarregar mantém a página; lista vazia; estado "indisponível" (apagar `.git` temporariamente ou simular `complete: false`) |
| Acessibilidade | Teclado + leitor de tela | Foco visível no link da versão; Enter abre a página; hierarquia `h1` → `h2`; selos com texto, não só cor; contraste AA nos dois temas |
| Segurança | Revisão do JSON gerado | Sem autor, e-mail ou hash interno; descrição renderizada como texto |
| Regressão | `npm run lint` e `npm run build` | Sem novos avisos em `src`; demais rotas inalteradas |
| Vercel | Deploy de preview | Versão publicada = contagem real de commits da branch (ver Riscos) |

## 9. Dependências

| Pacote | Versão | Motivo |
| ------ | ------ | ------ |
| (nenhum novo) | — | Usa apenas `node:child_process`, `node:fs`, `node:path` no script e as libs já instaladas (Next 16.3.5, React 19, styled-components) |

Requisito de ambiente: `git` disponível no build (garantido na Vercel). Sem alterar `package.json` além do script opcional `generate:changelog` (`node scripts/generate-changelog.mjs`), útil para CI e para gerar os JSON antes de `tsc`/`eslint` isolados.

## 10. Riscos Técnicos

| Risco | Probabilidade | Mitigação |
| ----- | ------------- | --------- |
| A Vercel clona raso (~10 commits) e o `git fetch --unshallow` falha (remote ausente/sem credencial no build), gerando versão errada | Alta | O script tenta o `unshallow`; se continuar raso marca `complete: false`, o rodapé mostra "Versão indisponível" e a página explica. **Validar no primeiro deploy de preview** e, se necessário, ajustar o processo de publicação (ex.: build via GitHub Actions com `fetch-depth: 0` e `vercel deploy --prebuilt`) |
| Reescrita de histórico (rebase/squash/force-push) muda a contagem e as entradas | Média | Proibir reescrita na branch principal; a versão é derivada e reflete o histórico vigente |
| Mensagens de commit técnicas ou com dado interno chegam ao usuário (PRD: `[A DEFINIR]`) | Média | Exportar só `feat`/`fix`, remover rodapés, não exportar autor/e-mail, renderizar como texto; combinar com o time um padrão de mensagem para esses tipos. Revisão/filtro adicional fica em aberto |
| Importar `src/generated/*.json` quebra `tsc`/`eslint` rodados isoladamente num clone novo (arquivos ainda não gerados) | Média | Script `generate:changelog` documentado; `next dev`/`next build` sempre geram antes de compilar |
| Mais de um processo carregando o `next.config.ts` ao mesmo tempo (build com workers) | Baixa | Gravação atômica (arquivo temporário + rename) e só quando o conteúdo muda |
| Versão em `next dev` desatualizada até reiniciar | Baixa | Aceito e documentado; não afeta o ambiente publicado |
| Branch ou deploy por outra ramificação conta commits diferentes de `main` | Baixa | A versão reflete o `HEAD` do build; documentado |
| Ambiente de produção sem `.git` ao rodar `next start` | Baixa | O script mantém os JSON existentes (passo 5 do fluxo) |

## 11. Decisões de Arquitetura

| Decisão | Alternativas Consideradas | Motivo da Escolha |
| ------- | ------------------------- | ----------------- |
| Gerar os dados **em tempo de build** a partir do git | Ler o git em runtime; consultar a API do GitHub | Sem `.git`, rede ou token em produção; página estática e rápida; escolha confirmada com o usuário. Runtime exigiria git no servidor e API externa exigiria token e limites |
| Disparar a geração pelo **`next.config.ts`** | Scripts `prebuild`/`predev` no `package.json`; passo no CI | Cobre `dev`, `build`, `build:hml`, `build:azl`, `build:prod` e `start` sem duplicar `pre*` por script; nenhum passo manual a esquecer |
| **Dois JSON** (`version` e `changelog`) | Um único arquivo | O rodapé aparece em todas as telas e não deve carregar o changelog inteiro no bundle do cliente |
| Versão `1.0.N` com `N = total de commits` | Tags/semver; contador manual | Escolha do usuário; derivada do git, sem estado a manter |
| Listar só `feat`/`fix` | Todos os commits; agrupar por tipo | Escolha do usuário; foca no que importa ao usuário final. A versão ainda conta todos |
| Destaque via **`:target`** (fragmento da URL) | Estado/`useSearchParams`, `useEffect` com scroll | Zero JavaScript, funciona no recarregamento e no compartilhamento do link; link do rodapé aponta para a entrada mais recente listada |
| Incompleto ⇒ **"Versão indisponível"** | Mostrar o número raso; esconder o rodapé | Número errado é pior que ausência; o usuário continua com o link e a explicação (fecha o `[A DEFINIR]` de contingência do PRD) |
| Fuso fixo `America/Sao_Paulo` na formatação de datas | Fuso do navegador | Evita diferença entre servidor e cliente e mantém a data estável |
| Sem Zustand/Context/React Query | Store global | Dados estáticos; estado seria complexidade sem benefício |
| Sem nova dependência | `simple-git`, `conventional-changelog` | `git log` + regex resolve; menos superfície e build mais simples |

## Fora de escopo técnico

- Introduzir runner de testes (Vitest/Jest) e escrever os testes automatizados.
- Revisão/curadoria manual das mensagens antes de exibir (`[A DEFINIR]` no PRD).
- Paginação, busca, filtros e exportação dos logs.
- Versionamento semântico, tags e geração de `CHANGELOG.md`.
- Mudar o processo de publicação da Vercel (só será necessário se o `unshallow` não funcionar no preview).
