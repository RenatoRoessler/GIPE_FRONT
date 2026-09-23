"use client";

import { Input } from "@/components/ui/Input";
import { formatCPF } from "@/lib/cpf";
import { AdminUserData } from "@/types/adesao";
import { Grid } from "../shared/FormGrid.styles";

export interface AdminUserStepFieldsProps {
  value: AdminUserData;
  errors: Partial<Record<keyof AdminUserData, string>>;
  onChange: <Field extends keyof AdminUserData>(
    field: Field,
    value: AdminUserData[Field],
  ) => void;
  disabled?: boolean;
}

export function AdminUserStepFields({
  value,
  errors,
  onChange,
  disabled,
}: AdminUserStepFieldsProps) {
  return (
    <Grid>
      <Input
        label="Nome"
        value={value.nome}
        error={errors.nome}
        onChange={(event) => onChange("nome", event.target.value)}
        disabled={disabled}
        required
      />
      <Input
        label="Sobrenome"
        value={value.sobrenome}
        error={errors.sobrenome}
        onChange={(event) => onChange("sobrenome", event.target.value)}
        disabled={disabled}
        required
      />
      <Input
        label="E-mail"
        type="email"
        value={value.email}
        error={errors.email}
        onChange={(event) => onChange("email", event.target.value)}
        disabled={disabled}
        required
      />
      <Input
        label="CPF"
        placeholder="000.000.000-00"
        inputMode="numeric"
        value={value.cpf}
        error={errors.cpf}
        onChange={(event) => onChange("cpf", formatCPF(event.target.value))}
        disabled={disabled}
        required
      />
      <Input
        label="Senha"
        type="password"
        autoComplete="new-password"
        value={value.senha}
        error={errors.senha}
        onChange={(event) => onChange("senha", event.target.value)}
        disabled={disabled}
        required
      />
      <Input
        label="Repetir senha"
        type="password"
        autoComplete="new-password"
        value={value.repetirSenha}
        error={errors.repetirSenha}
        onChange={(event) => onChange("repetirSenha", event.target.value)}
        disabled={disabled}
        required
      />
    </Grid>
  );
}
