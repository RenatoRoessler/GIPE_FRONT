"use client";

import { withForm } from "@/components/form";
import { Grid, GridItem } from "@/components/form/FormGrid.styles";
import { Text } from "@/components/ui/Text";
import { EMPTY_PRECO_INFO, PERIODO_DIARIA_OPTIONS } from "@/types/preco";
import { formatMinutos } from "../format";
import { Section, SectionTitle } from "../shared/FormSection.styles";

const MAX_VALOR = 9999;
const MAX_TOLERANCIA = 120;

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
                  <field.StepperField
                    label="Valor da diária"
                    min={0}
                    max={MAX_VALOR}
                    step={1}
                    decimals={2}
                    disabled={disabled}
                  />
                )}
              </form.AppField>
            </GridItem>
            <GridItem>
              <form.AppField name="valorAdicionalDiaria">
                {(field) => (
                  <field.StepperField
                    label="Valor adicional da diária"
                    min={0}
                    max={MAX_VALOR}
                    step={0.5}
                    decimals={2}
                    disabled={disabled}
                  />
                )}
              </form.AppField>
              <Text variant="muted">Cobrado por hora depois do período da diária.</Text>
            </GridItem>
          </Grid>
        </Section>

        <Section>
          <SectionTitle>Tolerâncias</SectionTitle>
          <Grid>
            <GridItem>
              <form.AppField name="toleranciaEntradaMinutos">
                {(field) => (
                  <field.StepperField
                    label="Tolerância de entrada"
                    min={0}
                    max={MAX_TOLERANCIA}
                    step={5}
                    format={formatMinutos}
                    disabled={disabled}
                  />
                )}
              </form.AppField>
              <Text variant="muted">Minutos iniciais sem cobrança.</Text>
            </GridItem>
            <GridItem>
              <form.AppField name="toleranciaAlteracaoFaixaMinutos">
                {(field) => (
                  <field.StepperField
                    label="Tolerância de alteração de faixa"
                    min={0}
                    max={MAX_TOLERANCIA}
                    step={5}
                    format={formatMinutos}
                    disabled={disabled}
                  />
                )}
              </form.AppField>
              <Text variant="muted">Minutos extras antes de passar para o degrau seguinte.</Text>
            </GridItem>
          </Grid>
        </Section>
      </>
    );
  },
});
