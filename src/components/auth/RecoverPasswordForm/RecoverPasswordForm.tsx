"use client";

import { FormEvent, useState } from "react";
import { AuthCard, Footer, Form } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "@/components/ui/Link";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { formatCPF, isValidCPF } from "@/lib/cpf";

export function RecoverPasswordForm() {
  const [cpf, setCpf] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast, showToast, dismissToast } = useToast();

  const cpfIsValid = isValidCPF(cpf);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      showToast("Enviamos um e-mail com instruções para recuperação.", "success");
    }, 900);
  }

  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Informe seu CPF para receber o link de recuperação por e-mail."
    >
      <Form onSubmit={handleSubmit}>
        <Input
          label="CPF"
          placeholder="000.000.000-00"
          inputMode="numeric"
          autoComplete="username"
          value={cpf}
          onChange={(event) => setCpf(formatCPF(event.target.value))}
          disabled={isLoading}
          required
        />
        <Button type="submit" disabled={!cpfIsValid || isLoading}>
          {isLoading ? "Enviando..." : "Recuperar senha"}
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
