# Tech Spec: Recibo Público da Saída

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e registra as decisões de componente)
- Modelo a seguir: o comprovante público da entrada (`src/app/comprovante`, `src/components/veiculos/ComprovantePublico`)

## Design
- Telas/estados: os de `design.md` (página pública do recibo: carregando, recibo, não encontrado, erro com nova tentativa; bloco do QR no recibo da tela de saída, que some sem o código).
- Componentes do design system reaproveitados: `PlateDisplay`, `QrCode`, `Button`, `Skeleton`, e os estilos de página do comprovante público (`Screen`, `Column`, `Top`, `Card`, `Facts`, `Actions`, `ActionButton`, `ActionError`, `Message`, `Footnote`, `SkeletonStack`), importados de `ComprovantePublico.styles`.
- Componentes novos necessários (em `src/components/veiculos`): `ReciboPublico` (a página) e `QrRecibo` (o bloco do QR no recibo da tela de saída).
- Tokens de tema usados/criados: nenhum novo.

## Arquitetura da solução

### API e tipos
- `src/lib/api/services/patio.ts`: `consultarRecibo(token)` faz `GET /Patio/recibo/cliente?token=...` (público, sem login) e traduz `not_found` e `validation` em `ApiError("not_found", "Recibo não encontrado.", 404)`, igual ao `consultarComprovante`. Resposta convertida por um mapeador tolerante a campos ausentes.
- `src/types/veiculo.ts` (ou `src/types/recibo.ts`): `ReciboCliente` com os campos do contrato: `cnpj`, `razaoSocial`, `endereco`, `telefone`, `placa`, `modelo`, `cor`, `categoriaId`, `categoriaNome`, `dataEntrada`, `dataSaida`, `minutosPermanencia`, `permanencia`, `valor`, `formaPagamento`, `descricaoFormaPagamento`, `token`, `notaFiscalSolicitada`. Mais `mensalista?: boolean` **[A CONFIRMAR]**: o exemplo não traz esse campo.
- `src/types/saida.ts`: `SaidaRegistrada` ganha `tokenRecibo?: string | null` **[A CONFIRMAR]** (nome e presença na resposta de `POST /Patio/{id}/saida`).
- **Valor:** em **reais**, confirmado com o back (`15100.00` = R$ 15.100,00). A leitura fica num único ponto (`valorDoRecibo`), que só valida o número (ausente, inválido ou negativo vira zero).

### Rota pública
- `src/app/recibo/[token]/page.tsx` (Server Component): `metadata` com título "Recibo de saída — GIPE" e `robots: { index: false, follow: false }`; valida o token com o mesmo padrão do comprovante (`/^[A-Za-z0-9]{4,32}$/`) e devolve `ReciboNaoEncontrado` sem chamar a API quando inválido; senão renderiza `ReciboPublico`.
- `src/app/recibo/layout.tsx`: reexporta o layout de `src/app/comprovante/layout.tsx` (`export { default } from "../comprovante/layout";`) para ter o mesmo tema e fontes sem duplicar. Se o Next não aceitar o reexporte, copiar o arquivo.
- `src/proxy.ts`: acrescentar `"/recibo"` a `PUBLIC_PATHS` (e um caso em `proxy.test.ts`); atualizar o comentário.

### Página pública (`src/components/veiculos/ReciboPublico/`)
- `ReciboPublico.tsx` (Client Component): `useQuery(["recibo", token], consultarRecibo)` com `refetchOnWindowFocus: false`; estados de carregando, recibo, não encontrado e erro com "Tentar novamente"; igual em estrutura ao `ComprovantePublico`. Exporta também `ReciboNaoEncontrado`.
- `ReciboPublico.styles.ts`: só o que é próprio (o total em destaque e o que mais faltar); o resto vem de `ComprovantePublico.styles`. Inclui `@media print` que esconde as ações e a moldura de celular.
- `format.ts`: `valorDoRecibo` (lê o valor em reais, validando) e reaproveita `formatPermanencia`, `formatBRL`, `formatPhone` e o formato de CNPJ.
- Ações: **Baixar PDF** (gera no aparelho, sem chamada extra) e **Imprimir** (`window.print()`).
- Mensalista: etiqueta "Mensalista" e "Sem cobrança" quando `mensalista` for verdadeiro; sem o campo, valor zero mostra "Sem cobrança" sem a etiqueta.
- `index.ts`.

### PDF
- Extrair de `ComprovantePublico/reciboPdf.ts` os auxiliares comuns (`WIDTH`, `MARGIN`, `formatPlaca`, `toLatin1`, `drawQr`) para `src/components/veiculos/ComprovantePublico/pdfCupom.ts`; `reciboPdf.ts` passa a importá-los, sem mudar o resultado.
- `ReciboPublico/reciboSaidaPdf.ts`: monta o PDF de 80 mm com empresa, placa, linhas (entrada, saída, veículo, categoria, permanência, forma de pagamento, total) e o QR da página; mesmo esquema de medir a altura em uma passada e refazer na exata. Arquivo `recibo-<placa>.pdf`. Mensalista: "Sem cobrança" no lugar de forma e total.

### Recibo da tela de saída
- `ReciboSaidaStep.tsx`: monta `link` quando `saida.tokenRecibo` existir (`${window.location.origin}/recibo/${encodeURIComponent(token)}`) e o passa em `ReciboData`; sem token, `link: null`.
- `ReciboConteudo.tsx`: `ReciboData` ganha `link?: string | null`; quando houver, renderiza `QrRecibo` depois do total (tela e impressão, pois o recibo da impressão usa o mesmo conteúdo).
- `QrRecibo/QrRecibo.tsx` (+ estilos em `Recibo.styles.ts`): pontilhado, `QrCode` de 140px, "Leve o recibo no celular", frase de apoio e o endereço curto. Sem `link`, não renderiza nada.

### Server vs Client
- Rota `page.tsx` e `layout.tsx`: Server Components. `ReciboPublico`, `QrRecibo`, `ReciboSaidaStep`: Client Components (consulta, PDF, `window`).

## Decisões técnicas e trade-offs
- **Página irmã do comprovante, sem refatorar o comprovante:** os estilos de página são importados de `ComprovantePublico.styles` em vez de movidos para um módulo comum. Menos risco numa página que já funciona; o custo é um acoplamento entre as duas pastas, aceitável enquanto forem duas. Se surgir uma terceira página pública, extrair então.
- **Layout reexportado** em vez de copiado: uma só definição de tema e fontes para as páginas do cliente.
- **PDF gerado no aparelho** (como o comprovante): não exige endpoint nem carrega o servidor, e o QR do PDF aponta de volta para a página.
- **Leitura do valor em um ponto só (`valorDoRecibo`):** valores ausentes ou inválidos viram zero (recibo sem cobrança) sem quebrar a página.
- **Sem código do recibo, sem QR e sem erro:** o operador não precisa saber; o recibo da tela continua útil.
- **Sem nome de operador nem do mensalista na página pública:** a consulta nem os devolve, e o PRD pede que não apareçam.

## Desvios na implementação
- A rota `/recibo` reexporta o layout do comprovante (`export { default } from "../comprovante/layout"`); o Next aceitou e o build lista `/recibo/[token]`.
- A página usa estilos próprios só para o que muda na impressão (`ReciboScreen`, `ReciboColumn`, `ReciboTop`, `ReciboEyebrow`, `ReciboActions`), derivados dos do comprovante com `styled(...)`; o resto vem de `ComprovantePublico.styles`.
- O cabeçalho mostra também o CNPJ formatado (o PRD pede os dados da empresa, e o comprovante da entrada não o exibe na página).
- Os auxiliares do PDF foram extraídos para `ComprovantePublico/pdfCupom.ts` sem mudar o PDF da entrada (os testes existentes passam sem alteração).
- O bloco do QR (`QrRecibo`) inclui a linha pontilhada, para não sobrar divisória quando não há link.
- Foi apagado o cache de tipos gerado em `.next/dev/types`, que ficava desatualizado em relação à rota nova e quebrava `tsc`; o Next o recria sozinho.

## Riscos / pontos de atenção
- **Contrato do back ainda por confirmar (bloqueante para liberar):** (1) nome e presença de `tokenRecibo` na resposta que registra a saída; (2) campo que indica mensalista na consulta do recibo. Sem (1) não há QR; sem (2) a etiqueta de mensalista não aparece. A unidade do `valor` já foi confirmada (reais).
- **`forma de pagamento` do mensalista:** hoje a saída de mensalista envia a forma Dinheiro (ver feature de mensalistas); o recibo público poderia mostrar "Dinheiro" num recibo sem cobrança. A página esconde a forma quando o recibo é de mensalista ou o valor é zero.
- **Erros da API para código inexistente:** como no comprovante, 404 e 400 são tratados como "não encontrado" (comentário `[A CONFIRMAR]` já existente); conferir o real.
- **Reexporte do layout:** se o Next recusar `export { default } from`, copiar o arquivo.
- **Token real no `input.md`:** não copiar para código, testes ou specs; recomenda-se revogá-lo.
- **Fuso e formato das datas:** a consulta devolve datas com 6 casas decimais sem fuso; conferir a exibição contra o recibo da tela.
- **Impressão da página:** depende do `@media print`; conferir no navegador.

## Fora de escopo técnico
- Pedir nota fiscal pela página.
- Reenvio por e-mail ou WhatsApp, e segunda via por dentro do sistema.
- Regra própria de validade do link.
- Alterar o recibo da tela além do bloco do QR.
- Refatorar o comprovante da entrada.
