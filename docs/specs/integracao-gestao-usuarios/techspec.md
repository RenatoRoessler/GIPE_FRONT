# Tech Spec: Integração da Gestão de Usuários

**Status:** Rascunho  
**Autor:** Renato Roessler  
**Data:** 2026-10-22  
**PRD:** ./prd.md  
**Design:** ./design.md

> Convenções: segue o `CLAUDE.md` (Next.js App Router + TypeScript + styled-components; tipos em `src/types`, serviços em `src/lib/api/services`, componentes em `src/components/<feature>`). O padrão de referência é o de Mensalistas (`mensalista.ts` + `mensalista.mapper.ts`, `useMensalistas`, `MensalistaModal`, `useAppForm` + Zod). Este documento substitui `docs/specs/gestao-usuarios/techspec.md` (versão mockada).

## Referências
- PRD: ./prd.md
- Design: ./design.md (a seção "Design" abaixo só referencia essa decisão)
- Contrato da API: `docs/specs/input.md`

## Design
- **Telas/estados:** listagem (`/usuarios`), modal de novo usuário em 2 etapas, modal de edição (perfil e acesso), modal de alterar a própria senha. Estados de carregando, vazio, erro, salvando e sucesso conforme `design.md`.
- **Componentes do design system reaproveitados:** `Table*`, `StatusBadge`, `Button`, `Modal`, `ConfirmDialog`, `Input`, `Select`, `Switch`, `Skeleton`, `ErrorBanner`, `Toast`, `Text`, `PasswordRequirements` (precisa de ajuste, ver abaixo).
- **Componentes novos (feature, não do design system):** em `src/components/usuarios/` (ver estrutura). Nenhum componente novo em `src/components/ui`.
- **Tokens de tema:** nenhum novo.

## 1. Visão técnica

Uma rota `/usuarios` com a listagem e três modais. Dados via TanStack Query (já usado em Mensalistas e Preços); formulários via `useAppForm` + Zod; erros da API via `ApiError`. Estado de servidor fica no cache do React Query; estado de UI (qual modal está aberto, qual usuário está sendo editado) é local, sem Zustand nem Context novo.

Pontos centrais:
- **Camada de serviço única** (`usuario.ts` + `usuario.mapper.ts`): as telas nunca falam com `api` diretamente.
- **Etapas do cadastro como máquina de estados pura** (`cadastroEtapa.ts`), testável sem React: a resposta de `GET /Usuario/cpf/{cpf}` decide a próxima etapa.
- **Regra do último Administrador** calculada no cliente só para desabilitar controles e explicar; a API continua sendo a autoridade (RF-05/RF-06).
- **Edição em modal sobre `/usuarios`**, não em rota própria.

## 2. Contrato da API (`docs/specs/input.md`)

Todas as rotas usam o `api` de `src/lib/api/client.ts` (Bearer do cookie `gipe_token`, erros normalizados em `ApiError`).

| Operação | Chamada | Corpo / resposta |
|---|---|---|
| Listar | `GET /Usuario` | `UsuarioResponse[]` (sem paginação) |
| Consultar CPF | `GET /Usuario/cpf/{cpf}` | `{ encontrado, cpf, usuarioId?, nome?, email?, celular?, vinculadoNaEmpresa }` |
| Criar / dar acesso | `POST /Usuario` | `{ cpf, nome, email, celular, perfil }` → `{ usuarioId, novoCadastro }` |
| Alterar perfil | `PUT /Usuario/{id}/perfil` | `{ perfil }` |
| Ativar/inativar | `PUT /Usuario/{id}/ativo` | `{ ativo }` |
| Alterar senha | `PUT /Usuario/senha` | `{ senhaAtual, novaSenha }` |

Observações do contrato que afetam o código:
- **Paginação:** a listagem devolve um array simples, não `Paginado<T>`. O serviço devolve `Usuario[]` e não usa `Paginado`.
- **CPF:** enviado só com dígitos (`onlyDigits`). A API aceita com ou sem máscara na consulta, mas padronizar evita divergência.
- **`novoCadastro`** da resposta do `POST` define a mensagem de sucesso do `Toast` (senha temporária enviada vs. pessoa avisada por e-mail). É a fonte da verdade, não o resultado da consulta de CPF, porque entre a consulta e o envio o cadastro pode mudar.
- **Quando `perfil` vem fora do enum conhecido** (ex.: um perfil novo do back): a tela mostra "Perfil {n}" em vez de quebrar, e o `Select` de edição inclui esse valor como opção desabilitada para não perdê-lo.
- **`[A CONFIRMAR]`** com o back: tamanho máximo de nome e e-mail, e se `celular` aceita máscara. Enquanto isso, limites de tela iguais aos de Mensalistas (nome 150, e-mail 150) e celular enviado só com dígitos.

## 3. Arquitetura da solução

### Estrutura de arquivos

```
src/
├── app/(app)/
│   ├── usuarios/page.tsx                    # Server Component: metadata + <UsuariosPage />
│   └── usuario/editar/page.tsx              # vira redirect para /usuarios (ver decisão 3)
├── types/
│   └── usuario.ts                           # enum de perfil, Usuario, payloads, CpfConsulta
├── lib/
│   ├── api/services/
│   │   ├── usuario.ts                       # chamadas HTTP
│   │   ├── usuario.mapper.ts                # resposta ↔ tipos de tela
│   │   ├── usuario.test.ts
│   │   └── usuario.mapper.test.ts
│   ├── schemas/
│   │   ├── usuario.ts                       # cadastro (nome, e-mail, celular, perfil) e CPF
│   │   ├── usuario.test.ts
│   │   ├── alterarSenha.ts                  # senhaAtual, novaSenha, confirmação
│   │   └── alterarSenha.test.ts
│   └── session.ts                           # leitura das claims do token (ver decisão 1)
├── contexts/
│   └── CurrentUserContext.tsx               # passa a usar a sessão real (ver decisão 1)
└── components/
    ├── layout/UserMenu/UserMenu.tsx         # + item "Alterar senha"; remove "Editar Usuário"
    └── usuarios/
        ├── UsuariosPage/
        │   ├── UsuariosPage.tsx             # cabeçalho, toast, estado dos modais
        │   └── index.ts
        ├── UsuariosList/                    # tabela + estados (carregando/erro/vazio)
        │   ├── UsuariosList.tsx
        │   └── index.ts
        ├── PerfilBadge.tsx                  # perfil → rótulo + StatusBadge
        ├── perfil.ts                        # rótulos, ordem e opções do Select (puro)
        ├── useUsuarios.ts                   # useQuery da listagem + chave exportada
        ├── useUsuarioMutations.ts           # criar, perfil, ativo (invalidam a listagem)
        ├── useConsultaCpf.ts                # useMutation da consulta de CPF
        ├── ultimoAdmin.ts                   # regra pura do último Administrador ativo
        ├── NovoUsuarioModal/
        │   ├── NovoUsuarioModal.tsx         # container das 2 etapas
        │   ├── EtapaCpf.tsx
        │   ├── EtapaDados.tsx               # pessoa nova (formulário) e conferência (leitura)
        │   ├── cadastroEtapa.ts             # CpfConsulta → próxima etapa (puro)
        │   └── index.ts
        ├── EditarUsuarioModal/
        │   ├── EditarUsuarioModal.tsx
        │   └── index.ts
        ├── AlterarSenhaModal/
        │   ├── AlterarSenhaModal.tsx
        │   └── index.ts
        └── Usuarios.styles.ts
```

Cada pasta de componente com teste ao lado (`*.test.ts(x)`), como no restante do repo.

### Tipos (`src/types/usuario.ts`)

```ts
export const PERFIL_USUARIO = { Administrador: 1, Gerente: 2, Manobrista: 3, Caixa: 4, Financeiro: 8 } as const;
export type PerfilUsuario = (typeof PERFIL_USUARIO)[keyof typeof PERFIL_USUARIO];

export type Usuario = {
  usuarioId: number;
  cpf: string;            // só dígitos
  nome: string;
  email: string;
  celular: string;        // só dígitos
  perfil: number;         // pode vir fora do enum; PerfilBadge trata
  perfilDescricao: string;
  ativo: boolean;
  trocarSenha: boolean;
  dataCriacao: string;    // ISO
};

export type CpfConsulta = {
  encontrado: boolean;
  cpf: string;
  usuarioId: number | null;
  nome: string;
  email: string;
  celular: string;
  vinculadoNaEmpresa: boolean;
};

export type NovoUsuarioValues = { cpf: string; nome: string; email: string; celular: string; perfil: string };
export type NovoUsuarioPayload = { cpf: string; nome: string; email: string; celular: string; perfil: PerfilUsuario };
export type NovoUsuarioResultado = { usuarioId: number; novoCadastro: boolean };
```

`trocarSenha` e `perfilDescricao` são lidos e guardados, mas a tela usa o rótulo local de `perfil.ts` (a descrição do back só entra como fallback para perfil desconhecido).

### Serviço (`usuario.ts`)

Funções: `listUsuarios()`, `consultarCpf(cpf)`, `createUsuario(values)`, `updatePerfil(id, perfil)`, `updateAtivo(id, ativo)`, `alterarSenha({ senhaAtual, novaSenha })`. Todas rejeitam com `ApiError`; nenhuma engole erro. O mapper aplica `onlyDigits`, tolera campos ausentes (`Partial<>`, como em Mensalistas) e nunca loga corpo de requisição com senha.

### Server vs Client Component

| Peça | Tipo | Motivo |
|---|---|---|
| `app/(app)/usuarios/page.tsx` | Server | só metadata e composição |
| `UsuariosPage`, `UsuariosList`, os três modais, hooks | Client | estado local, React Query, formulário |
| `perfil.ts`, `ultimoAdmin.ts`, `cadastroEtapa.ts`, mappers, schemas | módulos puros | testáveis sem React |

## 4. Fluxos técnicos

### Cadastro em duas etapas

1. `EtapaCpf` valida o CPF com `isValidCPF` e só então chama `useConsultaCpf`.
2. `cadastroEtapa(consulta)` devolve um destes resultados:
   - `{ etapa: "dados", modo: "novo" }` quando `encontrado === false`;
   - `{ etapa: "dados", modo: "conferencia", pessoa }` quando `encontrado && !vinculadoNaEmpresa`;
   - `{ etapa: "bloqueado", usuarioId }` quando `encontrado && vinculadoNaEmpresa`.
3. Modo `novo`: `useAppForm` com `NovoUsuarioSchema` (nome, e-mail, celular, perfil obrigatórios). Modo `conferencia`: o formulário só controla `perfil`; nome, e-mail e celular vêm da consulta e são exibidos como texto. No envio, o corpo da conferência leva os dados da consulta, que a API **ignora** (regra do contrato), mas permanece válido se a validação do back os exigir.
4. `onSuccess` do `POST`: `invalidateQueries(USUARIOS_QUERY_KEY)`, `onSuccess(message)` conforme `novoCadastro`, fecha o modal.
5. "Voltar" na etapa 2 preserva o CPF digitado; trocar o CPF descarta a consulta anterior (a etapa 2 nunca usa dados de um CPF diferente do atual).

### Edição

- Estado inicial vem da linha da lista (sem nova chamada). Salvar dispara, em sequência, só as mutações que mudaram: `updatePerfil` e/ou `updateAtivo`. Falha em uma não desfaz a outra; o `ErrorBanner` nomeia qual falhou e a lista é recarregada em qualquer caso para refletir o estado real.
- Confirmações via `ConfirmDialog` antes de inativar e antes de rebaixar um Administrador.
- `ultimoAdmin.ts` expõe `ehUltimoAdminAtivo(usuario, lista)`: verdadeiro quando o usuário é Administrador (1), ativo e o único com esses dois atributos na lista. Desabilita `Select` e `Switch` e liga o texto de apoio via `aria-describedby`.

### Alterar senha

- `AlterarSenhaSchema`: `senhaAtual` obrigatória; `novaSenha` com no mínimo 6 caracteres e diferente da `senhaAtual`; `confirmacao` igual à `novaSenha`.
- Falha 401/400 por senha atual incorreta: mapeada para erro inline em `senhaAtual` (ver risco 3), com os demais campos preservados.
- Sucesso: `Toast`, modal fecha; **não** se chama `clearToken`, o token atual continua válido (contrato).

## 5. Decisões técnicas e trade-offs

1. **Usuário logado vem do token, não do mock.** Hoje `CurrentUserContext` entrega um usuário fixo (`mock-user-1`) e o `UserMenu` mostra as iniciais dele. A gestão precisa saber quem é o usuário logado (rótulo "(você)", aviso de edição do próprio acesso) e qual o perfil dele (para restringir a tela). O token já traz `emailaddress`, `name` e `role` nas claims. Decisão: `src/lib/session.ts` decodifica as claims do cookie `gipe_token` (apenas leitura, sem validar assinatura, que é papel do back) e `CurrentUserProvider` passa a usar isso no lugar do mock. O vínculo com a linha da tabela é feito por **e-mail** (a claim `nameidentifier` é um GUID e não bate com o `usuarioId` numérico). Trade-off: e-mail é único por pessoa, mas depende do back manter essa propriedade; alternativa mais robusta é a API expor `GET /Usuario/eu` ou incluir `usuarioId` no token. Marcado como risco.
   - O tipo `CurrentUser` ganha `email` e `perfil` (opcionais, para não quebrar `AppShell.test.tsx` e `Header`).
2. **Restringir a tela ao Administrador também no cliente.** O item do menu continua visível (a restrição fina de menu é do PRD de Permissões); se o perfil lido do token não for Administrador, `UsuariosPage` mostra um estado "Sem permissão" em vez de chamar a API. A API continua a barreira real (`forbidden` já é um `ApiErrorKind`). Isso é uma suposição do PRD (seção 9) e depende de confirmar se o Gerente também gerencia.
3. **Edição como modal; `/usuario/editar` vira redirect.** `UserMenu` hoje aponta para `/usuario/editar` ("Editar Usuário"), mas o escopo é trocar a própria senha. O item é trocado por "Alterar senha", que abre `AlterarSenhaModal` direto do menu (o modal é montado no `UserMenu`/`Header`, já que não pertence a nenhuma página). A rota antiga redireciona para `/usuarios` para não quebrar favoritos. Alternativa descartada: manter a rota como página de perfil, porque o único dado editável do próprio usuário seria a senha.
4. **Sem paginação nem busca.** A API devolve a lista inteira e uma empresa tem poucos usuários; `Pagination` e filtro entram só se a lista crescer (fora de escopo no `design.md`). Isso simplifica `useUsuarios` (sem `keepPreviousData` nem debounce).
5. **Regra do último Administrador duplicada no cliente por UX, não por segurança.** O cálculo é feito sobre a lista carregada, que pode estar desatualizada (outro Administrador pode ter sido inativado em outra aba). Por isso o erro da API sempre aparece no `ErrorBanner` mesmo com o controle habilitado.
6. **Duas mutações independentes na edição, não um endpoint único.** Imposto pelo contrato (`/perfil` e `/ativo` separados). Evita-se orquestração de rollback: reportar a falha parcial é mais simples e honesto.
7. **`PasswordRequirements` ganha regras injetáveis.** O componente hoje chama `getPasswordRuleResults(value)` com as regras de 8+ caracteres, maiúscula, minúscula, número e símbolo. Aqui a regra é outra. Mudança proposta: prop opcional `rules` (lista de `{ id, label, test }`) com o padrão atual, e `alterarSenha.ts` exporta `ALTERAR_SENHA_RULES` (≥ 6 caracteres e diferente da atual, esta última dependente de outro campo). Como "diferente da atual" não é função só do valor, o requisito entra como texto dinâmico dentro do próprio modal em vez de regra do componente; o componente recebe apenas a regra de comprimento. Trade-off aceito para não generalizar o componente além do necessário.
8. **Mensagens de sucesso vêm de `novoCadastro`**, ver seção 2.

## 6. Testes

Seguindo o padrão do repo (Vitest + Testing Library + `src/test`), cobertura focada em lógica e fluxos:

- **Unitários:** `usuario.mapper` (campos ausentes, perfil desconhecido), `perfil.ts`, `ultimoAdmin.ts` (um admin; dois admins; admin inativo; lista vazia), `cadastroEtapa.ts` (os 3 resultados), schemas (`usuario`, `alterarSenha`: limite de 6, senha igual à atual, confirmação diferente), `session.ts` (token válido, malformado, ausente).
- **Serviço:** `usuario.test.ts` com `api` mockado: URL, método e corpo de cada chamada; CPF enviado sem máscara; erro propagado como `ApiError`.
- **Componentes:** `UsuariosList` (carregando, erro, vazio, linha inativa, "(você)"), `NovoUsuarioModal` (os 3 caminhos da consulta, voltar sem perder o CPF, erro ao salvar), `EditarUsuarioModal` (só chama o que mudou; último Administrador desabilita controles; falha parcial), `AlterarSenhaModal` (validação, erro de senha atual inline, sucesso sem logout).
- **Acessibilidade:** nome acessível dos botões "Editar {nome}", foco ao abrir/fechar modal e ao trocar de etapa.
- Antes de concluir: `npm run lint` e `npm run build`.

## 7. Riscos / pontos de atenção

1. **Identificação do usuário logado por e-mail.** Se a API permitir e-mails repetidos ou o token mudar de formato, "(você)" e o aviso de autoedição falham silenciosamente (sem quebrar a tela). Mitigação: pedir ao back um `usuarioId` no token ou um endpoint "eu".
2. **Perfil lido do token pode estar defasado.** Mudança de perfil só vale no próximo login (contrato); a restrição de tela usa o perfil do login atual, coerente com o aviso da interface.
3. **Mensagem de "senha atual incorreta".** O formato do erro (status e texto) não está no contrato. Enquanto não confirmado, trata-se `unauthorized`/`validation` com mensagem referindo a senha atual como erro do campo e qualquer outro como banner. **[A CONFIRMAR]** com o back; o 401 do cliente `api` hoje não derruba a sessão (ver comentário em `client.ts`), então não há logout acidental.
4. **E-mail e celular ignorados na conferência.** Se o back passar a rejeitar corpo com dados diferentes dos cadastrados, o envio da conferência precisa mudar para só `{ cpf, perfil }`. Cobrir com um teste de contrato quando o back confirmar.
5. **Concorrência.** Dois Administradores editando a mesma lista: a lista é recarregada após cada mutação e o `ErrorBanner` mostra a regra da API; não há bloqueio otimista.
6. **Perfil Financeiro (8)** sem permissões de menu definidas. Está no `Select`, mas só deve ir a produção após o PRD de Permissões.
7. **Token no `input.md`.** O arquivo traz um Bearer real; não deve ser commitado. Os testes usam tokens fictícios gerados no próprio teste.
8. **Estrutura do app (Next.js).** `AGENTS.md` avisa que esta versão do Next tem mudanças incompatíveis (por exemplo, `proxy.ts` no lugar de `middleware`). Antes de implementar o redirect de `/usuario/editar` e a página nova, conferir `node_modules/next/dist/docs/` para o padrão atual de `redirect` e `metadata` (o código existente em `src/app/(app)/mensalistas/page.tsx` serve de referência).

## 8. Fora de escopo técnico

- Paginação, busca e filtros na listagem.
- Exclusão definitiva de usuário e reenvio de senha temporária.
- Edição de nome, e-mail e celular de outra pessoa.
- Permissões por menu (PRD de Permissões) e liberação do perfil Financeiro.
- Validação de assinatura do token no cliente; invalidação imediata da sessão ao mudar perfil ou inativar.
- Um endpoint "eu" ou `usuarioId` no token (dependência do back, só registrada).
