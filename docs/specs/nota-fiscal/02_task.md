# Task 02: Modal de solicitação

**Status:** ✅ Concluída  
**Dependências:** Task 01

## Objetivo

Entregar o modal "Gerar nota fiscal", isolado e testado, usado depois pelos dois recibos.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/notas/NotaFiscalModal/NotaFiscalModal.tsx`, `NotaFiscalModal.styles.ts`, `index.ts` e `NotaFiscalModal.test.tsx`. Props: `{ token, valor, placa?, onClose, onSolicitada }`.

**Arquivos a editar:**
- Nenhum.

## Critérios de Aceite

- [ ] O modal mostra o valor do recibo (somente leitura, em fonte de display) e, com placa, "Saída de <placa>".
- [ ] E-mail obrigatório e caixa "Pessoa jurídica": desmarcada, CPF opcional; marcada, CNPJ obrigatório; cada um com a sua máscara, e trocar o tipo limpa o documento. Erros por campo, com foco no primeiro inválido; Enter envia.
- [ ] Sucesso troca o formulário pela confirmação ("Nota fiscal solicitada", data, valor, "A empresa vai lançar a nota com os dados informados.") com botão Concluir, e chama `onSolicitada`.
- [ ] "Nota já solicitada": banner, botão passa a Fechar e `onSolicitada` não é chamado.
- [ ] Limite de tentativas, recibo não encontrado e falha de rede mostram o motivo e preservam o formulário.
- [ ] Fechar com dados digitados pede confirmação de descarte; sem dados, fecha direto.
- [ ] Durante o envio, campos e botões ficam desabilitados e o modal não fecha.

## Testes

- [ ] Componente: valor e placa exibidos; valor sem campo editável.
- [ ] Componente: validações do e-mail e do documento; máscara do documento.
- [ ] Componente: envio com o corpo certo (sem `documento` quando vazio) e confirmação com os dados da resposta.
- [ ] Componente: erros `rate_limited`, "já solicitada" e rede, com formulário preservado.
- [ ] Componente: descarte com e sem dados; envio em andamento.

## Notas de Implementação

Tech Spec, "Modal" e `design.md`. Mesmo padrão do `TipoModal` (`useAppForm`, `useMutation`, `ConfirmDialog`). A detecção de "já solicitada" é por mensagem **[A CONFIRMAR]**.
