# Tech Spec: Nova identidade Murel e navegação inferior única

## Referências
- PRD: ./prd.md
- Design: ./design.md (tokens, logotipo, barra, menu estendido, estados e acessibilidade). A seção "Design" abaixo só aponta o que muda no código e corrige o que a leitura do código mostrou.
- Guia de marca: `C:\Users\renat\Downloads\Marca_Murel.html` (v1.1)
- Antes de implementar, ler em `node_modules/next/dist/docs/` os guias de `next/font`, `metadata`/`viewport` e `manifest` (o `AGENTS.md` avisa que o Next 16.3 tem mudanças).

## Design

### Correção em relação ao design.md
O design.md trata o tema como um par claro/escuro. O código tem **quatro** temas em `src/styles/theme.ts`:
- `lightTheme` ("Confiança Azul") e `darkTheme` ("Grafite Coral"): telas públicas e globais (login, adesão, recuperar senha, etc.), providos por `ThemeModeProvider`.
- `signageLightTheme` e `signageDarkTheme` ("Modelo B", sinalização viária, Barlow Condensed em caixa alta): área logada, providos por `SignageThemeProvider` nos layouts `(app)`, `comprovante` e `contrato`.

**Decisão:** os quatro viram **dois**. `lightTheme` e `darkTheme` passam a ser os temas Murel descritos no design.md e valem em todo o app. Somem `signageLightTheme`, `signageDarkTheme`, `SignageThemeProvider`, `signageShared`, `signageTypography`, o `FontScope` e as fontes Barlow. A identidade fica uma só, sem diferença entre área pública e logada.

### Telas e estados
Conforme design.md, seção 5. Nenhuma tela ganha estado novo, exceto a barra inferior (carregando com slots fixos, completa, com "Mais", item ativo oculto) e o menu estendido (só itens excedentes).

### Componentes do design system reaproveitados
`Button`, `Input`, `Select`, `Card`, `InfoCard`, `Modal`, `Skeleton`, `StatusBadge`, `PlateDisplay`, `QrCode`, `Table`, `Tabs`, `Text`, `Link`, `AuthCard`, `PageBackground`. Mudam só por tokens, exceto onde indicado abaixo.

### Componentes novos ou reescritos
- `src/components/ui/Logo/Logo.tsx` + `Logo.styles.ts`: reescrito como SVG inline (`variant`, `size`, `align`, `tone`, `animated`).
- `src/components/ui/Logo/MurelSymbol.tsx`: só o símbolo (vagas + carro), reaproveitado por `Logo`, favicon e telas.
- `src/components/layout/BottomNav/useBarCapacity.ts`: hook que mede o contêiner da barra e devolve quantos slots cabem.
- `src/components/layout/NavIcons/` (movido de `NavSign/NavIcons`): ícones de navegação, para a pasta `NavSign` poder ser apagada.

### Tokens de tema
Todos os do design.md, seção 2. Em `AppTheme`:
- `ThemeColors`: acrescentar `accent`, `focus`, `cliente: { avulso; mensal; conveniado }`, `pagamento: { dinheiro; pix; credito; debito }`.
- Novo `fontFamilies: { sans: string; mono: string }` e `fontWeights` com `semibold` e `extrabold`.
- `fontSizes`: `xxl` e `subtitle`.
- `layout.contentMaxWidth: "1120px"`.
- `ThemeTypography`: `displayTransform` passa a ser sempre `"none"`; `displayWeight` novo (800). Se nada mais usar `displayTransform`/`displayTracking`/`displaySize` após a migração, remover os campos em vez de manter dois caminhos.
- Removidos ao final: `glass`, `glassBorder`, `shadows.glow` (depois de migrar `Card`, `DiscButton`, `FaixasPreview` e demais usos), `onSign` e `signEdge` (depois de apagar `NavSign`/`Gantry` e conferir `BottomBarIcons`, `MenuSheet`, `Card`, `DiscButton`, `FaixasPreview`).

## Arquitetura da solução

### 1. Tema e fontes
- `src/styles/theme.ts`: reescrever `shared`, `lightTheme` e `darkTheme` com os valores do design.md; apagar os temas de sinalização.
- `src/contexts/ThemeModeContext.tsx`: remover `SignageThemeProvider`; `ThemeModeProvider` continua. A chave de `localStorage` passa de `gipe-theme-mode` para `murel-theme-mode`, **lendo a antiga como fallback uma vez** e gravando só a nova, para ninguém perder a preferência. Padrão inicial segue "light".
- `src/app/layout.tsx` (raiz): trocar `Geist`/`Geist_Mono` por `Plus_Jakarta_Sans` (pesos 400, 500, 600, 700, 800) e `JetBrains_Mono` (500, 600), com `variable` e `display: "swap"`. `<html lang="pt-BR">` (hoje `en`). O tema referencia `var(--font-plus-jakarta)` e `var(--font-jetbrains)` com fallback de sistema.
- `src/app/globals.css`: tirar as variáveis `--background`/`--foreground` fixas e o `font-family: Arial`; `body` usa a fonte do tema. Hoje o fundo segue `prefers-color-scheme`, não o alternador; passa a seguir só o tema para o primeiro pintar não divergir (ver riscos).
- Apagar `src/app/(app)/layout.tsx` partes de Barlow/`FontScope`/`SignageThemeProvider` (o layout fica só com `AppShell`); mesma limpeza em `src/app/comprovante/layout.tsx` e `src/app/contrato/layout.tsx`. Apagar `src/components/layout/FontScope.tsx`.

### 2. Logotipo
- `Logo` deixa de usar `next/image`, `useThemeMode` e os arquivos `public/assets/gipe-*`. Usa o `MurelSymbol` + `<span>` "murel". Cores via `currentColor` e tokens do tema: vagas e palavra em `colors.text`; carro sempre `#FFC20E` (a única exceção ao "sem valor solto", por ser parte do logotipo, documentada no componente). `tone="onYellow"` pinta tudo em `#0E1729` com vidros vazados.
- IDs da `<mask>` com `useId()`.
- `animated`: classe com keyframes `estaciona` dentro de `@media (prefers-reduced-motion: no-preference)`; usado só em `AuthCard` e na página de adesão.
- Apagar `public/assets/gipe-*` e `Logo` antigo; `Header`, `AuthCard` e telas públicas passam a usar a nova API (`variant="symbol"` abaixo de `sm`).

### 3. Navegação
Dados (`src/lib/nav.ts`):
- `NavLinkItem` e `NavActionItem` ganham `shortLabel: string` (rótulos do design.md, seção 4.2).
- `BOTTOM_NAV_ITEMS`, `BOTTOM_NAV_LABELS` e `bottomNavItemsPermitidos` saem.
- Nova ordem de prioridade: `NAV_PRIORITY = ["/dashboard", "entrada", "saida"]` primeiro; o restante na ordem de `NAV_ITEMS`. Função `navItemsPorPrioridade(perfil)` (filtra por permissão e ordena).
- Nova função pura `dividirItensDaBarra(itens, capacidade): { visiveis: NavItem[]; excedentes: NavItem[] }`:
  - `capacidade >= itens.length` → tudo visível, sem excedentes;
  - senão `visiveis = itens.slice(0, max(capacidade, 3) - 1)` e `excedentes = resto` (o slot que sobra é o "Mais"). Capacidade mínima tratada: 3.
- `isMenuTabActive(pathname)` vira `isMaisAtivo(pathname, excedentes)`: ativo se o painel está aberto ou algum excedente corresponde à rota atual. Reaproveitar `isNavActive`.
- `ordem de exibição` na barra = ordem de prioridade; no painel, a ordem natural de `NAV_ITEMS` entre os excedentes.

Componentes (`src/components/layout/`):
- `BottomNav/BottomNav.tsx` (Client): continua dono do `dialog`, do estado e de `pendingActionRef`. Passa a calcular `{ visiveis, excedentes }` com `useBarCapacity` + `dividirItensDaBarra`; passa `excedentes` ao `MenuSheet`. Remove o `useEffect` que fecha o painel no breakpoint `lg` (o painel agora existe em qualquer largura). Fecha o painel se `excedentes` ficar vazio (redimensionamento).
- `BottomNav/useBarCapacity.ts` (Client hook): `ref` no contêiner interno da barra; `ResizeObserver` observa a largura; `capacidade = Math.floor(largura / SLOT_MIN)` com `SLOT_MIN = 64` (constante no hook, comentada com o motivo: alvo de 44px + rótulo). Retorna `null` até medir, para a barra mostrar slots de `Skeleton` e não piscar nem divergir na hidratação (o usuário já chega de forma assíncrona via `useCurrentUser`, então o `null` não acrescenta espera perceptível).
- `BottomNav/BottomBar.tsx`: recebe `visiveis`, `temMais`, `menuActive`; renderiza `shortLabel`; botão "Mais" só quando `temMais`; mesmos atributos ARIA. `grid-template-columns: repeat(var(--slots), 1fr)` via prop transitória `$slots`.
- `BottomNav/BottomNav.styles.ts`: remover `display: none` em `lg` de `Bar` e `Sheet`; `Bar` externo com fundo/borda e contêiner interno `max-width: contentMaxWidth; margin: 0 auto`; usar `colors.focus` e `radii` no lugar de `FOCUS_RING` e valores soltos; faixa de item ativo em `colors.primary`, ícone/rótulo ativo em `colors.accent`/`colors.text`. Folha: a partir de `md`, `inset: auto auto calc(bottomNavHeight + safe-area) 50%`, `transform: translateX(-50%)`, `max-width: 480px`, raio `xl` nos quatro cantos, sem `Grabber`.
- `BottomNav/MenuSheet.tsx`: receber `itens: NavItem[]` (excedentes) em vez de ler `navItemsPermitidos`; título "Mais" no lugar de "Menu"; `aria-label` da lista "Outras telas"; linhas conforme design.md 4.3; `nome completo` (campo `label`).
- `AppShell/AppShell.tsx`: remover `<Gantry />`. `AppShell.styles.ts`: `padding-bottom` da barra em todas as larguras (tirar o `@media max-width`).
- `Header/Header.tsx` e `Header.styles.ts`: `aria-label="Murel — ir para o início"`; sem outras mudanças de estrutura.
- `Mensalistas.styles.ts:30`: já usa `bottomNavHeight`; remover qualquer `@media` que o limite a telas estreitas.
- Apagar: `Gantry/`, `NavSign/` (movendo `NavIcons` antes) e testes associados.

### 4. Marca no texto, metadados e app instalável
- Trocar "GIPE" por "Murel" em todos os `metadata.title` (`"… — Murel"`), no `layout.tsx` raiz (`title.default: "Murel"`, `applicationName`, `appleWebApp.title`, `description` de design.md seção 7), em `InstallPwaButton`, `ResetPasswordForm`, `qr.ts`/`LeitorQrSaida` (mensagem "QR Code não é um ticket Murel"), `usuario.ts` (comentário) e demais ocorrências de texto visível. Comando de varredura na task: `grep -rniI "gipe" src public --include=...` sem `generated/changelog.json` (histórico não se reescreve).
- `src/app/manifest.ts`: `name`/`short_name` "Murel", `description` nova, `background_color` e `theme_color` `#0E1729`.
- `src/app/layout.tsx`: `viewport.themeColor` com duas entradas por `media: "(prefers-color-scheme: …)"`.
- Ícones: `scripts/gerar-icones.mjs` (único script, usa `sharp`, já presente em `node_modules`) gera `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png` e `src/app/icon.svg` (favicon) a partir do SVG do símbolo: fundo `#0E1729`, símbolo amarelo, maskable com símbolo em 60% central. Os PNG gerados são versionados; o script não roda no build.
- `public/offline.html`: cores e nome da marca (asfalto, giz, botão amarelo com texto asfalto; sem fonte externa). `public/sw.js`: `CACHE_NAME` de `gipe-offline-v1` para `murel-offline-v1`, para a página offline nova substituir a antiga; conferir se o ativador já apaga caches antigos.

### 5. Documentos e telas públicas
- `ComprovantePublico/ComprovantePublico.styles.ts` e a página `src/app/comprovante/[token]` / `recibo/[token]`: migrar para tokens, remover hex soltos que não sejam cores reais de placa; logotipo `Logo` no topo; valores/horários em `fontFamilies.mono`.
- `reciboPdf.ts`: cabeçalho com marca. O recibo é de bobina estreita em preto e Helvetica (`toLatin1`), então a marca é desenhada **em vetor com jsPDF** (`roundedRect`/`line` para as três vagas e o carro, em preto) mais o texto "murel" em `helvetica bold`, centralizada acima da razão social. Sem fonte embutida e sem imagem. O texto "Comprovante de entrada - Estacionamento" e o rodapé citam "Murel" se hoje citam o nome antigo. Ajustar o teste `reciboPdf.test.ts`.
- `QrCode.tsx` e `QrCode.styles.ts`: manter QR preto sobre branco (legibilidade acima de tudo); só o contêiner recebe `giz`/`surface`.
- `PlateDisplay.styles.ts`: manter cores reais de placa; trocar a fonte para `fontFamilies.mono`.

### 6. Identificadores persistidos (não renomear)
Para não deslogar nem perder dados de ninguém:
- Cookie `gipe_token` (`src/lib/auth.ts`), banco IndexedDB `gipe` e chave `gipe_remembered_login` (`rememberedLogin.ts`): **mantidos**.
- Prefixo de QR `GIPE-SAIDA:` em `qr.ts`: **mantido e aceito**; adicionar `MUREL-SAIDA:` como alternativa aceita (regex `^(GIPE|MUREL)-SAIDA:`). Tickets impressos/fotografados antes da troca continuam válidos.
- `package.json` `name` (`gipe-front`) e repositório: mantidos.
- Backend e tokens de ticket: sem mudança.

## Decisões técnicas e trade-offs
- **Dois temas em vez de quatro.** A diferença entre público e logado era visual (azul/coral vs. sinalização). Com uma marca única, manter quatro temas dobraria o custo de cada token novo. Custo: toda tela logada muda de aparência de uma vez; compensado por tokens com os mesmos nomes (compila sem mexer em cada componente) e por revisão visual por tela.
- **`accent` separado de `primary`.** O amarelo não serve de texto no claro. Alternativa descartada: escurecer o amarelo no claro, que perderia a identidade e o contraste com o asfalto.
- **Capacidade por `ResizeObserver` em JS, não CSS puro.** A lista de excedentes precisa existir como dados para o painel. CSS puro exigiria renderizar a lista duas vezes e esconder por container query, o que duplica foco e leitura por leitor de tela.
- **Mínimo de 64px por slot, constante no hook.** Evita configuração e cumpre o alvo de toque de 44px com rótulo.
- **Marca do PDF em vetor.** Evita imagem embutida e fonte extra no PDF de bobina, e mantém o arquivo pequeno e a impressão térmica nítida.
- **Logo em SVG inline.** Some a troca de arquivos por tema e os dois PNG; o custo é markup repetido, reduzido pelo `MurelSymbol`.
- **Não renomear cookie, IndexedDB nem prefixo de QR.** Renomear exigiria migração e deslogaria usuários sem benefício visível.
- **Sem camada de compatibilidade para os quatro temas.** Os nomes de token são mantidos, mas os valores mudam de uma vez, sem flag.

## Riscos / pontos de atenção
- **Escopo visual grande:** ~60 arquivos usam `primary`. Muitos usam como cor de texto, ícone ou borda; precisam ir para `accent`. Varredura obrigatória por `colors.primary` e revisão tela a tela nos dois temas. Amarelo como texto sobre fundo claro é defeito.
- **Contraste:** os valores do tema claro são propostas. Validar AA (texto ≥ 4,5:1, controles ≥ 3:1) em `text`/`textMuted`/`accent`/`danger`/`success` contra `background` e `surface`, antes de dar o tema por pronto.
- **Primeiro pintar:** `ThemeModeProvider` inicia em "light" e troca no efeito. Com `globals.css` seguindo só o tema, quem usa o escuro vê um relampejo claro; mitigar com um script curto inline no `<head>` que aplica `data-theme` antes do pintar, ou aceitar o comportamento atual e registrar. Decidir na task do tema.
- **Hidratação da barra:** `useBarCapacity` começa em `null`; a primeira renderização não pode depender de `window`. Cobrir em teste.
- **Redimensionamento:** `ResizeObserver` pode disparar em laço se a barra mudar a própria largura. Medir o contêiner externo (largura fixa pela janela e `contentMaxWidth`), não o conteúdo.
- **Foco ao fechar o painel:** hoje o foco volta ao botão Menu. Se "Mais" some depois de redimensionar com o painel aberto, o foco deve ir ao primeiro item da barra.
- **Playwright/QA:** testes E2E que procuram o botão "Menu" ou o pórtico quebram; atualizar seletores (`Mais`, `Navegação principal`).
- **Fontes externas:** `next/font/google` baixa em build; sem rede no build o `next build` falha. Fallback de sistema garantido no tema.
- **Service worker:** versão antiga em cache pode servir a página offline antiga; o novo `CACHE_NAME` mitiga.
- **Changelog:** `src/generated/changelog.json` guarda texto histórico com "GIPE"; não reescrever. Registrar a mudança no histórico de atualizações do projeto como nas outras features.

## Plano de testes
- `src/lib/nav.test.ts`: `dividirItensDaBarra` (cabe tudo; capacidade 1, 2, 3, 5, 11; mínimo 3; ordem de prioridade; perfis com menos itens), `isMaisAtivo`, `navItemsPorPrioridade`. Remover os casos de `BOTTOM_NAV_ITEMS` e do teste de `bottomNavHeight` se mudar.
- `BottomBar.test.tsx` / `BottomNav.test.tsx`: com `useBarCapacity` mockado; barra completa sem "Mais"; com "Mais" e painel só com excedentes; item ativo oculto destaca "Mais"; Esc, fora e fechar; `aria-current`; ação Entrada/Saída abre o modal após fechar o painel.
- `useBarCapacity.test.tsx`: `ResizeObserver` simulado; `null` inicial; arredondamento; atualização.
- `AppShell.test.tsx`: sem pórtico; barra presente.
- `Logo.test.tsx`: variantes, rótulo "Murel", ids de máscara únicos.
- `ThemeModeContext`: migração da chave antiga; testes que referenciam `signage*` ou `gipe-theme-mode` atualizados.
- `qr.test.ts`: `GIPE-SAIDA:` e `MUREL-SAIDA:` aceitos; mensagem nova.
- `reciboPdf.test.ts` e testes de `recibo/[token]` com o título "Recibo de saída — Murel".
- Manual / `executar-qa`: dois temas, larguras 320, 375, 480, 768, 1024, 1440 e giro do aparelho; contraste; foco por teclado; instalação do PWA; recibo PDF.
- Final: `npm run lint` e `npm run build`.

## Fora de escopo técnico
- Site, redes sociais, sinalização do pátio e papelaria do guia.
- Tema único escuro e remoção do alternador.
- Renomear cookie, banco local, chaves de armazenamento (exceto o tema, com migração), prefixo de QR, pacote ou repositório.
- Reescrever o histórico de atualizações.
- Fonte customizada embutida no PDF e reescrita geral dos textos para o tom de voz.
- Mudanças de permissão, rotas ou conteúdo das telas.
