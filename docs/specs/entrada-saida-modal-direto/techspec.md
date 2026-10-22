# Tech Spec: Entrada e Saída Direto no Modal

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e registra as decisões de componente)

## Design
- Telas/estados: os de `design.md` (itens do menu como botões, modal aberto por cima da tela atual, sem estado de "página atual" para Entrada e Saída).
- Componentes do design system reaproveitados: `EntradaVeiculoModal`, `SaidaVeiculoModal`, `Toast`, `DiscButton`, `useToast`, estilos atuais de `NavSign`, `BottomNav` e `MenuSheet`.
- Componentes novos necessários: um host de modais sem aparência (`VeiculoModais`, em `src/components/veiculos`), ver "Arquitetura".
- Tokens de tema usados/criados: nenhum.

## Arquitetura da solução

### Host dos modais (`src/components/veiculos/VeiculoModais/`)
- `VeiculoModaisProvider.tsx` (Client Component): guarda qual modal está aberto (`"entrada" | "saida" | null`) e usa `useToast`. Renderiza `EntradaVeiculoModal` ou `SaidaVeiculoModal` quando abertos (com `onClose` que limpa o estado e `onSuccess` que mostra o `Toast`), e o `Toast` quando há aviso. Expõe pelo contexto `abrirEntrada()` e `abrirSaida()`.
- `useVeiculoModais()`: hook que devolve as duas funções; lança erro claro se usado fora do provider.
- `index.ts`.
- O estado do toast mora no provider, para o aviso sobreviver ao fechamento do modal e não depender da tela onde o modal foi aberto.

### Dados de navegação (`src/lib/nav.ts`)
- `NavItem` vira uma união: item de **link** (`label`, `href`, `icon`) ou item de **ação** (`label`, `acao: "entrada" | "saida"`, `icon`). Helper `isNavAction(item)`.
- `NAV_ITEMS`: Entrada e Saída passam a ser itens de ação (mesma ordem, rótulos e ícones de hoje).
- `isNavItemActive(pathname, href)` não muda; um novo `isNavActive(pathname, item)` devolve `false` para itens de ação e delega para `isNavItemActive` nos de link.
- `BOTTOM_NAV_ITEMS`: Início (link), Entrada e Saída (ações), derivados de `NAV_ITEMS` por `href` ou `acao`.
- `isMenuTabActive(pathname)`: verdadeiro quando a tela atual não é o Início (os demais atalhos não são mais telas).
- A chave de lista de cada item passa a ser `href ?? acao`.

### Componentes de menu
- `NavSign` (pórtico): para item de ação renderiza `<button type="button">` com o mesmo estilo e `aria-haspopup="dialog"`, chamando `abrirEntrada`/`abrirSaida`; para link, como hoje.
- `BottomBar`: aba de ação usa `TabButton` (já existe) com `onClick` da ação; aba de link continua `TabLink`. Sem `aria-current` nas ações.
- `MenuSheet`: linha de ação usa um botão com o mesmo estilo de linha (`SheetRow` como `button`); ao tocar, chama `onRequestClose()` e, depois, a ação. O painel fecha primeiro para o modal nunca abrir por baixo dele.
- `Gantry`: só passa os itens para o `NavSign` (sem mudança de lógica).

### Telas e botões que abriam as páginas
- `RegistrarEntradaButton` e `RegistrarSaidaButton`: passam a só chamar `abrirEntrada`/`abrirSaida` (somem o estado, o modal e o toast locais).
- `PatioView`: o link "Registrar entrada" (`EntradaLink`, hoje para `/veiculos/entrada`) vira um botão com a mesma aparência que chama `abrirEntrada`. O modal de saída aberto pela lista do Pátio (`SaidaVeiculoModal` com `buscaInicial`) continua como está, no próprio `PatioView`.
- `dashboard/page.tsx`: sem mudança (usa os dois botões acima).
- `AppShell`: envolve o conteúdo com `VeiculoModaisProvider`.

### Rotas
- Remover `src/app/(app)/veiculos/entrada/page.tsx` e `src/app/(app)/veiculos/saida/page.tsx` (a pasta `veiculos` some).
- `next.config.ts`: `redirects()` com `/veiculos/entrada` e `/veiculos/saida` para `/dashboard`, `permanent: false` (307; redirecionamentos de `next.config` valem antes do sistema de arquivos e do proxy). Usuário sem sessão cai no login pelo proxy, como qualquer rota.
- Remover componentes que ficam sem uso: `ActionRow` só se nenhuma outra tela o usar (conferir antes de apagar).

### Server vs Client
- `VeiculoModaisProvider`, `NavSign`, `BottomBar`, `MenuSheet`, `Gantry`, `PatioView`, botões: Client Components (estado, eventos). As páginas removidas eram Server Components.

## Decisões técnicas e trade-offs
- **Contexto com host único** em vez de cada item abrir seu próprio modal: o pórtico, a barra, o painel, o Início e o Pátio precisam abrir o mesmo modal; um host evita montar o modal em cinco lugares e deixa o aviso de sucesso num só lugar. Alternativa descartada: estado global em um store (zustand), que seria mais peso para dois valores.
- **Itens de ação na própria lista de navegação** (união no `NavItem`) em vez de uma lista paralela: mantém uma só fonte de verdade para ordem, rótulo e ícone do menu, e o compilador obriga cada consumidor a tratar os dois casos.
- **Redirecionamento temporário** (307) para o Início, em vez de permanente: se um dia o destino mudar (por exemplo, abrir o modal ao chegar), navegadores não terão guardado o redirecionamento. Fica em `next.config.ts` (e não em uma página com `redirect()`) porque a pasta de rotas é removida.
- **Painel do Menu fecha antes de abrir o modal**: evita dois `<dialog>` modais empilhados e o foco preso no painel.
- **O Pátio mantém o modal de saída com `buscaInicial`**: é outro caminho (veículo já escolhido) e funciona; unificar traria risco sem ganho para este pedido.

## Desvios na implementação
- `BottomBar`, `MenuSheet` e `NavSign` não usam o hook: recebem `onAction(acao)` por prop. Quem usa `useVeiculoModais` é `BottomNav` e `Gantry`, o que mantém as peças visuais simples de testar.
- No painel do Menu, a ação escolhida fica guardada e só roda **depois** do evento `close` do painel (`BottomNav`). Isso garante que o modal nunca abre com o painel ainda aberto e que o foco já está no botão Menu quando o modal abre (e volta a ele ao fechar). Foi a alternativa já prevista nos riscos, aplicada desde o início.
- No Pátio, o link virou o `Button` do design system (o estilo `EntradaLink` foi removido).
- `ActionRow` continua em uso (Início) e não foi removido.
- Testes que renderizam `PatioView` passam a mockar `@/components/veiculos/VeiculoModais`, pois em produção o provider vem do `AppShell`.

## Riscos / pontos de atenção
- **Foco ao fechar**: quando o modal abre a partir do painel (que fecha antes), o foco deve acabar no botão Menu da barra; conferir em teste e no navegador.
- **Dois `<dialog>` em sequência**: fechar o painel e abrir o modal no mesmo instante pode piscar ou perder o foco em alguns navegadores; se acontecer, abrir o modal no tick seguinte ao fechamento do painel.
- **Testes existentes**: `nav.test.ts`, `BottomBar.test.tsx`, `BottomNav.test.tsx`, `AppShell.test.tsx`, `Gantry.test.tsx` e `PatioView.test.tsx` assumem links para essas páginas e precisam de ajuste; componentes que usam `useVeiculoModais` precisam do provider (ou de um mock) nos testes.
- **Links e atalhos salvos** para `/veiculos/*` (favoritos, PWA instalado): cobertos pelo redirecionamento.
- **Textos que citam as páginas** (por exemplo, em `PagamentosFields` ou em specs antigas): conferir se algum texto da tela manda "ir para Entrada/Saída de Veículos".
- **Permissões**: o menu não filtra por perfil hoje; os modais também não. Sem mudança.

## Fora de escopo técnico
- Mudar o conteúdo ou o fluxo dos modais.
- Atalhos de teclado globais para abrir os modais.
- Unificar o modal de saída do Pátio com o do menu.
- Esconder itens conforme permissão.
