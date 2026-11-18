# PRD: Logo animado do Murel

> Referência: `prototipo.html` (cópia de `murel-patio-celular.html`, nesta pasta). Revê a regra de animação do logotipo definida em `docs/specs/identidade-murel/` (hoje só o logotipo grande de login e adesão anima, com o carro subindo até a vaga uma vez).

## Problema
O símbolo do Murel são três vagas com um carro estacionado na do meio, mas hoje essa ideia só ganha movimento no login e na adesão, e de forma mínima (o carro sobe até a vaga). No resto do sistema e nas páginas que o cliente abre, o logo é estático. Existe um exemplo aprovado em que o carro "vive" o pátio: chega pela rua, estaciona, espera e vai embora. Isso conta em poucos segundos o que o produto faz e reforça a marca em todos os pontos de contato.

## Objetivo
O logo do Murel tem a animação do exemplo (o carro entra pela rua, estaciona na vaga do meio, fica parado, sai de ré e vai embora) no cabeçalho do sistema, no login e na adesão, e nas páginas públicas. A animação se repete algumas vezes e para com o carro estacionado, que é o logo de sempre.

## Usuário-alvo
- Operadores, caixas, gerentes e administradores, que veem o cabeçalho o dia todo no celular ou no computador.
- Quem está entrando no sistema ou contratando (login e adesão).
- O cliente do estacionamento, que abre o comprovante, a consulta do ticket ou o recibo pelo QR Code.

## Requisitos funcionais

### Animação
- RF1: O ciclo segue o exemplo, nesta ordem:
  1. O carro entra pela direita, por uma "rua" abaixo do logo, faz a curva e sobe até a vaga do meio.
  2. Freia (luz de freio acende) e fica estacionado, com os faróis se apagando.
  3. Acende a luz de ré, sai de ré refazendo a curva até a rua e para (troca de marcha).
  4. Segue para a esquerda até sair do logo.
  5. O logo fica vazio por um instante antes do próximo ciclo.
- RF2: Os detalhes do carro do exemplo fazem parte da animação: faróis com facho de luz, luz de freio e luz de ré.
- RF3: A animação roda **2 ciclos** (cerca de 30 segundos no total) e **para com o carro estacionado na vaga do meio**, ou seja, o logo termina igual ao logo estático de hoje.
- RF3a: **Reinício (revisão de 2026-11-18):** terminada sozinha, a animação espera **2 minutos** com o carro estacionado e roda os 2 ciclos de novo, enquanto a página estiver aberta. Se o usuário parar pelo logo (RF14), ela não recomeça mais.
- RF4: O carro segue as regras de cor da marca: amarelo nos temas claro e escuro; sobre fundo amarelo, tudo em asfalto, como o logo já faz hoje.

### Onde anima
- RF5: **Cabeçalho do sistema**: o logo do topo das telas logadas anima quando o sistema é aberto ou recarregado, e não a cada troca de tela.
- RF6: **Login e adesão**: o logotipo grande usa a nova animação no lugar da atual (carro subindo até a vaga).
- RF7: **Páginas públicas**: o logo do comprovante digital, da consulta do ticket, do recibo e das páginas de aceite e de mensagem do contrato anima quando a página abre.
- RF8: Onde o logo aparece só com o símbolo (sem a palavra "murel", como no cabeçalho do celular estreito), a animação também funciona, com o carro entrando e saindo pelas laterais do símbolo.
- RF9: O cartaz do ticket (feito para imprimir) e qualquer versão impressa continuam com o logo estático.

### Acessibilidade e comportamento
- RF10: Com a preferência do aparelho por **menos movimento**, não há animação: o logo aparece direto com o carro estacionado.
- RF11: A animação não muda o tamanho nem a posição do logo e não empurra nada ao redor; o carro pode passar por fora do desenho do símbolo, mas sem cobrir botões ou textos vizinhos de forma que atrapalhe a leitura ou o toque.
- RF12: O logo continua com o mesmo nome acessível ("Murel") e, no cabeçalho, continua sendo o link para o início. A animação não é anunciada pelo leitor de tela.
- RF13: A animação não deixa o sistema mais lento nem atrasa a abertura das telas.
- RF14: **Parar pelo logo (WCAG 2.2.2)**: enquanto a animação roda, o usuário consegue pará-la pelo próprio logo, sem sair da tela. Ao parar, o carro vai direto para a vaga e o logo fica estático até a página ser aberta de novo.
  - Com mouse: passar o mouse sobre o logo para a animação.
  - Com teclado: focar o logo para a animação.
  - Com toque: tocar no logo para a animação.
- RF15: No **cabeçalho**, onde o logo é o link para o início: enquanto a animação roda, o primeiro toque ou clique só para a animação e não navega; com a animação parada (por ter terminado ou por ter sido parada), o toque ou clique leva ao início, como hoje. Pelo teclado, Enter no logo focado sempre leva ao início (o foco já parou a animação).
- RF16: Fora do cabeçalho, o logo não é link; o toque só para a animação.

## Fora de escopo
- Mudar o desenho do símbolo, da palavra "murel", as cores da marca ou o tamanho do logo.
- Animar outros elementos (menu, botões, cards) ou criar novas animações além do ciclo do exemplo.
- Botão ou configuração para o usuário ligar e desligar a animação, além de parar pelo logo (RF14) e da preferência de movimento reduzido do aparelho.
- O resto do exemplo (lista do Pátio, cards, menu inferior): ele serve só como referência da animação do logo.

## Critérios de aceite
- [ ] O ciclo do carro (entrar, estacionar, sair de ré, ir embora, logo vazio) é igual ao do exemplo, com faróis, freio e luz de ré.
- [ ] Depois de 2 ciclos, a animação para com o carro estacionado na vaga do meio.
- [ ] Passar o mouse, focar ou tocar no logo para a animação, com o carro na vaga.
- [ ] No cabeçalho, durante a animação o primeiro toque só para; com a animação parada, o toque leva ao início; Enter no logo focado leva ao início.
- [ ] O cabeçalho anima ao abrir ou recarregar o sistema e não recomeça ao trocar de tela.
- [ ] Login e adesão usam a nova animação no lugar da antiga.
- [ ] Comprovante digital, consulta do ticket, recibo e as páginas do contrato animam ao abrir.
- [ ] Com só o símbolo (cabeçalho do celular estreito) a animação funciona e termina com o carro estacionado.
- [ ] O cartaz do ticket e as impressões mostram o logo estático.
- [ ] Com "menos movimento" ligado no aparelho, não há animação.
- [ ] O logo não muda de tamanho nem desloca o layout durante a animação, nos temas claro e escuro e sobre fundo amarelo.
- [ ] O logo do cabeçalho continua levando ao início e mantém o nome acessível.

## Decisões
- **Ciclos:** 2 (cerca de 30 segundos), terminando com o carro estacionado; recomeça a cada 2 minutos, salvo se o usuário parar pelo logo.
- **Acessibilidade (WCAG 2.2.2):** como a animação passa de 5 segundos, ela pode ser parada pelo próprio logo (RF14 a RF16), além de não rodar com a preferência de movimento reduzido.
- **Contrato:** as páginas de aceite e de mensagem do contrato contam como páginas públicas e animam.

## Métricas de sucesso
- Nenhum aumento de reclamações sobre lentidão ou distração no cabeçalho depois do lançamento.
- A animação aparece, termina e para nas telas listadas, sem quebra de layout nos testes de QA nos dois temas.
