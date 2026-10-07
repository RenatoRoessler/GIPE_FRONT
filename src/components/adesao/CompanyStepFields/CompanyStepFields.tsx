"use client";

import { withForm } from "@/components/form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatCEP } from "@/lib/cep";
import { formatCNPJ } from "@/lib/cnpj";
import { ESTADOS } from "@/lib/estados";
import { formatPhone } from "@/lib/phone";
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
        <form.Field name="telefone">
          {(field) => (
            <Input
              label="Telefone"
              type="tel"
              placeholder="(00) 0000-0000"
              inputMode="tel"
              value={field.state.value}
              onChange={(event) => field.handleChange(formatPhone(event.target.value))}
              onBlur={field.handleBlur}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              disabled={disabled}
              required
            />
          )}
        </form.Field>
        <form.Field name="cep">
          {(field) => (
            <Input
              label="CEP"
              placeholder="00000-000"
              inputMode="numeric"
              autoComplete="postal-code"
              value={field.state.value}
              onChange={(event) => field.handleChange(formatCEP(event.target.value))}
              onBlur={field.handleBlur}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              disabled={disabled}
              required
            />
          )}
        </form.Field>
        <form.AppField name="logradouro">
          {(field) => <field.TextField label="Logradouro" disabled={disabled} required />}
        </form.AppField>
        <form.AppField name="numero">
          {(field) => <field.TextField label="Número" disabled={disabled} required />}
        </form.AppField>
        <form.AppField name="bairro">
          {(field) => <field.TextField label="Bairro" disabled={disabled} required />}
        </form.AppField>
        <form.AppField name="cidade">
          {(field) => <field.TextField label="Cidade" disabled={disabled} required />}
        </form.AppField>
        <form.AppField name="estado">
          {(field) => (
            <field.SelectField label="Estado" disabled={disabled} required>
              <option value="" disabled>
                Selecione...
              </option>
              {ESTADOS.map((estado) => (
                <option key={estado.sigla} value={estado.sigla}>
                  {estado.sigla} - {estado.nome}
                </option>
              ))}
            </field.SelectField>
          )}
        </form.AppField>
        <form.AppField name="quantidadeVagasMoto">
          {(field) => (
            <field.TextField
              label="Vagas de moto"
              inputMode="numeric"
              disabled={disabled}
              required
            />
          )}
        </form.AppField>
        <form.AppField name="quantidadeVagasCarro">
          {(field) => (
            <field.TextField
              label="Vagas de carro"
              inputMode="numeric"
              disabled={disabled}
              required
            />
          )}
        </form.AppField>
      </Grid>
    );
  },
});
