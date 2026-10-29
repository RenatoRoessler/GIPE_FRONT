# Tech Spec: Carimbo de Convênio

**Status:** Rascunho
**PRD:** ./prd.md
**Design:** ./design.md

> Convenções: segue o `CLAUDE.md` e os padrões já usados em Pátio/Saída e Empresas conveniadas (tipos em `src/types`, serviços e mappers em `src/lib/api/services`, componentes em `src/components/<feature>`). O contrato do endpoint está em `docs/specs/input.md`.

## Referências
- PRD: ./prd.md
- Design: ./design.md (esta spec referencia, não redefine)

## Design
- **Telas/estados:** uma rota, `/carimbo`, com os estados do `design.md` (ocioso, abrindo/lendo, QR inválido, carimbando, sucesso, erro de negócio, câmera negada/indisponível, 403 e falha de conexão).
- **Componentes do design system reaproveitados:** `PlateDisplay`, `StatusBadge` (tom `conveniado`), `Button`, `Card`, `Text`, `ErrorBanner`, `ErroSemPermissao`.
- **Reuso de leitor:** `LeitorQrSaida` + `useLeitorQr` (`components/veiculos/LeitorQrSaida`) já cuidam de câmera, permissão, mira, vibração e da extração do token (`extrairTokenComprovante`). O carimbo usa o leitor como está, pelas props `onToken`, `onInvalido` e `buscando`. O nome tem "Saida" mas o componente não tem nada de saída; renomear/mover é refatoração à parte (ver decisões).
- **Componentes novos (feature, não vão para `ui`):** `components/carimbo/CarimboPage` e `components/carimbo/TicketCarimbado`.
- **Ícone novo do menu:** `stamp` em `NavIcons` (já há um ícone único por item, exigido por `nav.test.ts`).
- **Tokens de tema:** só os existentes (`surface`, `border`, `success`, `danger`, `warn`, `textMuted`, `focus`, `space`, `radii`, `breakpoints`, `cliente.conveniado` via `StatusBadge`). Nenhum token novo.

## Arquitetura da solução

### Estrutura de pastas

```
src/
├── app/(app)/carimbo/
│   └── page.tsx                       # Server Component: metadata + <CarimboPage />
├── components/carimbo/
│   ├── CarimboPage/
│   │   ├── CarimboPage.tsx            # Client: leitor, estados, resultado
│   │   └── index.ts
│   ├── TicketCarimbado/
│   │   ├── TicketCarimbado.tsx        # Client: resultado (placa, dados, selo, botão)
│   │   ├── TicketCarimbado.styles.ts
│   │   └── index.ts
│   ├── Carimbo.styles.ts              # Page, área do leitor, banners
│   ├── useCarimbar.ts                 # useMutation + regra de repetição do token
│   └── format.ts                      # cor, categoria, data/hora do resultado
├── lib/
│   ├── api/services/
│   │   ├── carimbo.ts                 # PUT /Convenio/carimbar
│   │   └── carimbo.mapper.ts          # DTO -> Carimbo, payload
│   ├── permissoes.ts                  # + AREA.Carimbo, padrão e rota
│   ├── nav.ts                         # + item "Carimbar ticket"
│   └── telaInicial.ts                 # perfis de conveniada abrem /carimbo
├── components/layout/NavIcons/NavIcons.tsx  # + ícone "stamp"
└── types/carimbo.ts
```

Arquivos de teste acompanham cada módulo (`*.test.ts(x)`), como no resto do projeto.

### Tipos e dados (`src/types/carimbo.ts`)

```ts
// Resposta de PUT /Convenio/carimbar.
export type Carimbo = {
  estacionamento: string;
  placa: string;
  modelo: string;
  cor: string;                 // como vem do back (ex.: "PRATA")
  categoria: number;           // categoria do veículo (1 a 6)
  dataHoraEntrada: string;     // ISO sem fuso
  rotatividadeId: number;
  rotatividade: string;        // nome da tabela de convênio aplicada
  dataHoraConveniada: string;  // ISO sem fuso: momento do carimbo
};
```

O corpo do PUT é `{ token: string }` (8 caracteres). O token vem de `extrairTokenComprovante`, que aceita o link `.../comprovante/<token>` ou o token solto.

### Serviço (`carimbo.ts`)

```ts
carimbarTicket(token: string): Promise<Carimbo>
// PUT /Convenio/carimbar  { token }
// Erros sobem como ApiError (client.ts); a mensagem de regra de negócio (400) vem em ApiError.message.
```

`carimbo.mapper.ts` faz `fromCarimboResponse` tolerante a campos ausentes (textos `""`, números `0`), no padrão dos mappers de Conveniada e Preço.

### Server vs Client

| Peça | Tipo | Motivo |
|------|------|--------|
| `app/(app)/carimbo/page.tsx` | Server | Só `metadata` e composição. |
| `CarimboPage`, `TicketCarimbado` | Client | Câmera (`getUserMedia`), TanStack Query, estado do resultado. |
| `carimbo.mapper`, `format` | Módulos puros | Testáveis sem React. |

### Fluxo de dados

- **Leitura:** `<LeitorQrSaida onToken onInvalido buscando={isPending} />`. `onToken(token)` chama a mutation; `onInvalido` não faz nada além do que o leitor já mostra (mira vermelha e anúncio "QR Code não é um ticket Murel").
- **Mutation:** `useCarimbar` usa `useMutation({ mutationFn: carimbarTicket })`. Enquanto `isPending`, o leitor recebe `buscando` e a câmera pausa; leituras novas são ignoradas, o que cobre o carimbo duplicado por leitura repetida do mesmo QR.
- **Repetição do token após erro:** com o mesmo QR ainda diante da câmera depois de um erro de negócio, o leitor voltaria a ler e repetiria a chamada. O hook guarda o último token que falhou e o instante, e ignora o mesmo token por 5 s (mesmo valor e a mesma ideia de `REPETICAO_TOKEN_MS` em `useSaidaFlow`). Um token diferente é aceito na hora.
- **Resultado:** com `isSuccess`, a página troca o leitor pelo `TicketCarimbado`. "Carimbar outro ticket" chama `mutation.reset()`, o que volta ao leitor, e devolve o foco ao visor. O resultado não some sozinho.
- **Erros:** `mutation.error` vira `ErrorBanner role="alert"` com `ApiError.message`; `isForbiddenError` mostra `ErroSemPermissao` com "Você não tem permissão para carimbar tickets." e não oferece nova tentativa. Falha de conexão (`kind` `network` ou `timeout`) mostra "Tentar novamente", que reenvia o mesmo token guardado, sem nova leitura.
- **Sem cache:** o carimbo é uma ação, não um dado de leitura. Nenhuma query é invalidada: nada na área da conveniada lista veículos carimbados nesta versão.
- **Dados do resultado:** `format.ts` reaproveita `getCategoriaVeiculoLabel` (`components/veiculos/saida.ts`) para a categoria, `CORES_VEICULO` (`types/veiculo`) para a cor (com o texto original como fallback) e `formatDataHora` (`components/contrato/format.ts`) para entrada e carimbo. Se o formato "às" for longo demais para o cartão no celular, usa `formatDate`/`formatTime` de `components/caixa/format` separados.

### Permissões e navegação

- `permissoes.ts`: `AREA.Carimbo = "carimbo"`; `PERMISSOES_PADRAO[AREA.Carimbo] = [AdministradorConveniada, GerenteConveniada, UsuarioConveniada]`; `AREA_POR_ROTA` ganha `["/carimbo", AREA.Carimbo]`. Atualizar `permissoes.test.ts` (os 8 perfis).
- Hoje o desestruturado de `PERFIL_USUARIO` em `permissoes.ts` só traz `AdministradorConveniada`; passam a ser usados também `GerenteConveniada` e `UsuarioConveniada`.
- `nav.ts`: item `{ label: "Carimbar ticket", shortLabel: "Carimbo", href: "/carimbo", icon: "stamp", area: AREA.Carimbo }`, onde o menu fica coerente para esses perfis (logo após "Caixa" ou ao fim; como só os perfis de conveniada o veem, a posição não afeta os de estacionamento). Atualizar `nav.test.ts`, `SideNav.test.tsx`, `BottomNav.test.tsx` e `BottomBar.test.tsx` se dependerem da lista ou da contagem de itens (todos eles fixam essas listas).
- Rótulo curto "Carimbo" respeita o limite de 11 caracteres verificado em `nav.test.ts`.
- `NavIcons.tsx`: ícone `stamp` (carimbo: cabo, base e marca), em traço de 2,4 como os demais, e `NavIconId` ganha `"stamp"`.
- `telaInicial.ts`: perfis de conveniada (5, 6 e 7) abrem `/carimbo` em qualquer largura, porque o dashboard deles é praticamente vazio (os indicadores só aparecem para quem acessa o Pátio). O tipo de retorno passa a incluir `"/carimbo"`; usar `podeAcessar(perfil, AREA.Carimbo)` e deixar a regra do Pátio como está. Atualizar `telaInicial.test.ts` (hoje o perfil 5 espera `/dashboard`).
- A enforcement da rota é a mesma das demais (`areaDaRota` no `proxy.ts` e no layout `(app)`); não há guarda nova. O 403 do back continua tratado na tela.

## Decisões técnicas e trade-offs

1. **Carimbar direto na leitura, sem etapa de confirmação** (recomendação do design para o RF3). Ler o QR já é o gesto deliberado; confirmar a cada ticket deixaria o balcão lento. O risco de não haver desfazer é coberto pelo resultado explícito e pelo erro de "já carimbado". Se o produto pedir confirmação, `useCarimbar` guarda o token lido e só chama a mutation depois do "Carimbar"; a estrutura da tela já comporta isso.
2. **Reaproveitar `LeitorQrSaida` sem renomear.** Mover para um nome neutro (ex.: `LeitorQr`) tocaria os três usos atuais (saída, leitor de placa) e seus testes, sem ganho para esta entrega. Fica como melhoria futura; o carimbo importa o componente de onde ele está.
3. **Mensagem do back no erro, sem mapeamento por texto.** Inferir o caso (já carimbado, mensalista, fora do pátio, sem tabela) a partir do texto exige confiar em strings do back. A tela usa `ApiError.message` por padrão; só troca por texto próprio se o back passar a devolver um código estável (`errors[].code`). Mesma decisão de Empresas conveniadas.
4. **Sem `Toast` no sucesso:** o ticket carimbado é o retorno e precisa ficar visível enquanto a conveniada confere os dados com o cliente.
5. **Estado local em vez de store ou URL:** o resultado vive em `useMutation`; recarregar a página volta ao leitor (o carimbo continua gravado no back). Não há link para compartilhar um carimbo.
6. **Mutation sem retry:** `retry: false` (padrão de mutations do TanStack). Reenviar é ação do usuário ("Tentar novamente"), porque o PUT altera o estado do veículo.
7. **Tela inicial dos perfis de conveniada em `/carimbo`:** muda o comportamento do login e da raiz para esses perfis. Não afeta quem acessa o Pátio.

## Riscos / pontos de atenção

- **Token real no `input.md`:** o exemplo de chamada contém um JWT de autenticação. Não vai para código, testes nem docs; convém removê-lo do arquivo antes de versionar.
- **Mensagens de erro sem código estável:** sem `errors[].code`, o texto de "já carimbado" ou "mensalista" é o que o back mandar. Pedir ao back um código estável é a evolução natural.
- **Nome da conveniada na sessão:** a rota depende de a sessão trazer um perfil de conveniada. Perfis fora do enum conhecido são tratados como perfil nulo pelo `proxy.ts` e só acessam o início.
- **Câmera:** exige HTTPS e permissão do navegador (já são pré-requisitos do leitor da saída). Em navegador sem `getUserMedia` a tela só informa a limitação; digitação manual está fora do PRD.
- **Duplo carimbo:** coberto em duas camadas, pausa do leitor durante a mutation e janela de 5 s para o mesmo token após erro; o back ainda rejeita o segundo carimbo do mesmo veículo.
- **Permissão por módulo:** a tela de permissões depende de a nova `Area` existir no back; se o back não conhecer `carimbo`, a sobrescrita não terá efeito e vale o padrão. Confirmar o identificador do módulo com o back.
- **Testes de menu:** adicionar um item altera listas fixas em `nav.test.ts` e nos testes de `SideNav`/`BottomNav`/`BottomBar`; ajustar todos na task de navegação, como na entrega de Empresas conveniadas.
- **Mudança na tela inicial:** `telaInicial.test.ts` e `RedirecionarInicio` dependem da regra; cobrir os perfis 5, 6 e 7.

## Fora de escopo técnico
- Desfazer carimbo, histórico/lista de carimbos e relatórios.
- Digitar o código do ticket à mão.
- Renomear/mover `LeitorQrSaida` para um componente neutro.
- Cálculo da saída pela tabela de convênio (feito pelo back no `GET patio/saida`).
- Qualquer mudança na tela de saída do estacionamento.
- Novo componente de design system ou novos tokens de tema.
- Mock/serviço fake: a integração é direta com a API real.

## Testes previstos
- **Unitários (Vitest):** `carimbo.mapper` (resposta completa, campos ausentes), `format` (categoria, cor com fallback, data/hora), `permissoes` e `nav` (os três perfis de conveniada sim; Administrador, Gerente, Caixa, Manobrista e Financeiro não), `telaInicial` (perfis 5, 6 e 7 abrem `/carimbo`).
- **Serviço:** `carimbo.ts` com o client mockado (PUT em `/Convenio/carimbar` com `{ token }`, propagação de `ApiError`).
- **Hook:** `useCarimbar` (token repetido após erro é ignorado por 5 s, token novo é aceito, `reset` volta ao leitor).
- **Componentes (Testing Library):** `CarimboPage` com o leitor mockado (carimbo com sucesso mostra o ticket e "Carimbar outro ticket"; erro de negócio mostra o banner e mantém o leitor; 403 sem tentar novamente; falha de conexão com "Tentar novamente" reenviando o mesmo token; leitura repetida durante o envio gera uma só chamada) e `TicketCarimbado` (dados, selo, foco no título).
- Antes de concluir: `npm run lint` e `npm run build`.
