# Tech Spec: Registrar Saída de Veículo

## Referências
- PRD: ./prd.md
- Design: ./design.md (via skill claude-design)
- Contrato recebido: `docs/specs/input.md` (`GET /Patio/saida?placa=`, `POST /Patio/{patioId}/saida`)
- Padrões reaproveitados: `docs/specs/entrada-veiculos/techspec.md` (`RegistrarEntradaButton`, `EntradaVeiculoModal`, `DiscButton`), `docs/specs/caixa/techspec.md` (`Modal`, enum `FORMA_PAGAMENTO`, conferência com `useState` + Zod), `PrecoWizardForm` (foco na descrição da etapa)

## Design
- **Telas/estados**: conforme `design.md`. Modal único `lg` com `Stepper` de 4 etapas (Consultar · Conferir · Pagamento · Recibo). Estados por etapa: consultando, erro, valor mudou (aviso `warn` + valor anterior riscado), enviando, sucesso/recibo.
- **Componentes do design system reaproveitados**: `Modal`, `Stepper`, `Button`, `Input`, `ErrorBanner`, `Toast`, `Skeleton`, `StatusBadge`, `Text`, `DiscButton`.
- **Componentes novos no design system** (`src/components/ui`):
  - `OptionGroup` — grupo de escolha única em tiles com `<input type="radio">` nativos (`fieldset`/`legend`), props `legend`, `options`, `value`, `onChange`, `disabled`, `error`.
  - `Stepper` ganha a prop opcional `label` (hoje o `aria-label` é fixo em "Progresso do cadastro"); valor padrão preservado.
- **Componentes de feature** (`src/components/veiculos/`): `RegistrarSaidaButton`, `SaidaVeiculoModal`, `ConsultaSaidaStep`, `ConferirSaidaStep`, `PagamentoSaidaStep`, `ReciboSaidaStep`, `ReciboConteudo`.
- **Tokens de tema**: nenhum novo. O recibo, em `@media print`, usa as palavras-chave `black`/`white` (impressão sempre preto sobre branco, independente do tema).

## Arquitetura da solução

### Gatilho
- `RegistrarSaidaButton` (Client): mesmo desenho de `RegistrarEntradaButton` — `DiscButton badge="S"` "Registrar saída", `aria-haspopup="dialog"`, dono de `useToast`/`Toast`. Entra na `ActionRow` de `src/app/(app)/dashboard/page.tsx` ao lado do botão de entrada e em `src/app/(app)/veiculos/saida/page.tsx` (hoje placeholder). Ambas continuam Server Components.

### Tipos (`src/types/saida.ts`)
```ts
export type SaidaBuscaTipo = "placa" | "codigoTicket" | "sequencial";
export type SaidaBusca = { tipo: SaidaBuscaTipo; valor: string };   // valor já normalizado (placa em maiúsculas; números só dígitos)
export type SaidaConsulta = {
  patioId: number; placa: string; categoria: number; modelo: string | null; cor: string | null;
  codigoTicket: number; sequencial: number; mensalista: boolean;
  dataHoraEntrada: string; dataHoraSaida: string; minutosPermanencia: number;
  rotatividadeId: number | null; rotatividadeDescricao: string | null;
  regra: number | null; faixaMinutosLimite: number | null; horasAdicionais: number | null; valor: number;
};
export type SaidaPayload = { valor: number; formaPagamento: number };
export type SaidaRegistrada = { patioId: number; placa: string; dataHoraEntrada: string; dataHoraSaida: string;
  minutosPermanencia: number; valor: number; formaPagamento: number };
```
- A forma de pagamento reaproveita `FORMA_PAGAMENTO`/`FORMA_PAGAMENTO_OPTIONS` de `src/types/caixa.ts` (enum já confirmado 1–6). Se um terceiro módulo precisar, mover para `types/pagamento.ts` em task à parte.
- A categoria usa `CATEGORIA_VEICULO_OPTIONS` (`types/veiculo.ts`) para o rótulo.

### Serviço (`src/lib/api/services/patio.ts`, mesmo arquivo da entrada)
```ts
consultarSaida(busca: SaidaBusca): Promise<SaidaConsulta>                          // GET /Patio/saida?{tipo}={valor}
registrarSaida(patioId: number, payload: SaidaPayload): Promise<SaidaRegistrada>   // POST /Patio/{patioId}/saida
```
- Um único parâmetro por consulta (a API devolve 400 com mais de um). Nome dos parâmetros: `placa` (confirmado no exemplo); `codigoTicket` e `sequencial` seguem o nome dos campos da resposta — **[A CONFIRMAR] com o backend**, concentrado no mapeamento `tipo → query param` do serviço.
- 404 da consulta vira `ApiError("not_found", "Nenhum veículo no pátio com esse <placa|ticket|sequencial>.")` quando o backend não enviar mensagem própria; 404 do `POST` vira "O veículo não está no pátio.". Demais erros sobem como estão.
- `SaidaConsulta.valor` é tratado como número em reais; a comparação "mudou?" usa centavos (`Math.round(v * 100)`).

### Utilitários e schemas
- `src/lib/schemas/saida.ts`: `saidaBuscaSchema` valida o objeto `{ placa, codigoTicket, sequencial }` do formulário — **exatamente um** preenchido ("Informe a placa, o ticket ou o sequencial"); placa com `isValidPlaca` + `PLACA_INVALIDA_MESSAGE` (já existem em `lib/placa.ts`); ticket e sequencial `^\d+$`, ticket ≤ 32767 (Int16, como na entrada). Função auxiliar `toSaidaBusca(values): SaidaBusca`.
- `src/lib/schemas/saida.ts` também exporta `createRecebidoSchema(valor)`: valor recebido em dinheiro, `parseMoney`, ≥ `valor`.
- `src/components/veiculos/saida.ts` (funções puras): `calcularTroco(recebido, valor)`, `valoresIguais(a, b)` (em centavos), `getCategoriaVeiculoLabel(n)`, `getFormaPagamentoLabel(n)` (reusa `formaPagamentoLabel` de `components/caixa/format.ts`). Datas com `formatDateTime` (`components/caixa/format.ts`) e permanência com `formatMinutos` (`components/precos/format.ts`, saída "1 h 5 min"); se um terceiro uso aparecer, extrair para `lib/`.

### Modal e estado (`SaidaVeiculoModal.tsx`, Client)
Estado único via `useReducer` (ou `useState` agrupado) com:
```ts
step: 1 | 2 | 3 | 4
busca: SaidaBusca | null            // última busca válida (para a reconsulta do RF6)
consulta: SaidaConsulta | null
valorAnterior: number | null        // preenchido quando o valor mudou na confirmação
forma: string                       // valor do OptionGroup ("" = nenhuma)
recebido: string                    // só dinheiro
resultado: { saida: SaidaRegistrada; recebido: number | null; troco: number | null } | null
```
- **Etapa 1 — `ConsultaSaidaStep`**: três `Input` controlados (`useState` + `saidaBuscaSchema`, como a conferência do Caixa — os campos são mutuamente exclusivos, o que encaixa mal no TanStack Form). Ao preencher um, os outros recebem `disabled` e dica "Limpe o campo X para usar outro". `useMutation(consultarSaida)` (não é `useQuery`: o resultado depende do instante e não deve ser cacheado). Sucesso: guarda `busca` e `consulta` e vai à etapa 2; erro: `ErrorBanner` na etapa, campos preservados.
- **Etapa 2 — `ConferirSaidaStep`**: somente leitura (`dl`). **Voltar** mantém os valores digitados na etapa 1 (estado fica no modal).
- **Etapa 3 — `PagamentoSaidaStep`**: `OptionGroup` com `FORMA_PAGAMENTO_OPTIONS`; se `Dinheiro` (valor `"1"`), `Input` "Valor recebido" com `autoFocus` e linha de troco em `aria-live="polite"`. Botão **Confirmar pagamento** (ou "Confirmar novo valor" quando `valorAnterior !== null`), desabilitado sem forma, ou em dinheiro com recebido inválido/insuficiente (motivo em texto visível).
- **Confirmação (`useMutation`)**, nesta ordem (RF6, RF7):
  1. `consultarSaida(busca)` — reconsulta;
  2. se `!valoresIguais(nova.valor, consulta.valor)`: atualiza `consulta = nova`, `valorAnterior = consulta.valor`, **não** registra; o troco recalcula; a UI mostra o aviso e o botão muda. Se o recebido em dinheiro ficou insuficiente com o novo valor, o botão desabilita normalmente;
  3. se igual: `registrarSaida(consulta.patioId, { valor: consulta.valor, formaPagamento: Number(forma) })`; sucesso → `resultado` com `recebido`/`troco` calculados no cliente → etapa 4, `onSuccess("Saída registrada.")`.
  - A mutação é única (consulta + registro encadeados); `isPending` bloqueia botões, campos e o fechamento do modal (mesma regra do modal de entrada: `handleClose` ignora enquanto pendente).
  - Se o valor enviado for rejeitado pelo backend por divergência (400), a mensagem aparece na etapa 3 e o usuário pode confirmar de novo (a reconsulta recarrega o valor).
- **Etapa 4 — `ReciboSaidaStep`**: mostra `ReciboConteudo` e os botões **Imprimir** e **Concluir** (fecha o modal). Fechar pelo × ou `Esc` equivale a Concluir (não há pagamento pendente).
- **Foco e anúncio**: cada troca de etapa foca o texto "Etapa N de 4: …" (`tabIndex={-1}` + `ref`), como no `PrecoWizardForm`.
- **Fechar**: etapas 1–3 livres (exceto enviando); sem confirmação de descarte (nada foi gravado).

### Recibo e impressão
- `ReciboConteudo` (puro, props): empresa (nome/CNPJ), emissão, placa, modelo/cor, categoria, ticket, entrada, saída, permanência, tabela, forma, total, e (dinheiro) recebido e troco.
- **Dados da empresa**: `useQuery(EMPRESA_QUERY_KEY, getEmpresa)` (já existentes; `EMPRESA_QUERY_KEY` exportado de `components/empresa/MinhaEmpresa/EmpresaForm.tsx`), `enabled` a partir da etapa 3, `staleTime` de 5 min, para o recibo já nascer completo. Nome = `nomeFantasia || razaoSocial`; CNPJ formatado com `lib/cnpj.ts`. Falha ao carregar **não** bloqueia: o recibo sai sem o bloco da empresa.
- **Impressão apenas do recibo**: `window.print()` com o recibo renderizado também em um nó **fora do app**, via `createPortal` para `document.body` (`#recibo-print-root`, `display: none` na tela). Uma `createGlobalStyle` montada junto do portal define em `@media print`: `body > *:not(#recibo-print-root) { display: none !important }` e `#recibo-print-root { display: block }`, com fundo `white`, texto `black`, sem sombras. Assim o modal (camada superior do `<dialog>`) e o resto da página somem sem hacks de `visibility`. O recibo na tela e o do portal usam o mesmo `ReciboConteudo`.
- Sem biblioteca de PDF: "Salvar como PDF" é do diálogo de impressão do navegador.

### Server vs Client
- `page.tsx` (dashboard, saída): Server Components. Todo o resto (botão, modal, etapas, recibo, `OptionGroup`): Client Components. `saida.ts`, schemas e tipos: módulos puros.

## Decisões técnicas e trade-offs
- **Reconsulta + registro numa mutação única**: garante que o valor enviado é o que o usuário viu; o custo é uma requisição extra por confirmação e a chance de o valor oscilar entre confirmações (se isso virar atrito, o backend pode aceitar tolerância ou travar o valor por alguns minutos).
- **Enviar `valor` do cliente**: é o contrato do `POST` (`valor` + `formaPagamento`); a validação final é do backend, por isso a reconsulta.
- **Mutation em vez de query para a consulta**: o resultado muda a cada chamada (hora de saída), cache faria o operador cobrar um valor velho.
- **Estado do fluxo no modal pai**: etapas ficam sem estado próprio relevante, o que permite **Voltar** sem perder dados e simplifica a reconsulta.
- **`useState` + Zod nos passos** (não TanStack Form): campos mutuamente exclusivos e validações dependentes do valor a cobrar; mesmo critério já adotado na conferência do Caixa.
- **Portal para impressão**: isola o que será impresso sem depender da estrutura do `<dialog>`; custo é renderizar o recibo duas vezes.
- **Troco calculado só no cliente**: a API não o conhece; o recibo reflete o que o operador informou, não é um dado auditado pelo backend.
- **Enum de pagamento importado de `types/caixa.ts`**: evita duplicar; se a dependência incomodar, mover para um módulo neutro depois.

## Verificação
- `npm run lint` e `npm run build`.
- Manual (desktop e 375 px, claro e escuro), **em empresa de teste** (a saída altera dados e exige caixa aberto; dar entrada de um veículo de teste antes):
  - Atalho na Home e em `/veiculos/saida`; abertura do modal na etapa 1 com foco na placa.
  - Busca por placa, por ticket e por sequencial (os outros campos desabilitam e liberam ao limpar); placa inválida; nenhum campo; veículo fora do pátio.
  - Etapa 2 com todos os dados e **Voltar** mantendo os campos; mensalista (valor 0).
  - Dinheiro: recebido menor, igual e maior; troco; demais formas sem campo de recebimento.
  - Valor mudando entre consulta e confirmação (aguardar virar de faixa): aviso, valor antigo riscado, nova confirmação, nada registrado antes dela.
  - Sem caixa aberto, veículo que já saiu (duas abas), 403 e falha de rede: mensagem na etapa 3 e dados preservados.
  - Duplo clique gera um único `POST`; `Esc` durante o envio não fecha.
  - Corpo do `POST`: `valor` numérico igual ao exibido, `formaPagamento` numérico; `patioId` correto na URL.
  - Recibo: dados corretos, com e sem dados da empresa; **Imprimir** mostra só o recibo em preto sobre branco (testar nos dois temas); **Concluir** limpa o estado e o foco volta ao atalho.
  - Teclado e leitor de tela: etapa anunciada, radios por setas, troco anunciado, alerta de valor alterado.

## Riscos / pontos de atenção
- **Nomes dos parâmetros `codigoTicket`/`sequencial`** na consulta não constam no `input.md` (só `placa`). Ajuste concentrado no serviço.
- **Valor oscilante e recusa no `POST`**: o backend pode recalcular ou recusar divergência; não há como saber pelo contrato. Mensagem e nova confirmação cobrem, mas pode irritar em tabelas que mudam de faixa a cada poucos minutos.
- **Mensalista/valor zero**: segue a decisão do PRD (ainda a definir); o fluxo está pronto para pular a etapa 3 se o negócio decidir.
- **Impressão**: comportamento de `@media print` e do `<dialog>` varia entre navegadores; testar em Chrome e Edge. Impressoras térmicas podem exigir ajuste de largura.
- **Dados da empresa no recibo**: dependem do cadastro; endereço não entra nesta versão.
- **Troco só no cliente**: se houver auditoria futura de caixa, o backend precisará receber o valor recebido.
- **Dois operadores na mesma saída**: o segundo recebe 404/400 do `POST`; a mensagem aparece na etapa 3.
- **Token JWT em `docs/specs/input.md`**: não commitar o arquivo com os tokens; invalidar os já expostos.

## Fora de escopo técnico
- Emissão de nota fiscal e PDF gerado pelo sistema.
- Pagamento dividido, integração com maquininha/Pix e registro do valor recebido no backend.
- Desconto manual ou de convênio; estorno de saída.
- Listagem do pátio e atualização de painéis (não há consultas de pátio para invalidar).
- Controle de acesso por perfil no cliente (a API devolve 403, exibido na etapa).
- Testes automatizados (sem runner configurado).
