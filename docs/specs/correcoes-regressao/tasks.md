# Tasks: Correções da regressão de 17/11/2026

Referências: ./prd.md, ./techspec.md

## RF1 — Recibo sem "Forma null"

- [x] T1 — Tornar o rótulo da forma de pagamento tolerante a valor vazio
  - Arquivos: `src/components/caixa/format.ts`, `src/components/caixa/format.test.ts` (criar se não existir)
  - Pronto quando: `formaPagamentoLabel(null)` e `formaPagamentoLabel(undefined)` devolvem "—"; ids válidos continuam devolvendo o nome; teste cobre os três casos.

- [x] T2 — Propagar o tipo opcional da forma de pagamento até o recibo
  - Arquivos: `src/components/veiculos/saida.ts`, `src/types/veiculo.ts` (linha ~136), `src/components/veiculos/ReciboSaidaStep/ReciboConteudo.tsx` (tipo `ReciboData`), `src/components/veiculos/ReciboSaidaStep/ReciboSaidaStep.tsx`
  - Pronto quando: `formaPagamento` aceita `number | null | undefined` só no que o recibo consome; `npm run build` passa sem erro de tipo e sem alterar os tipos do caixa e da conferência de pátio.

- [x] T3 — Mostrar "Sem cobrança" no recibo quando não há forma de pagamento
  - Arquivos: `src/components/veiculos/ReciboSaidaStep/ReciboConteudo.tsx`, `src/components/veiculos/ReciboSaidaStep/ReciboConteudo.test.tsx`
  - Depende de: T1, T2
  - Pronto quando: sem forma de pagamento aparece "Pagamento: Sem cobrança", sem "Valor recebido" nem "Troco" e sem o texto "null"; com forma aparece o nome (Dinheiro, Crédito, Débito, Pix); testes cobrem os dois casos e passam. Vale também para `/recibo/[token]`, cujo teste (`src/app/recibo/[token]/page.test.tsx`) continua passando.

## RF3 — Criar categoria sem perder o lançamento

- [x] T4 — Fazer o `CategoriaModal` avisar qual categoria foi criada
  - Arquivos: `src/components/financeiro/CategoriaModal/CategoriaModal.tsx`, `src/components/financeiro/useCategoriaMutations.ts`
  - Pronto quando: `CategoriaModal` aceita `onCriada?(categoria)` e a chama com a categoria devolvida pela API ao criar; a lista de categorias é invalidada; uso atual (aba Categorias) segue igual.

- [x] T5 — Confirmar que o `Modal` suporta ficar empilhado sobre outro modal
  - Arquivos: `src/components/ui/Modal` (ajustar só se necessário)
  - Pronto quando: abrir um segundo modal por cima mantém o primeiro montado; Esc fecha só o de cima; o foco volta ao primeiro ao fechar o segundo. Se já funciona, registrar isso no teste e não alterar o componente.

- [x] T6 — Abrir a categoria por cima do lançamento, sem trocar de aba
  - Arquivos: `src/components/financeiro/FinanceiroPage/FinanceiroPage.tsx`
  - Depende de: T4, T5
  - Pronto quando: novo estado `criandoCategoria` independente de `modal`; o `onCriarCategoria` do `LancamentoModal` só liga esse estado (sem `changeAba` e sem `setModal`); o `onCriarCategoria` da lista vazia continua levando à aba Categorias.

- [x] T7 — Selecionar a categoria nova no formulário de lançamento
  - Arquivos: `src/components/financeiro/LancamentoModal/LancamentoModal.tsx`, `src/components/financeiro/LancamentoModal/LancamentoForm.tsx`, `src/components/financeiro/FinanceiroPage/FinanceiroPage.tsx`
  - Depende de: T6
  - Pronto quando: ao salvar a categoria, `LancamentoForm` define `financeiroCategoriaId` com a nova categoria, ajusta entrada/saída se for do outro tipo e mantém descrição, valor, data e demais campos.

- [x] T8 — Atualizar e criar testes do fluxo de categoria
  - Arquivos: `src/components/financeiro/FinanceiroPage/FinanceiroPage.test.tsx`, `src/components/financeiro/LancamentoModal/LancamentoModal.test.tsx`
  - Depende de: T6, T7
  - Pronto quando: teste novo prova que criar categoria a partir do lançamento não troca de aba, mantém o modal e os campos e seleciona a nova categoria; testes antigos que esperavam a troca para a aba Categorias foram atualizados; a suíte passa.

## RF2, RF4, RF5 — Verificação e ajuste menor

- [x] T9 — Reverificar no navegador o acesso do usuário (RF2)
  - Arquivos: nenhum (verificação); se falhar, `src/components/usuarios/useUsuarioMutations.ts` e `EditarUsuarioModal.tsx`
  - Pronto quando: inativar um usuário confirmando "Tirar acesso" mostra "Inativo" na lista, inclusive após recarregar; religar volta a "Ativo". Se falhar, registrar a causa (front ou API) no `techspec.md` e abrir correção.

- [x] T10 — Reverificar a mensagem de perfil no "Novo usuário" (RF5)
  - Arquivos: nenhum (verificação); se falhar, `src/components/usuarios/NovoUsuarioModal/EtapaDados.tsx`
  - Pronto quando: cadastrar sem perfil mostra "Selecione o perfil". Se falhar, corrigir e cobrir com teste em `NovoUsuarioModal.test.tsx`.

- [x] T11 — Mostrar "CPF inválido" sem esperar o `onBlur` (RF4, melhoria)
  - Arquivos: `src/components/usuarios/NovoUsuarioModal/EtapaCpf.tsx`, `src/components/usuarios/NovoUsuarioModal/NovoUsuarioModal.test.tsx`
  - Pronto quando: com 11 dígitos digitados e CPF inválido, a mensagem aparece sem sair do campo; com menos de 11 dígitos não aparece; a regra de validação (`isValidCPF`) não muda; teste cobre os dois casos.

## Fechamento

- [x] T12 — Validar tudo
  - Arquivos: nenhum
  - Depende de: T1 a T11
  - Pronto quando: `npm run lint`, `npm test` e `npm run build` passam; repetir no navegador (saída com R$ 0,00 e com valor; lançamento com categoria nova; inativar usuário confirmando; CPF inválido) e marcar os critérios de aceite do `prd.md`.
