"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AuthCard, Footer, Form } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import { PasswordRequirements } from "@/components/ui/PasswordRequirements";
import { Text } from "@/components/ui/Text";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { resetPassword } from "@/lib/api/services/auth";
import { resetPasswordSchema, ResetPasswordValues } from "@/lib/schemas/resetPassword";

// Respostas do backend que indicam código do link inválido, vencido ou já usado.
const INVALID_LINK_KINDS = new Set(["not_found", "unauthorized", "forbidden"]);

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

  const senha = useStore(form.store, (state) => state.values.senha);
  // Calculado pelo schema: isFormValid é verdadeiro antes de qualquer digitação.
  const canSubmit = useStore(
    form.store,
    (state) => resetPasswordSchema.safeParse(state.values).success,
  );

  const isInvalidLink = !token || (mutation.isError && INVALID_LINK_KINDS.has(mutation.error.kind));

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
        <PasswordRequirements value={senha} />
        <form.AppField name="confirmarSenha">
          {(field) => (
            <field.TextField
              label="Repetir senha"
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
        <Button type="submit" disabled={!canSubmit || mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Alterar senha"}
        </Button>
      </Form>
      {mutation.isError && (
        <Footer>
          <Link href="/recuperar-senha">Solicitar novo link</Link>
        </Footer>
      )}
    </AuthCard>
  );
}
