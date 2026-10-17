# PRD: Configuração de meios de pagamento da empresa

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-17  
**Versão:** 1.0

---

## 1. Objetivo

Cada empresa passa a informar quais meios de pagamento aceita (Dinheiro, Pix, Cartão de crédito e Cartão de débito), tanto ao aderir ao sistema quanto depois, na tela Minha Empresa. A tela de saída de veículos passa a oferecer ao operador somente os meios que a empresa aceita, evitando cobrar por uma forma que o estacionamento não atende.

## 2. Contexto e Motivação

Hoje a tela de saída oferece sempre as mesmas quatro formas de pagamento, mesmo que a empresa não trabalhe com todas (por exemplo, não tenha maquininha de cartão). O operador pode registrar um pagamento por um meio que a empresa não aceita, e não há onde configurar isso. O cadastro da empresa e a adesão já reúnem os dados operacionais (vagas, horários), então são o lugar natural para essa configuração.

## 3. Usuários-Alvo

| Perfil | Necessidade | Contexto de uso |
|--------|-------------|-----------------|
| Responsável pela empresa (adesão) | Informar desde o início quais meios de pagamento aceita | Primeira configuração da empresa, em computador ou celular |
| Administrador da empresa (Minha Empresa) | Ligar ou desligar meios de pagamento quando a operação mudar | Ocasional, normalmente em computador |
| Operador de caixa/portaria | Ver só as formas de pagamento válidas ao dar saída | Em cada saída de veículo, com fila e pouco tempo |

## 4. Escopo

### Dentro do Escopo
- Quatro opções de liga/desliga: Dinheiro, Pix, Cartão de crédito e Cartão de débito.
- Nova seção **Pagamentos** na adesão, dentro da etapa de dados da empresa.
- Nova seção expansível **Pagamentos** na tela Minha Empresa, com visualização e edição.
- Regra de pelo menos um meio de pagamento ligado.
- Filtro das formas de pagamento oferecidas na saída de veículos conforme a configuração.

### Fora do Escopo
- Boleto e transferência bancária (não são oferecidos na saída hoje).
- Taxas, limites ou regras por meio de pagamento, e integração com maquininha ou Pix.
- Configuração por unidade, usuário ou período; tudo é por empresa.
- Mudanças em relatórios e no caixa (por exemplo, esconder formas desligadas do histórico).
- Alterar pagamentos já registrados por meios que depois foram desligados.

## 5. Requisitos Funcionais

### RF-01: Seção Pagamentos na adesão
**Critério de aceite:**
- Dado que a empresa está preenchendo os dados na adesão, quando chega à etapa de dados da empresa, então vê uma seção **Pagamentos** com os quatro meios, cada um com liga/desliga.
- Dado que a seção é exibida pela primeira vez, então apenas **Dinheiro** está ligado e os demais desligados.

### RF-02: Pelo menos um meio ligado
**Critério de aceite:**
- Dado que todos os meios estão desligados, quando o usuário tenta avançar na adesão ou salvar em Minha Empresa, então vê uma mensagem clara ("Selecione ao menos um meio de pagamento"), o salvamento é bloqueado e a seção é aberta se estiver recolhida.
- Dado que ao menos um meio está ligado, então a validação não bloqueia o envio.

### RF-03: Gravação na adesão
**Critério de aceite:**
- Dado que a adesão é concluída, então a empresa criada fica com exatamente os meios que foram ligados na adesão.

### RF-04: Seção Pagamentos em Minha Empresa
**Critério de aceite:**
- Dado um usuário que abre Minha Empresa, então vê a seção expansível **Pagamentos** com os quatro meios mostrando o estado atual da empresa.
- Dado que o usuário altera os meios e salva com sucesso, então a confirmação aparece e, ao recarregar, o novo estado é mostrado.
- Dado que o usuário descarta as alterações, então os meios voltam ao último estado salvo.
- Dado que o salvamento falha, então a mensagem aparece, o que foi marcado é mantido e é possível tentar de novo.

### RF-05: Comportamento igual ao resto do formulário
**Critério de aceite:**
- Dado que a seção está no formulário de Minha Empresa, então segue as mesmas regras do restante: controles indisponíveis durante o salvamento, indicação de progresso, e a edição reservada a quem já pode editar os dados da empresa.

### RF-06: Saída de veículos oferece só os meios aceitos
**Critério de aceite:**
- Dado que a empresa aceita apenas alguns meios, quando o operador chega à fase de pagamento da saída, então só aparecem esses meios.
- Dado que o meio inicialmente marcado (Dinheiro) não é aceito, então a primeira opção aceita vem marcada.
- Dado que só um meio é aceito, então ele vem marcado e é o único exibido.
- Dado que a configuração da empresa ainda está carregando ou falhou ao carregar, então o operador vê um estado de carregamento ou mensagem com opção de tentar de novo, e não consegue confirmar a saída sem a lista de meios.

### RF-07: Mudança de configuração vale para as próximas saídas
**Critério de aceite:**
- Dado que um meio foi desligado em Minha Empresa, então as saídas feitas depois mostram a configuração nova, sem precisar sair e entrar no sistema.
- Dado que uma saída já está aberta na fase de pagamento quando a configuração muda, então ela continua válida até ser confirmada ou descartada.

## 6. Requisitos Não-Funcionais

- **Performance:** a lista de meios aceitos não deve atrasar a abertura da fase de pagamento além do carregamento já existente.
- **Acessibilidade:** WCAG 2.2 nível AA; cada liga/desliga com nome e estado anunciados, mensagem de erro anunciada, navegação por teclado.
- **Compatibilidade:** desktop e celular, como o restante da adesão e de Minha Empresa.
- **Segurança:** a configuração só pode ser alterada por usuário autenticado com permissão de editar a empresa.

## 7. Fluxos Principais

### Fluxo 1: Adesão
1. Responsável preenche os dados da empresa e chega à seção Pagamentos.
2. Sistema mostra Dinheiro ligado e os demais desligados.
3. Responsável liga o que a empresa aceita e avança.
4. Sistema bloqueia com mensagem se nenhum meio estiver ligado; caso contrário segue para a próxima etapa.
5. Ao concluir a adesão, a empresa fica com os meios escolhidos.

### Fluxo 2: Alterar em Minha Empresa
1. Administrador abre Minha Empresa e a seção Pagamentos.
2. Altera os meios e salva.
3. Sistema valida (pelo menos um ligado), grava, confirma e mostra o novo estado.

### Fluxo 3: Saída de veículo
1. Operador localiza o veículo e chega à fase de pagamento.
2. Sistema oferece só os meios aceitos pela empresa, com o primeiro aceito marcado.
3. Operador confirma a saída com um dos meios oferecidos.

## 8. Critérios de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Saídas registradas com meio de pagamento que a empresa não aceita | Não medido | Zero |
| Empresas com a configuração de pagamentos preenchida | 0% | 100% das novas adesões |
| Pedidos de suporte para ajustar formas de pagamento | Não medido | Redução após a entrega |

## 9. Dependências e Riscos

| Dependência/Risco | Impacto | Mitigação |
|-------------------|---------|-----------|
| O back-end precisa aceitar e devolver os quatro campos de pagamento no cadastro da empresa e na adesão | Alto | Alinhar o contrato com o back antes de iniciar; sem ele a seção não grava |
| Empresas já cadastradas não têm essa configuração | Alto | Definir o valor para elas (ver Pontos em aberto) antes de liberar o filtro na saída, para não bloquear saídas |
| Operador sem acesso à configuração da empresa (perfil sem permissão) | Médio | A saída precisa conseguir ler os meios aceitos mesmo para perfis que não editam a empresa |
| Falha ao carregar a configuração impede a saída | Médio | Mensagem clara com "tentar de novo"; avaliar com o negócio se deve haver um padrão de segurança |
| Meio desligado que já aparece em registros antigos | Baixo | Fora de escopo: registros existentes não mudam |

## 10. Referências

- `docs/specs/minha-empresa/prd.md` (tela Minha Empresa)
- `docs/specs/adesao-sistema/prd.md` (adesão)
- `docs/specs/saida-localizar-e-pagar/prd.md` (fase de pagamento da saída)

---

## Pontos em aberto

- **Empresas já cadastradas:** qual valor assumir para quem ainda não tem a configuração? Sugestão: **todos ligados** até o administrador revisar, para não bloquear saídas em andamento. Confirmar com o negócio.
- **Quem pode ver na saída:** operadores de qualquer perfil precisam ler os meios aceitos; confirmar que o back entrega isso sem exigir permissão de edição da empresa.
- **Padrão na adesão:** assumido só Dinheiro ligado (resposta do solicitante); confirmar se vale também para quem aderir por links de empresas conveniadas.
- **Efeito sobre o caixa e relatórios:** assumido nenhum; confirmar se o fechamento de caixa deve esconder formas desligadas.
