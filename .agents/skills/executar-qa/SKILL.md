---
name: executar-qa
description: Executes full QA validation of a feature using Playwright for E2E tests, verifying all PRD requirements and Tech Spec contracts. Checks WCAG 2.2 accessibility, documents bugs with screenshot evidence, and produces a QA report. Use after feature implementation is complete. Do not use for unit test planning, code review, or features without a PRD.
argument-hint: '[feature-name]'
---

# Executar QA

## Pré-condições

- Requer `docs/spec/[slug]/prd.md`
- Requer `docs/spec/[slug]/techspec.md`
- Requer `docs/spec/[slug]/tasks.md`
- O QA **não está completo** até que todas as verificações passem
- Documentar **todos** os bugs encontrados com screenshots de evidência

## Step 1: Preparação

1. Leia o PRD para mapear todos os requisitos funcionais e critérios de aceite.
2. Leia a Tech Spec para entender contratos de API e estrutura esperada.
3. Leia `tasks.md` para verificar quais tasks estão marcadas como concluídas.
4. Inicie o servidor de desenvolvimento: `npm run dev` ou equivalente.
5. Confirme que a aplicação está respondendo antes de prosseguir.

## Step 2: Testes Unitários e de Componente

1. Execute o suite de testes unitários e de componente: `npm run test`.
2. Registre resultados: testes passando, falhando e skipped.
3. Se algum teste falhar, registre como bug antes de prosseguir.

## Step 3: Testes E2E com Playwright

1. Verifique se o Playwright está configurado no projeto: procure `playwright.config.ts` ou `playwright.config.js` na raiz.
   - Se não existir, execute `npx playwright install` para instalar os browsers e crie a configuração mínima apontando para o servidor de dev.

2. **Autenticação obrigatória — injetar cookie antes de cada teste.**
   O cookie `CockpitLogged` deve ser lido do arquivo `.env` na raiz do projeto e injetado via `context.addCookies(...)` antes de qualquer navegação. Leia o valor com:

   ```typescript
   import * as fs from 'fs';
   import * as path from 'path';
   import * as dotenv from 'dotenv';

   const env = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../../.env')));
   const cockpitToken = env['CockpitLogged'];
   ```

   Injete o cookie antes de `page.goto(...)`:

   ```typescript
   await context.addCookies([
     {
       name: 'CockpitLogged',
       value: cockpitToken,
       domain: '.webmotors.com.br',
       path: '/',
       httpOnly: false,
       secure: false
     }
   ]);
   ```

   **Nunca hardcode o token nos testes** — sempre leia do `.env`.
   O `baseURL` do Playwright deve ser `http://local.webmotors.com.br:8000` para que o domínio do cookie seja respeitado.

3. Para cada requisito funcional do PRD, escreva ou execute um teste E2E que:
   - Navega até a URL relevante no browser real (use `page.goto(url)`).
   - Executa as interações descritas no critério de aceite.
   - Captura screenshot como evidência: `await page.screenshot({ path: 'docs/spec/[slug]/screenshots/rf-XX.png' })`.
4. Execute todos os testes E2E: `npx playwright test` ou `npm run test:e2e`.
5. Se um teste E2E falhar, registre como bug com o screenshot gerado automaticamente pelo Playwright.

### Cenários E2E obrigatórios por tipo de requisito

| Tipo de RF                              | Cenário E2E mínimo                                                                                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Feature flag / renderização condicional | Verificar presença/ausência de elementos chave dependendo do estado da flag — **não validar ausência de erros de console** (libs externas podem emitir warnings fora do escopo da feature) |
| Navegação e rotas                       | `page.goto(url)` + `expect(page).toHaveURL(...)` + verificar elemento da página destino                                                                                                    |
| Formulários                             | Preencher campos, submeter, verificar feedback de sucesso e erro                                                                                                                           |
| Temas / estilos visuais                 | Screenshot comparativo ou verificação de CSS property via `page.evaluate`                                                                                                                  |
| Estados de loading/erro                 | Interceptar request com `page.route(...)` para simular erro ou delay                                                                                                                       |

## Step 4: Validação de Requisitos Funcionais

Para cada requisito funcional do PRD:

1. Execute o cenário E2E correspondente (do Step 3).
2. Capture screenshot como evidência.
3. Marque como ✅ PASS ou ❌ FAIL.
4. Para FAIL, documente com: descrição, passos para reproduzir, screenshot, severidade.

## Step 5: Validação de Acessibilidade (WCAG 2.2)

Verifique nos fluxos principais usando Playwright:

```typescript
// Exemplo: verificar contraste e atributos via axe-playwright (se disponível)
import { checkA11y } from 'axe-playwright';
await checkA11y(page);
```

- [ ] Navegação completa por teclado: `await page.keyboard.press('Tab')` e verificar foco
- [ ] Contraste de cores mínimo 4.5:1 para texto normal
- [ ] Atributos `aria-label`, `role` e `alt` presentes onde necessário: `page.getByRole(...)`
- [ ] Mensagens de erro anunciadas por leitores de tela
- [ ] Foco visível em todos os elementos interativos

## Step 6: Validação de Edge Cases

Teste os cenários de borda via E2E:

- [ ] Campos obrigatórios vazios — submeter sem preencher e verificar mensagem de erro
- [ ] Dados inválidos (formatos, limites) — entrada fora do range esperado
- [ ] Estados de loading e erro — interceptar API com `page.route(...)` para simular falha
- [ ] Comportamento com dados vazios/nulos — mock de resposta vazia
- [ ] Comportamento offline — `await context.setOffline(true)`

## Step 7: Documentar Resultados

1. Leia o template em `assets/qa-report-template.md`.
2. Crie `docs/spec/[slug]/qa-report.md` com:
   - Resumo executivo (APROVADO / REPROVADO)
   - Matriz de cobertura de requisitos
   - Lista de bugs encontrados com severidade e evidências (screenshots linkados)
   - Itens de melhoria (não-bloqueadores)
3. Salve todos os screenshots em `docs/spec/[slug]/screenshots/`.
4. Se bugs forem encontrados, crie `docs/spec/[slug]/bugs.md` para o ciclo de bugfix.

## Step 8: Critério de Aprovação

O QA está **aprovado** quando:

- [ ] 100% dos testes unitários e de componente passam
- [ ] 100% dos testes E2E passam
- [ ] 100% dos requisitos funcionais validados como PASS
- [ ] Nenhum bug de severidade Critical ou High em aberto
- [ ] Acessibilidade básica (WCAG 2.2 nível AA) verificada

## Error Handling

- Se o servidor não iniciar, documente o bloqueio e interrompa o QA.
- Se o Playwright não estiver instalado e não for possível instalar, documente os testes E2E como "não executados" e marque o QA como REPROVADO parcial até execução completa.
- Se um requisito do PRD for ambíguo para validação, consulte o usuário antes de marcar como PASS.
- Bugs de severidade Critical bloqueiam aprovação — não contornar.
