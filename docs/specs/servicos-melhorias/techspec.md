# Tech Spec: Melhorias na Tela de Serviços

## Referências
- PRD: ./prd.md
- Design: ./design.md (esta spec referencia, não redefine). Contexto: `docs/specs/modulo-servicos/` (PRD, design, techspec do módulo) continua valendo no que aqui não muda.
- Protótipos: `Murel Serviços.html`, `Murel Serviços Mobile.html`, `Murel Fila de Serviços.html` (fora do repo; `docs/specs/input.md`).

## Ponto de partida (o que já existe)

O módulo está implementado em `src/components/servicos/`. Antes de escrever tasks, vale separar o que **já é verdade** do que é **delta**:

| Pedido do PRD | Situação no código |
|---|---|
| RF13 colunas/abas por status, contagem | **Existe** (`FilaServicos`, `Tabs segmentada`, `?status=`). Falta `ResumoDaFila`. |
| RF17/RF18 ação principal, voltar, desfazer | **Existe** (`acaoDeStatus`, `Desfazer` com 6 s, atualização otimista em `useAtualizarStatusServico`). Muda só a apresentação. |
| RF20 cancelar com motivo, só Na fila, só quem tem `AREA.ServicosPatio` | **Existe** (`CancelarServicoDialog`, `podeCancelar`). Faltam motivos rápidos e o texto de efeito. |
| RF21 atualização automática | **Existe** (`INTERVALO_FILA_MS` = 15 s, ao voltar o foco, não em segundo plano). Mantém 15 s (o design citava 30 s; 15 s já foi decidido e é mais fresco para o lavador). |
| RF2 busca na lista | **Existe**, só por nome (`filtrarServicos`). Estender à descrição. |
| RF19 busca da fila por placa/prisma | **Não existe.** |
| RF14–RF16 cartão com prisma, "+N no carro", tempo por status, atraso | **Parcial**: placa, veículo, prisma e "entrou HH:MM" existem; o resto não. |
| RF1, RF3, RF4 lista com faixa de preço, resumo, vazio orientado | **Não existe** (item só mostra nome, duração, situação). |
| RF5–RF12 cadastro com modelos, repetir, prévia, validação, passos no celular | **Não existe** (formulário único em `Modal`, valor por categoria sem tempos). |
| RF6 duração e tempo grátis **por categoria** | **Não existe e depende do back** (ver Dependências). |

O trabalho é, portanto: **(A)** reapresentar lista, cadastro e fila com os dados que já chegam; **(B)** habilitar o que depende de campos novos do back, com o mesmo código já preparado para a ausência deles.

## Dependências de back (decisão que bloqueia a Fase B)

O swagger não descreve o corpo das respostas (`servico.mapper.ts` já aceita aliases). Os protótipos trazem o formato esperado, usado como proposta de contrato. **A confirmar com o back antes de implementar a Fase B:**

1. **Catálogo, por categoria** (`GET/POST/PUT /Servico`): cada item de `precos` ganha `duracaoMinutos` e `tempoPermitidoMinutos` (opcionais). Hoje eles são do serviço inteiro.
2. **Fila** (`GET /Servico/fila`): cada item ganha `dataCriacao` (entrou na fila), `dataHoraInicio`, `dataHoraPronto`, `duracaoMinutos` (a da categoria do veículo). Nomes do protótipo; o mapper aceita também `criadoEm`/`adicionadoEm`, `inicioEm`, `prontoEm` por segurança.
3. **Corpo do PUT de status** não muda (`{ status }`); o back grava início e pronto.

**Sem a confirmação:** nada quebra. Cada elemento que depende de um campo ausente é omitido (regra do design: nunca estimar no cliente). Se o back recusar (1), o cadastro mantém os dois campos globais do serviço (`duracaoMinutos`, `tempoPermitidoMinutos`) e a grade de categorias mostra só valor; a prévia e o comprovante usam o valor global.

## Design
- **Telas/estados**: ver `design.md` (Catálogo, Cadastro em página única e em 3 passos, Fila). Estados carregando, vazio, sem resultado, erro e sem permissão já descritos lá.
- **Componentes do design system reaproveitados**: `Modal`, `BottomSheet`, `Button`, `Input`, `Textarea`, `Switch`, `Tabs`, `OptionGroup`, `StatusBadge`, `ProgressBar`, `PlateDisplay`, `Skeleton`, `ErrorBanner`, `Toast`, `ConfirmDialog`, `Stepper`, `ActionBar`/`DockBar`, `Checkbox`, e os campos de formulário de `@/components/form` (`useAppForm`, `TextField`, `TextareaField`).
- **Componentes novos** (todos em `src/components/servicos/`, nenhum em `ui`): `ServicoCard` (substitui `ServicoListItem`), `CategoriasAtendidas`, `ModelosDeServico`, `CategoriaLinha`, `CategoriaFolha`, `PreviaDoServico`, `ResumoDaFila`, `FilaTempo`, `MotivosRapidos`. `ServicoFormModal` ganha uma variante em passos (`ServicoFormPassos`) para o celular.
- **Tokens de tema**: nenhum novo (ver `design.md`). Tons de status continuam via `STATUS_TOM`/`StatusBadge`.

## Arquitetura da solução

Tudo abaixo é Client Component (`"use client"`): o módulo é interativo, usa React Query, `useSearchParams` e estado de formulário. As rotas `src/app/(app)/servicos/page.tsx` (fila) e `src/app/(app)/servicos/catalogo/page.tsx` (catálogo) são Server Components finos que renderizam `FilaServicosPage` e `CatalogoServicosPage` (a tela única com abas foi separada em `servicos-menu-separado`; só restam as abas de status dentro da fila, no celular). Antes de tocar em qualquer API do Next (`useSearchParams`, `useRouter`), conferir `node_modules/next/dist/docs/` (aviso do `AGENTS.md`); as peças novas não introduzem API nova do Next, só reutilizam o padrão de `FilaServicos`.

### Tipos e dados (`src/types/servico.ts`, `src/lib/api/services/servico.mapper.ts`)
- `PrecoServico` ganha `duracaoMinutos: number | null` e `tempoPermitidoMinutos: number | null`.
- `ServicoPayload.precos[]` ganha os mesmos dois campos opcionais; só são enviados quando preenchidos (`> 0` para tempo grátis; 0 vira ausente, como já ocorre com o global).
- `ItemFila` ganha `criadoEm`, `iniciadoEm`, `prontoEm` (ISO ou `null`) e `duracaoMinutos: number | null`. **Todos nulos por padrão**; o mapper (`fromItemFila`) lê os nomes do protótipo e os aliases com `primeiro(...)`. Sem teste de contrato real, os testes do mapper cobrem presença e ausência.
- Modelos de serviço: `src/components/servicos/modelos.ts` exporta `MODELOS_DE_SERVICO` (constante de front: nome, descrição, valor-base, duração-base, grátis-base e fator por categoria, como no protótipo). Função pura `aplicarModelo(modelo): ServicoFormValues`, testada à parte. Valores são **sugestões editáveis**, não preço padrão do negócio.

### Lista do catálogo (RF1–RF4)
- `catalogo.ts`: `faixaDePreco(servico)` → `{ minimoCentavos, maximoCentavos, unico }` (usa `linhasDePreco`, que já resolve "Todas"), `faixaDeDuracao(servico)`, `gratisDoServico(servico)` (texto "até 2h grátis" ou `null` = "cobra permanência"), `categoriasAtendidas(servico)` (seis booleanos). `filtrarServicos` passa a casar também a descrição (normalizada) no desktop; mobile segue por nome via parâmetro opcional `incluirDescricao`.
- `resumirCatalogo(servicos)` → `{ ativos, comTempoGratis }` para os chips (`aria-live="polite"`).
- `ServicoCard` + `CategoriasAtendidas` substituem `ServicoListItem` em `ServicosMasterDetail`. O master-detail, `?servico=` e o filtro Ativos/Inativos **não mudam**.
- Estado vazio e "sem resultado" com os textos do design; o vazio reaproveita `onNovo` já existente.

### Cadastro (RF5–RF12)
- **Formulário**: continua em `useAppForm` + zod. `ServicoFormValues` (`src/lib/schemas/servico.ts`) evolui:
  - `precos: Record<number, string>` vira `categorias: Record<number, { recebe: boolean; valor: string; duracao: string; gratis: string }>` (as seis categorias). Compatível com o preço único "Todas" apenas na **leitura** de serviços antigos: ao abrir um serviço que só tem a categoria 99, o formulário expande o valor para as seis categorias (mantendo `recebe: true`) e, ao salvar, envia as seis. **Decisão a fechar com o produto antes da task de edição** (ver Riscos): o design do protótipo não tem o campo "Todas as categorias" e o PRD original o previa.
  - Validações (zod): nome obrigatório; duplicidade de nome entre ativos checada **localmente** contra o catálogo já carregado (`useServicos`) para dar o erro junto ao campo, e continua valendo o erro do back como rede de proteção; categorias com `recebe` precisam de valor; ao menos uma categoria com valor; minutos inteiros; duração > 0 quando houver; **regra "duração coerente com tempo grátis"** do PRD (RF9) ainda **não tem definição de negócio** (ver Riscos) e fica fora até ser definida.
  - `toServicoPayload` monta `precos` apenas com as categorias `recebe`, convertendo valor com `parseMoney`; mantém os campos globais enquanto o back não confirmar o contrato por categoria (Fase A).
- **Desktop** (`ServicoFormModal`, `Modal size="lg"`): seções "Dados" e "Preço e tempos por categoria" na mesma página; `CategoriaLinha` por categoria (`Switch` + campos); botão "Repetir a 1ª linha nas vazias" chama `repetirPrimeiraLinha(values)` (função pura, devolve `{ valores, copiadas }`; Toast "Copiado de X para N categorias"); `PreviaDoServico` lê os valores do form via `useStore(form.store)` (sem estado duplicado).
- **Celular** (`ServicoFormPassos`, tela cheia em `BottomSheet`): passo local (`useState<1|2|3>`), `Stepper`, `ActionBar` fixa; `CategoriaFolha` (`BottomSheet` aninhado) edita **um rascunho local** da categoria e só grava no form em "Salvar"; opção "usar também nas N sem valor". Passo 3 reutiliza `PreviaDoServico` + seletor de categoria (`Tabs segmentada`) para o texto do comprovante. Escolha desktop vs. celular por `useIsMobile()` (padrão já usado).
- Os textos do comprovante (`textoComprovante(preco)`) ficam em `format.ts` como função pura, **idêntica** à usada pelo comprovante público real (checar `components/veiculos/ComprovantePublico`) para a prévia não divergir do que o cliente vê; se divergirem, a prévia segue o comprovante real.
- Sucesso e erro: `AVISOS` e `ErrorBanner` existentes; foco vai ao primeiro campo inválido (hook local `useFocoNoPrimeiroErro`).

### Fila (RF13–RF22)
- `src/components/servicos/fila.ts` (funções puras, com testes):
  - `tempoNaFila(item, agora)`, `decorridoEmExecucao`, `previsaoDeTermino(item)`, `progresso(item, agora)` (0–100 ou `null`), `atrasado(item, agora)` (status Em andamento **e** `iniciadoEm` **e** `duracaoMinutos` presentes **e** decorrido > duração), `minutosAtrasado`.
  - `outrosNoCarro(itens, item)` = quantos outros itens com o mesmo `idPatio` há na fila carregada (sem filtro de status). Calculado no cliente; não pede campo ao back.
  - `filtrarFila(itens, busca)`: normaliza removendo tudo que não é `A-Z0-9`, casa por `includes` na placa ou igualdade no prisma (como o protótipo).
  - `resumirFila(itens, agora)` → contagens por status e `atrasados`.
- `FilaServicos`: estado local `busca` (`useDebouncedValue` não é necessário: filtro local e barato), campo "Placa ou prisma", `ResumoDaFila`, mensagens de coluna vazia do design, "Busca sem resultado" com "Limpar busca".
- **Relógio**: hoje `FilaServicos` re-renderiza a tela **a cada segundo** (`setAgora` em `setInterval(1000)`) para o "Atualizado há N s". Os tempos novos são em minutos; separar em um hook `useAgora(intervaloMs)` e usar 1 s só no texto "Atualizado há", 30 s (alinhado ao minuto) no `FilaTempo`/`atrasado`. Evita re-render de toda a fila por segundo.
- `FilaCard` reescrito (apresentação) + `FilaTempo`; mantém `data-acao-card` (foco ao vizinho) e as props atuais, acrescentando `agora`, `outros` e `atrasado`.
- `ProgressBar` já existente é usado com `aria-label`; texto de atraso fica **em texto**, não só em cor.
- Desfazer: **comportamento atual mantido** (`Desfazer` com `PRAZO_DO_DESFAZER_MS`); migrar para `Toast` com ação só se `Toast` ganhar `action` (não faz parte desta entrega; o desfazer atual atende RF18).
- `CancelarServicoDialog`: `MotivosRapidos` (chips `aria-pressed`) preenche o `Textarea`; texto do efeito do cancelamento vem **da regra do back já descrita no protótipo** ("o serviço sai do valor e do tempo grátis do carro; sem outro serviço a permanência volta a ser cobrada desde a entrada") e deve ser **confirmada com o back** antes de ir para a tela, pois afirma uma regra de cobrança.
- Troca de aba no celular acompanhando o serviço movido: **não adotar** (o `FilaServicos` atual mantém a aba e o cartão some da coluna, com anúncio por `aria-live`); mover a aba surpreende quem está trabalhando uma coluna. Revisar com o produto se o protótipo for requisito.

## Decisões técnicas e trade-offs

- **Fase A antes de B.** Entrega valor sem o back: lista nova, cadastro com modelos/repetir/prévia/passos (com os campos globais), fila com busca, resumo, prisma, "+N", motivos rápidos, e tempo na fila usando apenas `entradaEm` do veículo se nada mais vier. A Fase B liga duração/grátis por categoria e os tempos da fila quando o contrato for confirmado. Custo: o formulário muda de forma duas vezes; mitigado por `categorias` já ter `duracao`/`gratis` desde a Fase A (a UI só os esconde enquanto `RECURSOS.duracaoPorCategoria` for falso, constante em `catalogo.ts`).
- **Nada estimado no cliente.** Tempo, previsão e atraso só aparecem com dado do back; um número inventado no pátio gera briga entre lavador e caixa.
- **Prévia derivada do form, não de estado paralelo** (`useStore(form.store)`): uma fonte de verdade.
- **Modelos como constante de front**, não API: são só atalhos de digitação; evita endpoint e permissão novos.
- **`useIsMobile` em vez de CSS duplicado** para escolher passos vs. página única: são fluxos distintos, não um reflow.
- **Não criar componente em `ui`**: os chips de duração/grátis usam `OptionGroup`; se o `OptionGroup` não suportar "outro valor" ao lado, o campo "Outro" é um `Input` ao lado dos chips (composição na feature), sem mexer no design system.
- **Desfazer permanece no componente `Desfazer` da fila**, sem refator para `Toast` com ação, por estar fora do que o PRD exige.

## Riscos / pontos de atenção

1. **Contrato do back (maior risco).** Duração/grátis por categoria e campos de tempo da fila não existem nos tipos nem no swagger. Mitigação: Fase A/B e "omitir se ausente". Exigir resposta do back antes das tasks da Fase B.
2. **Serviços antigos com preço "Todas" (99).** O protótipo não tem esse campo. Decidir: manter o campo "Todas as categorias" (compatível com o catálogo atual) **ou** expandir para as seis categorias ao editar (muda o dado salvo). Recomendação: **manter** "Todas" como atalho ("Mesmo valor para todas") e só expandir quando o usuário editar por categoria. Precisa de aprovação, pois muda o PRD original do módulo (RF2).
3. **Regra de "duração × tempo grátis" (RF9)**: o PRD cita validação sem dizer a regra. Sugestão: nenhuma restrição entre os dois (um serviço pode ter grátis menor ou maior que a duração); validar só formato. Confirmar com o produto.
4. **Texto do comprovante na prévia** pode divergir do comprovante público real; unificar a função (ver Cadastro).
5. **Texto de efeito do cancelamento** afirma regra de cobrança; confirmar com o back.
6. **Desempenho do relógio** (re-render por segundo) piora com mais elementos por cartão: tratado com `useAgora`.
7. **Valor monetário**: continuar usando `parseMoney`/`formatCentavos`; não somar valores no cliente (subtotais vêm do back, como já documentado em `resumo.ts`).
8. **Acessibilidade**: chips com `aria-pressed`, `Switch` por categoria com nome completo, foco ao primeiro erro e retorno do foco ao fechar folhas/diálogos (já garantido por `BottomSheet`/`Modal`; testar a `CategoriaFolha` aninhada ao `BottomSheet` do formulário, que usa dois `<dialog>` empilhados).
9. **Testes**: manter e atualizar `FilaServicosPage`, `CatalogoServicosPage`, `ServicosMasterDetail`, `FilaServicos`, `ServicoFormModal`, `useFilaServicos`; adicionar testes de `catalogo.ts`, `fila.ts`, `modelos.ts`, `repetirPrimeiraLinha`, mapper (campos novos presentes e ausentes) e do fluxo em 3 passos.

## Fora de escopo técnico
- Alterar regras de cobrança, saída, caixa ou nota fiscal.
- Endpoint de modelos, de busca ou de paginação (a lista continua completa e filtrada no cliente).
- Push/WebSocket para a fila (continua polling de 15 s).
- Mover o desfazer para o `Toast` com ação; reordenação manual de cartões; arrastar entre colunas.
- Alternador Desktop/Celular, troca de perfil e painéis "Para o desenvolvedor" dos protótipos.
- Migração de dados de serviços existentes (o formulário só lê o que já existe).
- Relatórios e métricas.
