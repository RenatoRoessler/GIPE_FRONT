# Tech Spec: Configuração da empresa — dados obrigatórios na entrada

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (resume e referencia `./design.md`, via skill claude-design)

## Contrato da API (do `input.md`)
- `GET /api/v1/Configuracao` → `{ configuracaoId, modelo, cor, prisma, usuarioId, dataCriacao, usuarioIdAlteracao, dataAlteracao }`.
  - Empresa sem configuração gravada recebe o padrão `modelo: true`, `cor: true`, `prisma: false`, com `configuracaoId`, `usuarioId` e `dataCriacao` nulos.
  - `usuarioIdAlteracao` e `dataAlteracao` são nulos se nunca alterada.
- `PUT /api/v1/Configuracao` com `{ modelo, cor, prisma }`.
- A empresa é identificada pelo token (mesmo padrão de `/Empresa`).
- O `input.md` lista os perfis Administrador, Gerente, Caixa e Manobrista como o padrão de acesso ao endpoint, ajustável por módulo. Por isso o spec assume que os quatro perfis de operação conseguem fazer o `GET` (necessário na entrada) e deixa a edição para quem tem `AREA.Configuracoes`.
- O back aplica a regra em `POST /Patio/entrada` e na entrada da conferência; o prisma ligado não vale para mensalista.

**A confirmar com o back antes das tasks de entrada** (bloqueia T6 e T7):
1. Nome e formato do campo do prisma nos payloads de entrada (`prisma` texto? número?). O PRD o descreve como a peça de identificação do veículo, mas isso veio de interpretação, não do `input.md`.
2. Quem pode chamar `PUT`. O `GET` está coberto pela lista de perfis do `input.md`, mas ela não diz quem edita. O operador (Manobrista, Caixa) precisa do `GET` para saber o que exigir; se ele for restrito, a tela de entrada cai no padrão e o back continua sendo a fonte da regra.
3. Quem aparece como autor da alteração: a API traz só `usuarioIdAlteracao`; para mostrar o nome (design: "por {nome}") é preciso um nome vindo da API ou resolvido pela lista de usuários, que hoje é restrita a Administrador. Sem isso, a linha de auditoria mostra só a data.

## Design
- Telas/estados: página **Configurações** (`/configuracoes`) com o cartão "Entrada de veículos" (carregando, padrão, com mudança, salvando, sucesso, erro ao carregar, erro ao salvar, somente leitura, sem acesso); e os formulários de entrada do pátio e da conferência com campos obrigatórios marcados conforme a configuração. Detalhes em `design.md`.
- Componentes do design system reaproveitados: `Switch` (via `SwitchField`), `Text`, `Button`, `ErrorBanner`, `Skeleton`, `Toast`, `StatusBadge`, `Card`; `ErroSemPermissao` e o `BackButton`/`Page` do padrão de Minha Empresa.
- Componentes novos (de feature, não do design system):
  - `src/components/configuracoes/ConfiguracoesPage/` (página cliente com a consulta, os estados e o formulário).
  - `src/components/configuracoes/ConfiguracaoEntradaForm/` (as três chaves, Salvar e a linha de auditoria).
- Tokens de tema: nenhum novo. Linha ligada com `primary`/`primarySoft`, bordas `border`, raios `radii.md`.

## Arquitetura da solução

### Camada de dados
- `src/types/configuracao.ts` (novo): `Configuracao` (formato do app: `modelo`, `cor`, `prisma`, `alteradoPorId: number | null`, `alteradoEm: string | null`) e `ConfiguracaoValues` (`{ modelo, cor, prisma }`), com a constante `CONFIGURACAO_PADRAO = { modelo: true, cor: true, prisma: false }`.
- `src/lib/api/services/configuracao.ts` (novo) + `configuracao.mapper.ts`: `getConfiguracao()` e `updateConfiguracao(values)`, no padrão de `empresa.ts`/`empresa.mapper.ts` (DTO parcial, defaults seguros: campo ausente cai no padrão da empresa; datas inválidas viram `null`). Testes `configuracao.test.ts` e `configuracao.mapper.test.ts` no padrão dos vizinhos.
- `src/components/configuracoes/useConfiguracao.ts` (novo): `useQuery` com chave `CONFIGURACAO_QUERY_KEY = ["configuracao"]`, `staleTime` de 5 minutos e `refetchOnWindowFocus: false`; devolve `{ configuracao, carregando, erro }` em que `configuracao` já é o padrão enquanto carrega ou se falhar. É o único ponto de leitura, usado pela tela e pelos formulários de entrada.
- `useSalvarConfiguracao` (mutation, mesmo arquivo da tela ou hook próprio): grava com `PUT`, atualiza o cache com a resposta e invalida a chave. Erro sobe como `ApiError` (padrão do projeto).

### Validação
- `src/lib/schemas/veiculo.ts` e `src/lib/schemas/conferenciaPatio.ts`: hoje `modelo` e `cor` são sempre obrigatórios. Passam a ter fábricas que recebem as regras: `criarEntradaVeiculoSchema(regras)` e `criarEntradaConferenciaSchema(regras)`, onde `regras = { modelo, cor, prisma, mensalista }`. Os campos desobrigados aceitam vazio; o prisma só é exigido se `regras.prisma && !regras.mensalista`. Os schemas atuais (`entradaVeiculoSchema`, `entradaConferenciaSchema`) viram `criar…(CONFIGURACAO_PADRAO, sem prisma)` para manter os testes e quem já os usa.
- Mensagens: "Informe o modelo", "Selecione a cor" (já existentes) e "Informe o prisma" (nova).
- `src/lib/schemas/configuracao.ts` (novo): `configuracaoSchema` com três booleanos, para o formulário da tela.

### Tela de configuração
- `src/app/(app)/configuracoes/page.tsx` (Server Component fino): renderiza `<ConfiguracoesPage />`.
- `ConfiguracoesPage` (Client Component): estados pelo padrão de `MinhaEmpresa` (esqueleto, `ErroSemPermissao` no 403, `ErrorBanner` + "Tentar novamente"). Quando `data` chega, monta `ConfiguracaoEntradaForm` com `initial`.
- `ConfiguracaoEntradaForm`: TanStack Form (`useAppForm`) com `SwitchField`; `isDirty` habilita Salvar; "Alterações não salvas" como texto de status; `Toast` no sucesso via `useToast`; `ErrorBanner` com foco no erro ao salvar. Somente leitura quando `!podeEditar`: chaves desabilitadas, selo e sem botão.
- A linha de auditoria usa `formatDateTime` (já usado no comprovante) e mostra o nome só se vier da API; senão, só "Última alteração em {data}".

### Permissões e menu
- `src/lib/permissoes.ts`: nova área `AREA.Configuracoes = "configuracoes"` com `PERMISSOES_PADRAO = [Administrador, Gerente]` (a confirmar com o produto, questão em aberto do PRD) e rota `["/configuracoes", AREA.Configuracoes]` em `AREA_POR_ROTA`. Atualizar `permissoes.test.ts` e `proxy.test.ts`.
- Edição x leitura: um único `useCan(AREA.Configuracoes)` decide ver e editar. Se o produto separar "só ver" de "editar", entra uma área `ConfiguracoesEdicao`; fica registrado como risco, não como escopo.
- `src/lib/nav.ts`: novo item "Configurações" (`shortLabel` "Config.", ícone `settings`, `area: AREA.Configuracoes`, `grupo: "configuracoes"`), logo depois de "Minha Empresa". `NavIconId` ganha `"settings"` e `NavIcons` ganha `SettingsIcon` (engrenagem no traço dos outros). Atualizar `nav.test.ts` e os testes de `SideNav`/`BottomNav` que contam itens.

### Entrada do pátio e da conferência
- `EntradaVeiculoModal.tsx` e `RegistrarEntradaConferenciaModal.tsx`: chamam `useConfiguracao()` e passam as regras ao schema de validação (via `useMemo` por `configuracao` e `mensalista`), em vez do schema fixo.
- Rótulo obrigatório: o marcador padrão do formulário aparece só nos campos ligados; `aria-required` nesses campos. O rodapé que diz o que falta ("Falta: modelo, categoria e cor.") passa a listar só o que a configuração exige.
- Novo campo **Prisma** nos dois formulários. Decisão: **só aparece quando a configuração o torna obrigatório**, para não poluir a tela do operador; prisma opcional preenchido não existe nesta versão (ver "Fora de escopo técnico"). O campo some quando a entrada é de mensalista.
- Payloads: `EntradaPayload` (`types/veiculo.ts`) e `EntradaConferenciaPayload` ganham `prisma?: <tipo a confirmar>`; só vai no corpo quando preenchido. `modelo` e `cor` também passam a poder ser omitidos quando opcionais e vazios (hoje o envio assume que existem).
- O sufixo `[A CONFIRMAR] modelo opcional` que existe hoje em `EntradaVeiculoModal.tsx` (linha ~127) é resolvido por esta feature: o back passa a aceitar modelo/cor vazios quando desligados.

## Decisões técnicas e trade-offs
- **Um hook de leitura (`useConfiguracao`) com padrão embutido.** O operador nunca fica travado por falha ou demora da configuração: usa o padrão e o back continua validando. O custo é aceitar que, em falha, o formulário pode exigir menos ou mais que o back; o erro do back chega como mensagem de API e é mostrado normalmente.
- **Fábricas de schema em vez de um schema com `superRefine` fixo.** Mantém a validação testável por unidade (regras → schema) e deixa os dois formulários (pátio, conferência) usarem a mesma regra. Alternativa descartada: ler a configuração dentro do `onSubmit`, que esconderia a regra do rótulo e do rodapé de pendências.
- **Página própria em vez de seção de Minha Empresa.** Minha Empresa tem um salvamento único para os dados cadastrais e é só do Administrador; a configuração é gravada à parte (`PUT /Configuracao`) e tem público e permissão diferentes. Mesmo conteúdo cabe numa seção se o produto preferir.
- **Client Components onde há estado e formulário** (`ConfiguracoesPage`, `ConfiguracaoEntradaForm`, hooks, modais de entrada); a `page.tsx` é Server Component fino, como `minha-empresa/page.tsx`.
- **Sem otimismo no salvamento.** O cache só é atualizado com o que o back confirmou, para a linha de auditoria mostrar quem e quando de verdade.
- **Prisma só aparece quando obrigatório.** Evita um campo extra na operação de quem não usa; se o produto quiser prisma opcional visível, é mudança pequena (mostrar o campo sem exigir).

## Riscos / pontos de atenção
- **Contrato do prisma não definido no `input.md`** (nome, tipo, tamanho). Sem ele, os payloads e o campo não podem ser finalizados; ver "A confirmar com o back".
- **Permissão de leitura da configuração.** Se o `GET` for negado a perfis de operação, a regra no formulário fica no padrão e o back recusa o que faltar; nesse caso a mensagem de erro do back precisa ser legível (já é o padrão de `ApiError`).
- **Perfis e override por módulo.** `AREA.Configuracoes` entra no mapa de permissões; overrides de empresa (`PermissoesPorModulo`) já passam por `podeAcessar`, mas é preciso conferir se o back devolve a chave nova.
- **Mudança de schema afeta testes existentes** de entrada (pátio e conferência), que assumem modelo e cor sempre obrigatórios; os testes são ajustados para passar as regras padrão.
- **Corrida entre salvar e entrar.** Um operador pode estar com o formulário de entrada aberto quando o gestor muda a regra; vale a regra carregada ao abrir (e o back como garantia).
- **Nome do autor da alteração**: depende do que a API devolver (ver item 3 da seção de contrato).

## Fora de escopo técnico
- Qualquer outra configuração além dos três campos.
- Prisma opcional visível/editável quando desligado.
- Histórico de alterações e auditoria além da última.
- Configuração por unidade, turno ou perfil.
- Revalidar entradas já registradas.
- Mudanças em `Minha Empresa` e na gestão de permissões por módulo.
