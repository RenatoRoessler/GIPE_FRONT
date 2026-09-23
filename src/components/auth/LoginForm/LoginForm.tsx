"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthCard, Footer, Form } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { formatCPF } from "@/lib/cpf";

export function LoginForm() {
  const searchParams = useSearchParams();
  const { toast, showToast, dismissToast } = useToast();
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("cadastro") === "sucesso") {
      showToast("Cadastro concluído! Faça login para continuar.", "success");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 900);
  }

  return (
    <AuthCard title="Entrar" subtitle="Acesse com seu CPF e senha.">
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
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
          required
        />
        {error && <Text variant="error">{error}</Text>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
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
