"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { AuthCard, Footer, Form } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "@/components/ui/Link";
import { Toast } from "@/components/ui/Toast";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { useToast } from "@/hooks/useToast";
import { mockRecoverPassword } from "@/lib/mockApi";
import { formatCPF } from "@/lib/cpf";
import { recoverPasswordSchema, RecoverPasswordValues } from "@/lib/schemas/recoverPassword";

export function RecoverPasswordForm() {
  const { toast, showToast, dismissToast } = useToast();

  const mutation = useMutation({
    mutationFn: (values: RecoverPasswordValues) => mockRecoverPassword(values.cpf),
    onSuccess: () => {
      showToast("Enviamos um e-mail com instruções para recuperação.", "success");
    },
  });

  const form = useAppForm({
    defaultValues: { cpf: "" } as RecoverPasswordValues,
    validators: {
      onChange: ({ value }) => {
        const result = recoverPasswordSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  const isFormValid = useStore(form.store, (state) => state.isFormValid);

  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Informe seu CPF para receber o link de recuperação por e-mail."
    >
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
              disabled={mutation.isPending}
              required
            />
          )}
        </form.Field>
        <Button type="submit" disabled={!isFormValid || mutation.isPending}>
          {mutation.isPending ? "Enviando..." : "Recuperar senha"}
        </Button>
      </Form>
      <Footer>
        <Link href="/login">Voltar ao login</Link>
      </Footer>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />
      )}
    </AuthCard>
  );
}
