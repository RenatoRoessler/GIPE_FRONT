"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { AuthCard, Footer, Form } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import { PasswordRequirements } from "@/components/ui/PasswordRequirements";
import { Text } from "@/components/ui/Text";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { alterarSenha } from "@/lib/api/services/usuario";
import { clearToken } from "@/lib/auth";
import { clearPasswordChange, getPasswordChange, subscribePasswordChange } from "@/lib/passwordChangeSession";
import { clearRememberedLogin } from "@/lib/rememberedLogin";
import { resetPasswordSchema, ResetPasswordValues } from "@/lib/schemas/resetPassword";

// Respostas do backend que indicam token de troca vencido ou recusado.
const TOKEN_RECUSADO_KINDS = new Set(["unauthorized", "forbidden", "not_found"]);

export function PrimeiroAcessoForm() {
  const router = useRouter();
  // No servidor e na hidratação não há dados (o token só existe em memória, no navegador).
  const dados = useSyncExternalStore(subscribePasswordChange, getPasswordChange, () => null);
  const token = dados?.token ?? null;
  const concluidoRef = useRef(false);

  const mutation = useMutation({
    // Mesma chamada de "Alterar senha" (PUT /Usuario/senha): o passwordChangeToken do login faz o papel da sessão e a
    // senha temporária é a senha atual.
    mutationFn: (values: ResetPasswordValues) => {
      // Sem sessão ativa: o cookie de um login anterior sobrescreveria o token de troca no cabeçalho.
      clearToken();
      return alterarSenha(
        { senhaAtual: dados?.senhaAtual ?? "", novaSenha: values.senha },
        { bearerToken: token ?? "" },
      );
    },
    onSuccess: () => {
      // Antes de limpar o token: sem ele a tela voltaria ao login sozinha, em vez de ir ao aviso de sucesso.
      concluidoRef.current = true;
      clearPasswordChange();
      // A senha lembrada, se existir, é a temporária e deixou de valer.
      void clearRememberedLogin();
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
  const valida = useStore(form.store, (state) => resetPasswordSchema.safeParse(state.values).success);
  // A API recusa nova senha igual à atual: aqui a atual é a temporária.
  const igualTemporaria = senha !== "" && senha === dados?.senhaAtual;
  const canSubmit = valida && !igualTemporaria;

  const tokenRecusado = mutation.isError && TOKEN_RECUSADO_KINDS.has(mutation.error.kind);

  // Token recusado não serve mais: sai da memória.
  useEffect(() => {
    if (tokenRecusado) {
      clearPasswordChange();
    }
  }, [tokenRecusado]);

  // Sem token (endereço digitado, página recarregada) não há o que mostrar: volta ao login.
  useEffect(() => {
    if (!token && !tokenRecusado && !concluidoRef.current) {
      router.replace("/login");
    }
  }, [token, tokenRecusado, router]);

  if (tokenRecusado) {
    return (
      <AuthCard title="Não foi possível trocar a senha">
        <Text variant="error" role="alert">
          O tempo para criar sua senha acabou. Entre novamente com a senha temporária para recomeçar.
        </Text>
        <Footer>
          <Link href="/login">Ir para o login</Link>
        </Footer>
      </AuthCard>
    );
  }

  // Nunca mostra o formulário sem token, nem por um instante.
  if (!token) {
    return null;
  }

  return (
    <AuthCard
      title="Crie sua senha"
      subtitle="Este é o seu primeiro acesso. Para continuar, troque a senha temporária por uma senha só sua."
    >
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
              autoFocus
              disabled={mutation.isPending}
              required
            />
          )}
        </form.AppField>
        <PasswordRequirements value={senha} />
        {igualTemporaria && (
          <Text variant="error" role="alert">
            A nova senha precisa ser diferente da senha temporária.
          </Text>
        )}
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
        <Text variant="muted">Depois de salvar, você volta ao login e entra com a nova senha.</Text>
        {mutation.isError && (
          <Text variant="error" role="alert">
            {mutation.error.message}
          </Text>
        )}
        <Button type="submit" disabled={!canSubmit || mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </Form>
      <Footer>
        <Link href="/login">Voltar ao login</Link>
      </Footer>
    </AuthCard>
  );
}
