# Tasks: Lembrar Senha no Login

Referências: ./prd.md, ./design.md, ./techspec.md

Sem testes automatizados novos (decisão do Tech Spec §8): cada task é validada por lint, build e checagem manual.

- [x] T1 — Criar o componente `ui/Checkbox`
  - Arquivos: `src/components/ui/Checkbox/Checkbox.tsx`, `src/components/ui/Checkbox/Checkbox.styles.ts`, `src/components/ui/Checkbox/index.ts`
  - Dependências: —
  - Pronto quando: exporta `Checkbox` com props `label`, `checked`, `onCheckedChange`, `hint?`, `disabled?`, `name?`; usa `<input type="checkbox">` nativo invisível sobreposto à caixa 20×20 com check em SVG inline; `hint` ligado por `aria-describedby` (`useId`); foco visível via `input:focus-visible + Box` (outline `colors.primary` 2px, offset 2px); desabilitado com `opacity: 0.5` e `cursor: not-allowed`; alvo de toque mínimo de 44px; só tokens do tema e props transientes (`$checked`, `$disabled`); opera com Tab/Espaço; `npm run lint` passa.

- [x] T2 — Criar o módulo `src/lib/rememberedLogin.ts`
  - Arquivos: `src/lib/rememberedLogin.ts`
  - Dependências: —
  - Pronto quando: exporta `RememberedLogin`, `saveRememberedLogin`, `loadRememberedLogin` e `clearRememberedLogin`; senha cifrada com AES-GCM (IV aleatório de 12 bytes por gravação) e persistida em `localStorage["gipe_remembered_login"]` como `{ cpf, iv, senha }` em base64; chave `CryptoKey` não extraível guardada no IndexedDB (DB `gipe`, store `keys`, id `remembered-login`) e reutilizada; `load` limpa tudo e retorna `null` se faltar item/chave ou a decifragem falhar; `clear` remove o item e a chave; nenhuma função lança (try/catch, guard `typeof window`); `npm run lint` passa.

- [x] T3 — Integrar o checkbox e o preenchimento ao `LoginForm`
  - Arquivos: `src/components/auth/LoginForm/LoginForm.tsx`
  - Dependências: T1, T2
  - Pronto quando: estado local `remember` (`useState(false)`, fora do `loginSchema`); `<Checkbox label="Lembrar senha" hint="Não recomendado em computadores compartilhados.">` entre o campo Senha e a mensagem de erro/botão, desabilitado durante `mutation.isPending`; na montagem, `loadRememberedLogin()` preenche CPF e senha via `form.setFieldValue` (só se os campos ainda estiverem vazios, com cancelamento na desmontagem) e marca o checkbox; em `onSuccess`, `remember` salva (`saveRememberedLogin`) ou desmarcado limpa (`clearRememberedLogin`) antes do `router.push("/dashboard")`; login com erro não salva nem apaga nada; login segue funcionando sem armazenamento disponível (RF-01 a RF-04, RF-06).

- [x] T4 — Limpar os dados lembrados ao clicar em "Sair"
  - Arquivos: `src/components/layout/UserMenu/UserMenu.tsx`
  - Dependências: T2
  - Pronto quando: `handleLogout` chama `void clearRememberedLogin()` junto de `clearToken()`; depois de "Sair", a tela de login abre com campos vazios e checkbox desmarcado (RF-05).

- [ ] T5 — Verificação final (lint/build) e checagem manual dos critérios de aceite
  - Arquivos: n/a
  - Dependências: T1–T4
  - Pronto quando: `npm run lint` e `npm run build` passam sem erros; e, manualmente: (a) login com "Lembrar senha" marcado e volta à tela de login preenche CPF e senha com o checkbox marcado (Fluxos 1 e 2); (b) desmarcar e logar deixa os campos vazios na próxima visita (Fluxo 3); (c) "Sair" apaga os dados lembrados (Fluxo 4); (d) credencial inválida com checkbox marcado não salva nada; (e) em janela anônima/armazenamento bloqueado o login funciona sem erro visível (RF-06); (f) no DevTools, `localStorage["gipe_remembered_login"].senha` não está legível; (g) checkbox operável por teclado e anunciado por leitor de tela, com foco visível e contraste adequado nos temas claro e escuro.
