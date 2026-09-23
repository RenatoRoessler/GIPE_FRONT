# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + styled-components (já definido no repositório).

## Users

- **Operadores no local** (caixa, manobrista): usam o sistema no balcão/portão do estacionamento para dar entrada e saída de veículos, aplicar descontos de convênio, receber pagamentos — ação rápida, tela em uso contínuo durante o expediente.
- **Administradores e gerentes**: configuram usuários, permissões, preços e convênios, geralmente à distância; também acompanham listagens e cadastros.

## Product Purpose

GIPE (Gestão Inteligente para Estacionamentos) é um sistema de gestão para estacionamentos: controla autenticação de usuários, cadastro e permissões de usuários, tabelas de preços (por categoria de veículo, convênio, período), entrada/saída de veículos, emissão de nota fiscal e adesão de empresas conveniadas ao sistema.

## Positioning

Sistema de gestão operacional para estacionamentos com controle granular de preços (por categoria, convênio, faixa horária, tolerância e degraus de cobrança) e fluxo próprio de adesão para empresas conveniadas — não é apenas um controle de entrada/saída, é uma ferramenta de precificação e permissões detalhada.

## Operating Context

- Login obrigatório: apenas usuários autenticados acessam o sistema (login via CPF + senha, recuperação de senha por e-mail/token temporário).
- Uso responsivo web + mobile: as telas operacionais (entrada/saída de veículo) tendem a ser usadas em dispositivos no local; as telas administrativas (usuários, preços, permissões) tendem a ser usadas em desktop.
- Fluxos multi-etapa (step): cadastro de preço (4 etapas) e adesão ao sistema (2 etapas) exigem wizards claros.
- Tabelas dinâmicas: cadastro de preço inclui sub-tabelas editáveis (categorias, faixas de dia/hora, degraus de valor por tempo).

## Capabilities and Constraints

- Perfis de usuário (enum): admin, caixa, manobrista, gerente — cada perfil pode ter permissões de menu configuráveis via tela de permissões.
- Cadastro de preço com regras complexas: vigência, tolerância de entrada, tolerância de alteração de faixa, período e valor de diária, valor adicional, tipo de preço (padrão/convênio/promocional/evento), categorias aplicáveis, faixas por dia da semana/horário, degraus de valor por tempo limite com percentual de desconto para conveniada.
- Entrada de veículo: placa, hora, categoria, operador (pode não ser visual).
- Saída de veículo: placa, hora, valor (calculado no backend), tempo de permanência, forma de pagamento, convênio, emissão de nota fiscal.
- Tela para empresa conveniada aplicar desconto via código de entrada + placa.
- Adesão ao sistema (onboarding de empresa conveniada): CNPJ, razão social, nome fantasia, endereço, telefone, tipo de empresa (estacionamento / lava-rápido / valet / combinações), seguido de cadastro do usuário admin da empresa.
- Recuperação de senha: botão só habilita após CPF válido digitado; sucesso mostra toast confirmando envio de e-mail.

## Brand Commitments

Nenhuma marca, paleta ou identidade visual definida ainda — greenfield total. A skill `claude-design`/impeccable tem liberdade para propor um mundo visual moderno e ousado do zero.

## Evidence on Hand

Nenhum conteúdo real, dado de demonstração, depoimento ou caso de uso fornecido ainda. Fonte de verdade funcional é `docs/input.md` (levantamento bruto de requisitos) e os PRDs em `docs/specs/*/prd.md`. Não inventar dados de exemplo além de placeholders óbvios.

## Product Principles

1. **Velocidade operacional acima de tudo nas telas de portão** (entrada/saída de veículo): poucos campos, ação em um clique, feedback imediato.
2. **Precisão e transparência nas regras de preço**: qualquer usuário administrativo deve entender exatamente que regra de cobrança está ativa e por quê.
3. **Confiança visual**: sistema de gestão financeira/operacional — o layout deve transmitir seriedade e controle, não parecer um protótipo.
4. **Responsivo por padrão**: toda tela nova deve funcionar bem em desktop (uso administrativo) e mobile (uso no local), sem duas implementações divergentes.
5. **Wizards claros para fluxos longos**: cadastro de preço e adesão ao sistema são multi-etapa e devem guiar o usuário sem sobrecarregar uma única tela.

## Accessibility & Inclusion

Nenhum requisito específico de acessibilidade foi confirmado ainda além das boas práticas padrão (contraste, navegação por teclado, leitores de tela) já cobertas pela skill `claude-design`.
