# Task 10: Telas públicas e recibo em PDF

**Status:** ✅ Concluída  
**Dependências:** Tasks 02, 06

## Objetivo

> Aplicar a marca no ticket, no recibo e no comprovante públicos e no recibo em PDF (RF-05), mantendo QR e placa legíveis.

## Contexto Técnico

**Arquivos a editar:**
- `src/components/veiculos/ComprovantePublico/ComprovantePublico.styles.ts` e o componente — `Logo`, tokens, valores/horários/códigos em `fontFamilies.mono`, sem hex soltos além de cores reais de placa e QR.
- `src/app/comprovante/[token]/page.tsx` e `src/app/recibo/[token]/page.tsx` — títulos e textos.
- `src/components/veiculos/ComprovantePublico/reciboPdf.ts` — cabeçalho com marca desenhada em vetor com jsPDF (três vagas e carro em preto, texto "murel" em `helvetica bold`), centralizada acima da razão social; manter Helvetica e `toLatin1`.
- `src/components/ui/QrCode/QrCode.tsx` e `QrCode.styles.ts` — QR preto sobre branco; só o contêiner usa `giz`/`surface`.
- `src/components/veiculos/QrRecibo/*` — textos.
- Testes: `reciboPdf.test.ts`, `recibo/[token]/page.test.tsx`, `QrRecibo.test.tsx`.

## Critérios de Aceite

- [ ] Ticket, recibo e comprovante públicos mostram o logotipo Murel e o visual novo nos dois temas. (pendente: ver registro da execução)
- [ ] O PDF do recibo traz a marca em vetor no cabeçalho, sem imagem nem fonte embutida. (pendente: ver registro da execução)
- [x] O PDF continua cabendo na largura da bobina e sem texto cortado.
- [x] O QR Code continua sendo lido por leitores de ticket do sistema.
- [x] Títulos de página: "Recibo de saída — Murel", "Comprovante de entrada — Murel".

## Testes

- [x] `reciboPdf.test.ts`: gera o documento e inclui "murel" no conteúdo; sem exceção com razão social longa.
- [x] Teste de página pública: título e marca presentes.
- [x] `QrRecibo.test.tsx`: QR gerado e legível pelo parser de `qr.ts`.
- [ ] Verificação manual: abrir o PDF gerado e conferir o cabeçalho. (pendente: ver registro da execução)

## Notas de Implementação

> Techspec seção 5. Cores de placa Mercosul/antiga são do mundo real e ficam fora do tema.

## Registro da execução

- `pdfCupom.ts` ganhou `drawMarca(doc, y)`: desenha em vetor, em preto e centralizada, as três vagas em M (traço de 18 unidades com pontas arredondadas), o carro com os vidros "furados" (pintados da cor do papel) e a palavra "murel" em Helvetica bold. Sem imagem e sem fonte extra no PDF. Depois de desenhar, devolve o traço ao padrão (ponta reta, junção em ângulo, 0,2 mm) para as linhas tracejadas do cupom não herdarem as pontas redondas. Usada nos dois PDFs (`reciboPdf.ts` e `reciboSaidaPdf.ts`), antes da razão social.
- A marca soma cerca de 15 mm à altura do cupom; o teste que limitava o comprovante a 200 mm passou para 220 mm.
- `ComprovantePublico`: o topo deixou de ser um bloco amarelo (`primary` com o "eyebrow" em `warn`, que sumiria sobre amarelo) e virou `surface` com divisória tracejada. O eyebrow ficou em JetBrains Mono, caixa alta, cor `accent`. A marca `Logo` (28px) abre o topo do comprovante e do recibo. O código de saída (`.code`) usa a fonte mono. O recibo (`ReciboTop`) herda o topo e, na impressão, a marca vira preta.
- QR: o `QrCode` continua preto sobre quadro branco fixo nos dois temas; é a regra de leitura e fica como está (o comentário no componente explica). Os textos do recibo já estavam trocados na Task 08.
- Placa: continua com as cores reais (a faixa Mercosul azul foi ajustada na Task 06).
- Testes: 3 novos casos nos PDFs (marca aparece antes da razão social e não há imagem no arquivo) e 2 nos componentes (marca no topo). 349 testes de `src/components/veiculos` passam; `tsc` e ESLint sem erros.
- Não conferido: o PDF gerado não foi aberto (não há leitor de PDF nem conversor neste ambiente), então o desenho da marca no cupom (proporção, espaço até a razão social, vidros do carro) só foi validado pelo conteúdo do arquivo e pelos testes. As telas públicas também não foram vistas no navegador. Fica para a Task 11, com impressão do PDF em tela real.
