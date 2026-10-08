"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AuthCard, Footer, Form } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { requestPasswordReset } from "@/lib/api/services/auth";
import { recoverPasswordSchema, RecoverPasswordValues } from "@/lib/schemas/recoverPassword";

export function RecoverPasswordForm() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (values: RecoverPasswordValues) => requestPasswordReset(values.email),
    onSuccess: () => {
      router.push("/login?recuperacao=enviada");
    },
  });

  const form = useAppForm({
    defaultValues: { email: "" } as RecoverPasswordValues,
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

  // Calculado pelo schema: isFormValid é verdadeiro antes de qualquer digitação.
  const isFormValid = useStore(
    form.store,
    (state) => recoverPasswordSchema.safeParse(state.values).success,
  );

  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Informe o e-mail cadastrado para receber as instruções de recuperação."
    >
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              label="E-mail"
              type="email"
              placeholder="seu@email.com.br"
              inputMode="email"
              autoComplete="email"
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
        <Button type="submit" disabled={!isFormValid || mutation.isPending}>
          {mutation.isPending ? "Enviando..." : "Recuperar minha senha"}
        </Button>
      </Form>
      <Footer>
        <Link href="/login">Voltar ao login</Link>
      </Footer>
    </AuthCard>
  );
}
