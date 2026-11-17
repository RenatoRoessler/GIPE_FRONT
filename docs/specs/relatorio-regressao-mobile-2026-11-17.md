# Relatório de regressão mobile (UX) — 17/11/2026

Ambiente: `yarn dev` (`.env.local`, homologação/dev). Emulação de iPhone 12 (390×844, escala 3) no Chrome headless via agent-browser.
Perfis: Administrador, Conveniado, Lavador. Dados criados usam o prefixo `TESTE-QA`.

## Como testei
- **Automático, em todas as telas do admin (23 rotas) e nas telas dos outros dois perfis:** rolagem horizontal da página, alvos de toque menores que 40px, texto menor que 12px e campos com fonte menor que 16px (que fazem o iOS dar zoom).
- **Manual, com captura de tela:** login, pátio, financeiro, modal de entrada, comprovante, modal de saída, menu "Mais", tour e telas do conveniado, fila do lavador.
- **Ações executadas:** entrada e saída de veículo (placa `QAT3C45`), abrir e navegar o menu "Mais", tour do conveniado, mover cartões da fila do lavador (feito antes, no teste desktop).

## Resumo
- Nenhuma tela tem rolagem horizontal da página. Nenhuma imagem sem `alt`.
- O desenho mobile é consistente e bem pensado: barra inferior com botão central "Entrada", sheet "Mais" agrupado, modais em tela cheia com rodapé fixo, cards grandes para escolhas.
- Os principais problemas são de **tamanho de alvo de toque** e de **fluxos que pedem passos desnecessários**.

## O que está bom
- **Login:** limpo, campos grandes, botão de mostrar senha, "Lembrar CPF" com aviso.
- **Pátio:** vagas ocupadas em destaque, busca, cards com placa em fonte monoespaçada e tempo de permanência bem legíveis.
- **Registrar entrada:** placa como o protagonista (estilo placa Mercosul), categorias em cards com ícone, cores como bolinhas, rodapé fixo e o motivo do botão desabilitado ("Informe a placa completa.").
- **Comprovante:** QR grande, dados da empresa, placa e ticket claros.
- **Confirmar saída:** resumo (placa, modelo, entrada, permanência), formas de pagamento em 4 cards grandes.
- **Menu "Mais":** agrupado por assunto (Operação, Financeiro, Configurações), com status "Caixa aberto" e linhas grandes.
- **Perfis restritos:** conveniado e lavador só veem o que precisam, com barra inferior de 2 itens.
- **Tour do conveniado:** texto claro, com "Sair" e "Não mostrar mais"; "Sair" não faz o tour voltar ao reabrir a tela.

## O que precisa melhorar
| # | Gravidade | Onde | Problema e sugestão |
|---|-----------|------|---------------------|
| 1 | Alta (corrigido em 17/11/2026) | Confirmar saída | Com "Nada a cobrar", o sistema ainda pede forma de pagamento e "Cliente pagou com", e o botão fica desabilitado até escolher "Exato". Sugestão: com valor R$ 0,00, esconder essas perguntas e habilitar "Confirmar saída". |
| 2 | Alta (corrigido em 17/11/2026) | Fila do lavador | A tela abre em "Na fila (0)", que está vazia, enquanto o carro "passou da previsão" está em "Em andamento". O que é urgente fica escondido. Sugestão: abrir na primeira aba com itens (ou em "Em andamento") e tornar os chips de resumo clicáveis. |
| 3 | Média | Todas as telas | Botões e controles com menos de 44px de altura: botões primários com 37px ("Novo lançamento", "Salvar", "Nova conveniada", "Carimbar"), menu do usuário 38×38, link "Voltar ao caixa" 96×18, "Editar" 73×26, chips "Este mês" com 26px, "Fatura 2" 24×21. Sugestão: mínimo de 44px, com área de toque maior que o visual onde o desenho exigir. |
| 4 | Média | Configurações | Os switches de "Modelo/Cor/Prisma obrigatório" têm 40×24; fácil errar o toque. |
| 5 | Média | Formulários | Campos de texto com 39px de altura. Os campos testados têm fonte ≥ 16px (sem zoom no iOS), mas a altura fica abaixo de 44px. |
| 6 | Baixa | Pátio da conveniada (vazio) | A ilustração do estado vazio parece cortada (só um retângulo parcial). |
| 7 | Baixa | Tour | O botão "Não mostrar mais" quebra em 3 linhas. |
| 8 | Baixa | Fila do lavador | A aba "Em andamento (1)" quebra em 3 linhas. O rótulo "Placa ou prisma" repete o placeholder. |
| 9 | Baixa | Financeiro | A aba "Categorias" fica cortada na borda sem pista de que há rolagem (sem sombra ou seta). |
| 10 | Baixa | Pátio | O card "Por tipo" fica quase vazio ao lado de "Vagas ocupadas" quando só há um tipo. |
| 11 | Baixa | Comprovante de entrada | Só há "Imprimir". No celular, "Compartilhar" (WhatsApp/Web Share) seria mais usado. |
| 12 | Baixa | Catálogo de serviços e cadastro de serviço | Texto de 11px nos selos ("LAVA-RÁPIDO", "pequeno", "médio", "grande", "1 DE 3", "PASSO 1 · SERVIÇO"). Sugestão: mínimo de 12px. |
| 13 | Info | Dev | O selo do Next.js ("1 Insight") cobre o botão "Saída" da barra inferior. Só ocorre em desenvolvimento, mas atrapalha testes manuais. |

## Não testado
- Teclado virtual da placa (o headless não mostra o teclado) e leitura por câmera (placa, QR e carimbo).
- Tema escuro no celular.
- Dispositivo real: gestos, orientação paisagem, barra do navegador e área segura do iPhone.
- Ações completas em Caixa (abrir/fechar), Mensalistas, Conveniadas, Faturas, Notas Fiscais, Preços, Quadros de chaves, Catálogo de serviços e Configurações: nas versões mobile só abri as telas e medi.
- Telas públicas (`/adesao`, `/contrato`, `/ticket`, `/comprovante`, `/recibo`, recuperar senha, primeiro acesso).

## Dados de teste deixados na homologação
- Entrada e saída da placa `QAT3C45`.
- Itens já listados no relatório desktop.
