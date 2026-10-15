# Tech Spec: Lembrar Senha no Login

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-15  
**PRD:** [prd.md](./prd.md) · **Design:** [design.md](./design.md)

---

## 1. Visão Técnica

O `LoginForm` ganha um checkbox "Lembrar senha". Quando marcado e o login tem sucesso, CPF e senha são gravados no `localStorage`, com a **senha cifrada em AES-GCM** (Web Crypto). A chave é uma `CryptoKey` **não extraível** guardada no **IndexedDB**: ler só o `localStorage` não basta para recuperar a senha. Ao montar a tela, o formulário carrega os dados salvos (assíncrono), preenche os campos e marca o checkbox. Desmarcar e logar, ou clicar em "Sair", apaga tudo (dados e chave). Qualquer falha de armazenamento/cripto é silenciosa (RF-06).

Limite assumido (PRD): a proteção só impede leitura casual/XSS que lê apenas o `localStorage`; um XSS ativo ainda pode usar a chave do IndexedDB para decifrar.

Nenhuma mudança em API, proxy ou fluxo de autenticação.

## 2. Estrutura de Pastas

```
src/lib/rememberedLogin.ts                         # novo: salvar/carregar/limpar (cripto + storage)
src/components/ui/Checkbox/                        # novo
├── Checkbox.tsx
├── Checkbox.styles.ts
└── index.ts
src/components/auth/LoginForm/LoginForm.tsx        # alterado
src/components/layout/UserMenu/UserMenu.tsx        # alterado: "Sair" limpa o lembrado
```

Convenção do projeto (sem `src/features`, tipos sem prefixo `I`, estilos em `*.styles.ts`) em vez do template genérico da skill.

## 3. Interfaces e Tipos

```ts
// src/lib/rememberedLogin.ts
export interface RememberedLogin {
  cpf: string;   // formatado, como no campo
  senha: string; // em texto, só em memória; cifrado em disco
}

// formato persistido em localStorage["gipe_remembered_login"]
interface StoredLogin {
  cpf: string;
  iv: string;     // base64, 12 bytes aleatórios por gravação
  senha: string;  // base64 do ciphertext AES-GCM
}
```

## 4. Contratos de API

Nenhum. Feature 100% client-side.

### API do módulo `rememberedLogin`

```ts
export async function saveRememberedLogin(login: RememberedLogin): Promise<void>;
export async function loadRememberedLogin(): Promise<RememberedLogin | null>;
export async function clearRememberedLogin(): Promise<void>; // remove localStorage + chave
```

Regras:
- Todas **nunca lançam**: capturam erro e retornam `void`/`null` (RF-06; `localStorage`/`indexedDB`/`crypto.subtle` podem faltar ou lançar em modo privado).
- Chave: `crypto.subtle.generateKey({name:"AES-GCM", length:256}, false, ["encrypt","decrypt"])`, persistida no IndexedDB (DB `gipe`, store `keys`, id `remembered-login`) — `CryptoKey` é clonável no IndexedDB. Reutilizada se já existir; criada no primeiro save.
- A cada save: novo IV aleatório; AES-GCM sobre a senha (UTF-8).
- `load`: se faltar item, chave, ou a decifragem falhar (dado corrompido), limpa tudo e retorna `null`.
- `clear`: `localStorage.removeItem` e apaga a chave do IndexedDB.
- Código só roda no cliente (guard `typeof window`).

## 5. Componentes

### Checkbox (`src/components/ui/Checkbox`)

**Responsabilidade:** checkbox acessível do design system, conforme `design.md` §2.

```ts
export interface CheckboxProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
  name?: string;
}
```

- `<label>` (`Wrapper`) + `<input type="checkbox">` nativo invisível sobreposto à `Box` 20×20 com check em SVG inline; `hint` via `aria-describedby` (id com `useId`).
- Foco: `input:focus-visible + Box` com outline `colors.primary` 2px, offset 2px.
- Somente tokens do tema; props transientes (`$checked`, `$disabled`) nos styled components.
- Exportar em `src/components/ui/Checkbox/index.ts`.

### LoginForm (alterado)

- Estado local `remember` (`useState(false)`).
- `useEffect` na montagem: `loadRememberedLogin()`; se vier valor, `form.setFieldValue("cpf", …)`, `form.setFieldValue("senha", …)` e `setRemember(true)`. Cancelar com flag de desmontagem. Sem "piscada" além do carregamento assíncrono curto; campos ficam desabilitados não — apenas preenchem ao resolver.
- `mutation.onSuccess` recebe as `values` (3º argumento de `onSuccess`/variables): se `remember`, `await saveRememberedLogin(values)`, senão `await clearRememberedLogin()`; só depois `router.push("/dashboard")`. Falhas já são engolidas pelo módulo.
- Falha de login: `onSuccess` não roda → nada salvo nem apagado (RF-02, RF-04 só após sucesso).
- Renderizar `<Checkbox label="Lembrar senha" hint="Não recomendado em computadores compartilhados." checked={remember} onCheckedChange={setRemember} disabled={mutation.isPending} />` entre o campo Senha e a mensagem de erro/botão.
- `remember` não entra em `loginSchema`/`LoginValues` (não é dado de autenticação).

### UserMenu (alterado)

`handleLogout` chama `void clearRememberedLogin()` junto de `clearToken()` (RF-05).

## 6. Gerenciamento de Estado

**Estratégia:** local (`useState` no `LoginForm`). Sem Zustand/Context: o estado só existe nessa tela.

## 7. Fluxo de Dados

```
Montagem:  localStorage + IndexedDB → loadRememberedLogin → form.setFieldValue + setRemember → UI
Login OK:  mutation.onSuccess → (remember ? save : clear) → router.push
Sair:      UserMenu.handleLogout → clearToken + clearRememberedLogin
```

## 8. Estratégia de Testes

Decisão do projeto: **sem testes automatizados novos** para esta feature. Verificação:

| Camada | Como |
|--------|------|
| Estática | `npm run lint` e `npm run build` |
| Manual | Fluxos 1–4 do PRD; RF-06 em janela anônima/armazenamento bloqueado; conferir no DevTools que `localStorage["gipe_remembered_login"].senha` não está legível; foco por teclado (Tab/Espaço) e leitor de tela; temas claro/escuro |

## 9. Dependências

Nenhuma nova. Usa Web Crypto e IndexedDB nativos. Sem biblioteca de IndexedDB (uso mínimo: um get/put/delete via wrapper de promises no próprio módulo).

## 10. Riscos Técnicos

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| `crypto.subtle` indisponível (contexto não seguro, HTTP) | Média | Falha silenciosa: não salva (RF-06). Documentar que exige HTTPS/localhost |
| Navegador não clona `CryptoKey` no IndexedDB (Safari antigo) | Baixa | `save` falha e é ignorado; nada é gravado no localStorage sem a chave |
| Chave apagada pelo navegador, dado órfão no localStorage | Baixa | `load` falha na decifragem → limpa e retorna `null` |
| XSS ativo ainda decifra usando a chave | Média | Risco aceito no PRD; aviso ao usuário; considerar lembrar só o CPF no futuro |
| Condição de corrida: usuário digita antes do preenchimento assíncrono | Baixa | Só preencher se os campos ainda estiverem vazios |
| Preenchimento do gerenciador de senhas do navegador conflita | Baixa | Manter `autoComplete` atual; validar manualmente |

## 11. Decisões de Arquitetura

| Decisão | Alternativas Consideradas | Motivo da Escolha |
|---------|---------------------------|-------------------|
| AES-GCM + chave não extraível no IndexedDB | Base64 simples; senha em texto; só lembrar CPF | Escolha do produto: protege contra leitura casual do `localStorage` sem backend |
| Módulo `src/lib/rememberedLogin.ts` que nunca lança | Hook dedicado; Zustand | Lógica não-visual, reutilizada por `LoginForm` e `UserMenu`; erros silenciosos exigidos por RF-06 |
| `localStorage` para dados, IndexedDB só para a chave | Tudo no IndexedDB | `CryptoKey` não é serializável em `localStorage`; manter CPF/ciphertext simples de limpar |
| `remember` fora do schema Zod | Incluir no `loginSchema` | Não é dado validado nem enviado ao backend |
| Novo `ui/Checkbox` | Reaproveitar `ChipInput`; `<input>` solto | Não existe checkbox genérico; design system exige componente base |
