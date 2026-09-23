"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthCard, Footer, Form } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";

export interface ResetPasswordFormProps {
  token: string | null;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <AuthCard title="Link inválido">
        <Text variant="error">
          Este link de recuperação expirou ou não é mais válido.
        </Text>
        <Footer>
          <Link href="/recuperar-senha">Solicitar novo link</Link>
        </Footer>
      </AuthCard>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setConfirmError("As senhas não coincidem");
      return;
    }

    setConfirmError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/login");
    }, 900);
  }

  return (
    <AuthCard title="Definir nova senha" subtitle="Escolha uma nova senha para acessar o GIPE.">
      <Form onSubmit={handleSubmit}>
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
          required
        />
        <Input
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={confirmError ?? undefined}
          disabled={isLoading}
          required
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Alterar senha"}
        </Button>
      </Form>
    </AuthCard>
  );
}
