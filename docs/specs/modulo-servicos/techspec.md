# Tech Spec: Módulo de Serviços

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e registra os ajustes que a API impôs)
- API: swagger do back-end, tag `Servico` (10 endpoints, todos sob `/api/v1`). A `baseURL` do cliente `api` já inclui `/api/v1`.

## O que a API revelou (muda o PRD e o design)
Lido no swagger e conferido com chamadas de leitura ao ambiente de desenvolvimento. Nada foi gravado.

1. **Serviços só funcionam com a empresa configurada para isso.** `POST patio/{id}/servico` exige `servicos: true` em `PUT /Configuracao`. Hoje `GET /Configuracao` devolve `servicos: false` para a empresa de teste. Sem o interruptor, não há como acrescentar serviços; o módulo precisa dele (ver "Configuração").
2. **O `PUT /Configuracao` do front apaga campos.** `toConfiguracaoPayload` envia só `modelo`, `cor` e `prisma`. O back diz que `servicos` não enviado vale `false` e `entradaDiretoCamera` não enviado vale `true`. Cada salvamento da tela de Configurações já está reiniciando esses dois campos. Corrigir faz parte deste trabalho, antes de qualquer outra coisa.
3. **A cobrança já é do back.** `valorServicos` (soma dos não cancelados) é cobrado na saída junto com a permanência; `tempoPermitidoMinutos` e `livreAte` abatem a permanência. O PRD deixou "cobrança" fora de escopo e continua assim para **telas de saída, caixa e nota fiscal**, mas a tela do veículo precisa **mostrar** esses três valores, senão o operador não entende o total que verá na saída.
4. **Cancelar só vale para serviço Aguardando.** Em execução e Pronto não cancelam. O design colocava "Cancelar" em todos os cartões; passa a existir só no cartão Aguardando.
5. **Quem pode o quê.** Existe um perfil **Lavador (9)** que o front não conhece (`PERFIL_USUARIO` vai até 8). Lista e fila: Administrador, Gerente, Caixa, Manobrista, Lavador. Trocar status: os mesmos. Acrescentar e cancelar: sem o Lavador. Cadastrar, editar e inativar: só Administrador e Gerente.
6. **Preços.** `precos` exige ao menos um preço e um por categoria (1 a 6 ou 99 = Todas). A categoria 99 vale para as que não têm preço próprio, então preço específico e preço "Todas" podem coexistir. O design propunha uma chave "mesmo valor para todas", que não cobre isso (ajuste abaixo). Nome é obrigatório e único entre os ativos. `tempoPermitidoMinutos` 0 é gravado como `null` ("sem tempo permitido").
7. **Acrescentar a um veículo** exige serviço ativo, com preço para a categoria do veículo (ou 99), e ainda não presente nele (cancelado pode voltar). Nome, valor e tempo são **copiados** do serviço na hora: mudar o catálogo depois não altera veículos que já têm o serviço.
8. **Os schemas de resposta não estão no swagger**, e as listas vieram vazias no ambiente de teste. Os campos de resposta abaixo vêm da descrição dos endpoints e precisam ser confirmados com dado real (ver "Riscos").

## Design
- **Telas/estados:** Catálogo (lista e detalhe), formulário de serviço, Fila (abas no celular, colunas no desktop), cancelamento, serviços do veículo dentro do Pátio, aviso de "serviços desligados". Detalhe em `design.md`.
- **Ajustes ao design, fechados aqui:**
  - *Cancelar* só no cartão **Aguardando** (Fila e veículo).
  - *Preços do formulário:* no lugar da chave "mesmo valor para todas", um campo **"Todas as categorias"** (categoria 99) e, abaixo, uma seção "Preços específicos por categoria" com as seis categorias, todas opcionais. Pelo menos um dos sete campos é obrigatório.
  - *Resumo do veículo:* a seção Serviços mostra "Serviços: R$ X", "Tempo permitido: N min" e "Permanência livre até HH:MM" quando existirem (vindos do back).
  - *Serviços desligados:* o módulo abre normalmente, mas um `ErrorBanner` informativo explica que os serviços estão desligados e, para quem pode, leva a Configurações. "Acrescentar serviços" fica oculto.
  - *Pronto → voltar:* mantido; a API aceita 1, 2 e 3 em qualquer direção. Em execução → Aguardando não é oferecido na interface (a API aceitaria).
- **Componentes do design system reaproveitados:** `Button`, `Input`, `Textarea`, `NumberStepper`, `Select`, `Switch`, `Checkbox`, `Combobox`, `Tabs`, `Modal`, `BottomSheet`, `ConfirmDialog`, `StatusBadge`, `PlateDisplay`, `Pagination` (não usada: a lista não é paginada), `Skeleton`, `ErrorBanner`, `Toast`, `Text`.
- **Componentes novos:** todos de feature, em `src/components/servicos/`. Nenhum vai para `ui`. Se `PlateDisplay` não tiver tamanho compacto, a variante `size` entra em `ui` (confirmar na tarefa do cartão).
- **Tokens:** nenhum novo. Os de `design.md`.

## Arquitetura da solução

### Fluxo de dados
```
GET/POST/PUT/DELETE /Servico ........ services/servico.ts (+ servico.mapper.ts) ─► useServicos / useServicoMutations
GET /Servico/fila ................... services/servico.ts ─► useFilaServicos (polling)
GET/POST/PUT /patio/{id}/servico .... services/servico.ts ─► useServicosDoVeiculo / mutations
GET/PUT /Configuracao ............... services/configuracao.ts (estendido) ─► useConfiguracao (já existe)
```
Todas as telas são Client Components (TanStack Query, `useSearchParams`, interação). A página da rota é Server Component com `Suspense`, como `conferencia-patio/page.tsx`. Nada usa API específica do Next além do que as outras rotas já usam; antes de escrever a rota, conferir em `node_modules/next/dist/docs/` as convenções de `page.tsx` e `Suspense` desta versão (AGENTS.md avisa que mudaram).

### Tipos (`src/types/servico.ts`, novo)
```ts
export const STATUS_SERVICO = { Aguardando: 1, EmExecucao: 2, Pronto: 3, Cancelado: 4 } as const;
export type StatusServico = (typeof STATUS_SERVICO)[keyof typeof STATUS_SERVICO];

// 1 a 6 são categorias de veículo; 99 vale para as categorias sem preço próprio.
export const CATEGORIA_TODAS = 99;

export interface PrecoServico { categoria: number; descricao: string; valorCentavos: number }

export interface Servico {
  id: number;
  nome: string;
  descricao: string | null;
  duracaoMinutos: number | null;
  tempoPermitidoMinutos: number | null; // null = sem tempo permitido (o back grava 0 como null)
  ativo: boolean;
  precos: PrecoServico[];
}

export interface ServicoPayload {
  nome: string;
  descricao: string | null;
  duracaoMinutos: number | null;
  tempoPermitidoMinutos: number | null;
  precos: { categoria: number; valor: number }[]; // valor em reais, como o back espera
}

export interface ServicoDoVeiculo {
  id: number; // patioServicoId
  servicoId: number;
  nome: string;
  valorCentavos: number;
  tempoPermitidoMinutos: number | null;
  status: StatusServico;
  motivoCancelamento: string | null;
  datas: { inicio?: string; fim?: string; cancelamento?: string };
}

export interface ServicosDoVeiculo {
  valorServicosCentavos: number;
  tempoPermitidoMinutos: number | null;
  livreAte: string | null;
  servicos: ServicoDoVeiculo[];
}

export interface ItemFila {
  patioServicoId: number;
  idPatio: number;
  nomeServico: string;
  status: StatusServico;
  placa: string;
  modelo: string | null;
  cor: string | null;
  categoria: string | null;
  prisma: string | null;
  entradaEm: string;
}
```
Perfil: `PERFIL_USUARIO` ganha `Lavador: 9` (`src/types/usuario.ts`).

### Serviços HTTP (`src/lib/api/services/servico.ts` e `servico.mapper.ts`, novos)
Segue `quadroChaves.ts`/`conferenciaPatio.ts`: recebem `unknown`, passam pelo mapper, nunca confiam no formato.
- `listServicos(ativo?: boolean)`: `GET /Servico` com `params: { ativo }` só quando definido.
- `getServico(id)`: `GET /Servico/{id}`.
- `criarServico(payload)`, `atualizarServico(id, payload)`, `inativarServico(id)` (aceita 200 e 204).
- `listFila(status?: StatusServico)`: `GET /Servico/fila`.
- `listServicosDoVeiculo(idPatio, { incluirCancelados })`, `acrescentarServicos(idPatio, servicoIds)`, `atualizarStatusServico(idPatio, patioServicoId, status)`, `cancelarServico(idPatio, patioServicoId, motivo)`. As duas últimas devolvem o veículo (acrescentar e cancelar) ou o serviço (status), então as mutações **invalidam** a lista do veículo em vez de depender do corpo.
- Mapper: `valor` em reais vira centavos com `Math.round(valor * 100)`, como em `plano.mapper.ts`; item inválido é descartado, não derruba a lista; lê `servicoId ?? id` e nomes de campo alternativos enquanto os nomes reais não são confirmados. Reutiliza `mapperUtils.ts`.
- Erros: 400 sobe como `ApiError` de validação com a mensagem do back (nome duplicado, "só serviço Aguardando", categoria sem preço); 401 e 403 seguem o tratamento global do cliente.

### Validação do formulário (`src/lib/schemas/servico.ts`, novo)
zod, no padrão dos outros schemas. Nome obrigatório e aparado; `descricao` opcional; durações inteiras ≥ 0; ao menos um preço > 0 entre "Todas" e as seis categorias; valores com no máximo duas casas. Função pura `toServicoPayload(values)` monta `precos` (descarta campos vazios) e converte 0 de tempo permitido em `null`. A unicidade do nome é regra do back e chega como erro 400 no campo.

### Chaves de consulta (`src/components/servicos/servicosKeys.ts`, novo)
```ts
export const SERVICOS_KEY = ["servicos"] as const;
export const servicosListaKey = (ativo?: boolean) => [...SERVICOS_KEY, "lista", ativo ?? "todos"] as const;
export const servicoKey = (id: number) => [...SERVICOS_KEY, "detalhe", id] as const;
export const filaServicosKey = (status?: number) => [...SERVICOS_KEY, "fila", status ?? "todos"] as const;
export const servicosDoVeiculoKey = (idPatio: number, canc: boolean) => ["patio", "servicos", idPatio, canc] as const;
```
A chave do veículo começa por `PATIO_QUERY_KEY`, porque acrescentar, cancelar e trocar status mudam o valor da saída: elas invalidam também o pátio e o comprovante.

### Hooks (`src/components/servicos/`, novos)
- `useServicos(ativo)`: `staleTime` curto (1 min). A busca por nome e o filtro Ativos/Inativos/Todos: o filtro vai ao back (`ativo`), a busca é local.
- `useServicoMutations()`: criar, atualizar, inativar; invalidam `SERVICOS_LISTA_KEY`. O `Toast` fica com a tela (`useToast` é estado local do componente, como nos outros módulos), não com o hook.
- `useFilaServicos(status?)`: `refetchInterval: 15_000`, `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true`, `placeholderData` para manter os cartões ao recarregar.
- `useAtualizarStatusServico()`: **atualização otimista** com `onMutate` na chave da fila (move o cartão de status), `onError` desfaz e mostra `Toast`, `onSettled` invalida. "Desfazer" do `Toast` reenvia o status anterior.
- `useServicosDoVeiculo(idPatio, incluirCancelados)`, `useAcrescentarServicos`, `useCancelarServico`.
- `useServicosHabilitados()`: lê `useConfiguracao()` e devolve `configuracao.servicos`.

### Configuração (`src/types/configuracao.ts`, `configuracao.mapper.ts`, `ConfiguracaoEntradaForm`)
- `ConfiguracaoValues` ganha `servicos: boolean` e `entradaDiretoCamera: boolean`. `CONFIGURACAO_PADRAO`: `servicos: false`, `entradaDiretoCamera: true` (padrões do back).
- `fromConfiguracaoResponse` lê os dois campos; `toConfiguracaoPayload` **envia todos os cinco**. Isso corrige o reinício silencioso descrito acima e vale mesmo para quem não usa serviços.
- `ConfiguracaoEntradaForm` ganha um `Switch` "Serviços (lava-rápido)" com texto de apoio. `entradaDiretoCamera` não ganha controle aqui (está fora do escopo): só é preservado.
- Os testes existentes de `configuracao.mapper`, `configuracao` e `ConfiguracaoEntradaForm` mudam para o novo contrato.

### Permissões e menu
- `src/lib/permissoes.ts`: novas áreas e regra padrão.
  - `AREA.Servicos` (ver catálogo e fila, trocar status): Administrador, Gerente, Caixa, Manobrista, Lavador.
  - `AREA.ServicosCatalogo` (cadastrar, editar, inativar): Administrador, Gerente.
  - `AREA.ServicosPatio` (acrescentar e cancelar): Administrador, Gerente, Caixa, Manobrista.
  - `AREA_POR_ROTA`: `["/servicos", AREA.Servicos]`.
  - Lavador entra em `TODOS`; como `SEM_CONVENIADA` é derivada de `TODOS`, o Lavador passaria a ter `Inicio` (Visão Geral). Decisão: **mantém**, para o login não cair em acesso negado; revisar se o back negar o dashboard ao Lavador.
- `src/lib/nav.ts`: item "Serviços" (`shortLabel` "Serviços", `href: "/servicos"`, `grupo: "operacao"`, `area: AREA.Servicos`), depois de "Conferência de pátio". Novo `NavIconId` (`"services"`) e o ícone no mesmo lugar dos demais.
- `PERFIS_ESTACIONAMENTO` **não** ganha o Lavador neste trabalho: isso abriria cadastro de usuário Lavador na Gestão de Usuários, que é outra feature. Consequência: o Lavador existe para o login e as permissões, mas o formulário de usuário só o oferecerá quando essa feature for feita. Registrado como pendência.
- Permissão por módulo (override vindo de `GET /Permissao`): as três áreas novas dependem de o back cadastrar os módulos correspondentes. `GET /Permissao` devolveu lista vazia para o usuário de teste, então o override não é verificável agora; o padrão acima é o que vale.

### Rotas e componentes (paths reais)
```
src/app/(app)/servicos/page.tsx                  Server Component + Suspense
src/components/servicos/
  ServicosPage/                                  Client. Abas Fila | Catálogo (?aba=), padrão por perfil (Lavador: Fila)
  ServicosMasterDetail/                          Duas colunas; tela cheia no celular
  ServicoListItem/  ServicoDetalhe/  PrecosPorCategoria/
  ServicoFormModal/                              Modal (desktop) ou BottomSheet (celular), TanStack Form + zod
  FilaServicos/  FilaCard/                       Abas por status no celular, colunas no desktop
  CancelarServicoDialog/
  ServicosDoVeiculo/  AcrescentarServicosModal/  Seção no detalhe do veículo
  ServicosDesligados/                            Aviso quando `servicos` está desligado
  servicosKeys.ts  format.ts  status.ts          Chaves; formatadores (R$, minutos); rótulo e tom de cada status
  use*.ts                                        Hooks acima
```
- **Pátio:** `ServicosDoVeiculo` é montado no detalhe do veículo (`src/app/(app)/patio/[patioId]`) e só renderiza com serviços habilitados. É o único ponto de contato com código existente além de menu, permissões e configuração.
- `/servicos` e o botão Voltar: aba e seleção ficam no endereço (`?aba=`, `?servico=`, `?status=`), validadas por funções puras como `lerPlanoDaUrl`.
- Server vs Client: só `page.tsx` é Server; todo o resto é `"use client"`.

### Testes (vitest + Testing Library, no padrão do repositório)
- Mappers e serviços: payload de criação (centavos ↔ reais, 0 ↔ `null`), item inválido descartado, 204 na inativação.
- Schema e `toServicoPayload`: sem preço, preço zero, tempo 0, só "Todas".
- Permissões: tabela por perfil das três áreas (inclui Lavador) e `areaDaRota("/servicos")`; `nav.test.ts` com o item novo.
- Configuração: mapper envia os cinco campos; formulário salva sem zerar `entradaDiretoCamera`.
- Hooks: atualização otimista com falha e desfazer; polling não roda em segundo plano.
- Componentes: formulário (validação e erro 400 do back no campo), Fila (agrupamento, ação por status, Cancelar só em Aguardando), serviços do veículo (serviço sem preço da categoria desabilitado), estados de carregando, vazio e erro.

## Decisões e trade-offs
- **Uma rota com duas abas, não duas rotas.** A fila e o catálogo compartilham permissão, menu e cabeçalho. Uma rota mantém o item de menu único e o botão Voltar simples. Custo: o Lavador carrega código do catálogo; aceitável (o código é pequeno) e evita duplicar a casca.
- **Polling em vez de tempo real.** O back não tem canal de eventos para a fila. 15 s com refetch ao voltar o foco basta para um pátio; a atualização otimista cobre a ação do próprio usuário. WebSocket só se o back oferecer.
- **Atualização otimista só no status.** É a ação mais frequente do lavador e é reversível. Criar, editar, inativar, acrescentar e cancelar esperam a resposta: têm validação do back que pode recusar.
- **Busca do catálogo local.** A API devolve a lista completa e não tem busca; o volume é de dezenas de serviços por empresa.
- **Sem abstração compartilhada de lista e detalhe.** `PrecosCockpit` já resolve o mesmo padrão, mas extrair agora acoplaria duas features por uma terceira cópia. Copiar o desenho, não o código; extrair só se aparecer um terceiro uso.
- **Corrigir a Configuração aqui.** O defeito de reiniciar `servicos` e `entradaDiretoCamera` é independente da feature, mas ligar serviços depende dele e a correção é pequena. Vai em commit separado (`fix(configuracoes)`).
- **Valores em centavos no front**, reais no payload: igual a `plano.mapper.ts` e `money.ts`, sem ponto flutuante na exibição.

## Riscos / pontos de atenção
- **Formato das respostas não confirmado (T5 sem dado real).** Em 2026-11-12 as listas do ambiente de teste estavam vazias e não houve autorização para gravar dados; o mapper (`servico.mapper.ts`) ficou tolerante: aceita `servicoId`/`id`, `nomeServico`/`servico`/`nome`, `idPatio`/`patioId` e a fila em lista única ou agrupada por status. Confirmar com a primeira resposta real e apertar o mapper.
- **Formato das respostas (descrição original).** Sem schema no swagger e sem dados no ambiente, nomes de campos (`servicoId`/`id`, `nomeServico`, `placa` na fila) são suposição. Mitigação: mapper tolerante, fixtures só a partir da descrição, e a primeira tarefa valida contra uma resposta real (criar um serviço de teste pela própria tela, com autorização do dono do ambiente, ou obter um exemplo do back). Não gravar dados no ambiente sem isso.
- **Reinício silencioso da Configuração** (item 2): enquanto não for corrigido, salvar a tela de Configurações desliga serviços e liga a câmera direta. Prioridade máxima.
- **Perfil Lavador** inexistente no front: testes que enumeram `PERFIL_USUARIO` ou os perfis permitidos podem quebrar; checar `usuario.mapper`, `permissoes.test` e telas de perfil.
- **Módulos de permissão** das três áreas novas dependem do back; sem eles a permissão por módulo não terá efeito sobre o menu.
- **Saída com serviço ainda aberto:** o PRD não define o que acontece se o veículo sai com serviço Aguardando ou Em execução. O back cobra os não cancelados; a interface não bloqueia. Pergunta em aberto para o dono do produto.
- **Preço copiado na hora:** mudar o preço do catálogo não altera veículos existentes. Mostrar um aviso curto no formulário de edição ("não altera serviços já acrescentados a veículos").
- **Segurança:** o token de acesso que estava em `docs/specs/input.md` não deve ser commitado nem copiado para fixtures, testes ou documentação. `input.md` está modificado e não commitado: deixar fora de qualquer commit.
- **Celular no pátio:** rede instável. Falha de rede no status desfaz a atualização otimista e mostra `Toast`; não há fila offline.

## Fora de escopo técnico
- Tela de saída, caixa e nota fiscal: só exibem o que o back já calcula; nenhuma mudança neles.
- Acrescentar serviços durante a **entrada** do veículo (`servicoIds` em `POST patio/entrada`): a API suporta, mas o fluxo de entrada é outra feature.
- Cadastro de usuário com perfil Lavador na Gestão de Usuários.
- Controle de `entradaDiretoCamera` na tela de Configurações (apenas preservado).
- Relatórios, produtividade por lavador, agendamento, notificações e tempo real.
- Modo offline e fila de ações pendentes.
