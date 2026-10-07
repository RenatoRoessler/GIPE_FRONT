# PRD: Integração do Fluxo de Adesão com o Backend

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-06  
**Versão:** 1.0

---

## 1. Objetivo

Fazer o fluxo de adesão cadastrar de verdade a empresa e o usuário titular no sistema, enviando os dados ao backend em vez de simulá-los. Para isso, o fluxo passa a coletar todas as informações que o backend exige: endereço detalhado, quantidade de vagas e horários de funcionamento.

O valor para o usuário é sair da adesão com a conta realmente criada e conseguir entrar no sistema.

## 2. Contexto e Motivação

O fluxo de adesão é o responsável pelo cadastro da empresa e do usuário titular. Quem recebe o link de adesão cadastra a empresa e, em seguida, o titular. Hoje o fluxo (`docs/specs/adesao-sistema`) apenas simula o salvamento. A base de comunicação com o backend já está pronta (`docs/specs/integracao-backend`), então esta é a primeira integração real. O backend exige dados que a tela atual não coleta (endereço separado em campos, vagas, horários).

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Responsável pela empresa (futuro titular) | Cadastrar a empresa e a si mesmo com o mínimo de atrito e saber se deu certo | Primeiro contato com o GIPE, a partir de um link recebido, em desktop ou celular |

## 4. Escopo

### Dentro do Escopo
- Envio do cadastro (empresa, horários e usuário titular) ao backend ao concluir a adesão.
- Fluxo com **3 etapas**: Dados da empresa, Funcionamento e Usuário titular.
- Novos campos na etapa da empresa: endereço detalhado (logradouro, número, bairro, cidade, estado, CEP), quantidade de vagas de moto e de carro.
- Nova etapa "Funcionamento" com os 7 dias da semana.
- Novo campo de celular do usuário titular; nome e sobrenome passam a ser um único campo "Nome completo".
- Manter o nome fantasia da empresa, que será enviado ao backend (o backend vai passar a aceitá-lo).
- Exibir erros devolvidos pelo backend em uma mensagem no topo da tela.
- Manter o redirecionamento ao login com aviso de sucesso após o cadastro.

### Fora do Escopo
- Exibição de erros por campo vindos do backend (até o formato de erro ser conhecido).
- Preenchimento automático de endereço pelo CEP e consulta de CNPJ em serviços externos.
- Confirmação de e-mail, aprovação manual, cobrança/plano (já fora de escopo na adesão original).
- Migrar login, recuperação de senha ou outras telas para o backend.
- Editar dados da empresa ou dos horários depois do cadastro.
- Salvamento de rascunho ou retomada do cadastro interrompido.

## 5. Requisitos Funcionais

### RF-01: Etapa "Dados da empresa" ampliada
Campos: CNPJ, razão social, nome fantasia, tipo de empresa, telefone, endereço (logradouro, número, bairro, cidade, estado, CEP), quantidade de vagas de moto e de carro.

**Critério de aceite:**
- Dado que a etapa está aberta, quando um campo obrigatório está vazio ou inválido (CNPJ, CEP, estado, vagas), então a mensagem de erro aparece no campo e o avanço é bloqueado.
- Dado que informo quantidade de vagas, quando o valor não é um número inteiro maior ou igual a zero, então o campo é rejeitado.
- Dado que todos os campos estão válidos, quando clico em "Próximo", então avanço para a etapa "Funcionamento".

### RF-02: Etapa "Funcionamento" (horários dos 7 dias)
Para cada dia da semana: se a empresa abre, se abre 24 horas e, quando aplicável, horário de abertura e de fechamento.

**Critério de aceite:**
- Dado que um dia está marcado como fechado, quando visualizo o dia, então os horários ficam indisponíveis e não são exigidos.
- Dado que um dia está marcado como "24 horas", quando visualizo o dia, então os horários ficam indisponíveis e não são exigidos.
- Dado que um dia está aberto e não é 24 horas, quando abertura ou fechamento está vazio, então o avanço é bloqueado com mensagem no dia correspondente.
- Dado que um dia está aberto e não é 24 horas, quando o fechamento não é posterior à abertura, então o avanço é bloqueado com mensagem. **[A DEFINIR]** se há horário que atravessa a meia-noite (assumido: não nesta entrega).
- Dado que todos os 7 dias estão válidos, quando clico em "Próximo", então avanço para a etapa "Usuário titular".
- Dado que estou na etapa, quando clico em "Voltar", então retorno à etapa anterior sem perder o que preenchi.

### RF-03: Etapa "Usuário titular" ajustada
Campos: nome completo, CPF, e-mail, celular, senha e confirmação de senha.

**Critério de aceite:**
- Dado que a etapa está aberta, quando CPF, e-mail ou celular é inválido, então a mensagem aparece no campo e o envio é bloqueado.
- Dado que senha e confirmação são diferentes, quando tento salvar, então o envio é bloqueado com mensagem. A confirmação serve apenas para conferência e não é enviada ao backend.
- **[A DEFINIR]** regra de senha: assumido o mínimo atual de 6 caracteres até o backend informar a regra.

### RF-04: Envio ao backend
**Critério de aceite:**
- Dado que as 3 etapas estão válidas, quando clico em "Salvar", então os dados de empresa, horários e usuário são enviados juntos em uma única solicitação ao backend.
- Dado que o envio está em andamento, quando aguardo, então os botões ficam desabilitados e o "Salvar" indica progresso, impedindo envio duplicado.
- Dado que os campos formatados (CNPJ, CPF, telefone, celular) estão com máscara, quando enviados, então seguem o formato aceito pelo backend. **[A DEFINIR]** se o backend espera apenas dígitos (o exemplo recebido mistura dígitos e CEP com hífen).
- Dado que o tipo de empresa foi escolhido, quando enviado, então segue os mesmos códigos já usados no fluxo (1 Estacionamento, 2 Lava-rápido, 3 Valet, 4 Estacionamento + Lava-rápido).
- Dado que cada dia da semana tem um código numérico, quando enviado, então a correspondência entre dia e código segue o backend. **[A DEFINIR]** qual código é qual dia (no exemplo, o dia 1 está fechado e o 7 fecha às 16h; assumido 1 = domingo).

### RF-05: Sucesso
**Critério de aceite:**
- Dado que o backend confirma o cadastro, quando recebo a resposta, então sou levado à tela de login com o aviso de cadastro realizado.
- Dado que cadastrei o titular, quando entro na tela de login, então o aviso de sucesso está visível. **[A DEFINIR]** a validação de que o titular consegue logar depende da integração do login (fora do escopo).

### RF-06: Erros do backend
**Critério de aceite:**
- Dado que o backend recusa o cadastro (ex.: CNPJ, CPF ou e-mail já cadastrado, dados inválidos), quando recebo a resposta, então vejo uma mensagem clara no topo da etapa final e os dados preenchidos são mantidos.
- Dado que ocorre falha de rede, tempo esgotado ou erro do servidor, quando tento salvar, então vejo mensagem compreensível em português e posso tentar de novo sem preencher tudo outra vez.
- Dado que há erro exibido, quando envio novamente com sucesso, então a mensagem some.
- **[A DEFINIR]** se uma recusa por dado de uma etapa anterior (ex.: CNPJ duplicado) deve levar o usuário de volta àquela etapa; por ora a mensagem aparece na etapa final.

## 6. Requisitos Não-Funcionais

- **Performance:** o envio deve indicar progresso imediatamente; o tempo limite segue o padrão da camada de comunicação (15 s).
- **Acessibilidade:** WCAG 2.2 nível AA: rótulos em todos os campos, erros anunciados, navegação por teclado na etapa dos 7 dias, estado dos toggles perceptível sem depender só de cor.
- **Compatibilidade:** desktop e mobile responsivo, como no fluxo atual; a etapa de horários deve ser usável em tela estreita.
- **Segurança:** a senha não é exibida em mensagens de erro; dados sensíveis não são registrados em log. **Atenção:** o backend usa HTTP sem criptografia, e a senha trafega nesse canal (ver riscos).
- **Consistência visual:** segue o design system já usado na adesão.

## 7. Fluxos Principais

### Fluxo 1: Adesão concluída com sucesso
1. Responsável abre o link de adesão e preenche os dados da empresa.
2. Sistema valida os campos e avança.
3. Responsável define os horários dos 7 dias.
4. Sistema valida e avança.
5. Responsável preenche os dados do titular e clica em "Salvar".
6. Sistema envia o cadastro ao backend e mostra o progresso.
7. Backend confirma; sistema leva ao login com aviso de sucesso.

### Fluxo 2: Backend recusa o cadastro
1. Responsável conclui a etapa final e clica em "Salvar".
2. Backend recusa (ex.: CNPJ já cadastrado).
3. Sistema mostra a mensagem no topo e mantém todos os dados.
4. Responsável corrige (voltando às etapas se necessário) e tenta novamente.

### Fluxo 3: Falha de comunicação
1. Responsável clica em "Salvar" sem conexão ou com o servidor fora do ar.
2. Sistema informa que não foi possível conectar.
3. Responsável tenta de novo quando a conexão voltar, sem perder o preenchimento.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Cadastros gravados de fato no backend | 0 (mock) | 100% das adesões concluídas |
| Taxa de conclusão do fluxo (inicia etapa 1 e conclui) | A medir | Não ser inferior à do fluxo atual (A DEFINIR após medição) |
| Envios duplicados por clique repetido | n/a | 0 |
| Falhas com mensagem compreensível ao usuário | n/a | 100% dos tipos de falha cobertos |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| Backend ainda vai incluir o `nomeFantasia` no cadastro | Alto | Tratar como combinado; confirmar nome e posição do campo (assumido dentro de empresa) antes da entrega |
| Formato de erro do backend desconhecido | Médio | Mensagem única no topo; evolução para erros por campo depois |
| Código dos dias da semana, formato de máscaras e regra de senha não definidos | Médio | Marcados como [A DEFINIR]; confirmar com o time de backend |
| Backend em HTTP, sem criptografia, enviando senha | Alto | Registrar risco; HTTPS recomendado antes de produção |
| Possível bloqueio de CORS/conteúdo misto | Alto | Validar cedo (ver `docs/INTEGRACAO-BACKEND.md`) |
| Fluxo mais longo (3 etapas) pode reduzir a conclusão | Médio | Etapa de horários com padrões práticos (ex.: aplicar o mesmo horário a vários dias, a avaliar no design) |
| Cadastro de teste cria dados reais no backend | Médio | Usar dados de teste identificáveis e alinhar limpeza com o time de backend |

## 10. Referências

- `docs/input.md` (descrição e exemplo de requisição `POST /Adesao`)
- `docs/specs/adesao-sistema/` (fluxo atual)
- `docs/specs/integracao-backend/` e `docs/INTEGRACAO-BACKEND.md` (camada de comunicação)
- Tela atual: `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx`
