# Roteiro de conferência manual: Serviços

Cobre as três verificações que ficaram abertas: **T24b** e **T30** (`servicos-melhorias`) e **T12** (`servicos-menu-separado`). O que dá para automatizar já passou (`tsc`, `eslint`, `vitest` das pastas tocadas); isto é o que só se vê com o app rodando.

**Antes de começar:** use uma empresa de teste (os passos criam, editam e cancelam serviços), com o módulo de serviços ligado em Configurações. Tenha um carro no pátio de cada categoria que for testar e um usuário de cada perfil: Administrador, Gerente, Caixa, Manobrista, Lavador e Financeiro.

**Tamanhos:** 360 px (celular), 768 px (tablet) e 1280 px (computador). **Temas:** claro e escuro. Em cada tela, olhe: sem rolagem horizontal, texto sem cortar, foco visível ao navegar por Tab, e o que a cor indica também dito em texto.

## 1. Menu e acesso (T12)

| Perfil | Menu mostra | Não mostra |
|---|---|---|
| Lavador, Manobrista, Caixa | **Fila de serviços** em Operação (rótulo "Fila" na barra do celular) | Catálogo de serviços |
| Administrador, Gerente | **Catálogo de serviços** em Configurações, depois de Gestão de Preços (rótulo "Catálogo") | Fila de serviços |
| Financeiro | nada de Serviços | Fila e Catálogo |

- [ ] Cada perfil vê só o que está na tabela, no computador (menu lateral) e no celular (barra inferior e painel "Mais").
- [ ] O ícone do catálogo (lista) é diferente do da fila (gota), com o menu lateral recolhido.
- [ ] Digitar `/servicos/catalogo` como Lavador, Caixa, Manobrista ou Financeiro leva a "acesso negado".
- [ ] Digitar `/servicos` como Financeiro leva a "acesso negado"; como Administrador ou Gerente, leva direto a `/servicos/catalogo`.
- [ ] `/servicos?aba=catalogo&servico=<id>` como Administrador abre o catálogo com esse serviço selecionado; `/servicos?aba=catalogo` como Caixa abre a fila.
- [ ] Com o módulo desligado em Configurações, as duas telas mostram o aviso "Os serviços estão desligados nesta empresa".
- [ ] O tour de boas-vindas mostra o passo certo de cada perfil ("Fila de serviços" em Operação; "Catálogo de serviços" em Configurações).

## 2. Catálogo, lista (T24b, T30)

- [ ] A lista mostra nome, preço ("a partir de" quando varia), tempos ("1 h · até 2 h grátis" ou "cobra permanência") e as pílulas de categoria, as que o serviço não atende riscadas.
- [ ] A busca acha por nome (e, no computador, pela descrição); no celular só pelo nome. "Limpar busca" funciona.
- [ ] Os chips "N ativos" e "N com tempo grátis no pátio" batem com a lista.
- [ ] Catálogo vazio: "Cadastre o primeiro serviço" com o botão (Administrador/Gerente).
- [ ] No celular, o botão flutuante "Novo serviço" não cobre o último item e some dentro do detalhe.
- [ ] O detalhe mostra, em cada categoria, o valor e "leva X · Y grátis no pátio".

## 3. Cadastro e edição, computador (T24b, T30)

- [ ] **Novo serviço** abre uma página única com as seções "1 · Dados" e "2 · Preço por categoria", e os modelos no topo.
- [ ] Escolher um modelo preenche nome, descrição e as seis categorias (valor, duração e tempo grátis); tudo continua editável.
- [ ] "Repetir a 1ª linha nas vazias" copia valor e tempos e avisa "Copiado de X para N categorias."; sem valor preenchido, avisa o que fazer.
- [ ] Desligar uma categoria mostra "Não faz"; ela não vai no envio.
- [ ] A prévia "Como aparece ao lançar no carro" acompanha o que se digita ("a partir de" quando varia; "Não aparece para: …").
- [ ] Salvar sem nome, sem valor de uma categoria ligada ou sem nenhuma categoria ligada mostra o aviso junto ao campo (ou na seção) e leva o foco ao primeiro erro.
- [ ] Nome igual ao de um serviço ativo avisa antes de enviar; no back, o erro aparece no topo.
- [ ] Editar um serviço traz os dados; **Inativar serviço** fecha o formulário e pede confirmação.
- [ ] Depois de salvar, o serviço aparece selecionado na lista e o Toast confirma.

## 4. Cadastro, celular em 3 passos (T24b, T30)

- [ ] Passo 1: nome, descrição e modelos; "Próximo" barra nome vazio ou repetido.
- [ ] Passo 2: cada categoria abre uma folha; "Salvar" grava, "Fechar" descarta; o contador "N de M prontas" e "K sem valor" bate; "Usar também nas N categorias sem valor" repete o valor.
- [ ] Os chips de duração e de tempo grátis marcam a opção escolhida; "Outro (min)" aceita um valor fora das opções.
- [ ] "Revisar" barra categoria sem valor ("Faltam os valores de N categorias.").
- [ ] Passo 3: lista as categorias, o seletor de categoria muda o valor e os textos do comprovante; "Alterar categorias" volta ao passo 2.
- [ ] Girar ou redimensionar a tela no meio do cadastro não perde o que foi digitado.
- [ ] A barra de ações e a folha não ficam atrás do teclado do celular.

## 5. Fila (T24b, T30)

- [ ] Computador: três colunas (Na fila, Em andamento, Pronto) com contagem; celular: abas com contagem e uma coluna por vez; a aba fica na URL (`?status=`).
- [ ] Cabeçalho: "Lava-rápido · agora HH:MM", o resumo por status e a busca "Placa ou prisma" (maiúsculas, Esc limpa, "Limpar busca").
- [ ] Cartão: placa, "Prisma N", veículo com o nome da categoria (ex.: "Carro médio", não "3"), "+N no carro" quando o carro tem outros serviços.
- [ ] Na fila: "Na fila há N min" e "leva ~X". Em andamento: hora de início, "termina ~HH:MM", barra de progresso. Pronto: "Pronto às HH:MM" e "aguardando retirada há N min".
- [ ] Serviço em andamento além da duração: borda vermelha, "Passou N min da previsão" e "N passou da previsão" no resumo.
- [ ] "Iniciar" mostra a hora de início na hora, sem esperar a releitura; "Marcar como pronto", "Voltar" (para a fila) e "Voltar para em andamento" (de Pronto) funcionam; "Desfazer" devolve o cartão.
- [ ] Cancelar (Caixa, Manobrista, Administrador, Gerente, só em "Na fila"): título "Cancelar <serviço>?", resumo "placa · modelo", o texto do efeito na cobrança, motivos rápidos, "Manter" e "Cancelar serviço". O Lavador não vê o cancelamento.
- [ ] A fila se atualiza sozinha (a cada ~15 s) e "Atualizado há N s" avança.

## 6. Ticket do Pátio

- [ ] A folha "Adicionar serviços" mostra a duração da categoria do carro e o preço dela; serviço que não atende a categoria fica desabilitado.
- [ ] Trocar o status pelo ticket reflete na fila e o valor da saída se atualiza.

## 7. Pontos em aberto (decisão do produto ou do back)

- [ ] Frases que o back ainda não sustenta: "Aparece no recibo do cliente, junto com o valor" (descrição) e "finaliza em cerca de…" (passo 3 do celular). O comprovante e o recibo públicos hoje trazem só nome, valor, status e `livreAte`.
- [ ] Ao voltar um serviço para a fila, o que o back faz com a hora de início não está documentado: conferir no teste de "Voltar".
- [ ] Três testes antigos fora desta mudança falham (`MinhaEmpresa`, `UsuariosList`, `CaixaPage`: esperam `/dashboard` no link "Ir para o início", e o componente aponta para `/`).

Ao terminar, marque T24b, T30 e T12 nos respectivos `tasks.md` e rode o QA completo com a skill `executar-qa`, se quiser o relatório com capturas.
