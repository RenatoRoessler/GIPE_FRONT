# Tech Spec: Aceite de Termos de Uso e Política de Privacidade na Adesão

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só aponta para ele e fixa as decisões técnicas de UI)

## Design
- Telas/estados: dois blocos novos ("Termos de Uso" e "Política de Privacidade") no fim da etapa Conferir, depois de Plano/Teste grátis, nos dois modos. Estados: padrão, marcado, erro de validação, enviando (caixas desabilitadas) e recusa do backend, conforme `design.md`.
- Componentes do design system reaproveitados: `Checkbox`, `Link` (`ui`), `ErrorBanner` e `Button` (já usados na Conferir), e os estilos `Secao`, `SecaoCabecalho` e `SecaoTitulo` do `ConferirStep`.
- Componentes novos: apenas `BlocoAceite`, interno ao `ConferirStep` (função local, como `Bloco` e `ResumoTeste`). Não vai para `ui`.
- Tokens de tema: nenhum novo.

## Arquitetura da solução

### Documentos públicos
- Copiar `termos-de-uso.html` e `politica-de-privacidade.html` (hoje em `Downloads\teclado`) para `public/legal/`, servidos em `/legal/termos-de-uso.html` e `/legal/politica-de-privacidade.html`. São páginas autocontidas (têm `<head>` e estilo próprios), então não viram rotas do App Router.
- `src/proxy.ts`: o `matcher` hoje manda para `/login` quem não tem token em qualquer rota fora da lista. A adesão é pública, então os documentos também precisam ser. Acrescentar `legal` à exclusão do `matcher` (junto de `icons`, `ocr`, `offline.html`) e atualizar o comentário. Ajustar `src/proxy.test.ts` (o `it.each` de arquivos estáticos, linha ~155) com os dois caminhos.

### Constantes
- Novo `src/lib/termos.ts`:
  - `VERSAO_TERMOS = "v1.0"` (única fonte da versão; trocar aqui quando os documentos mudarem).
  - `DOCUMENTOS_ACEITE`: `{ termos: { titulo: "Termos de Uso", url: "/legal/termos-de-uso.html" }, privacidade: { titulo: "Política de Privacidade", url: "/legal/politica-de-privacidade.html" } }`.

### Tipos e validação
- `src/types/adesao.ts`: `AceiteData { termos: boolean; privacidade: boolean }` e `EMPTY_ACEITE_DATA` (ambos `false`).
- `src/lib/schemas/adesao.ts`: `aceiteSchema` com `termos` e `privacidade` como `z.literal(true)` e as mensagens do design ("Aceite os Termos de Uso para continuar." / "Aceite a Política de Privacidade para continuar."). Mensagens como constantes exportadas, como `PLANO_OBRIGATORIO_MESSAGE`.

### Contrato de envio
- `src/lib/api/services/adesao.mapper.ts`:
  - `AdesaoPayload` ganha `aceiteTermos: { aceito: boolean; versaoTermos: string }`.
  - `AdesaoInput` ganha `aceite: AceiteData`.
  - `toAdesaoPayload` preenche `aceiteTermos: { aceito: aceite.termos && aceite.privacidade, versaoTermos: VERSAO_TERMOS }`. O backend recebe um único aceite; ele só é `true` se os dois foram dados.
- `adesao.ts` (`saveAdesao`) não muda.
- Atualizar `adesao.mapper.test.ts` e os testes que montam `AdesaoInput`.

### Estado e fluxo (`src/components/adesao/useAdesaoWizard.ts`)
- O aceite não tem formulário próprio: são dois booleanos sem digitação, então `useState<AceiteData>` basta, mais `useState<Partial<Record<keyof AceiteData, string>>>` para os erros. Preserva-se na troca de etapas porque o hook vive durante todo o fluxo (RF7).
- `aceitar(chave, valor)`: atualiza o booleano e limpa o erro dessa chave.
- `enviar()`: antes de chamar a mutation, valida com `aceiteSchema`. Se inválido, preenche os erros e chama `focarPrimeiroInvalido()`, que já procura `[aria-invalid="true"]` (o `Checkbox` define isso). Só então segue para `mutateAsync({ ..., aceite })`.
- `corrigir(alvo)`: para alvo na etapa Conferir, não troca de etapa nem liga `retornoConferencia` (o usuário já está lá): faz `mutation.reset()` e foca `[name="<campo>"]` depois do render, como já faz hoje.
- O hook passa a expor `aceite`, `erroAceite` e `aceitar`.

### Tratamento de recusa do backend (`src/lib/api/adesaoErrors.ts`)
- `CampoAdesao` ganha `"aceiteTermos"` e `"aceitePrivacidade"`; `AlvoErro.etapa` passa a aceitar `ETAPA.Conferir`.
- `ALVOS`: `rotulo` "Termos de Uso" e "Política de Privacidade". O botão do banner fica "Corrigir Termos de Uso" / "Corrigir Política de Privacidade".
- `PALAVRAS_CHAVE`: `/privacidade/i` → privacidade; `/termos|aceite/i` → termos. Entram depois de cnpj/cpf/e-mail para não roubar mensagens existentes. O formato real do erro do backend ainda não é conhecido (ver riscos); a lógica continua isolada nesse arquivo.
- Os `name` dos `Checkbox` são exatamente `aceiteTermos` e `aceitePrivacidade`, para o `corrigir` achar o campo.

### UI
- `ConferirStep.tsx`: novas props `aceite: AceiteData`, `erroAceite`, `onAceitar` e `desabilitado`. Renderiza `BlocoAceite` duas vezes depois do bloco de plano/teste. Sem "Editar".
- `BlocoAceite` (local): `Secao` com `aria-label` do título, texto de apoio, `Link` (`href` do documento, `target="_blank"`, `rel="noopener noreferrer"`, `prefetch={false}`, texto visível "Ler …" com complemento "(abre em nova aba)") e `Checkbox` (`name`, `label` "Li e aceito …", `checked`, `onCheckedChange`, `error`, `disabled`). O `Link` do design system é um `NextLink`; com `target="_blank"` e `prefetch={false}` ele funciona para um arquivo estático em `public/`. O link fica fora do `label` do `Checkbox` (que é `string`), de modo que clicar nele não marca a caixa.
- `OnboardingWizard.tsx`: passa `aceite`, `erroAceite`, `onAceitar={wizard.aceitar}` e `desabilitado={enviando}` ao `ConferirStep`. Nenhuma outra mudança; o botão "Criar conta" continua habilitado fora do envio.
- `ConferirStep.styles.ts`: um estilo local para o texto de apoio e o agrupamento link + caixa (coluna no mobile, `breakpoints.sm` para a linha de apoio + link), só com tokens do tema.
- Todos os componentes alterados já são Client Components (`"use client"`); `public/legal/*` é estático.

### Testes (vitest + Testing Library, ao lado de cada arquivo)
- `ConferirStep.test.tsx`: os dois blocos aparecem nos dois modos; caixas desmarcadas; links com `href`, `target` e `rel` corretos; erros junto das caixas; caixas desabilitadas quando `desabilitado`.
- `useAdesaoWizard` / `OnboardingWizard.test.tsx`: sem aceite não envia e foca a primeira pendente; um aceite só mantém o erro do outro; com os dois, chama `saveAdesao` com `aceiteTermos`; aceites persistem ao voltar e retornar.
- `adesao.mapper.test.ts`, `adesaoErrors.test.ts`, `adesao.test.ts` (schema), `proxy.test.ts`: conforme itens acima.

## Decisões técnicas e trade-offs
- **Arquivos estáticos em `public/legal` em vez de rotas Next:** os HTMLs já são páginas completas. Convertê-los em páginas React duplicaria conteúdo jurídico e exigiria manutenção em dois formatos. Contrapartida: não herdam o tema do app e precisam de exceção no `proxy`.
- **Nova aba em vez de modal:** o documento é longo e o usuário não perde o preenchimento nem a posição na conferência; evita reimplementar scroll/foco de modal. Um `Modal` com iframe pode ser avaliado depois se houver pedido.
- **`useState` e não `useAppForm`:** os outros passos usam TanStack Form por causa de máscaras e validação por campo; aqui são dois booleanos, e o schema Zod só valida no envio.
- **Um único `aceito` no payload:** o backend tem um aceite e uma versão. Exigimos os dois no front e enviamos o resultado combinado; não registramos qual documento foi aceito separadamente, porque o contrato não permite.
- **Versão como constante:** a versão enviada é a dos documentos publicados em `public/legal`. Acoplar as duas coisas em um arquivo evita publicar um documento novo e esquecer de subir a versão.
- **`Checkbox` sem mudanças:** o `label` continua `string`, então o link fica no corpo do bloco, como o design prevê.

## Riscos / pontos de atenção
- **Formato do erro do backend desconhecido:** a atribuição por palavra-chave pode não reconhecer a recusa do aceite; nesse caso o `ErrorBanner` aparece só com a mensagem, sem o botão "Corrigir". Confirmar com o back o texto/código do erro e a validação do `versaoTermos` (se rejeita versões desconhecidas, "v1.0" precisa existir lá).
- **Conteúdo dos HTMLs:** os arquivos usam Google Fonts e CSS próprio; verificar se carregam sem erro sob a CSP do projeto (se houver) e se funcionam offline/PWA (o service worker só trata navegações com a página offline).
- **Mudança dos documentos:** subir `VERSAO_TERMOS` sempre que o texto mudar; o aceite de quem já se cadastrou não é refeito (fora de escopo).
- **Testes existentes:** os que enviam a adesão (`OnboardingWizard`, `ConferirStep`, `adesao.test.ts`, `adesao.mapper.test.ts`) passam a exigir `aceite`; atualizar os fixtures.
- **`AGENTS.md`:** este Next.js tem mudanças incompatíveis. Antes de editar o `matcher` do `proxy.ts`, conferir em `node_modules/next/dist/docs/` a sintaxe atual de `proxy`/`matcher`.

## Fora de escopo técnico
- Conversão dos documentos para componentes React ou rotas do App Router.
- Reaceite por versão nova, histórico de aceites ou envio separado de cada aceite.
- Aceite em outros fluxos (novo usuário, nova empresa, mensalistas — este já tem o seu aceite próprio em `contrato`).
- Alterar a lógica de etapas (`etapas.ts`) ou o Stepper.
