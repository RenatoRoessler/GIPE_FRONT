# Tech Spec: Correções da regressão de 17/11/2026

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (via skill claude-design). Sem tela nova: só ajustes de comportamento e de texto em telas existentes.

## Triagem dos itens do relatório (após ler o código)

| Item | Veredito | Evidência |
|------|----------|-----------|
| 1. "Forma null" no recibo de saída | **Defeito real** | `formaPagamentoLabel` (`src/components/caixa/format.ts`) devolve `Forma ${id}` quando o id não está na lista. A saída de R$ 0,00 chega sem forma de pagamento (o tipo diz `number`, mas o valor é `null`/ausente), e o recibo imprime "Forma null". |
| 2. Acesso do usuário não muda para "Inativo" | **Provável falso positivo do teste** | `EditarUsuarioModal` pede confirmação ao inativar ("Tirar acesso de …?" com botão "Tirar acesso"). O teste clicou em Salvar e não confirmou. Reverificar confirmando o diálogo. |
| 3. Criar categoria dentro do lançamento perde o formulário | **Defeito real** | `FinanceiroPage` trata `onCriarCategoria` com `changeAba("categorias")` + `setModal({ kind: "categoria" })`, o que desmonta o `LancamentoModal` e troca de aba. |
| 4. CPF inválido sem mensagem | **Falso positivo parcial** | `EtapaCpf` já mostra "CPF inválido" quando o campo foi tocado (após `onBlur`). O teste preencheu o campo sem sair dele. Lacuna menor: com o campo em foco, o botão fica desabilitado sem explicação. |
| 5. Perfil sem mensagem | **Provável falso positivo do teste** | `novoUsuarioSchema` já tem `"Selecione o perfil"`. A checagem do teste usou `head -4`, que cortou a saída antes dessa linha. Reverificar. |

Consequência para o PRD: RF1 e RF3 são correções de código. RF2, RF4 e RF5 viram verificação (e, se a verificação falhar, correção). O relatório e o PRD foram atualizados.

## Design
- Telas/estados: recibo de saída (passo do modal e página pública `/recibo/[token]`), modal "Novo lançamento", modal "Novo usuário".
- Componentes do design system reaproveitados: `Modal`, `Select`, `Button`, `Toast` (já usados).
- Componentes novos: nenhum.
- Tokens de tema: nenhum novo.
- Texto do recibo quando não há forma de pagamento: "Pagamento: Sem cobrança" (mesmo vocabulário já usado em `ReciboConteudo` para mensalista).

## Arquitetura da solução

### RF1 — Recibo sem "Forma null"
- `src/types/veiculo.ts:136` e `src/components/veiculos/ReciboSaidaStep/ReciboConteudo.tsx`: o campo `formaPagamento` passa a aceitar `number | null | undefined` no tipo de dados do recibo.
- `ReciboConteudo.tsx` (linha ~79-83): se não houver forma de pagamento, mostrar "Sem cobrança" no lugar de `getFormaPagamentoLabel(...)`. Mantém "Valor recebido" e "Troco" ocultos quando não há valor.
- `src/components/caixa/format.ts` (`formaPagamentoLabel`): defesa extra. Receber `number | null | undefined` e devolver "—" para vazio, em vez de montar `Forma null`. Os outros usos (`ConferenciaFields`, `FormasPagamentoTabela`, `exportCsv`) continuam iguais para ids válidos.
- `src/components/veiculos/saida.ts` (`getFormaPagamentoLabel`): repassar o novo tipo.
- Cobre também a página pública do recibo, que usa o mesmo `ReciboConteudo`.
- Server/Client: sem mudança (já são Client Components).

### RF3 — Criar categoria sem perder o lançamento
- `FinanceiroPage.tsx`: hoje o `modal` é um único estado, então abrir a categoria fecha o lançamento. Solução: abrir o `CategoriaModal` **por cima** do `LancamentoModal`, sem trocar de aba e sem desmontar o formulário.
  - Novo estado `criandoCategoria: boolean`, independente de `modal`.
  - `onCriarCategoria` do `LancamentoModal` passa a fazer `setCriandoCategoria(true)` (remove `changeAba("categorias")` e `setModal(...)` nesse caminho).
  - O `onCriarCategoria` da lista de lançamentos (estado vazio, sem modal aberto) continua levando à aba Categorias, como hoje.
- `CategoriaModal` recebe `onCriada?: (categoria: FinanceiroCategoria) => void`. Ao salvar, chama `onCriada` e fecha só ele.
- `LancamentoForm.tsx`: ao receber a categoria criada, seleciona-a (`form.setFieldValue("financeiroCategoriaId", String(id))`) e ajusta o tipo (entrada/saída) se a categoria for do outro tipo. Os demais campos permanecem.
- `useCategoriaMutations.ts`: garantir que o `onSuccess` da criação invalida `useCategorias` (já invalida a lista) e devolve a categoria criada para o `onCriada`.
- Verificar o foco: o `Modal` empilhado precisa devolver o foco ao modal de baixo ao fechar. Se o `Modal` atual não suportar empilhamento, tratar no mesmo ajuste.

### RF2, RF4, RF5 — Verificação
- Reverificar no navegador: (a) inativar usuário confirmando "Tirar acesso" e conferir "Inativo" após recarregar; (b) "Novo usuário" sem perfil, conferindo "Selecione o perfil"; (c) CPF inválido com saída do campo.
- Só se (a) ou (b) falhar de verdade abrir correção. Para (a), conferir primeiro se `useEditarUsuario` invalida `useUsuarios` e se a API aceita o campo `ativo`.
- Melhoria opcional de RF4: mostrar "CPF inválido" assim que o CPF tiver 11 dígitos, sem esperar o `onBlur`. Alteração em `EtapaCpf.tsx` (`invalido`), sem mudar a regra de validação.

## Decisões e trade-offs
- Empilhar modais (RF3) em vez de salvar um rascunho do lançamento: o formulário nunca é desmontado, então não precisa de persistência extra. O custo é depender do suporte do `Modal` a empilhamento; se faltar, o ajuste fica no `Modal` e não numa gambiarra na página.
- Corrigir o rótulo na origem **e** no componente do recibo: o recibo mostra "Sem cobrança" (contexto), e o helper compartilhado só evita texto quebrado nos outros usos.
- Não mexer em RF2/RF4/RF5 sem reproduzir antes, para não alterar telas que já funcionam.

## Riscos / pontos de atenção
- O tipo `formaPagamento: number` está repetido em `types/veiculo.ts`, `types/conferenciaPatio.ts` e outros. Alargar só o que o recibo consome, para não espalhar `null` pelo caixa.
- Testes existentes que esperam o texto atual: `ReciboConteudo.test.tsx`, `ReciboSaidaStep` e `src/app/recibo/[token]/page.test.tsx`, `FinanceiroPage.test.tsx` e `LancamentoModal.test.tsx`. Atualizar os que cobrem o fluxo de "criar categoria" (hoje esperam a troca de aba).
- Empilhar modais pode quebrar a ordem de foco/Esc; cobrir com teste.

## Testes (Vitest + Testing Library)
- `ReciboConteudo`: sem forma de pagamento mostra "Sem cobrança" e nunca "null"; com forma mostra o nome (Dinheiro, Crédito, Débito, Pix).
- `formaPagamentoLabel`: `null`/`undefined` devolve "—"; id válido devolve o nome.
- `FinanceiroPage`/`LancamentoModal`: criar categoria a partir do lançamento mantém o modal aberto, preserva descrição e valor e seleciona a nova categoria; não troca de aba.
- Teste manual de regressão: repetir os cenários do relatório (saída com R$ 0,00 e com valor, fluxo completo de lançamento com categoria nova, inativar usuário confirmando o diálogo).

## Fora de escopo técnico
- Upgrade do Next.js e investigação do `.env.hml`.
- Mudanças na API (se a verificação de RF2 apontar o back-end, vira pedido separado).
- Áreas não cobertas pela regressão.
