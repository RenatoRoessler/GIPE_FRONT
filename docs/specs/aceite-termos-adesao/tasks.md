# Tasks: Aceite de Termos de Uso e Política de Privacidade na Adesão

Referências: ./prd.md, ./techspec.md, ./design.md

- [x] T1 — Publicar os documentos e liberar o acesso sem login
  - Arquivos: `public/legal/termos-de-uso.html`, `public/legal/politica-de-privacidade.html` (copiados de `C:\Users\renat\Downloads\teclado`), `src/proxy.ts`, `src/proxy.test.ts`
  - Antes de editar o `matcher`, conferir a sintaxe atual em `node_modules/next/dist/docs/` (AGENTS.md).
  - Pronto quando: `legal` está excluído do `matcher` (com o comentário atualizado), o teste de arquivos estáticos do `proxy.test.ts` inclui os dois caminhos e passa, e os dois HTMLs abrem sem login com `npm run dev`.

- [x] T2 — Constantes dos termos
  - Arquivos: `src/lib/termos.ts` (novo)
  - Pronto quando: exporta `VERSAO_TERMOS = "v1.0"` e `DOCUMENTOS_ACEITE` (título e URL de `termos` e `privacidade`), sem valores soltos fora desse arquivo.

- [x] T3 — Tipos e schema do aceite
  - Arquivos: `src/types/adesao.ts`, `src/lib/schemas/adesao.ts`, `src/lib/schemas/adesao.test.ts`
  - Pronto quando: existem `AceiteData`, `EMPTY_ACEITE_DATA` (ambos `false`) e `aceiteSchema` (`z.literal(true)` para cada item, com as mensagens do design como constantes exportadas); testes cobrem: nenhum marcado, só um marcado e os dois marcados.

- [x] T4 — Contrato de envio com `aceiteTermos`
  - Arquivos: `src/lib/api/services/adesao.mapper.ts`, `src/lib/api/services/adesao.mapper.test.ts`, `src/lib/api/services/adesao.test.ts`
  - Depende de: T2, T3
  - Pronto quando: `AdesaoInput` recebe `aceite`, `AdesaoPayload` tem `aceiteTermos: { aceito, versaoTermos }`, `aceito` só é `true` com os dois aceites e a versão vem de `VERSAO_TERMOS`; testes do mapper e do serviço atualizados e passando.

- [x] T5 — Atribuição de erro do backend ao aceite
  - Arquivos: `src/lib/api/adesaoErrors.ts`, `src/lib/api/adesaoErrors.test.ts`
  - Pronto quando: `CampoAdesao` inclui `aceiteTermos` e `aceitePrivacidade`, `AlvoErro.etapa` aceita `ETAPA.Conferir`, os rótulos são "Termos de Uso" e "Política de Privacidade", e as palavras-chave (`/privacidade/i`, `/termos|aceite/i`) entram depois de cnpj/cpf/e-mail sem alterar os casos existentes; testes cobrem os dois novos alvos e a não regressão dos antigos.

- [x] T6 — Estado e validação do aceite no wizard
  - Arquivos: `src/components/adesao/useAdesaoWizard.ts`
  - Depende de: T3, T4, T5
  - Pronto quando: o hook expõe `aceite`, `erroAceite` e `aceitar`; `enviar()` valida com `aceiteSchema`, preenche os erros e foca o primeiro inválido antes de chamar a mutation, e envia `aceite` junto; `corrigir` para alvo na Conferir só reseta a mutation e foca `[name="<campo>"]`, sem trocar de etapa nem ligar `retornoConferencia`; os aceites persistem ao voltar e retornar.

- [x] T7 — Blocos de aceite na Conferir
  - Arquivos: `src/components/adesao/ConferirStep/ConferirStep.tsx`, `src/components/adesao/ConferirStep/ConferirStep.styles.ts`, `src/components/adesao/ConferirStep/ConferirStep.test.tsx`
  - Depende de: T2, T3
  - Pronto quando: `ConferirStep` recebe `aceite`, `erroAceite`, `onAceitar`, `desabilitado` e mostra `BlocoAceite` ("Termos de Uso" e "Política de Privacidade") depois de Plano/Teste grátis nos dois modos, conforme `design.md`: `section` com `aria-label`, link com `target="_blank"`, `rel="noopener noreferrer"` e `prefetch={false}` fora do rótulo, `Checkbox` com `name` `aceiteTermos`/`aceitePrivacidade`, erro junto da caixa, caixas desabilitadas durante o envio, só tokens do tema; testes cobrem os estados.

- [x] T8 — Ligar o `OnboardingWizard`
  - Arquivos: `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx`, `src/components/adesao/OnboardingWizard/OnboardingWizard.test.tsx`
  - Depende de: T6, T7
  - Pronto quando: o wizard passa `aceite`, `erroAceite`, `onAceitar` e `desabilitado={enviando}` ao `ConferirStep`; testes cobrem: sem aceite não envia e foca a primeira caixa pendente, um aceite só mantém o erro do outro, com os dois chama `saveAdesao` com `aceiteTermos` (`aceito: true`, `"v1.0"`), banner "Corrigir Termos de Uso"/"Corrigir Política de Privacidade" foca a caixa, e funciona nos modos plano e teste grátis.

- [x] T9 — Ajustar os demais testes que montam a adesão
  - Arquivos: testes existentes que usam `AdesaoInput` ou o fluxo completo de adesão (localizar com busca por `saveAdesao`, `toAdesaoPayload` e `ConferirStep`)
  - Depende de: T4, T8
  - Pronto quando: nenhum teste falha por falta de `aceite`/aceites marcados.

- [ ] T10 — Verificação final
  - Arquivos: —
  - Depende de: T1–T9
  - Pronto quando: `npm run lint`, os testes e `npm run build` passam; no navegador, a conferência mostra os dois blocos em ~320 px sem rolagem horizontal, os links abrem os documentos em nova aba sem perder o preenchimento, e o cadastro conclui com os dois aceites marcados.
