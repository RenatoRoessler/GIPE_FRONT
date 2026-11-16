# Tech Spec: Leitor de placa sem teclado

## Referências
- PRD: ./prd.md
- Design: seção "Design" abaixo (ajuste pontual; sem nova spec de `claude-design`)

## Causa do problema
O campo de placa (entrada, busca da saída, mensalistas) tem teclado próprio, aberto pelo `TecladoProvider` quando o campo recebe foco. Ao tocar no ícone de câmera, o `LeitorPlacaModal` abre por cima, mas nada avisa o provider: ele continua com `alvo` e `config` ativos e a folha do teclado segue na tela, embaixo do leitor (como na captura do pedido). O `TecladoProvider` só fecha o teclado por toque fora, `Escape`, troca de rota, aba oculta ou `close` do `<dialog>` do próprio campo. Abrir outro modal não está na lista.

## Design
- **Telas/estados**: só a etapa "leitura" do `LeitorPlacaModal` muda. A etapa "conferência" (placa lida em dúvida, com `Input` de correção) mantém o teclado de placa, que ali é necessário.
- **Texto do botão**: o botão secundário do rodapé, hoje "Cancelar" (estados `pedindo`, `lendo` e `pre-leitura`), passa a "Digitar Placa". O rodapé de falha (`sem-leitura`, `negada`, `indisponivel`) já tem "Digitar" e continua como está (ver trade-offs).
- **Componentes do design system reaproveitados**: `Button` (`variant="secondary"`), `Modal`. Nada novo.
- **Tokens de tema**: nenhum novo.

## Arquitetura da solução

### Arquivos afetados
- `src/components/veiculos/LeitorPlacaModal/LeitorPlacaModal.tsx`
  1. Importar `useTeclado` de `@/components/teclado/TecladoProvider`.
  2. Em `LeitorPlacaAberto`, fechar o teclado do Murel sempre que a etapa for "leitura":
     ```ts
     const { fechar: fecharTeclado } = useTeclado();
     useEffect(() => {
       if (etapa === "leitura") {
         fecharTeclado();
       }
     }, [etapa, fecharTeclado]);
     ```
     Cobre a abertura do leitor (RF1) e o "Ler de novo" vindo da conferência, em que o `Input` de correção deixava o teclado aberto.
  3. Botão do rodapé: texto "Cancelar" → "Digitar Placa" e `onClick={onClose}` → `onClick={onDigitar}`. `onDigitar` já tem como padrão `onClose` (`onDigitar = onClose`), então quem não passa `onDigitar` (mensalistas) continua só fechando. Entrada e busca da saída passam `handleDigitarPlaca`, que fecha o leitor e devolve o foco ao campo da placa, reabrindo o teclado (RF3).
- `src/components/veiculos/LeitorPlacaModal/LeitorPlacaModal.test.tsx`
  - Atualizar os testes que procuram `name: "Cancelar"` (linhas ~69, 74, 149, 225) para "Digitar Placa".
  - O teste "cancela a leitura sem confirmar nada" passa a validar que o botão chama `onDigitar` e não chama `onConfirm`; sem `onDigitar`, chama `onClose`.
  - Novo teste: com um `TecladoProvider` real (ou mock de `useTeclado`) e um teclado aberto, montar o leitor em "leitura" e verificar que `fechar` foi chamado; ir para a conferência (leitura em dúvida) e voltar com "Ler de novo" e verificar que `fechar` é chamado de novo.
- Os testes de `EntradaVeiculoModal` e `BuscaManualSaida` não procuram "Cancelar" do leitor (verificado por busca); não precisam mudar.

### Tipos e dados
Nenhum tipo novo. `useTeclado().fechar` já existe e é estável (`useCallback`).

### Server vs. Client
Tudo continua Client Component (`"use client"` já presente).

## Decisões e trade-offs
- **Corrigir no leitor, não nos três chamadores.** O leitor é usado em entrada, busca da saída e mensalistas, e todos têm o mesmo defeito. Fechar o teclado dentro do `LeitorPlacaModal` resolve os três e vale para qualquer novo uso. A alternativa, cada tela chamar `fechar()` ao abrir o leitor, duplicaria a regra.
- **`fechar()` por efeito, não por `blur`.** O teclado do Murel é controlado pelo provider, não pelo foco do navegador. Tirar o foco do campo não o fecharia, e ainda dispararia `onBlur` do formulário (por exemplo, a consulta do cadastro da placa na entrada).
- **Teclado do sistema.** Em aparelhos de toque o campo usa `inputMode="none"`, então o teclado do sistema não abre. Em desktop o teclado é o físico e não aparece na tela. Nada a fazer.
- **Botão da falha continua "Digitar".** O PRD pede mudar só o "Cancelar". Quando a câmera falha, o botão "Digitar" já diz isso com a mesma ação. Unificar o texto para "Digitar Placa" é opcional e pode ser decidido na revisão.
- **Mensalistas sem `onDigitar`.** Ali "Digitar Placa" só fecha o leitor e o foco volta ao botão da câmera; o operador toca no campo para o teclado voltar. Dar foco ao campo exigiria mudar `MensalistaModal`, e o PRD cita entrada e saída. Fica como está, a menos que se queira o mesmo comportamento lá.
- **Sem `aria-label` extra.** O texto visível "Digitar Placa" já é o nome acessível (RF5).

## Riscos / pontos de atenção
- **Foco devolvido ao campo.** Ao fechar o leitor, o `Modal` devolve o foco a quem o abriu e `handleDigitarPlaca` foca o campo da placa, que reabre o teclado: é o desejado em RF3. Confirmar no celular que o teclado não pisca fechado e aberto na abertura do leitor da entrada (o leitor abre sozinho logo depois do modal, com `setTimeout(…, 0)`).
- **Ordem dos efeitos na conferência.** O `Input` de correção abre o teclado ao receber `autoFocus`. O `fechar()` só roda na etapa "leitura", então não o fecha na conferência. Verificar manualmente o caminho leitura → conferência → "Ler de novo".
- **Teste dependente de `TecladoProvider`.** `renderWithTheme` pode não incluir o provider; sem ele `useTeclado` devolve o contexto vazio (`SEM_PROVIDER`), e o teste precisa envolver o leitor num provider ou mockar `useTeclado`.

## Fora de escopo técnico
- Mudar o `TecladoProvider` (por exemplo, fechar sozinho ao abrir qualquer outro `<dialog>`).
- Mudar o `useLeitorPlaca`, o reconhecimento ou a conferência.
- Mudar o texto "Digitar" do rodapé de falha e a tela `VisorPlacas` da conferência de pátio.
- Dar foco ao campo de placa em `MensalistaModal` ao tocar em "Digitar Placa".
