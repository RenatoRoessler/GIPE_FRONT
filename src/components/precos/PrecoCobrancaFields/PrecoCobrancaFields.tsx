"use client";

import { withForm } from "@/components/form";
import { Grid, GridItem } from "@/components/form/FormGrid.styles";
import { EMPTY_PRECO_INFO, PERIODO_DIARIA_OPTIONS } from "@/types/preco";
import { formatMinutos } from "../format";
import { Section, SectionTitle } from "../shared/FormSection.styles";

export const PrecoCobrancaFields = withForm({
  defaultValues: EMPTY_PRECO_INFO,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled }) {
    return (
      <>
        <Section>
          <SectionTitle>Diária</SectionTitle>
          <Grid>
            <GridItem $span>
              <form.AppField name="periodoDiaria">
                {(field) => (
                  <form.Subscribe selector={(state) => state.values.periodoDiaria}>
                    {(periodo) => (
                      <field.SelectField label="Período da diária" disabled={disabled}>
                        <option value="">Selecione</option>
                        {PERIODO_DIARIA_OPTIONS.map((option) => (
                          <option key={option.minutos} value={option.minutos}>
                            {option.label}
                          </option>
                        ))}
                        {/* Valor já salvo que não está na lista (ex.: tabela antiga): mantém a opção para não perdê-lo. */}
                        {periodo !== "" && !PERIODO_DIARIA_OPTIONS.some((option) => String(option.minutos) === periodo) && (
                          <option value={periodo}>{formatMinutos(Number(periodo))}</option>
                        )}
                      </field.SelectField>
                    )}
                  </form.Subscribe>
                )}
              </form.AppField>
            </GridItem>
            <GridItem>
              <form.AppField name="valorDiaria">
                {(field) => (
                  <field.TextField
                    label="Valor da diária (R$)"
                    inputMode="decimal"
                    format={(value) => value.replace(/[^\d.,]/g, "")}
                    disabled={disabled}
                  />
                )}
              </form.AppField>
            </GridItem>
            <GridItem>
              <form.AppField name="valorAdicionalDiaria">
                {(field) => (
                  <field.TextField
                    label="Valor adicional da diária (R$)"
                    inputMode="decimal"
                    hint="Cobrado por hora depois do período da diária."
                    format={(value) => value.replace(/[^\d.,]/g, "")}
                    disabled={disabled}
                  />
                )}
              </form.AppField>
            </GridItem>
          </Grid>
        </Section>

        <Section>
          <SectionTitle>Tolerâncias</SectionTitle>
          <Grid>
            <GridItem>
              <form.AppField name="toleranciaEntradaMinutos">
                {(field) => (
                  <field.TextField
                    label="Tolerância de entrada (min)"
                    inputMode="numeric"
                    hint="Minutos iniciais sem cobrança."
                    format={(value) => value.replace(/\D/g, "")}
                    disabled={disabled}
                  />
                )}
              </form.AppField>
            </GridItem>
            <GridItem>
              <form.AppField name="toleranciaAlteracaoFaixaMinutos">
                {(field) => (
                  <field.TextField
                    label="Tolerância de alteração de faixa (min)"
                    inputMode="numeric"
                    hint="Minutos extras antes de passar para o degrau seguinte."
                    format={(value) => value.replace(/\D/g, "")}
                    disabled={disabled}
                  />
                )}
              </form.AppField>
            </GridItem>
          </Grid>
        </Section>
      </>
    );
  },
});
