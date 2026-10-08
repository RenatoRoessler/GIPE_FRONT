"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AuthCard, Footer, Form } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { resetPassword } from "@/lib/api/services/auth";
import { resetPasswordSchema, ResetPasswordValues } from "@/lib/schemas/resetPassword";

export interface ResetPasswordFormProps {
  token: string | null;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordValues) =>
      resetPassword({ token: token ?? "", senha: values.senha }),
    onSuccess: () => {
      router.push("/login?senha=alterada");
    },
  });

  const form = useAppForm({
    defaultValues: { senha: "", confirmarSenha: "" } as ResetPasswordValues,
    validators: {
      onChange: ({ value }) => {
        const result = resetPasswordSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  // Sem código no endereço ou recusado pelo backend (resetPassword normaliza os 4xx em "validation").
  const isInvalidLink = !token || (mutation.isError && mutation.error.kind === "validation");

  if (isInvalidLink) {
    return (
      <AuthCard title="Link inválido">
        <Text variant="error" role="alert">
          Este link de recuperação expirou ou não é mais válido.
        </Text>
        <Footer>
          <Link href="/recuperar-senha">Solicitar novo link</Link>
        </Footer>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Definir nova senha" subtitle="Escolha uma nova senha para acessar o GIPE.">
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="senha">
          {(field) => (
            <field.TextField
              label="Nova senha"
              type="password"
              autoComplete="new-password"
              disabled={mutation.isPending}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="confirmarSenha">
          {(field) => (
            <field.TextField
              label="Confirmar senha"
              type="password"
              autoComplete="new-password"
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
          {mutation.isPending ? "Salvando..." : "Alterar senha"}
        </Button>
      </Form>
    </AuthCard>
  );
}
