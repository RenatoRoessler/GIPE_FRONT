# Relatório de teste de regressão — 17/11/2026

Ambiente: `yarn dev` (`.env.local`, confirmado pelo usuário como homologação/dev). Navegador: agent-browser (Chrome headless, sem câmera).
Perfis: Administrador, Conveniado, Lavador. Dados criados usam o prefixo `TESTE-QA`.

## Resumo
- Login funcionou com os 3 perfis em `yarn dev`. Com `.env.hml` as 3 credenciais foram recusadas ("CPF ou senha inválidos").
- Todas as telas estáticas do admin abriram sem erro. Não houve erro 4xx/5xx nem exceção no log do servidor.
- O controle de acesso por perfil funcionou: conveniado e lavador são redirecionados para `/acesso-negado` fora das suas áreas.

## O que está bom
- **Pátio**: entrada (validação com botão desabilitado, autocomplete de modelo, comprovante com QR) e saída por placa (Dinheiro/Exato) funcionam.
- **Financeiro**: criar categoria, validação ("Selecione a categoria", "Informe a descrição"), criar, editar e cancelar lançamento com confirmação.
- **Usuários**: fluxo em 2 etapas (CPF, dados), validação de campos, criação com aviso de senha temporária enviada por e-mail.
- **Quadros de chaves**: validação de nome, criar e inativar com confirmação.
- **Preços**: o wizard valida por seção ("Faltam: Informe a descrição (+4)").
- **Lavador**: fila de serviços move cartões entre "em andamento", "pronto" e de volta.
- **Conveniado**: só vê Carimbo e Pátio da conveniada.

## O que precisa melhorar
| # | Gravidade | Problema |
|---|-----------|----------|
| 1 | Média | Recibo de saída mostra **"Forma null"** no pagamento (saída com Dinheiro/Exato, valor R$ 0,00). |
| 2 | Retratado | ~~Em Usuários, desligar o acesso e salvar não muda o status.~~ Provável falso positivo: o modal pede confirmação ("Tirar acesso") e o teste não confirmou. Reverificar. |
| 3 | Baixa | Criar categoria de dentro de "Novo lançamento" fecha o modal e troca para a aba Categorias; o que foi digitado se perde. |
| 4 | Baixa (parcial) | CPF inválido só mostra a mensagem depois de sair do campo; enquanto o campo está em foco, o botão fica desabilitado sem explicação. |
| 5 | Retratado | ~~Perfil sem mensagem.~~ A mensagem "Selecione o perfil" existe no código; minha checagem cortou a saída. Reverificar. |
| 6 | Info | Credenciais recusadas com `.env.hml`: confirmar se o `.env.hml` aponta para a API certa. |
| 7 | Info | Next.js 16.4.3 sinalizado pelo próprio `next dev` como vulnerável; vale avaliar o upgrade. |

## Não testado
- Leitura de placa/QR e carimbo (exigem câmera).
- Salvar um preço completo (wizard de 4 seções): só a validação foi exercitada.
- Criar mensalista, conveniada, serviço de catálogo, fatura, nota fiscal, abertura/fechamento de caixa, configurações, minha empresa.
- Telas públicas: `/adesao`, `/contrato`, `/ticket/[empresa]`, `/comprovante/[token]`, `/recibo/[token]`, recuperar senha, primeiro acesso, alterar senha.
- Responsividade mobile, tema escuro e acessibilidade.

## Dados de teste deixados na homologação
- Usuário `TESTE-QA Usuario` (CPF 529.982.247-25, perfil Lavador, ativo).
- Categoria `TESTE-QA Despesa`.
- Entrada e saída da placa `QAT1A23`.
- Quadro `TESTE-QA Quadro` (inativado).
- Lançamento `TESTE-QA editado` (cancelado).
