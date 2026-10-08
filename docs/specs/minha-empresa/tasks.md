# Tasks: Minha Empresa

Referências: ./prd.md, ./techspec.md

- [x] T1 — Extrair `ErrorBanner` do `OnboardingWizard` para um componente compartilhado
  - Arquivos: `src/components/ui/ErrorBanner/{ErrorBanner.tsx,ErrorBanner.styles.ts,index.ts}`, `src/components/adesao/OnboardingWizard/OnboardingWizard.styles.ts`, `src/components/adesao/OnboardingWizard/OnboardingWizard.tsx`
  - Pronto quando: o wizard da adesão importa o `ErrorBanner` de `@/components/ui/ErrorBanner`, o visual não muda e `npm run lint` passa.

- [x] T2 — Criar o componente `Accordion` / `AccordionItem`
  - Arquivos: `src/components/ui/Accordion/{Accordion.tsx,Accordion.styles.ts,index.ts}`
  - Pronto quando: item controlado (`open`/`onOpenChange`), cabeçalho `<button aria-expanded aria-controls>` dentro de `<h2>`, painel `role="region"` com `aria-labelledby`, painel recolhido apenas com `hidden` (continua montado), props `title`, `summary` e `hasError` (indicador `danger`), só tokens do tema, funciona por teclado (Enter/Espaço) e lint passa.

- [x] T3 — Adicionar tipos da tela e extrair helpers dos mappers da adesão
  - Arquivos: `src/types/empresa.ts`, `src/lib/api/services/adesao.mapper.ts`
  - Pronto quando: `EmpresaFormValues = { company: CompanyData; hours: BusinessHoursData }` existe; `toEnderecoPayload` e `toHorariosPayload` são exportadas de `adesao.mapper.ts` e usadas por `toAdesaoPayload`, sem mudar o payload gerado (conferido por comparação do resultado antes/depois) e lint/typecheck passam.

- [x] T4 — Criar o mapper da empresa (`GET`/`PUT`)
  - Arquivos: `src/lib/api/services/empresa.mapper.ts`
  - Pronto quando: `fromEmpresaResponse` formata CNPJ, telefone e CEP, converte vagas em string, localiza os dias por `diaDaSemana` (não por posição), completa dias ausentes como fechados, converte `HH:mm:ss` em `HH:mm` e `null` em `""`, e tolera campos ausentes; `toEmpresaPayload` gera corpo plano com dígitos em CNPJ/telefone, CEP com hífen, vagas inteiras, horas `HH:mm:00` e `null` nos dias fechados ou de 24 horas; conferido com o exemplo de `docs/specs/input.md`.

- [x] T5 — Criar o serviço da empresa
  - Arquivos: `src/lib/api/services/empresa.ts`
  - Pronto quando: `getEmpresa()` faz `GET /Empresa` e devolve `EmpresaFormValues`; `updateEmpresa(values)` faz `PUT /Empresa` com `toEmpresaPayload`; erros sobem como `ApiError`; nada de token ou payload em log.

- [x] T6 — Permitir travar o CNPJ nos campos de empresa
  - Arquivos: `src/components/adesao/CompanyStepFields/CompanyStepFields.tsx`
  - Pronto quando: nova prop opcional `lockCnpj` desabilita só o campo CNPJ (valor continua no formulário); sem a prop, a adesão se comporta como antes.

- [x] T7 — Criar o formulário da tela `EmpresaForm`
  - Arquivos: `src/components/empresa/MinhaEmpresa/EmpresaForm.tsx`, `src/components/empresa/MinhaEmpresa/MinhaEmpresa.styles.ts`
  - Pronto quando: recebe os valores iniciais por prop e os usa como `defaultValues` de dois `useAppForm` (`companySchema` e `businessHoursSchema`); mostra as seções "Dados da empresa" (com `lockCnpj`) e "Funcionamento" em `Accordion`, ambas abertas por padrão; "Salvar" valida os dois formulários, abre a seção com erro e foca o primeiro campo inválido; com tudo válido, chama a mutation `updateEmpresa`; em sucesso atualiza o cache `["empresa"]`, faz `reset` com os valores salvos e exibe `Toast`; em erro mostra `ErrorBanner` mantendo os dados; "Salvar" e "Descartar alterações" só ficam ativos com alteração; durante o envio, botões e campos ficam desabilitados.

- [x] T8 — Criar o container `MinhaEmpresa` com consulta, carregamento e erro
  - Arquivos: `src/components/empresa/MinhaEmpresa/MinhaEmpresa.tsx`, `src/components/empresa/MinhaEmpresa/index.ts`
  - Pronto quando: `useQuery(["empresa"])` com `refetchOnWindowFocus: false`; mostra "Carregando…" durante a carga; em falha mostra `ErrorBanner` com a mensagem e botão "Tentar novamente"; com dados, monta `EmpresaForm`.

- [x] T9 — Criar a rota e o item de menu
  - Arquivos: `src/app/(app)/minha-empresa/page.tsx`, `src/lib/nav.ts`, `src/components/layout/Sidebar/NavIcons.tsx`
  - Pronto quando: `/minha-empresa` renderiza `MinhaEmpresa` dentro do `AppShell` e exige login; `NavIconId` ganha `"company"`, o ícone existe e o item "Minha Empresa" aparece no menu com estado ativo na rota.

- [ ] T10 — Verificação final
  - Arquivos: —
  - Pronto quando: `npm run lint` e `npm run build` passam; no navegador (desktop e 375px) carga dos dados, alternar seções sem perder edição, validação com erro em seção recolhida, dia fechado/24h, "Copiar segunda", busca de CEP, salvar e recarregar, descartar, clique repetido em "Salvar", falha de rede e erro do backend funcionam; o corpo do `PUT` confere com `docs/specs/input.md`; a adesão segue funcionando. Atenção: o `PUT` altera dados reais, então usar empresa de teste e restaurar os valores.
