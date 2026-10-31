# Design Spec: Revisão de UX e Layout do Fluxo de Adesão

Insumo de UI/UX para o Tech Spec, a partir de `prd.md`. Segue o design system em `src/styles/theme.ts` + `src/components/ui`. O sistema se chama **Murel** (marca, textos e leitores de tela); "GIPE" é só o nome interno do projeto e não aparece na interface.

Referência visual: `mockups/opcao-1.png` (fonte: `mockups/mockup.html`).

## Direção
**Composição "Credencial ao vivo"** dentro do mundo visual já estabelecido do Murel (asfalto `#0E1729`, amarelo faixa `#FFC20E`, giz `#F4F1E8`, Plus Jakarta Sans). Muda a estrutura, não a identidade.

- **Tese:** a adesão é a empresa "tirando a credencial" do Murel. Enquanto o usuário preenche, uma credencial da empresa se monta ao lado, e ele vê o resultado do esforço, em vez de um cartão de formulário genérico.
- **Modo:** Operate. Clareza e tarefa acima de expressão; a marca vive nos detalhes (listra de faixa, selos de placa, amarelo como ação).
- **Estratégia de cor:** restrita. Giz de fundo, asfalto no texto e na credencial, amarelo só como preenchimento de ação e destaque.
- **Momento memorável:** a credencial se preenchendo em tempo real, com a listra de faixa de estacionamento no topo.

## Fluxo geral
Wizard em uma única página (`/adesao`) com **4 etapas**: Empresa → Horários → Titular → Conferir.

| # | Etapa | Conteúdo |
|---|-------|----------|
| 1 | Empresa | Identificação (CNPJ, razão social, nome fantasia, tipo, telefone), endereço (CEP com busca automática), capacidade (vagas de carro e moto), meios de pagamento aceitos |
| 2 | Horários | 7 dias, com atalhos |
| 3 | Titular | Nome completo, CPF, celular, e-mail, senha e repetir senha |
| 4 | Conferir | Resumo por seção com "Editar" e envio |

Para cumprir RF1 (telas menores), a etapa 1 é dividida em **sub-blocos recolhíveis em sequência** (Identificação → Endereço → Capacidade e pagamentos). Cada bloco concluído se fecha em uma linha-resumo com "Editar" e o próximo abre sozinho; a etapa só avança com os três válidos. Assim a tela nunca exige rolagem longa, no desktop ou no celular.

## Layout

### Desktop (≥ `lg` 1024px)
- **Barra superior**: `Logo` (Murel) à esquerda; stepper horizontal à direita (etapa atual com nome; concluídas com ✓ em `success`; futuras só com número). Etapas concluídas são clicáveis para voltar.
- **Corpo em 2 colunas**: formulário à esquerda (fluido, máx. ~640px de conteúdo), **credencial** à direita (~330px, sticky em `layout.stickyTop`).
- **Rodapé de ações** fixo na base da área de conteúdo: "Voltar" (secundário) à esquerda; "Próximo: <nome da etapa>" (primário) à direita.
- Fundo `colors.background`; sem cartão envolvendo o formulário (os campos se apoiam direto no fundo, o que dá ar mais aberto que o Card atual).

### Tablet (`md` 768–1023px)
- Credencial desce para uma faixa horizontal abaixo do título da etapa (mesmo conteúdo, em linha); formulário em coluna única de largura máxima ~640px, centralizado.

### Celular (< `md`)
- **Credencial compacta fixa no topo**: nome fantasia (ou "Sua empresa" enquanto vazio) + selo `carros·motas` ; toque abre painel inferior com a credencial completa.
- Abaixo: stepper compacto (✓ — ● Nome da etapa — ○ — ○) e "Etapa X de 4".
- Campos em coluna única, `inputMode`/teclado correto por campo, alvos de toque ≥ 44px.
- **Barra de ações fixa no rodapé** (Voltar + Próximo lado a lado, respeitando a área segura do aparelho). O conteúdo ganha folga inferior para nunca ficar sob a barra.
- Sem rolagem horizontal em 320px.

## A credencial (componente novo)
Cartão em asfalto (`colors.text` como fundo no tema claro; `colors.surface` no escuro, mantendo contraste) com:
- **Listra de faixa** no topo (listras diagonais amarelo/asfalto), assinatura visual do Murel.
- Campos: Empresa (nome fantasia), CNPJ, Tipo, selos de placa "N CARROS" / "N MOTOS" (contorno amarelo), Funcionamento (7 mini-caixas S T Q Q S S D; abertas em amarelo, fechadas apagadas, 24h com marca), e linha "Pagamentos: Pix · Dinheiro…".
- **Estados**: campo ainda vazio aparece como traço apagado ("—"), nunca como texto de placeholder falso; ao preencher, o valor entra com transição curta (fade/translate 150ms). Com `prefers-reduced-motion`, sem transição.
- É puramente informativa: `aria-hidden` não, mas região rotulada ("Resumo da credencial") com `aria-live` desligado, para não poluir leitores de tela a cada tecla.
- Na etapa 4 ela fica completa e vira o resumo visual; o resumo textual por seção continua abaixo para conferência.

## Telas/estados

### Etapa 1 — Empresa
- **Padrão**: sub-bloco aberto com título e uma frase de ajuda; os demais fechados (pendentes) ou resumidos (concluídos, com ✓ e "Editar").
- **CEP**: `loading` ("Buscando endereço…"), `found` (preenche logradouro, bairro, cidade, estado; foca "Número"), `not_found`/`error` (mensagem e preenchimento manual).
- **Meios de pagamento**: linhas com ícone e `Switch`, como hoje; erro de "pelo menos um meio" em `role="alert"`.
- **Erro ao avançar**: todos os blocos com problema abrem, erros junto dos campos, foco no primeiro inválido; um aviso curto no topo do formulário diz "Faltam N campos".

### Etapa 2 — Horários
- **Atalhos** em chips acima da lista: "Seg–Sex 08–18" (padrão destacado), "Todos os dias", "24 horas", "Copiar segunda para os outros dias". Aplicar um atalho preenche a lista e permite ajuste fino.
- **Lista de 7 dias**: nome do dia, `Switch` aberto/fechado, abertura, fechamento. "24 horas" vira opção por dia dentro da linha (chip pequeno), não um segundo switch.
- **Fechado / 24h**: horários ficam desabilitados e visualmente apagados, sem exigir valor.
- **Erro**: mensagem na própria linha do dia ("Fechamento deve ser depois da abertura").
- **Celular**: cada dia vira cartão de duas linhas (nome + switch; horários abaixo lado a lado), sem controles espremidos.

### Etapa 3 — Titular
- Campos como hoje, em ordem: nome completo, CPF, celular, e-mail, senha, repetir senha.
- `PasswordRequirements` aparece junto da senha, atualizando ao digitar; botão para mostrar/ocultar senha.
- Texto de apoio: "Este será o usuário administrador da conta."
- **Erro**: senhas diferentes mostram erro no campo "Repetir senha".

### Etapa 4 — Conferir
- Resumo em seções (Empresa, Endereço e capacidade, Pagamentos, Horários, Titular), cada uma com botão "Editar" que leva à etapa/sub-bloco correspondente sem perder dados.
- A senha nunca é exibida (mostrar "••••••••").
- Ação principal: "Criar conta" (primário).
- **Loading**: botão com "Criando conta…", todos os controles desabilitados, sem envio duplicado.
- **Erro do backend**: `ErrorBanner` no topo da etapa com a mensagem. Quando o erro é atribuível a um dado de etapa anterior (CNPJ, CPF ou e-mail já cadastrado), a mensagem inclui link "Corrigir CNPJ" que leva ao campo, mantendo todo o preenchimento.
- **Sucesso**: redireciona ao login com o aviso de cadastro concluído (`Toast`, como hoje).

## Componentes

### Reaproveitados de `src/components/ui`
`Logo` (marca Murel), `Button`, `Input`, `Select`, `Switch`, `ErrorBanner`, `Toast`, `Text`, `PasswordRequirements`, `Accordion` (base dos sub-blocos recolhíveis, se atender; senão estender), `Skeleton` não necessário.

### A criar/evoluir (em `src/components/ui`, reutilizáveis)
- `Stepper`: evoluir para versão com etapas clicáveis (concluídas), nome só da etapa atual e variante compacta para celular.
- `CredencialEmpresa`: cartão descrito acima, com variantes `completa`, `compacta` (faixa/topo do celular) e `lateral`.
- `StripeBar`: listra de faixa decorativa reutilizável.
- `ChipAtalho` (ou variante de `Button` `size="sm"`): chip de atalho de horário com estado ativo.
- `ActionBar`: barra de ações com versão fixa no rodapé para celular, respeitando área segura.

## Tokens usados
- **Cores**: `background`, `surface`, `text`, `textMuted`, `primary`/`onPrimary` (ações e destaques), `accent` (texto/linha de destaque), `success` (etapas concluídas, campo válido), `danger`/`dangerSoft` (erros), `border`/`borderStrong` (divisórias e controles), `focus` (anel de foco), `surfaceMuted` (dias fechados, trilhos).
- **Espaçamento**: `space` (4/8/16/24/32/48/64); respiro de 24–32 entre blocos no desktop, 16 no celular.
- **Tipografia**: título de etapa `fontSizes.xl` com `typography.displayWeight` e `displayTracking`; ajuda `fontSizes.sm` em `textMuted`; rótulos `fontSizes.sm` semibold; apoio/erros `fontSizes.xs`.
- **Raios**: `radii.md` campos e botões, `radii.lg`/`xl` credencial e cartões de dia, `radii.full` chips.
- **Sombras**: `shadows.md` só na credencial.
- **Layout**: `layout.stickyTop`, `layout.formGridWide` (grade de 6 colunas do formulário), `breakpoints`.
- **Novos tokens (se faltarem)**: altura mínima de alvo de toque (44px) e altura da barra de ações fixa, em `layout`. Nada hardcoded.

## Movimento
- Troca de etapa: deslizamento curto lateral + fade (200–250ms, ease-out); foco vai ao título da nova etapa (mantém o comportamento atual de acessibilidade).
- Recolher/abrir sub-blocos: altura animada ~200ms.
- Credencial: entrada de valor com fade; listra estática.
- `prefers-reduced-motion`: sem deslizamento nem animação de altura; trocas instantâneas.

## Responsividade (resumo)
| Faixa | Credencial | Ações | Formulário |
|-------|-----------|-------|------------|
| < 768px | Faixa compacta fixa no topo (toque abre completa) | Barra fixa no rodapé | 1 coluna |
| 768–1023px | Faixa horizontal sob o título | Rodapé do conteúdo | 1 coluna centralizada |
| ≥ 1024px | Coluna lateral sticky | Rodapé do conteúdo | Grade de 6 colunas quando larga (`formGridWide`) |

## Acessibilidade
- Stepper com `aria-label` e `aria-current="step"`; etapas clicáveis são botões com nome ("Voltar para Empresa").
- Foco gerenciado na troca de etapa e no primeiro campo inválido; erros por campo ligados via `aria-describedby`; avisos gerais com `role="alert"`.
- Estado de switch, dia fechado, campo válido e etapa concluída nunca só por cor (ícone/texto junto).
- Contraste AA nos dois temas; credencial mantém contraste do texto sobre o fundo escuro/claro.
- Tudo operável por teclado; atalhos de horário são botões com `aria-pressed` quando ativos.

## Fora desta spec
Contrato de envio ao backend, salvamento de rascunho e consulta externa de CNPJ (ver PRD).
