# PRD: Teclados customizados no celular

## Problema
No celular, o operador do pátio preenche placa, valores, tickets e textos curtos com o teclado padrão do sistema operacional. Esse teclado é genérico: mostra letras e números juntos na placa, deixa digitar caracteres que o campo não aceita (acentos, símbolos, emojis), ocupa a tela de forma imprevisível e varia entre Android e iOS. O operador trabalha em pé, com pressa e muitas vezes com uma mão só, então cada toque errado ou troca de teclado custa tempo e gera dado inconsistente (placa inválida, valor com formato errado, modelo com acento).

## Objetivo
No celular e no tablet, os campos de texto do app passam a usar três teclados próprios do Murel, desenhados para cada tipo de dado, que só oferecem o que o campo aceita. No computador nada muda: os campos continuam usando o teclado físico, com as mesmas regras de filtro.

Os protótipos de referência estão em `murel-site/docs/specs/`: `Teclado_Placa_Murel.html`, `Teclado_Numerico_Murel.html` e `Teclado_Alfanumerico_Murel.html`.

## Usuário-alvo
- **Operador do pátio / manobrista**: registra entrada e saída, recebe pagamento e abre/fecha caixa no celular ou tablet, em pé, com pressa.
- **Gestor / administrador** que usa o app no celular para cadastros (mensalistas, preços, empresas, usuários).

## Requisitos funcionais

### Comportamento comum aos três teclados
- RF1: Os teclados só aparecem em dispositivos de toque sem mouse (celular e tablet). No computador o campo usa o teclado físico, com o mesmo filtro de caracteres.
- RF2: Ao focar um campo coberto por um dos teclados, o teclado do sistema não abre e o teclado do Murel aparece fixo na parte de baixo da tela, respeitando a área segura do aparelho.
- RF3: O campo focado fica visível acima do teclado (rola a tela se preciso) e tem destaque de foco.
- RF4: Tocar numa tecla não tira o foco do campo. Cada toque dá retorno tátil leve (vibração curta) quando o aparelho suportar.
- RF5: Tocar fora do campo e do teclado, ou sair do app/aba, fecha o teclado.
- RF6: Os campos continuam filtrando o que é digitado por teclado físico ou colado, aplicando as mesmas regras do teclado de toque.
- RF7: A tecla de ação amarela avança para o próximo campo da tela ("Próximo"); no último campo vira "OK" e fecha o teclado.
- RF8: O teclado de toque respeita o limite de caracteres do campo: ao atingir o limite, as teclas de caractere ficam desabilitadas.
- RF9: Teclas desabilitadas ficam visualmente distintas das ativas, e o teclado respeita a preferência de movimento reduzido (sem animação de entrada).

### Teclado de placa
- RF10: Usado no campo de placa do veículo. Mostra apenas o tipo de caractere válido para a posição atual: posições 1 a 3 só letras; posição 4 só números; posição 5 letra (Mercosul) ou número (modelo antigo); posições 6 e 7 só números.
- RF11: Quando só números são aceitos, o teclado mostra o bloco numérico (1-2-3 / 4-5-6 / 7-8-9 / 0) com apagar; quando letras são aceitas, mostra o QWERTY (e a fileira de números na posição 5).
- RF12: O campo detecta e formata o modelo da placa (Mercosul `ABC1D23` ou antigo `ABC-1234`), indica o tipo e valida o formato, com mensagem clara quando inválida.
- RF13: Ao completar uma placa válida, o teclado fecha sozinho.

### Teclado numérico
- RF14: Usado em campos numéricos: nº do ticket, valores em R$, quantidades (vagas, km, dias), códigos. Layout de discador (1-2-3 / 4-5-6 / 7-8-9 / 0), com apagar, "Próximo", ponto/hífen e vírgula na coluna da direita.
- RF15: Cada campo declara seu modo: **inteiro** (só dígitos), **decimal** (dígitos e vírgula, até 2 casas, vírgula não pode ser o primeiro caractere) ou **livre** (dígitos, vírgula, ponto e hífen; toque em ".-" insere ponto, segurar insere hífen).
- RF16: Teclas que o modo do campo não aceita ficam desabilitadas (ex.: vírgula em campo inteiro, ponto/hífen fora do modo livre, vírgula repetida).

### Teclado alfanumérico
- RF17: Usado em campos de texto curto: modelo, cor/observação e demais textos livres curtos. Mostra o QWERTY e uma tecla "123" que troca para o bloco numérico; no bloco numérico a tecla "ABC" volta às letras. Ao mudar de campo, volta às letras.
- RF18: Aceita letras A–Z (sempre maiúsculas, sem acento), números, espaço, ponto, hífen e vírgula. Não aceita espaço no início nem dois espaços seguidos. Espaços sobrando no fim são removidos ao avançar ou fechar.
- RF19: Tem versão para modo dia e modo noite, seguindo o modo do aparelho/app.

### Onde se aplica
- RF20: Campos de **placa** usam o teclado de placa. Campos de **valor, quantidade, ticket e outros números inteiros ou decimais** usam o teclado numérico. Campos de **texto curto em maiúsculas sem acento** usam o teclado alfanumérico.
- RF21: Campos que exigem outros caracteres mantêm o teclado do sistema: e-mail, senha, telefone, CPF/CNPJ, CEP e textos longos com acento ou minúsculas. A lista definitiva de campos por tela fica no Tech Spec, a partir do levantamento dos campos do app.

## Fora de escopo
- Teclado instalável no sistema (IME no Android / Keyboard Extension no iOS): os teclados valem só dentro do app.
- Acentos, minúsculas, símbolos e emojis no teclado alfanumérico.
- Campos de e-mail, senha, telefone, CPF/CNPJ, CEP e textos longos (mantêm o teclado do sistema, ver RF21).
- Mover o cursor dentro do texto: nesta versão o teclado insere e apaga sempre no fim do campo.
- Teclado de data/hora e seletores já existentes.
- Alterar regras de negócio ou validações do backend.
- Mudanças em versão desktop.

## Critérios de aceite
- [ ] No celular, ao focar o campo de placa, abre o teclado de placa e o teclado do sistema não aparece.
- [ ] O teclado de placa só habilita letras ou números conforme a posição (3 letras, 1 número, letra ou número, 2 números); não é possível digitar uma placa fora do formato.
- [ ] A placa é formatada como Mercosul ou antigo conforme o 5º caractere, e fecha o teclado sozinha ao ficar válida.
- [ ] Em campos numéricos, o teclado respeita o modo do campo (inteiro, decimal, livre): vírgula só onde cabe, no máximo 2 casas decimais, hífen apenas segurando ".-" no modo livre.
- [ ] O teclado alfanumérico só gera maiúsculas sem acento; "123" e "ABC" alternam o bloco numérico e o de letras.
- [ ] "Próximo" passa ao próximo campo do mesmo tipo da tela; no último campo vira "OK" e fecha.
- [ ] Tocar nas teclas não tira o foco do campo, e o campo focado fica visível acima do teclado.
- [ ] Tocar fora fecha o teclado.
- [ ] No computador, os campos usam o teclado físico e rejeitam os mesmos caracteres que o teclado de toque.
- [ ] Texto colado é limpo conforme a regra do campo.
- [ ] Os teclados são legíveis em modo dia e noite, com teclas de pelo menos 44 px de altura (largura mínima de 24 px nas teclas de letra, como em todo teclado QWERTY) e contraste adequado.
- [ ] Teclas têm rótulo acessível (apagar, espaço, próximo, ponto, vírgula, trocar para números/letras).

## Pontos em aberto
- **Lista de campos por teclado**: confirmar com o produto quais telas e campos entram (levantamento a fazer no Tech Spec) e quais mantêm o teclado do sistema. Hoje há campos de valor, ticket, quantidade e duração em caixa, saída, preços e mensalistas que parecem candidatos ao numérico.
- **Campos com acento ou minúsculas** (nome de pessoa, razão social, endereço): definir se continuam no teclado do sistema (proposta) ou se ganham um teclado próprio em outra versão.
- **Telefone, CPF/CNPJ e CEP**: manter o teclado do sistema (`tel`/`numeric`) ou usar o numérico do Murel? Esses campos já têm máscara própria.
- **Cursor**: confirmar se inserir e apagar sempre no fim do campo é suficiente para as telas escolhidas.
- **Modo dia/noite**: resolvido na spec de design. O app já tem tema claro e escuro (`theme.ts`) e os teclados usam esses tokens.
- **Quadro de chaves e "cor"**: o campo cor foi trocado por lista fixa na spec `melhoria-fluxo-entrada`; confirmar se "cor" ainda aparece como texto em algum fluxo.

## Métricas de sucesso
- Redução de placas inválidas e de campos corrigidos após a digitação.
- Menor tempo médio para registrar uma entrada no celular.
- Menos trocas de teclado do sistema (letras ↔ números) durante o preenchimento.
