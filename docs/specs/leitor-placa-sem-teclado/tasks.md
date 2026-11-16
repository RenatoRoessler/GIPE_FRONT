# Tasks: Leitor de placa sem teclado

Referências: ./prd.md, ./techspec.md

- [x] T1 — Fechar o teclado do Murel enquanto o leitor está na etapa "leitura": importar `useTeclado` e chamar `fechar()` em um `useEffect` que depende de `etapa` e roda só quando `etapa === "leitura"`.
  - Arquivos: `src/components/veiculos/LeitorPlacaModal/LeitorPlacaModal.tsx`
  - Pronto quando: ao abrir o leitor com o teclado de placa aberto, a folha do teclado some; ao ir para a conferência o teclado de correção continua funcionando; ao voltar por "Ler de novo" o teclado fecha de novo.

- [x] T2 — Trocar o botão "Cancelar" do rodapé de leitura por "Digitar Placa" e ligar o clique em `onDigitar` (que por padrão já é `onClose`). O rodapé de falha ("Tentar de novo" / "Digitar") não muda.
  - Arquivos: `src/components/veiculos/LeitorPlacaModal/LeitorPlacaModal.tsx`
  - Pronto quando: nos estados `pedindo`, `lendo` e `pre-leitura` o botão exibe "Digitar Placa"; tocar nele chama `onDigitar` (ou `onClose` se não for passado) e não chama `onConfirm`.
  - Depende de: T1 (mesmo arquivo; fazer em sequência)

- [x] T3 — Atualizar os testes existentes do leitor: trocar `name: "Cancelar"` por `"Digitar Placa"` e ajustar o teste "cancela a leitura sem confirmar nada" para cobrir `onDigitar` informado e o padrão `onClose`.
  - Arquivos: `src/components/veiculos/LeitorPlacaModal/LeitorPlacaModal.test.tsx`
  - Pronto quando: nenhuma referência a "Cancelar" resta nesse arquivo e os testes antigos passam com o novo texto.
  - Depende de: T2

- [x] T4 — Adicionar testes do fechamento do teclado: com `TecladoProvider` real (ou mock de `useTeclado`), verificar que `fechar` é chamado ao montar o leitor em "leitura" e de novo após conferência → "Ler de novo", e que não é chamado enquanto a conferência está aberta.
  - Arquivos: `src/components/veiculos/LeitorPlacaModal/LeitorPlacaModal.test.tsx`
  - Pronto quando: os novos testes passam e falham se o `useEffect` da T1 for removido.
  - Depende de: T1, T3

- [x] T5 — Verificação final: rodar `npm run lint`, os testes dos componentes de veículos e mensalistas (`LeitorPlacaModal`, `EntradaVeiculoModal`, `BuscaManualSaida`, `MensalistaModal`) e `npm run build`; conferir no celular que o teclado não aparece na leitura, que não pisca na abertura automática da entrada e que "Digitar Placa" devolve o teclado ao campo na entrada e na busca da saída.
  - Arquivos: nenhum (só execução)
  - Pronto quando: lint, testes e build passam sem erros; os três pontos manuais acima foram conferidos (ou registrados como não verificados).
  - Resultado: lint (0 erros), 866 testes de veiculos/mensalistas/teclado e build passaram. Conferencias no celular NAO verificadas (teclado fora da leitura, sem piscar na abertura automatica da entrada, "Digitar Placa" devolvendo o teclado ao campo).
  - Depende de: T1–T4
