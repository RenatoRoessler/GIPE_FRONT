# Tasks: Escolha de Plano no Fluxo de Adesão

Referências: ./prd.md, ./techspec.md, ./design.md

Antes da T7: confirmar com o backend a posição de `tipoPlanoAdesao` no JSON (assumida na raiz do corpo).

- [x] T1 — Tipos e dados dos planos
  - Arquivos: `src/types/plano.ts`, `src/lib/planos.ts`, `src/lib/planos.test.ts`
  - Pronto quando: `TipoPlanoAdesao` (enum), `PlanoVendido` e `Plano` existem; `PLANOS` tem Mensal, Trimestral, Semestral e Anual (centavos 14990, 13490, 11990, 7990; só o Anual `recomendado`); `calcularCondicoes`, `formatarReais`, `descreverTotal` e `lerPlanoDaUrl` (só "1" a "4") passam nos testes com totais 14990/40470/71940/95880, economias 0/4500/18000/84000 e percentuais 0/10/20/47.

- [x] T2 — Schema de validação do plano
  - Arquivos: `src/lib/schemas/adesao.ts`, `src/lib/schemas/adesao.test.ts`
  - Pronto quando: `planoSchema` rejeita plano ausente com "Escolha um plano para continuar." e aceita 1 a 4; testes cobrem os dois casos.

- [x] T3 — Plano no contrato de envio
  - Arquivos: `src/lib/api/services/adesao.mapper.ts`, `src/lib/api/services/adesao.mapper.test.ts`
  - Pronto quando: `AdesaoInput` tem `plano: PlanoVendido`, `AdesaoPayload` tem `tipoPlanoAdesao` e `toAdesaoPayload` o preenche; teste confirma 1, 2, 3 e 4 conforme o plano e que 0 nunca é enviado. Testes existentes do mapper e de `adesao.ts` atualizados e passando.

- [x] T4 — Constante `ETAPA` e destino dos erros do backend
  - Arquivos: `src/components/adesao/etapas.ts`, `src/lib/api/adesaoErrors.ts`, `src/lib/api/adesaoErrors.test.ts`
  - Pronto quando: `ETAPA` (Empresa 1, Horários 2, Titular 3, Plano 4, Conferir 5) existe; `AlvoErro.etapa` é `1 | 3`; CNPJ aponta para a etapa 1 e CPF e e-mail para a 3, com testes passando.

- [x] T5 — Variante de cartão no `OptionGroup`
  - Arquivos: `src/components/ui/OptionGroup/OptionGroup.tsx`, `OptionGroup.styles.ts`, `OptionGroup.test.tsx`
  - Pronto quando: `variant="card"` aceita `detail` e `badge` por opção, mostra o selo como texto, 1 coluna abaixo de `md` e 2 a partir dele; a seleção por clique e por setas funciona, o erro usa `role="alert"` e o padrão `tile` segue idêntico. Testes antigos e novos passam; sem valores visuais soltos.

- [x] T6 — Linha de plano na credencial
  - Arquivos: `src/components/adesao/credencial.ts`, `credencial.test.ts`, `src/components/ui/CredencialEmpresa/CredencialEmpresa.tsx`, `CredencialEmpresa.test.tsx`
  - Pronto quando: `buildCredencial` aceita `plano` e devolve `plano?: string` ("Anual · R$ 79,90/mês" ou `undefined`); `CredencialEmpresa` mostra "Plano:" com o traço apagado quando vazio; testes passando.

- [x] T7 — Hook do wizard com 5 etapas e estado do plano
  - Arquivos: `src/components/adesao/useAdesaoWizard.ts`
  - Pronto quando: etapas 1 a 5 usam `ETAPA` sem literais; o plano inicial vem de `useSearchParams` via `lerPlanoDaUrl`; avançar da etapa Plano sem escolha define `erroPlano`, `faltam = 1` e foca o primeiro radio; escolher um plano limpa o erro; `editar` e `corrigir` usam as novas etapas; `enviar` volta à etapa Plano se não houver plano e envia `plano` ao `saveAdesao`; o hook devolve `plano`, `escolherPlano` e `erroPlano`, e a credencial recebe o plano.

- [x] T8 — Etapa Plano
  - Arquivos: `src/components/adesao/PlanoStepFields/PlanoStepFields.tsx`, `PlanoStepFields.test.tsx`, `index.ts`
  - Pronto quando: renderiza os quatro planos em `OptionGroup variant="card"` com nome, valor por mês, total (`descreverTotal`) e economia (sem linha no Mensal), selo "Mais econômico" só no Anual e erro em `role="alert"`; testes passando.

- [x] T9 — Bloco "Plano" na Conferir
  - Arquivos: `src/components/adesao/ConferirStep/ConferirStep.tsx`, `ConferirStep.test.tsx`
  - Pronto quando: o bloco "Plano" é o primeiro, com plano, valor por mês e total, e "Editar Plano" chama `onEditar(ETAPA.Plano)`; os demais "Editar" usam `ETAPA.Empresa`, `ETAPA.Horarios` e `ETAPA.Titular`; testes passando.

- [x] T10 — Integração no wizard e `Suspense` na página
  - Arquivos: `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx`, `src/app/adesao/page.tsx`
  - Pronto quando: a etapa 4 mostra "Escolha o seu plano" com a descrição do design e a lista das 13 áreas, e `TITULOS` e `DESCRICOES` têm 5 itens; botão principal "Próximo: Conferir" e "Voltar" ao Titular; `faltamAviso` e a Conferir recebem o plano; a página envolve o wizard em `Suspense` e mantém `metadata`.

- [x] T11 — Testes do wizard atualizados e ampliados
  - Arquivos: `src/components/adesao/OnboardingWizard/OnboardingWizard.test.tsx`
  - Pronto quando: o mock de `next/navigation` inclui `useSearchParams`; os testes antigos usam os novos índices e passam; novos testes cobrem as cinco etapas no indicador, pré-seleção com `?tipoPlanoAdesao=1..4`, parâmetro ausente ou inválido sem seleção e sem erro, bloqueio sem plano com a mensagem, plano e dados preservados ao voltar, "Editar Plano" voltando à conferência e `saveAdesao` recebendo o plano escolhido.

- [ ] T12 — Verificação final
  - Arquivos: nenhum novo
  - Pronto quando: `npm run lint` e `npm run build` passam; testes do projeto passam; conferência manual em 360 px e desktop, nos dois temas, sem rolagem horizontal, com foco visível e contraste AA; os quatro planos enviados ao backend com `tipoPlanoAdesao` correto.
