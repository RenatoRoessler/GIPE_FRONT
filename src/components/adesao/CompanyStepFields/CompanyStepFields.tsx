"use client";

import { withForm } from "@/components/form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatCNPJ } from "@/lib/cnpj";
import { EMPTY_COMPANY_DATA, TIPO_EMPRESA_LABEL, TipoEmpresa } from "@/types/adesao";
import { Grid, GridItem } from "../shared/FormGrid.styles";

const TIPO_EMPRESA_OPTIONS = Object.values(TipoEmpresa).filter(
  (value): value is TipoEmpresa => typeof value === "number",
);

export const CompanyStepFields = withForm({
  defaultValues: EMPTY_COMPANY_DATA,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled }) {
    return (
      <Grid>
        <GridItem $span>
          <form.Field name="cnpj">
            {(field) => (
              <Input
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
                value={field.state.value}
                onChange={(event) => field.handleChange(formatCNPJ(event.target.value))}
                onBlur={field.handleBlur}
                error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
                disabled={disabled}
                required
              />
            )}
          </form.Field>
        </GridItem>
        <form.AppField name="razaoSocial">
          {(field) => <field.TextField label="Razão social" disabled={disabled} required />}
        </form.AppField>
        <form.AppField name="nomeFantasia">
          {(field) => <field.TextField label="Nome fantasia" disabled={disabled} required />}
        </form.AppField>
        <GridItem $span>
          <form.AppField name="endereco">
            {(field) => <field.TextField label="Endereço" disabled={disabled} required />}
          </form.AppField>
        </GridItem>
        <form.AppField name="telefone">
          {(field) => (
            <field.TextField label="Telefone" type="tel" disabled={disabled} required />
          )}
        </form.AppField>
        <form.Field name="tipoEmpresa">
          {(field) => (
            <Select
              label="Tipo de empresa"
              value={field.state.value}
              onChange={(event) =>
                field.handleChange(Number(event.target.value) as TipoEmpresa)
              }
              onBlur={field.handleBlur}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              disabled={disabled}
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
          )}
        </form.Field>
      </Grid>
    );
  },
});
