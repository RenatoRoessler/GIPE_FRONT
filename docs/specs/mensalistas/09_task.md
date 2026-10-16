# Task 09: Aba Mensalistas: cadastro e edição

**Status:** ✅ Concluída
**Dependências:** Task 02, Task 03, Task 07, Task 08

## Objetivo

Permite cadastrar e editar mensalistas, incluindo ativar/desativar, atendendo RF-04, RF-05 e RF-09.

## Contexto Técnico

**Arquivos a criar:**
- `src/components/mensalistas/MensalistaModal/MensalistaModal.tsx`
- `src/components/mensalistas/MensalistaModal/MensalistaModal.styles.ts`
- `src/components/mensalistas/MensalistaModal/index.ts`
- `src/components/mensalistas/MensalistaModal/MensalistaModal.test.tsx`

**Arquivos a editar:**
- `src/components/mensalistas/MensalistasPage/MensalistasPage.tsx` — abre/fecha o modal e exibe `Toast`
- `src/components/mensalistas/MensalistasList/MensalistasList.tsx` — liga "Novo mensalista" e editar; botão "Criar tipo" quando não há tipo ativo

## Critérios de Aceite

- [x] `Modal size="lg"`, duas colunas a partir de `breakpoints.sm`
- [x] Campos: tipo (só ativos; na edição inclui o tipo atual mesmo inativo, marcado "(inativo)"), pessoa (`OptionGroup` Física/Jurídica), documento e celular com máscara, nome, e-mail, dia de vencimento, ativo (só na edição)
- [x] Trocar a pessoa no cadastro limpa o documento e muda rótulo e máscara; na edição, pessoa e documento ficam desabilitados e são reenviados
- [x] Validação com `mensalistaSchema`; erros por campo e erro do servidor no `ErrorBanner` (tipo inativo, dados inválidos, 403)
- [x] Sucesso: fecha, `Toast` ("Mensalista cadastrado." / "Mensalista atualizado.") e invalida `["mensalistas"]`
- [x] Sem tipos ativos: o cadastro é bloqueado com orientação e atalho para a aba Tipos
- [x] Fechar com dados alterados pede confirmação; envio desabilita campos

## Testes

- [x] Máscara e validação de CPF e de CNPJ alfanumérico no formulário
- [x] Edição bloqueia pessoa e documento e reenvia os valores atuais no `PUT`
- [x] Cadastro envia payload com `ativo: true`
- [x] Desmarcar "ativo" envia `ativo: false`
- [x] Tipo inativo no cadastro não aparece; na edição o tipo atual aparece
- [x] Erro 400 aparece no banner

## Notas de Implementação

Padrão do `EntradaVeiculoModal`. Seções 5 e 7 do Tech Spec. Decisões do produto: documento e pessoa bloqueados na edição; cadastro sempre ativo.
