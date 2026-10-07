"use client";

import { withForm } from "@/components/form";
import { CepLookupStatus, useCepLookup } from "@/hooks/useCepLookup";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatCEP, isValidCEP } from "@/lib/cep";
import { formatCNPJ } from "@/lib/cnpj";
import { onlyDigits } from "@/lib/digits";
import { ESTADOS } from "@/lib/estados";
import { formatPhone } from "@/lib/phone";
import { EMPTY_COMPANY_DATA, TIPO_EMPRESA_LABEL, TipoEmpresa } from "@/types/adesao";
import { Grid, GridItem } from "../shared/FormGrid.styles";

const ADDRESS_FIELDS = ["logradouro", "bairro", "cidade", "estado"] as const;

function cepHint(status: CepLookupStatus) {
  switch (status.state) {
    case "loading":
      return { hint: "Buscando endereço…", hintTone: "muted" } as const;
    case "found":
      return { hint: "Endereço preenchido. Confira os dados.", hintTone: "success" } as const;
    case "not_found":
      return {
        hint: "CEP não encontrado. Preencha o endereço manualmente.",
        hintTone: "danger",
      } as const;
    case "error":
      return {
        hint: "Não foi possível buscar o endereço. Preencha manualmente.",
        hintTone: "danger",
      } as const;
    default:
      return {};
  }
}

const TIPO_EMPRESA_OPTIONS = Object.values(TipoEmpresa).filter(
  (value): value is TipoEmpresa => typeof value === "number",
);

export const CompanyStepFields = withForm({
  defaultValues: EMPTY_COMPANY_DATA,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled }) {
    const cepLookup = useCepLookup();

    async function handleCepChange(rawValue: string) {
      const cep = formatCEP(rawValue);
      form.setFieldValue("cep", cep);
      if (!isValidCEP(cep)) {
        cepLookup.reset();
        return;
      }

      const address = await cepLookup.lookup(cep);
      if (!address || form.getFieldValue("cep") !== cep) return;
      // Campos que a consulta não trouxe mantêm o que o usuário já digitou; o número nunca é preenchido.
      for (const name of ADDRESS_FIELDS) {
        if (address[name]) form.setFieldValue(name, address[name]);
      }
    }

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
              onChange={(event) => void handleCepChange(event.target.value)}
              {...cepHint(cepLookup.status)}
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
          {(field) => (
            <field.TextField
              label="Número"
              inputMode="numeric"
              format={onlyDigits}
              disabled={disabled}
              required
            />
          )}
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
              format={onlyDigits}
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
              format={onlyDigits}
              disabled={disabled}
              required
            />
          )}
        </form.AppField>
      </Grid>
    );
  },
});
