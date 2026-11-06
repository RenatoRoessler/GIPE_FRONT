# Tech Spec: Enviar link do ticket ao cliente

## Referências
- PRD: ./prd.md
- Design: ./design.md (resumo na seção "Design" abaixo)

## Design
- **Telas/estados:** botão "Enviar ao cliente" no comprovante de entrada e no detalhe do ticket do Pátio; popup com canal (WhatsApp/e-mail), campo de contato, prévia da mensagem e rodapé com Cancelar + "Abrir WhatsApp"/"Abrir e-mail". Estados: inicial, inválido, sucesso (Toast), link indisponível. Detalhes em `design.md`.
- **Componentes do design system reaproveitados:** `Modal` (`size="sm"`, `fullScreenOnMobile={false}`), `OptionGroup`, `Input`, `Button`, `Toast`, `ErrorBanner`.
- **Componentes novos necessários:** `src/components/patio/EnviarTicketModal/` (popup, usado pelos dois pontos de entrada). Específico da feature, não vai para `ui`.
- **Tokens de tema:** nenhum novo. Usa `surfaceMuted`, `danger`, `fontFamilies.mono`, `radii.md`, `space`.

## Arquitetura da solução

Tudo roda no navegador: o sistema não chama o back. O link do ticket já existe (`/comprovante/<token>`), então o envio é montar uma URL `wa.me` ou `mailto:` e abri-la.

### Arquivos criados
- `src/components/patio/ticketLink.ts` — `linkDoTicket(token: string): string` (`${window.location.origin}/comprovante/${encodeURIComponent(token)}`). Hoje essa montagem está duplicada em `ComprovanteDigital.tsx:134` e `ReciboEntradaStep.tsx:52`; os dois passam a usar o helper (mudança mecânica, sem alterar comportamento).
- `src/components/patio/envioTicket.ts` — funções puras, sem React:
  - `type CanalEnvio = "whatsapp" | "email"`.
  - `mensagemDoTicket({ placa, estacionamento, link }): string` — texto único, usado na prévia e no envio. Ex.: `Olá! Segue o ticket do veículo FLP3C88 no Estacionamento Central: <link>`. Sem nome do estacionamento, omite o trecho "no …".
  - `assuntoDoEmail({ placa, estacionamento })`: `Ticket de entrada — FLP3C88`.
  - `hrefDoEnvio(canal, contato, dados): string`:
    - WhatsApp: `https://wa.me/55<dígitos>?text=<encodeURIComponent(mensagem)>`; dígitos só do número com DDD (10 ou 11), prefixo `55` fixo.
    - E-mail: `mailto:<contato.trim()>?subject=<encodeURIComponent(assunto)>&body=<encodeURIComponent(mensagem)>`.
  - `validarContato(canal, valor): string | null` — devolve a mensagem de erro ou `null`. WhatsApp: `isValidPhone` de `@/lib/phone` (10 ou 11 dígitos); e-mail: `isValidEmail` de `@/lib/email`. Mensagens do `design.md` ("Informe o WhatsApp com DDD." / "Informe um e-mail válido, como nome@dominio.com.").
- `src/components/patio/EnviarTicketModal/EnviarTicketModal.tsx`, `EnviarTicketModal.styles.ts`, `index.ts`, `EnviarTicketModal.test.tsx`.
- `src/components/patio/envioTicket.test.ts`, `ticketLink.test.ts` (se o helper ganhar teste próprio).

### Arquivos alterados
- `src/components/veiculos/ReciboEntradaStep/ReciboEntradaStep.tsx` — botão "Enviar ao cliente" na linha de ações (entre Concluir e Imprimir, só se `data.link`), estado local de abrir/fechar, `Toast` de sucesso. O botão fica fora de `#recibo-print-root`, então não sai na impressão. Usa `linkDoTicket`.
- `src/components/patio/TicketView/TicketView.tsx` — botão ao lado de "Mostrar QR do ticket ao cliente". Com `semToken`, fica `disabled` com `aria-describedby` para "Link do ticket indisponível." (o `Aviso` existente cobre o texto; avaliar reaproveitá-lo com `id`). Renderiza o popup junto de `modais`; o `Toast` reaproveita `aviso`/`setAviso`.
- `src/components/patio/TicketView/TicketView.styles.ts` — ajuste de `Acoes` para três botões, se necessário.
- `src/components/patio/ComprovanteDigital/ComprovanteDigital.tsx` — passa a usar `linkDoTicket`.
- Testes existentes dos três componentes: cobrir o novo botão.

### Contrato do popup
```ts
interface EnviarTicketModalProps {
  placa: string;
  token: string | null;          // sem token: não abre (RF8)
  estacionamento?: string;       // nome fantasia; opcional
  onClose: () => void;
  onEnviado: (canal: CanalEnvio) => void; // o pai mostra o Toast
}
```
- Estado interno: `canal` (padrão `"whatsapp"`), `contato`, `tocado`. Trocar de canal limpa `contato` e `tocado` e devolve o foco ao campo (`data-autofocus` no `Input`).
- WhatsApp: `onChange` aplica `formatPhone`; `type="tel"`, `inputMode="tel"`. E-mail: `type="email"`, `inputMode="email"`, `autoCapitalize="none"`.
- Erro de `validarContato` só aparece com `tocado` (onBlur ou tentativa de envio). Botão principal `disabled` enquanto houver erro.
- Confirmar (clique no botão, mesmo gesto do usuário): `window.open(href, "_blank", "noopener,noreferrer")` para WhatsApp; para e-mail, `window.location.href = href` (`mailto:` não deve abrir aba em branco). Depois, `onEnviado(canal)` e `onClose()`.
- Nome do estacionamento: `ReciboEntradaStep` já tem `empresa` (consulta `getEmpresa`, cacheada); `TicketView` pode usar o dado do comprovante se existir (`comprovante.data`), senão omitir. Não adicionar consulta nova.
- Mensagens do Toast: "Mensagem aberta no WhatsApp. Confirme o envio por lá." / "Mensagem aberta no aplicativo de e-mail. Confirme o envio por lá.".

### Server vs Client
Tudo Client Component (`"use client"`): usa estado, `window` e eventos. `envioTicket.ts` e `ticketLink.ts` são módulos puros; `ticketLink.ts` usa `window.location.origin` e só deve ser chamado em evento/efeito ou render client, como já é feito hoje.

## Decisões técnicas e trade-offs
- **Sem endpoint no back.** Decisão do produto (o operador conclui o envio no próprio app). Evita dependência de back, custo de provedor de WhatsApp/e-mail e problemas de entregabilidade. Trade-off: o sistema não sabe se a mensagem foi enviada, por isso o Toast diz "aberta", não "enviada".
- **DDI 55 fixo.** `wa.me` exige código do país e o produto é brasileiro; pedir DDI no popup pioraria o fluxo rápido. Número estrangeiro fica fora de escopo.
- **`isValidPhone` (10 ou 11 dígitos), não `isValidCelular`.** WhatsApp pode estar em linha fixa com DDD; só bloqueamos formato impossível. Se o produto quiser exigir celular, trocar por `isValidCelular` em um ponto só.
- **Helper `linkDoTicket` agora.** O terceiro ponto que usa o link justifica extrair; sem isso, o prefixo `/comprovante/` ficaria em três lugares.
- **Função pura de montagem separada do componente.** Permite testar o `href` (encoding, prefixo, dígitos) sem renderizar.
- **Popup único para os dois pontos de entrada**, em vez de um por tela: mesma UI, mesma validação, um teste.
- **Prévia só leitura.** Editar a mensagem aumenta superfície (validação, tamanho do `mailto:`) sem pedido do PRD.
- **Sem persistir o contato** (RF6): estado só em memória do componente; nada em `localStorage`, query string ou cache do TanStack Query.

## Riscos / pontos de atenção
- **Bloqueio de pop-up.** `window.open` só é seguro se chamado sincronamente no clique; não colocar `await` antes. Teste cobre que `window.open` é chamado no handler.
- **`mailto:` sem cliente de e-mail instalado** (comum em computador): nada acontece. Mitigação futura: botão "Copiar link". Não incluso agora; registrar se o operador relatar.
- **Tamanho da URL do `mailto:`/`wa.me`.** O link do ticket contém token e pode ser longo; a mensagem é curta (< 300 caracteres), dentro dos limites práticos.
- **Segurança.** O token vai dentro de uma URL externa (`wa.me`) e de uma mensagem para terceiro: é o objetivo da feature, mas o link dá acesso ao ticket público; o contato digitado não é registrado em log nem enviado ao servidor.
- **Layout dos três botões** no comprovante de entrada em 320px (`Actions` é `column-reverse` abaixo de `sm`): validar manualmente que "Concluir" continua por último e ações empilham sem corte.
- **Máscara + `type="tel"`** no `Input` base: confirmar que `formatPhone` no `onChange` não perde o cursor/teclado em iOS. Se o `Input` repassar `inputMode` normalmente, nenhum ajuste no base.
- **Dados do estacionamento ausentes** (consulta da empresa falhou): a mensagem deve continuar válida sem o nome.

## Fora de escopo técnico
- Endpoint no back, fila ou provedor de WhatsApp/e-mail; confirmação de entrega ou leitura.
- Persistir o contato do cliente ou pré-preencher envios futuros.
- DDI diferente de 55; envio nos dois canais ao mesmo tempo.
- Editar o texto da mensagem; botão "Copiar link".
- Enviar o recibo da saída.
- Mudanças na página pública do ticket (`/comprovante/[token]`).
