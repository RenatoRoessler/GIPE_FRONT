# Tech Spec: QR Code do comprovante de entrada

> **Atualização (2026-10-17):** o link do QR deixou de ser `patioId + placa` e passou a usar o `token` devolvido pelo registro da entrada (`/comprovante/<token>`, consultando `GET /Patio/comprovante/cliente`). Ver `docs/specs/melhoria-fluxo-entrada/techspec.md`. O restante deste documento descreve a versão original.

## Referências
- PRD: ./prd.md
- Design: ./design.md (resumo na seção "Design" abaixo)

## Design
- **Telas/estados**: (A) etapa de comprovante no `EntradaVeiculoModal` (formulário → comprovante, sem fechar sozinho); (B) página pública da entrada com estados loading / sucesso / não encontrada / erro. Detalhes em `design.md`.
- **Componentes do design system reaproveitados**: `Modal`, `Button`, `Text`, `ErrorBanner`, `Skeleton`, `Card`, `Logo`, `PageBackground`, `AuthCard`.
- **Reaproveitados do recibo de saída** (`ReciboSaidaStep.styles.ts`): `Receipt`, `ReceiptHeader`, `Divider`, `Rows`, `ReceiptPlaca`, `Actions`, `PrintStyles`, `Success`.
- **Componentes novos**:
  - `src/components/ui/QrCode/` (`QrCode.tsx`, `index.ts`): SVG do QR.
  - `src/components/veiculos/ReciboEntradaStep/` (`ReciboEntradaStep.tsx`, `ReciboEntradaConteudo.tsx`, `index.ts`): etapa do modal e corpo do comprovante.
  - `src/components/veiculos/EntradaPublica/` (`EntradaPublica.tsx`, `index.ts`): conteúdo da página pública.
- **Tokens de tema**: nenhum novo. Fundo do QR é branco fixo (requisito de leitura), não token.

## Arquitetura da solução

### Rota pública
- `src/app/comprovante/[patioId]/[placa]/page.tsx`, fora do grupo `(app)` (sem menu/sessão).
- `src/proxy.ts`: adicionar `"/comprovante"` em `PUBLIC_PATHS`. Sem isso o proxy redireciona o cliente para `/login`.
- Link do QR: `${window.location.origin}/comprovante/${patioId}/${placa}` (placa já normalizada por `normalizePlaca`).
- `generateMetadata` com título "Comprovante de entrada — GIPE" e `robots: { index: false, follow: false }` (página com dados de veículo não deve ser indexada).
- Antes de implementar, conferir `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` (formato de `params`, que no Next 16 é assíncrono) e `not-found.md`.

### Consulta pública
- Novo serviço em `src/lib/api/services/patio.ts`: `consultarEntradaPublica(patioId: number, placa: string): Promise<EntradaPublica>`.
- **[A CONFIRMAR com o back]** endpoint sem autenticação, por exemplo `GET /Patio/entrada/{patioId}?placa={placa}` (ou `/Patio/{patioId}/comprovante`). Deve responder 404 quando `patioId` e `placa` não correspondem e devolver só os campos do RF4.
- Tipo novo em `src/types/veiculo.ts`:

```ts
export type EntradaPublica = {
  placa: string;
  modelo: string | null;
  cor: string | null;
  categoria: number;
  sequencial: number;
  mensalista: boolean;
  dataHoraEntrada: string;
  rotatividadeDescricao: string | null;
  // Opcional: o back pode devolver o nome da empresa para o cabeçalho.
  empresaNome?: string | null;
};
```

- 404 → `ApiError` de `kind: "not_found"` (padrão já usado em `consultarSaida`), tratado na página como "Entrada não encontrada". Demais falhas → estado de erro com "Tentar novamente".

### Página pública: Server vs Client
- `page.tsx`: **Server Component**. Valida `patioId` (inteiro positivo) e `placa` (`isValidPlaca`) antes de chamar o back; inválidos vão direto para "não encontrada" sem requisição.
- `EntradaPublica`: **Client Component** com `useQuery` (TanStack Query, já presente) e `Skeleton`, para reutilizar o cliente `api`, a classificação de erros e o botão "Tentar novamente" (`refetch`), no mesmo padrão das demais telas. Sem retry automático para `not_found`.
- Se a página não estiver sob um `QueryClientProvider`, o provider atual hoje vive no layout de `(app)`: incluir um provider no layout da rota `comprovante` ou envolver no próprio componente (verificar `src/lib/queryClient.ts`).
- O cliente `api` só anexa `Authorization` se existir token; um operador logado abrindo o link também funciona. O endpoint público ignora o header.

### Comprovante no modal
- `EntradaVeiculoModal.tsx`: guardar o resultado da mutation em estado local (`EntradaRegistrada | null`). Com resultado, renderizar `ReciboEntradaStep` no lugar do formulário e trocar o rodapé por Concluir / Imprimir.
- `onSuccess` do modal (toast "Entrada registrada.") passa a ser disparado em **Concluir/fechar** da etapa de comprovante, não mais ao receber a resposta. `onClose` só depois disso.
- `handleClose` na etapa de comprovante fecha direto, sem o `ConfirmDialog` de "Descartar entrada?" (a entrada já existe). `hasChanges` só vale na etapa do formulário.
- `ReciboEntradaStep` (**Client**): recebe `EntradaRegistrada`, busca a empresa com a mesma `EMPRESA_QUERY_KEY`/`getEmpresa` do recibo de saída (falha → comprovante sem cabeçalho de empresa), monta `ReciboEntradaData` e renderiza `ReciboEntradaConteudo` + `QrCode`. Impressão via `window.print()` com o portal `#recibo-print-root` e `PrintStyles`, igual a `ReciboSaidaStep`.
- `ReciboEntradaConteudo` (**Client**): empresa, placa, veículo (modelo · cor), categoria (`getCategoriaVeiculoLabel`), sequencial, entrada (`formatDateTime`), tabela, QR e legenda "Escaneie para ver os dados da entrada".

### Reaproveitar estilos do recibo
- Extrair `Receipt`, `ReceiptHeader`, `Divider`, `Rows`, `ReceiptPlaca`, `Actions`, `Success`, `PrintStyles` de `ReciboSaidaStep.styles.ts` para `src/components/veiculos/Recibo.styles.ts`, importado por saída e entrada. Mudança mecânica, sem alteração visual; `ReciboSaidaStep` continua funcionando como hoje.

### `QrCode`
- Biblioteca: `qrcode.react` (`QRCodeSVG`), componente puro, SVG nítido na impressão, sem acesso a DOM/canvas. **Fixar a versão exata** ao instalar (sem `^`) e conferir a licença/uso no `package.json`.
- Props: `value: string`, `size?: number` (padrão 160), `label: string` (vira `aria-label`, `role="img"`).
- Nível de correção `M`, margem de silêncio de 4 módulos (`marginSize`), módulos `colors.text` e fundo `#FFFFFF` fixo. Contêiner com `padding: space[3]` e `radii.sm`.
- **Client Component** (é usado só dentro de componentes client).

### Campo de identificação do ticket
- A resposta traz `codigoTicket` e `sequencial`. O comprovante mostra **`sequencial`** (é o que o `input.md` lista como identificador da entrada). **[A CONFIRMAR]** com o back/produto qual dos dois é o "número do ticket" exibido ao cliente; a troca é uma linha em `ReciboEntradaConteudo` e na página pública.

## Decisões técnicas e trade-offs
- **Link por `patioId + placa` (decisão do produto)**: simples e sem mudança no cadastro, mas `patioId` é sequencial e a placa é pública; quem sabe os dois lê placa/modelo/cor/horário da entrada. Mitigação: o back só devolve os campos do RF4 e responde 404 genérico para qualquer combinação inválida. Se virar risco, migrar para token não adivinhável (o back devolve o token na entrada; muda só o segmento da URL e o serviço).
- **QR gerado no cliente**: evita endpoint de imagem e permite impressão vetorial. O link usa `window.location.origin`, então o QR sempre aponta para o ambiente em que foi emitido.
- **Página pública com TanStack Query em Client Component** (e não fetch em Server Component): reaproveita `api`, `ApiError` e padrões de loading/erro; custo é um pouco de JS no celular do cliente. A validação de `params` fica no Server Component para não gastar requisição com link malformado.
- **Etapa no mesmo modal** (em vez de modal novo): espelha o fluxo de saída e mantém o foco/Esc/Modal já resolvidos. Custo: `EntradaVeiculoModal` cresce; manter o corpo do comprovante em `ReciboEntradaStep`.
- **Extrair estilos do recibo agora**: duas telas já usam o mesmo layout; duplicar o CSS divergiria rápido. Não criar abstração além disso (um único `Recibo.styles.ts`, sem componente genérico de recibo).
- **`noindex` na página pública**: evita que links de comprovantes apareçam em buscadores.

## Riscos / pontos de atenção
- **Endpoint público inexistente ou diferente**: toda a feature depende do back. Sem ele, só a etapa A (comprovante com QR) pode ser entregue, e o QR apontaria para uma página sem dados. Alinhar contrato antes de implementar a página B.
- **Proxy**: esquecer `/comprovante` em `PUBLIC_PATHS` faz o cliente cair no login. Cobrir com teste manual sem sessão.
- **Enumeração de entradas** (ver trade-off): considerar rate limit no back.
- **Origem do link em dev/hml**: QR emitido em `localhost` não abre no celular do cliente. Testar com o host da rede ou em hml.
- **Impressão**: o QR precisa de contraste total; o `PrintStyles` força `background: transparent` e `color: black` em todos os filhos, então validar que o SVG (fills explícitos) continua preto sobre branco e legível.
- **Mudança de fluxo do toast**: o toast agora aparece ao concluir, não ao registrar; garantir que fechar pelo X/Esc na etapa de comprovante também dispare `onSuccess`.
- **`QueryClientProvider`** na rota pública (ver acima).
- **Dependência nova** (`qrcode.react`): checar tamanho no bundle e que o build (`npm run build`) passa.

## Fora de escopo técnico
- Impressão térmica/formatação de cupom específica.
- Valor a pagar, saída ou pagamento na página pública.
- Reenvio por e-mail/WhatsApp e reimpressão de entradas antigas.
- Token não adivinhável / assinatura do link (reavaliar conforme risco de segurança).
- Rate limiting e proteção contra enumeração (responsabilidade do back).
- Atualização retroativa dos specs de `entrada-veiculos` (a remoção do ticket no front já foi feita em outra mudança).
