# Tech Spec: Ticket do Cliente por Placa e Cartaz do Ticket

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e registra as decisões de componente)
- Modelos a seguir: o comprovante público da entrada e o recibo público da saída (`src/app/comprovante`, `src/app/recibo`, `src/components/veiculos/ComprovantePublico`, `src/components/veiculos/ReciboPublico`) e a impressão por portal do recibo de entrada (`ReciboEntradaStep`).

## Design
- Telas/estados: os de `design.md` (consulta: padrão, placa incompleta, buscando, não encontrado, erro com nova tentativa, link inválido; cartaz A4 na impressão; botão com aviso de falha).
- Componentes do design system reaproveitados: `PlateDisplay`, `Button`, `QrCode`, `Logo`, `Toast`; estilos de página pública de `ComprovantePublico.styles` (`Screen`, `Column`, `Top`, `Card`, `Message`, `Footnote`); `PlateInput`, `PlateFrame`, `PlateRow` de `src/components/form/PlateField.styles` (são `styled` simples, sem dependência do formulário).
- Componentes novos necessários:
  - `src/components/veiculos/ConsultaTicketPublica/` (a página de consulta).
  - `src/components/empresa/CartazTicket/` (o cartaz A4, o botão e a lógica de impressão).
- Tokens de tema usados/criados: nenhum novo. O cartaz usa `lightTheme` explicitamente (ver "Cartaz").
- **Correção ao `design.md`:** a "Home" que recebe o botão é o `/dashboard` (`src/app/(app)/dashboard/page.tsx`, na `ActionRow`, ao lado de Entrada e Saída). O componente `Hero` não é usado por nenhuma rota. A tela da empresa é `MinhaEmpresa` (`EmpresaForm`, no `HeaderRow`).

## Arquitetura da solução

### API e tipos
- `src/types/patio.ts` (junto de `ComprovanteCliente`): `ComprovantePorPlaca` com os campos do contrato (`cnpj`, `razaoSocial`, `endereco`, `telefone`, `placa`, `modelo`, `cor`, `categoriaId`, `categoriaDescricao`, `dataHoraEntrada`, `dataHoraConsulta`, `minutosPermanencia`, `permanencia`, `sequencial`, `prisma`, `token`, `valorAtual`). A página só usa `token`; os demais ficam tipados, não lidos.
- `src/lib/api/services/patio.ts`: `consultarComprovantePorPlaca(empresaGuid, placa)` faz `GET /Patio/comprovante/cliente/placa` com `params: { empresa, placa }` (público, sem login) e traduz `not_found` e `validation` em `ApiError("not_found", "Ticket não encontrado.", 404)`, igual ao `consultarComprovante`. Comentário `[A CONFIRMAR]` no mesmo padrão das outras consultas públicas.
- `src/types/empresa.ts`: `EmpresaFormValues` ganha `empresaGuid?: string | null`, só para leitura. Não é campo de formulário e **não entra** em `toEmpresaPayload` (o PUT não o envia).
- `src/lib/api/services/empresa.mapper.ts`: `EmpresaDto` ganha `empresaGuid?: string`; `fromEmpresaResponse` o copia (texto aparado; ausente ou vazio vira `null`).

### Rota pública
- `src/app/ticket/[empresaGuid]/page.tsx` (Server Component): `metadata` com título "Consultar ticket — Murel" (o título das outras páginas públicas usa "Murel", não "GIPE"; manter o padrão do código) e `robots: { index: false, follow: false }`. Valida o `empresaGuid` com a regex de GUID (`/^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/`) e devolve a mensagem de **link inválido** sem renderizar o formulário quando inválido; senão renderiza `ConsultaTicketPublica`.
- Sem layout próprio: as rotas públicas existentes não têm `layout.tsx`; o tema e os provedores vêm do layout raiz (`StyledComponentsRegistry`).
- `src/proxy.ts`: acrescentar `"/ticket"` a `PUBLIC_PATHS` (e um caso em `proxy.test.ts`); atualizar o comentário.
- **Endereço do QR:** `/ticket/{empresaGuid}` (curto, na mesma linha de `/comprovante/{token}` e `/recibo/{token}`). O pedido original diz só "tela do 1 passando o empresaGuid"; o formato é decisão deste spec.

### Página de consulta (`src/components/veiculos/ConsultaTicketPublica/`)
- `ConsultaTicketPublica.tsx` (Client Component): estado local (placa, erro de validação); `useMutation` com `consultarComprovantePorPlaca` (é uma ação do usuário, não uma leitura de página: mutation em vez de `useQuery`, sem cache nem refetch).
  - Placa normalizada com `normalizePlaca` e validada com `isValidPlaca` **ao tocar em Buscar** (não desabilita o botão). Inválida: mensagem em `danger`, `aria-invalid`, foco no campo, nenhuma chamada.
  - Sucesso: `router.push(`/comprovante/${encodeURIComponent(token)}`)`; o botão continua em "Buscando..." até a navegação. Token ausente na resposta vira erro de consulta.
  - `not_found`: mensagem de "Ticket não encontrado" no cartão (`role="alert"`), placa mantida. Outros erros: "Não foi possível consultar" e o botão vira "Tentar novamente".
  - Campo: `PlateDisplay` `size="lg"` com `PlateInput` dentro, **input nativo**, sem `PlateField` (que depende do contexto do formulário) e **sem `useTecladoCampo`** (a página pública fica fora do `TecladoProvider`, que só envolve a área logada). Atributos: `autoCapitalize="characters"`, `autoCorrect="off"`, `spellCheck={false}`, `maxLength={7}`, `inputMode="text"`, `autoComplete="off"`, `autoFocus`.
- `ConsultaTicketPublica.styles.ts`: só o que é próprio (bloco de mensagem do cartão); o resto vem de `ComprovantePublico.styles`.
- `LinkInvalido`: exportado do mesmo módulo, usa `Message`.
- `index.ts`.

### Cartaz (`src/components/empresa/CartazTicket/`)
- `CartazTicket.tsx`: o cartaz em si (sem lógica): recebe `link` e renderiza o layout da referência com `Logo`, `PlateDisplay` e `QrCode`. Envolvido em um `ThemeProvider` com `lightTheme`, para ficar igual nos dois temas do aparelho.
- `CartazTicket.styles.ts`: dimensões A4 em `mm`, tipografia e cores só por tokens (`lightTheme`), e o CSS global de impressão:
  - `#cartaz-print-root { display: none; }` na tela; em `@media print`, `body > *:not(#cartaz-print-root) { display: none !important; }` e o root `display: block`.
  - `@page { size: A4 portrait; margin: 0; }` e `print-color-adjust: exact` (com o prefixo `-webkit-`) no root.
  - **Não reutiliza `PrintStyles` do recibo**: aquele força preto e fundo transparente em tudo, o que apagaria o fundo asfalto e o marcador amarelo do cartaz.
- `GerarCartazButton.tsx` (Client Component): botão secundário com ícone de impressora e rótulo "Gerar Cartaz do Ticket".
  1. No clique, busca o `empresaGuid` com `queryClient.fetchQuery({ queryKey: EMPRESA_QUERY_KEY, queryFn: getEmpresa, staleTime: 5 min })`. **Sob demanda, não ao montar**: o dashboard não faz uma chamada a mais, e perfis que não podem ler a empresa não geram erro de fundo; para eles o clique mostra o aviso.
  2. `empresaGuid` ausente/vazio ou erro na busca: `Toast` de erro "Não foi possível gerar o cartaz agora. Tente novamente em instantes." e nada é impresso (RF-05).
  3. Com o guid: monta o link `${window.location.origin}/ticket/${encodeURIComponent(guid)}`, mostra o cartaz via `createPortal` em `document.body` (`#cartaz-print-root`), e chama `window.print()` depois que o QR foi desenhado (`requestAnimationFrame` duplo). Remove o portal em `afterprint`, com um limite de segurança por tempo caso o evento não dispare.
  4. Enquanto isso, o botão fica desabilitado (evita duplo clique).
- `EMPRESA_QUERY_KEY` já é exportado por `EmpresaForm`; importar de lá em vez de duplicar a chave (o `GerarCartazButton` em `home` não deve importar a tela inteira: mover a constante para `src/components/empresa/MinhaEmpresa/queryKeys.ts` e reexportar em `EmpresaForm`, sem mudar o comportamento).
- `index.ts`.

### Pontos de entrada
- `src/app/(app)/dashboard/page.tsx`: `GerarCartazButton` dentro da `ActionRow`, depois de Entrada e Saída.
- `src/components/empresa/MinhaEmpresa/EmpresaForm.tsx`: `GerarCartazButton` no `HeaderRow`, junto de "Adicionar empresa" (agrupar os dois em um contêiner de ações se o `HeaderRow` precisar).
- **Permissão:** sem permissão própria nesta entrega: o botão aparece para quem já vê a Home e a tela da empresa (resolve o `[A CONFIRMAR]` do PRD pelo caminho mais simples; trocar por uma permissão é uma mudança local no botão).

### Server vs Client
- `page.tsx` da rota: Server Component. `ConsultaTicketPublica`, `GerarCartazButton` e `CartazTicket` (portal, `window`, `useRouter`, mutation): Client Components.

## Decisões técnicas e trade-offs
- **Rota `/ticket/[empresaGuid]` com o guid no caminho**, não em query string: casa com `/comprovante/[token]` e `/recibo/[token]`, e deixa o link do QR curto (QR menos denso, mais fácil de ler no papel). O guid na URL não é segredo (está no QR impresso).
- **Navegação interna para o comprovante** (`/comprovante/{token}`) em vez do endereço absoluto `https://app.murel.com.br/...` do pedido: é a mesma página, funciona em qualquer ambiente (homologação, local) e permite voltar para a consulta. Se o front público passar a ficar em outro domínio, trocar por um endereço configurável.
- **Mutation, não query:** a consulta é uma ação do cliente com efeito de navegação; cache e refetch por foco não fazem sentido e atrapalhariam a tentativa de novo.
- **Input nativo, sem teclado customizado:** resolve o `[A CONFIRMAR]` do design. A página pública não tem o `TecladoProvider`, e o teclado nativo do celular com `autoCapitalize` atende (a validação por `isValidPlaca` cobre o resto).
- **Validar só ao tocar em Buscar:** o cliente vê o motivo em vez de um botão desabilitado sem explicação.
- **Cartaz por portal + `window.print()`**, como o recibo de entrada: sem dependência nova (nada de gerar PDF), a impressora do navegador cuida do A4. O CSS de impressão é próprio porque o do recibo remove cores.
- **Cartaz sempre no tema claro** via `ThemeProvider` local: o operador pode estar no tema escuro e o papel não pode sair escuro.
- **`empresaGuid` buscado no clique:** evita uma chamada extra no dashboard e erros de permissão invisíveis; o custo é um pequeno atraso no primeiro clique (cache de 5 min nos seguintes).
- **Sem normalizar o guid** além do `trim`: o back é quem decide se existe.

## Riscos / pontos de atenção
- **Contrato do back por confirmar:** (1) nome e presença de `empresaGuid` no retorno de `GET /Empresa`; (2) caminho exato da consulta (`/Patio/comprovante/cliente/placa` com `empresa` e `placa`, a partir do pedido); (3) se a resposta traz sempre `token`; (4) **regra dos 8 minutos do 404** (a partir de quê; se vale para veículo que já saiu). A página só reage ao 404.
- **Abuso da consulta pública:** qualquer pessoa com o guid pode tentar placas (o guid está impresso no cartaz). Limitar tentativas é responsabilidade do back; **não há bloqueio no front**, só o normalizador de placa. Registrar como pedido ao back.
- **`GET /Empresa` pode exigir perfil:** se perfis operacionais receberem 403, o botão mostra o aviso para eles. Se isso acontecer com frequência, o back deveria expor o guid em um lugar acessível a todos (ex.: na resposta do login) **[A CONFIRMAR]**.
- **Impressão:** depende de `@page`, `print-color-adjust` e do navegador permitir "gráficos de segundo plano". Testar no Chrome, Edge e Safari (iOS/macOS); o cartaz precisa ficar legível mesmo sem os fundos (design.md).
- **Portal do cartaz e o `ThemeProvider`:** o portal fica fora da árvore do tema da aplicação; por isso o `ThemeProvider` local com `lightTheme` é necessário, não decorativo.
- **`afterprint` não dispara em alguns navegadores móveis:** por isso o limite de segurança por tempo para remover o portal.
- **Token real no `input.md`:** não copiar para código, testes ou specs.

## Fora de escopo técnico
- Gerar o cartaz em PDF ou em imagem para download.
- Personalizar o cartaz por empresa (logotipo, cores, textos).
- Limitação de tentativas, captcha ou qualquer proteção da consulta pública no front.
- Alterar o comprovante público ou o recibo público.
- Criar ou trocar o `empresaGuid`.
- Permissão específica para gerar o cartaz.

## Desvios na implementação
- `ComprovantePorPlaca` ficou em `src/types/veiculo.ts`, ao lado de `ComprovanteCliente` (onde o tipo já vive), e não em `src/types/patio.ts`. É `ComprovanteCliente & { prisma? }`.
- O campo de placa **não** tem `maxLength`: um valor colado ou preenchido de uma vez com hífen (`QQQ-5Z88`) perdia o último caractere antes de ser normalizado. `normalizePlaca` já limita a 7.
- O cartaz usa `warn` (e não `primary`) no numeral dos passos e na linha pontilhada: a regra do tema (`tokens.test.ts`) reserva `primary` ao preenchimento. O amarelo fica um pouco mais escuro que o da referência nesses dois pontos.
- `EmpresaForm` passou a **manter o `empresaGuid`** no cache ao salvar (o formulário não o edita, e o cache ficava sem ele). O botão ainda consulta de novo se o cache vier sem guid.
- No cabeçalho da tela da empresa, o botão do cartaz e o "Adicionar empresa" ficam em um contêiner novo (`AcoesCabecalho`), com o mesmo comportamento de largura no celular.
- O cabeçalho da consulta pública segue o `Top` do comprovante (fundo `surface`), não `primary` como dizia o `design.md`.
- `src/app/(app)/dashboard/page.test.tsx` é novo (a página não tinha teste).
