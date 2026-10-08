"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AuthCard, Footer, Form } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { useToast } from "@/hooks/useToast";
import { login } from "@/lib/api/services/auth";
import { clearToken, saveToken } from "@/lib/auth";
import { formatCPF } from "@/lib/cpf";
import { loginSchema, LoginValues } from "@/lib/schemas/login";

// Avisos exibidos ao chegar no login por outro fluxo (parâmetro de URL -> mensagem).
const NOTICES: Record<string, Record<string, string>> = {
  cadastro: { sucesso: "Cadastro concluído! Faça login para continuar." },
  recuperacao: {
    enviada: "Enviamos as instruções de recuperação para o seu e-mail.",
  },
  senha: { alterada: "Senha alterada! Faça login com a nova senha." },
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showToast, dismissToast } = useToast();

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => {
      // Um novo login substitui a sessão; evita enviar token antigo na própria requisição.
      clearToken();
      return login(values.cpf, values.senha);
    },
    onSuccess: ({ token }) => {
      saveToken(token);
      router.push("/dashboard");
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
    for (const [param, messages] of Object.entries(NOTICES)) {
      const message = messages[searchParams.get(param) ?? ""];
      if (message) {
        showToast(message, "success");
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthCard title="Entrar" subtitle="Acesse com seu CPF e senha.">
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
