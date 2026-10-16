# Task 02: Documento, celular e esquemas de validação

**Status:** ✅ Concluída
**Dependências:** Task 01

## Objetivo

Entrega as regras de validação e máscara da feature como funções puras e esquemas Zod, cobrindo CPF, CNPJ (inclusive alfanumérico), celular, dia de vencimento, valor e horários.

## Contexto Técnico

**Arquivos a criar:**
- `src/lib/documento.ts`
- `src/lib/documento.test.ts`
- `src/lib/schemas/mensalista.ts`
- `src/lib/schemas/mensalista.test.ts`

**Arquivos a editar:**
- — (não alterar `src/lib/cnpj.ts`, usado na adesão)

## Critérios de Aceite

- [x] `normalizeDocumento` remove máscara e põe em maiúsculas
- [x] `formatDocumento(valor, tipoPessoa)` aplica máscara de CPF ou de CNPJ (aceitando letras nas 12 primeiras posições)
- [x] `isValidDocumento(valor, tipoPessoa)` valida CPF (reusa `isValidCPF`) e CNPJ numérico e alfanumérico (dígitos verificadores)
- [x] `mensalistaSchema`: tipo obrigatório, pessoa, documento válido para a pessoa, nome obrigatório, e-mail válido, celular DDD + 9 dígitos, dia de vencimento inteiro de 1 a 31
- [x] `tipoSchema`: nome de 1 a 100 caracteres, categoria obrigatória, valor maior que zero (`parseMoney`), horários ambos vazios ou ambos preenchidos (saída menor que a entrada é válida)
- [x] Mensagens de erro em português, no padrão dos demais esquemas

## Testes

- [x] CPF válido/inválido, com e sem máscara
- [x] CNPJ numérico válido/inválido e CNPJ alfanumérico válido/inválido
- [x] Máscara de CNPJ com letras
- [x] Celular válido (11 dígitos, 9 após o DDD) e inválido
- [x] Dia de vencimento 0, 1, 31, 32 e não numérico
- [x] Valor 0, negativo, vazio e `280,00`
- [x] Horário só entrada, só saída, ambos e 19:00 → 07:00

## Notas de Implementação

Seção 7 do Tech Spec ("Regras de mapeamento e validação"). Valor de cada caractere do CNPJ alfanumérico = código ASCII − 48. Usar `isValidCelular` e `formatPhone` (`lib/phone.ts`), `parseMoney` (`lib/money.ts`) e o helper de e-mail existente.
