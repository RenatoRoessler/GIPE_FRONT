# Tasks: Módulo de Serviços

Referências: ./prd.md, ./techspec.md, ./design.md

Cada task termina com `npm run lint` e os testes da área tocada passando (`npx vitest run <caminho>`); rodar `npm run build` ao fim de T9, T13 e T17. Commits por tipo/assunto (skill `commit`); T1 vai em commit `fix(configuracoes)` separado.

## Fase 0 — Correção prévia e base

- [x] T1 — Corrigir o `PUT /Configuracao` para não apagar `servicos` e `entradaDiretoCamera`
  - Arquivos: `src/types/configuracao.ts`, `src/lib/api/services/configuracao.mapper.ts`, `configuracao.mapper.test.ts`, `configuracao.test.ts`, `src/components/configuracoes/useConfiguracao.ts` e testes
  - Pronto quando: `ConfiguracaoValues` tem `servicos` e `entradaDiretoCamera` (padrões `false` e `true`); o mapper lê os dois campos do `GET` e `toConfiguracaoPayload` envia os cinco; teste prova que salvar modelo/cor/prisma devolve os outros dois como vieram; nenhum teste existente quebra.

- [x] T2 — Switch "Serviços (lava-rápido)" na tela de Configurações
  - Arquivos: `src/components/configuracoes/ConfiguracaoEntradaForm/ConfiguracaoEntradaForm.tsx` (+ `.test.tsx`), `ConfiguracoesPage`
  - Pronto quando: o switch aparece com texto de apoio, reflete o valor do back e é salvo; `entradaDiretoCamera` segue preservado e sem controle; teste cobre ligar, desligar e salvar.

- [x] T3 — Perfil Lavador e áreas de permissão do módulo
  - Arquivos: `src/types/usuario.ts`, `src/lib/permissoes.ts`, `src/lib/permissoes.test.ts`, testes que enumeram perfis (`usuario.mapper.test.ts` e afins)
  - Pronto quando: `PERFIL_USUARIO.Lavador = 9`; `PERFIS_ESTACIONAMENTO` inalterado; existem `AREA.Servicos` (Administrador, Gerente, Caixa, Manobrista, Lavador), `AREA.ServicosCatalogo` (Administrador, Gerente) e `AREA.ServicosPatio` (Administrador, Gerente, Caixa, Manobrista); `areaDaRota("/servicos")` devolve `Servicos`; tabela de teste por perfil cobre as três áreas; suíte inteira passa.

- [x] T4 — Item "Serviços" no menu
  - Arquivos: `src/lib/nav.ts`, `src/lib/nav.test.ts`, registro de ícones de navegação (onde os demais `NavIconId` são desenhados)
  - Pronto quando: item `/servicos` no grupo Operação, depois de "Conferência de pátio", com ícone novo `services`; aparece só para perfis com `AREA.Servicos`; teste do menu atualizado.

## Fase 1 — Contrato com a API

- [x] T5 — Validar o formato real das respostas
  - Arquivos: `docs/specs/modulo-servicos/techspec.md` (seção "Riscos" atualizada), fixtures da T6
  - Pronto quando: os nomes dos campos de `GET /Servico`, `GET /Servico/fila` e `GET /patio/{id}/servico` estão confirmados com uma resposta real. Para obter o dado, pedir ao dono do ambiente um exemplo ou autorização para criar um serviço de teste; **não gravar no ambiente sem essa autorização**. Se não houver dado, registrar no techspec que o mapper segue tolerante e seguir.

- [x] T6 — Tipos do domínio
  - Arquivos: `src/types/servico.ts`
  - Pronto quando: `StatusServico`, `STATUS_SERVICO`, `CATEGORIA_TODAS`, `PrecoServico`, `Servico`, `ServicoPayload`, `ServicoDoVeiculo`, `ServicosDoVeiculo` e `ItemFila` existem como no techspec; `tsc` sem erro.

- [x] T7 — Mapper das respostas
  - Arquivos: `src/lib/api/services/servico.mapper.ts`, `servico.mapper.test.ts`
  - Pronto quando: converte serviço, fila e serviços do veículo; reais viram centavos com `Math.round`; item inválido é descartado sem derrubar a lista; campos ausentes têm padrão seguro; `tempoPermitidoMinutos` ausente ou 0 vira `null`; testes cobrem cada caso.

- [x] T8 — Serviço HTTP
  - Arquivos: `src/lib/api/services/servico.ts`, `servico.test.ts`
  - Pronto quando: existem `listServicos(ativo?)`, `getServico`, `criarServico`, `atualizarServico`, `inativarServico` (aceita 200 e 204), `listFila(status?)`, `listServicosDoVeiculo`, `acrescentarServicos`, `atualizarStatusServico` e `cancelarServico`; o parâmetro `ativo` só vai quando definido; testes com `api` mockado confirmam método, URL e corpo de cada um e que 400 vira `ApiError` de validação.

- [x] T9 — Schema e payload do formulário
  - Arquivos: `src/lib/schemas/servico.ts`, `servico.test.ts`
  - Pronto quando: valida nome obrigatório aparado, durações inteiras ≥ 0, ao menos um preço > 0 entre "Todas" e as seis categorias e no máximo duas casas decimais; `toServicoPayload` descarta campos vazios, converte tempo permitido 0 em `null` e envia valores em reais; testes cobrem sem preço, preço zero, só "Todas" e só uma categoria.

## Fase 2 — Dados no cliente

- [x] T10 — Chaves de consulta, formatadores e rótulos de status
  - Arquivos: `src/components/servicos/servicosKeys.ts`, `format.ts`, `status.ts` (+ testes de `format` e `status`)
  - Pronto quando: a chave do veículo começa por `PATIO_QUERY_KEY`; `format` entrega R$ e minutos legíveis ("90 min · 1 h 30"); `status` devolve rótulo e tom de `StatusBadge` para os quatro status (confirmar os nomes de `StatusBadgeTone` no componente).

- [x] T11 — Hooks do catálogo
  - Arquivos: `src/components/servicos/useServicos.ts`, `useServicoMutations.ts` (+ testes)
  - Pronto quando: lista com filtro ativo/inativo; criar, atualizar e inativar invalidam `SERVICOS_KEY` e disparam `Toast` ("Serviço criado.", "Serviço atualizado.", "Serviço inativado."); erro 400 chega ao chamador com a mensagem do back.

- [x] T12 — Hooks da fila
  - Arquivos: `src/components/servicos/useFilaServicos.ts`, `useAtualizarStatusServico.ts` (+ testes)
  - Pronto quando: polling de 15 s sem rodar em segundo plano e com refetch ao voltar o foco; `placeholderData` mantém os cartões; a troca de status é otimista, desfaz em caso de erro com `Toast` e permite "Desfazer"; testes cobrem sucesso, falha e desfazer.

- [x] T13 — Hooks dos serviços do veículo e da habilitação
  - Arquivos: `src/components/servicos/useServicosDoVeiculo.ts`, `useAcrescentarServicos.ts`, `useCancelarServico.ts`, `useServicosHabilitados.ts` (+ testes)
  - Pronto quando: acrescentar, cancelar e trocar status invalidam a lista do veículo e `PATIO_QUERY_KEY`; `useServicosHabilitados` devolve `false` enquanto a configuração carrega e o valor de `servicos` depois; cancelar exige motivo.

## Fase 3 — Catálogo

- [x] T14 — Rota e casca do módulo
  - Arquivos: `src/app/(app)/servicos/page.tsx`, `src/components/servicos/ServicosPage/` (+ teste), `ServicosDesligados/`
  - Pronto quando: `page.tsx` é Server Component com `Suspense` e esqueleto (convenções conferidas em `node_modules/next/dist/docs/`); abas Fila e Catálogo em `?aba=`, com padrão por perfil (Lavador abre em Fila e não vê Catálogo); aviso `ServicosDesligados` aparece quando `servicos` está desligado, com link para Configurações apenas para quem pode; perfil sem acesso cai em acesso negado.

- [x] T15 — Lista e detalhe do catálogo
  - Arquivos: `src/components/servicos/ServicosMasterDetail/`, `ServicoListItem/`, `ServicoDetalhe/`, `PrecosPorCategoria/` (+ testes)
  - Pronto quando: busca local por nome, filtro Ativos/Inativos/Todos com contagem em `aria-live`, item selecionado no endereço (`?servico=`); detalhe mostra descrição, tempos e preços por categoria com "—/Não atende" e linha "Todas as categorias"; estados carregando, vazio, sem resultado, erro e não encontrado; no celular, lista e detalhe em telas separadas com Voltar; sem rolagem horizontal.

- [x] T16 — Formulário de serviço e inativação
  - Arquivos: `src/components/servicos/ServicoFormModal/` (+ teste), uso de `ConfirmDialog`
  - Pronto quando: `Modal` no desktop e `BottomSheet` no celular; campos nome, descrição, duração, tempo permitido, "Todas as categorias" e seção de preços específicos; validação com o schema da T9; erro 400 (nome duplicado) aparece no campo; aviso de que editar não altera serviços já acrescentados a veículos; Editar e Inativar só para `AREA.ServicosCatalogo`; inativar confirma e mostra `Toast`.

## Fase 4 — Fila e veículo

- [x] T17 — Fila do lavador
  - Arquivos: `src/components/servicos/FilaServicos/`, `FilaCard/`, `CancelarServicoDialog/` (+ testes); `PlateDisplay` só se faltar tamanho compacto
  - Pronto quando: abas com contagem no celular e três colunas no desktop; cartão com placa, serviço, veículo, prisma e entrada; ação principal por status (Iniciar, Marcar como pronto, Voltar para em execução) com alvo ≥ 44px; **Cancelar só no cartão Aguardando** e só para `AREA.ServicosPatio`, com motivo obrigatório (até 200 caracteres); estados carregando, coluna vazia, fila vazia e erro mantendo os cartões; foco vai ao próximo cartão após a ação; "Atualizado há N s" visível.

- [x] T18 — Serviços dentro do veículo no Pátio
  - Arquivos: `src/components/servicos/ServicosDoVeiculo/`, `AcrescentarServicosModal/` (+ testes), detalhe do veículo em `src/app/(app)/patio/[patioId]/` e o componente que ele usa
  - Pronto quando: a seção só aparece com serviços habilitados; lista os serviços do veículo com status e valor, interruptor de cancelados (com o motivo), e o resumo "Serviços R$ X · tempo permitido · livre até HH:MM" vindo do back; "Acrescentar serviços" (só `AREA.ServicosPatio`) lista os ativos com caixas de seleção, desabilita o que não atende a categoria do veículo e mostra o total selecionado; Cancelar só em Aguardando.

## Fase 5 — Fechamento

- [x] T19 — Acessibilidade e responsividade (código conferido; a checagem visual em 360/768/1024px com o app rodando fica na T20)
  - Arquivos: componentes de `src/components/servicos/` conforme necessário
  - Pronto quando: regiões da fila com nome e contagem, anúncio em `aria-live` ao mudar de coluna, foco devolvido ao fechar diálogos, `prefers-reduced-motion` respeitado, `layout.bottomNavReserved` no fim do conteúdo, nenhum valor visual fora do tema; verificado em 360px, 768px e 1024px.

- [ ] T20 — Verificação final e registro
  - Estado (2026-11-12): `npm run lint` (0 erros) e `npm run build` passam. `npm test`: 4538 de 4543 passam; as 5 falhas (3 testes de 403 que esperam o link `/dashboard` em `CaixaPage`, `MinhaEmpresa` e `UsuariosList`, e 1 timeout em `MensalistaModal.veiculos`) estão fora do módulo. Falta conferir os critérios do PRD e 360/768/1024px no app rodando (exige login e API). O token de `docs/specs/input.md` está só na cópia local, não em `HEAD`: não commitar esse arquivo como está.
  - Arquivos: `docs/specs/modulo-servicos/` (critérios do PRD marcados), changelog gerado pelo fluxo do projeto
  - Pronto quando: `npm run lint`, `npm test` e `npm run build` passam; cada critério de aceite do `prd.md` foi conferido no app rodando (ou anotado como não verificável e por quê); o token de `docs/specs/input.md` não aparece em nenhum arquivo commitado.
