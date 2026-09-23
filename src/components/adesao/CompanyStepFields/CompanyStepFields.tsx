"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatCNPJ } from "@/lib/cnpj";
import { CompanyData, TIPO_EMPRESA_LABEL, TipoEmpresa } from "@/types/adesao";
import { Grid, GridItem } from "../shared/FormGrid.styles";

export interface CompanyStepFieldsProps {
  value: CompanyData;
  errors: Partial<Record<keyof CompanyData, string>>;
  onChange: <Field extends keyof CompanyData>(field: Field, value: CompanyData[Field]) => void;
}

const TIPO_EMPRESA_OPTIONS = Object.values(TipoEmpresa).filter(
  (value): value is TipoEmpresa => typeof value === "number",
);

export function CompanyStepFields({ value, errors, onChange }: CompanyStepFieldsProps) {
  return (
    <Grid>
      <GridItem $span>
        <Input
          label="CNPJ"
          placeholder="00.000.000/0000-00"
          inputMode="numeric"
          value={value.cnpj}
          error={errors.cnpj}
          onChange={(event) => onChange("cnpj", formatCNPJ(event.target.value))}
          required
        />
      </GridItem>
      <Input
        label="Razão social"
        value={value.razaoSocial}
        error={errors.razaoSocial}
        onChange={(event) => onChange("razaoSocial", event.target.value)}
        required
      />
      <Input
        label="Nome fantasia"
        value={value.nomeFantasia}
        error={errors.nomeFantasia}
        onChange={(event) => onChange("nomeFantasia", event.target.value)}
        required
      />
      <GridItem $span>
        <Input
          label="Endereço"
          value={value.endereco}
          error={errors.endereco}
          onChange={(event) => onChange("endereco", event.target.value)}
          required
        />
      </GridItem>
      <Input
        label="Telefone"
        type="tel"
        value={value.telefone}
        error={errors.telefone}
        onChange={(event) => onChange("telefone", event.target.value)}
        required
      />
      <Select
        label="Tipo de empresa"
        value={value.tipoEmpresa}
        error={errors.tipoEmpresa}
        onChange={(event) => onChange("tipoEmpresa", Number(event.target.value) as TipoEmpresa)}
        required
      >
        <option value="" disabled>
          Selecione...
        </option>
        {TIPO_EMPRESA_OPTIONS.map((tipo) => (
          <option key={tipo} value={tipo}>
            {TIPO_EMPRESA_LABEL[tipo]}
          </option>
        ))}
      </Select>
    </Grid>
  );
}
