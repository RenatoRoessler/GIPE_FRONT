# PRD: Minha Empresa

## Problema
Depois da adesão, o responsável pela empresa não tem como conferir nem corrigir os dados cadastrados (dados cadastrais, endereço, vagas e horários de funcionamento). Qualquer mudança, como novo telefone, mais vagas ou horário alterado, hoje exigiria intervenção fora do sistema.

## Objetivo
Uma tela "Minha Empresa" em que o usuário logado visualiza e edita os dados da própria empresa, com os mesmos campos preenchidos na adesão, organizados em 3 seções expansíveis (accordion) em vez de 3 etapas.

## Usuário-alvo
Usuário autenticado que administra a empresa (hoje o perfil Administrador) e precisa consultar ou atualizar os dados cadastrais, as vagas e os horários de funcionamento.

## Requisitos funcionais
- RF1: Existe uma tela "Minha Empresa", acessível apenas por usuário logado, que carrega e exibe os dados atuais da empresa dele.
- RF2: Os dados são agrupados em 3 seções expansíveis, equivalentes às 3 etapas da adesão:
  - **Dados da empresa**: CNPJ, razão social, nome fantasia, tipo de empresa, telefone, endereço (CEP, logradouro, número, bairro, cidade, estado) e quantidade de vagas de moto e de carro.
  - **Funcionamento**: para cada um dos 7 dias da semana, se a empresa abre, se abre 24 horas e, quando aplicável, horário de abertura e de fechamento.
  - **Usuário titular**: ver "A definir" abaixo.
- RF3: Os campos usam as mesmas regras de validação e máscara da adesão (CNPJ, CEP, telefone, vagas inteiras maiores ou iguais a zero, horários coerentes por dia).
- RF4: O usuário pode editar os campos e salvar as alterações em uma única ação.
- RF5: Durante o salvamento os controles ficam indisponíveis, evitando envio duplicado, e há indicação de progresso.
- RF6: Ao salvar com sucesso, o usuário vê confirmação e os dados exibidos refletem o que foi salvo.
- RF7: Se o salvamento for recusado ou falhar (rede, tempo esgotado, erro do servidor), o usuário vê mensagem clara em português e mantém o que digitou.
- RF8: Enquanto os dados carregam há indicação de carregamento; se o carregamento falhar, há mensagem e opção de tentar de novo.
- RF9: O usuário pode descartar as alterações e voltar aos últimos dados salvos.

## Fora de escopo
- Troca ou exclusão da empresa e alteração de plano/cobrança.
- Edição de dados de outros usuários (cabe a "Gestão de usuários").
- Troca de senha (fluxo próprio já existente).
- Histórico/auditoria de alterações.
- Upload de logo ou imagens da empresa.

## A definir
- **Seção "Usuário titular"**: o endpoint de empresa não retorna nem aceita dados do usuário (somente empresa, endereço, vagas e horários). Premissa desta versão: a tela tem **2 seções** (Dados da empresa e Funcionamento), pois os dados do titular não vêm desse endpoint. Confirmar se a 3ª seção deve existir e de onde viria.
- **Campos editáveis**: confirmar se CNPJ pode ser alterado ou deve aparecer somente leitura.
- **Perfis com permissão de edição**: confirmar se apenas Administrador edita ou se os demais perfis apenas visualizam (alinhar com o PRD de permissões).
- **Formato enviado ao backend**: confirmar se máscaras (CNPJ, telefone, CEP) são enviadas ou apenas dígitos; o exemplo recebido mistura os formatos.
- **Código dos dias da semana**: confirmar a correspondência entre código e dia (assumido o mesmo da adesão: 1 = domingo).
- **Horário que atravessa a meia-noite**: assumido não suportado, como na adesão.

## Critérios de aceite
- [ ] A tela "Minha Empresa" só abre para usuário logado e mostra os dados da empresa dele.
- [ ] Os dados aparecem organizados em seções expansíveis, e o usuário consegue abrir e fechar cada uma sem perder o que editou.
- [ ] Todos os campos da adesão (empresa, endereço, vagas e horários) aparecem preenchidos com os valores atuais.
- [ ] Campos inválidos mostram mensagem no próprio campo e bloqueiam o salvamento; se o erro está numa seção recolhida, ela é aberta para mostrá-lo.
- [ ] Dia marcado como fechado ou 24 horas não exige nem permite horários; dia aberto exige abertura e fechamento com fechamento posterior à abertura.
- [ ] Ao salvar com sucesso, aparece confirmação e recarregar a página mostra os dados atualizados.
- [ ] Recusa do backend ou falha de comunicação mostra mensagem compreensível, mantém o que foi digitado e permite tentar de novo.
- [ ] Não é possível disparar dois salvamentos ao mesmo tempo.
- [ ] Descartar alterações restaura os últimos dados salvos.
- [ ] A tela funciona de forma responsiva em desktop e mobile.

## Métricas de sucesso
- Redução de pedidos de suporte para alterar dados cadastrais da empresa.
- Taxa de salvamentos concluídos sem erro sobre o total de tentativas.
