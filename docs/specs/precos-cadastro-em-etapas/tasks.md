# Tasks: Cadastro de Preços em 3 etapas com resumo ao vivo

Referências: ./prd.md, ./design.md, ./techspec.md

- [x] T1 — Validação por etapa: criar `validarEtapasPreco(values)` (mensagens por etapa: basico, horarios, cobranca, agrupando os paths de `precoInfoSchema`) e fazer `findInvalidPrecoStep` devolver 1|2|3
  - Arquivos: `src/lib/schemas/preco.ts`, `src/lib/schemas/preco.test.ts`
  - Pronto quando: testes cobrem cada etapa completa/incompleta (inclui fim anterior ao início, faixa repetida, "Todas" combinada, sem horário) e a ordem do primeiro erro; schemas existentes seguem iguais

- [x] T2 — `resumoHorarios(horarios)`: texto que agrupa dias consecutivos com o mesmo intervalo ("Seg–Sex 06:00–22:00"), ignora horários inativos e devolve "nenhum ainda" sem horários
  - Arquivos: `src/components/precos/resumoHorarios.ts`, `src/components/precos/resumoHorarios.test.ts`
  - Pronto quando: testes cobrem dias iguais agrupados, dias salteados, vários intervalos no mesmo dia, inativo ignorado e lista vazia

- [x] T3 — `TipoRegraCards`: cartões de tipo de regra como radiogroup (setas, `aria-checked`, texto de apoio por tipo)
  - Arquivos: `src/components/precos/TipoRegraCards/{TipoRegraCards.tsx,TipoRegraCards.styles.ts,index.ts}`, teste
  - Pronto quando: teste cobre seleção por clique e por setas, estado anunciado e `disabled`

- [x] T4 — Dividir `PrecoInfoStepFields` em `PrecoBasicoFields` (descrição, tipo em cartões, empresa desabilitada, vigência, "Sem data de fim", Ativo, categorias abaixo) e `PrecoCobrancaFields` (diária e tolerâncias com texto de ajuda); remover o componente antigo; tirar a prop `summary` de `PrecoCategoriasStepFields`
  - Arquivos: `src/components/precos/{PrecoBasicoFields,PrecoCobrancaFields}/`, `PrecoInfoStepFields/` (remover), `PrecoCategoriasStepFields/`
  - Pronto quando: os campos mantêm rótulos, formatação e validação de hoje; "Sem data de fim" desabilita e limpa o fim e desmarcar reabilita; tipecheck sem referências ao componente removido

- [x] T3b — Remover a placa embutida de `PrecoFaixasStepFields` (Layout e prop `diaria`) para a placa ir ao painel
  - Arquivos: `src/components/precos/PrecoFaixasStepFields/`
  - Pronto quando: a etapa mostra só as linhas de faixa e continua ordenando ao sair da linha e anunciando adição/remoção

- [x] T5 — `PrecoEtapasNav`: três botões de etapa com número, nome, apoio e estado (atual, completa ✓, pendência !, neutra), rótulo acessível com o estado
  - Arquivos: `src/components/precos/PrecoEtapasNav/{PrecoEtapasNav.tsx,PrecoEtapasNav.styles.ts,index.ts}`, teste
  - Pronto quando: teste cobre `aria-current`, o estado dito no nome acessível e `onSelect` ao clicar

- [x] T6 — `PrecoResumoAoVivo`: painel "Sua tabela" (barra de progresso, lista de conferência com ✓/○, horários via `resumoHorarios`) com a placa `FaixasPreview` abaixo; no modo edição mostra "antes → depois" e "Alterado" via `diffPreco`; anúncio `aria-live` com debounce
  - Arquivos: `src/components/precos/PrecoResumoAoVivo/{PrecoResumoAoVivo.tsx,PrecoResumoAoVivo.styles.ts,index.ts}`, teste
  - Pronto quando: teste cobre valores vazios e preenchidos, vigência "sem fim", placa vazia, e o destaque de mudança só quando há `original`

- [x] T7 — Reescrever `PrecoWizardForm` para 3 etapas com navegação livre (estado `step`/`visitadas`, estado por etapa derivado de `validarEtapasPreco`), cabeçalho com andamento, painel lateral sticky (coluna única abaixo de `lg`), "Salvar" que marca campos, vai à primeira etapa pendente com `ErrorBanner` listando as mensagens, e envia o mesmo payload; mantém cancelar com confirmação, `beforeunload`, trava de duplo envio e redirecionamento (`salvo`, `preco`)
  - Arquivos: `src/components/precos/PrecoWizard/PrecoWizardForm.tsx`, `PrecoWizard.styles.ts`, `PrecoWizard.tsx` (esqueleto de carregamento e `STEPS`)
  - Pronto quando: clicar em qualquer etapa preserva o que foi digitado; salvar completo chama o serviço uma vez com os mesmos valores; salvar incompleto leva à etapa pendente; na edição o salvar só habilita com mudanças

- [x] T8 — Atualizar os testes do wizard: fluxo em 3 etapas, navegação livre sem perder dados, estados ✓/!, "Sem data de fim", salvar com pendência, edição (antes → depois, salvar desabilitado sem mudança), cache invalidado e redirecionamento
  - Arquivos: `src/components/precos/PrecoWizard/PrecoWizard.test.tsx`
  - Pronto quando: `npm test` dos arquivos de preços passa

- [x] T9 — Limpeza e verificação: remover `PrecoResumo` se ficou sem uso, conferir tokens (nenhum valor visual solto) e rodar lint, tipos, testes e build
  - Arquivos: `src/components/precos/PrecoResumo/` (se sem uso), demais ajustes
  - Pronto quando: `npm run lint`, `npx tsc --noEmit`, testes de preços e `npm run build` passam

- [x] T10 — Verificação visual: conferir desktop e celular (painel desce, sem rolagem horizontal) e os temas, em Chrome headless ou no navegador
  - Arquivos: (nenhum; usar rota temporária de preview e removê-la)
  - Pronto quando: as 3 etapas, o estado de pendência e o modo edição foram vistos em desktop e em ~480px sem sobreposição

- [x] T12 — `grade.ts` (`horariosParaGrade`, `gradeParaHorarios` preservando horários não representáveis) e `avisosFaixas.ts`
  - Arquivos: `src/components/precos/grade.ts`, `avisosFaixas.ts` e testes
  - Pronto quando: testes cobrem ida e volta sem perda (minutos quebrados, inativo, período), fim às 24 h e cada aviso de faixa

- [x] T13 — `GradeHorarios` (pintura por clique e arraste, dia/hora, atalhos, resumo e total) e etapa 2 com a grade + "Ajuste fino" recolhível
  - Arquivos: `src/components/precos/GradeHorarios/`, `PrecoHorariosStepFields/`, `PrecoWizardForm.tsx`
  - Pronto quando: teste cobre clique, atalho, dia inteiro, e que a grade e o ajuste fino editam os mesmos horários

- [x] T14 — Faixas com horas e minutos, salto, modelos e avisos na etapa 3
  - Arquivos: `src/components/precos/PrecoFaixasStepFields/`, `PrecoWizardForm.tsx`
  - Pronto quando: teste cobre h+min gravando minutos, salto, modelo e avisos (valor que cai, limite repetido, diária menor)

- [x] T15 — Verificação visual das etapas 2 e 3 (desktop e ~500 px), lint, tipos, testes e build
  - Arquivos: —
  - Pronto quando: grade e faixas vistas sem sobreposição nem rolagem horizontal da página

- [ ] T11 — Roteiro manual (fica aberto até o usuário rodar): criar uma tabela pulando entre etapas, tentar salvar com pendência, criar com "Sem data de fim", editar uma tabela em vigor e salvar; conferir no back-end que o payload é o mesmo
  - Arquivos: —
  - Pronto quando: executado manualmente com a API real

## Notas da execução

- `findInvalidPrecoStep` passou a devolver 1–3 e há `validarEtapasPreco` (mensagens por etapa) em `src/lib/schemas/preco.ts`; os schemas por formulário não mudaram, então o payload é o mesmo.
- As categorias ficaram em uma seção própria no fim da etapa "O básico" (`PrecoCategoriasStepFields` renderizado pelo wizard), em vez de dentro de `PrecoBasicoFields`, porque pertencem a outro formulário.
- "Sem data de fim" é estado do wizard (começa marcado quando o fim está vazio); marcar limpa o fim, desmarcar só reabilita o campo.
- `PrecoResumo` foi removido; o painel `PrecoResumoAoVivo` cobre o "antes → depois" com `diffPreco`.
- Correção de grade compartilhada: `FormGrid` agora usa `minmax(0, 1fr)` para o campo de data não vazar do cartão no celular.
- Verificação visual feita em Chrome headless (1280 px e 500 px, criar e editar) com rotas temporárias, já removidas.
- T11 (roteiro manual com a API real) segue aberta.
- A grade de horários trabalha em horas cheias (fim às 24 h grava 23:59); horários com minutos, inativos ou com período específico ficam no "Ajuste fino" (que abre sozinho quando há algum) e nunca são apagados pela grade.
- As faixas guardam o limite em minutos; os campos de horas e minutos só o recompõem. Os modelos "Rotativo" e "A cada 30 min até 2 h" substituem a lista de faixas.
- Os avisos de faixas (limite repetido, degrau mais barato, diária menor que o último degrau) não bloqueiam o salvamento.
