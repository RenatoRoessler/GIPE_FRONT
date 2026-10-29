"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EscolherEmpresa } from "@/components/auth/EscolherEmpresa";
import { AuthCard, Footer, Form } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/errors";
import { login, selecionarEmpresa } from "@/lib/api/services/auth";
import { clearToken, saveToken } from "@/lib/auth";
import { formatCPF } from "@/lib/cpf";
import { setPasswordChange } from "@/lib/passwordChangeSession";
import {
  clearRememberedLogin,
  loadRememberedLogin,
  saveRememberedLogin,
} from "@/lib/rememberedLogin";
import { loginSchema, LoginValues } from "@/lib/schemas/login";
import { parseSession } from "@/lib/session";
import { telaInicial } from "@/lib/telaInicial";
import type { EmpresaOpcao } from "@/types/auth";

// Avisos exibidos ao chegar no login por outro fluxo (parâmetro de URL -> mensagem).
const NOTICES: Record<string, Record<string, string>> = {
  cadastro: { sucesso: "Cadastro concluído! Faça login para continuar." },
  recuperacao: {
    enviada: "Enviamos as instruções de recuperação para o seu e-mail.",
  },
  senha: { alterada: "Senha alterada! Faça login com a nova senha." },
};

// Etapa da tela: o formulário de login ou, para quem tem mais de uma empresa, a escolha da empresa. O token de
// pré-autenticação e a senha digitada ficam só aqui, em memória: nunca em URL, cookie ou storage.
type Etapa =
  | { tipo: "login" }
  | { tipo: "empresa"; preAuthToken: string; empresas: EmpresaOpcao[]; values: LoginValues };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showToast, dismissToast } = useToast();
  const [remember, setRemember] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "login" });
  const [empresaPendente, setEmpresaPendente] = useState<string | null>(null);

  // Abre a sessão (login direto ou depois de escolher a empresa) e aplica "Lembrar CPF".
  async function abrirSessao(token: string, values: LoginValues) {
    saveToken(token);
    if (remember) {
      await saveRememberedLogin({ cpf: values.cpf });
    } else {
      await clearRememberedLogin();
    }
    router.push(telaInicial(parseSession(token)?.perfil));
  }

  const escolha = useMutation({
    mutationFn: ({ empresaId }: { empresaId: string }) => {
      if (etapa.tipo !== "empresa") throw new Error("Sem etapa de escolha de empresa.");
      return selecionarEmpresa({ preAuthToken: etapa.preAuthToken, empresaGuid: empresaId });
    },
    onSuccess: async (token) => {
      if (etapa.tipo !== "empresa") return;
      await abrirSessao(token, etapa.values);
    },
    // Em caso de sucesso a empresa segue como "Entrando…" até a navegação; no erro, a lista volta a ficar clicável.
    onError: () => setEmpresaPendente(null),
  });

  function escolherEmpresa(empresaId: string) {
    setEmpresaPendente(empresaId);
    escolha.mutate({ empresaId });
  }

  function voltarAoLogin() {
    escolha.reset();
    setEmpresaPendente(null);
    setEtapa({ tipo: "login" });
  }

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => {
      // Um novo login substitui a sessão; evita enviar token antigo na própria requisição.
      clearToken();
      return login(values.cpf, values.senha);
    },
    onSuccess: async (result, values) => {
      switch (result.kind) {
        case "trocar-senha":
          // Primeiro acesso: não há sessão. O token de troca e a senha digitada (a temporária, que a API pede como
          // senha atual) ficam só em memória, nunca na URL. Ela nunca é guardada.
          setPasswordChange({ token: result.passwordChangeToken, senhaAtual: values.senha });
          await clearRememberedLogin();
          router.push("/primeiro-acesso");
          return;
        case "escolher-empresa":
          // Mais de uma empresa: ainda não há sessão. O "Lembrar CPF" só vale depois que a empresa é escolhida.
          setEtapa({ tipo: "empresa", preAuthToken: result.preAuthToken, empresas: result.empresas, values });
          return;
        case "sessao":
          await abrirSessao(result.token, values);
          return;
      }
    },
  });

  const form = useAppForm({
    defaultValues: { cpf: "", senha: "" } as LoginValues,
    validators: {
      onChange: ({ value }) => {
        const result = loginSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  useEffect(() => {
    let active = true;
    void loadRememberedLogin().then((saved) => {
      if (!active || !saved) return;
      // Não sobrescreve o que o usuário já começou a digitar.
      if (form.state.values.cpf) return;
      form.setFieldValue("cpf", saved.cpf);
      setRemember(true);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    for (const [param, messages] of Object.entries(NOTICES)) {
      const message = messages[searchParams.get(param) ?? ""];
      if (message) {
        showToast(message, "success");
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (etapa.tipo === "empresa") {
    return (
      <EscolherEmpresa
        empresas={etapa.empresas}
        onEscolher={escolherEmpresa}
        onVoltar={voltarAoLogin}
        pendenteId={empresaPendente}
        error={escolha.isError ? escolha.error.message : null}
        expirada={escolha.isError && escolha.error instanceof ApiError && escolha.error.kind === "unauthorized"}
      />
    );
  }

  return (
    <AuthCard tagline title="Entrar" subtitle="Acesse com seu CPF e senha.">
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field name="cpf">
          {(field) => (
            <Input
              label="CPF"
              placeholder="000.000.000-00"
              inputMode="numeric"
              autoComplete="username"
              value={field.state.value}
              onChange={(event) => field.handleChange(formatCPF(event.target.value))}
              onBlur={field.handleBlur}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              disabled={mutation.isPending}
              required
            />
          )}
        </form.Field>
        <form.AppField name="senha">
          {(field) => (
            <field.TextField
              label="Senha"
              type="password"
              autoComplete="current-password"
              disabled={mutation.isPending}
              required
            />
          )}
        </form.AppField>
        <Checkbox
          label="Lembrar CPF"
          hint="Não recomendado em computadores compartilhados."
          checked={remember}
          onCheckedChange={setRemember}
          disabled={mutation.isPending}
        />
        {mutation.isError && (
          <Text variant="error" role="alert">
            {mutation.error.message}
          </Text>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </Form>
      <Footer>
        <Link href="/recuperar-senha">Esqueci minha senha</Link>
      </Footer>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />
      )}
    </AuthCard>
  );
}
