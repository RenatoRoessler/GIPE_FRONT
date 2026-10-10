"use client";

import { withForm } from "@/components/form";
import { Grid, GridItem } from "@/components/form/FormGrid.styles";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";
import { EMPTY_PRECO_INFO, TIPO_REGRA_OPTIONS } from "@/types/preco";
import { formatMinutos } from "../format";
import { Section, SectionTitle } from "./PrecoInfoStepFields.styles";

export const PrecoInfoStepFields = withForm({
  defaultValues: EMPTY_PRECO_INFO,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled }) {
    return (
      <>
        <Section>
          <SectionTitle>Identificação</SectionTitle>
          <Grid>
            <GridItem $span>
              <form.AppField name="descricao">
                {(field) => <field.TextField label="Descrição" maxLength={120} disabled={disabled} />}
              </form.AppField>
            </GridItem>
            <GridItem>
              <form.AppField name="tipoRegra">
                {(field) => (
                  <field.SelectField label="Tipo de regra" disabled={disabled}>
                    {TIPO_REGRA_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </field.SelectField>
                )}
              </form.AppField>
            </GridItem>
            <GridItem>
              <form.AppField name="prioridade">
                {(field) => (
                  <field.TextField
                    label="Prioridade"
                    inputMode="numeric"
                    hint="Quanto maior o número, maior a precedência."
                    format={(value) => value.replace(/\D/g, "")}
                    disabled={disabled}
                  />
                )}
              </form.AppField>
            </GridItem>
            <GridItem $span>
              {/* Reservado para uso futuro: sempre desabilitado e fora do valor do formulário. */}
              <Select label="Empresa conveniada" value="" disabled onChange={() => undefined}>
                <option value="">Nenhuma</option>
              </Select>
              <Text variant="muted">Disponível em breve.</Text>
            </GridItem>
          </Grid>
        </Section>

        <Section>
          <SectionTitle>Vigência e tolerâncias</SectionTitle>
          <Grid>
            <GridItem>
              <form.AppField name="inicioVigencia">
                {(field) => (
                  <field.TextField label="Início da vigência" type="datetime-local" disabled={disabled} />
                )}
              </form.AppField>
            </GridItem>
            <GridItem>
              <form.AppField name="fimVigencia">
                {(field) => (
                  <field.TextField
                    label="Fim da vigência (opcional)"
                    type="datetime-local"
                    hint="Deixe em branco para vigência indeterminada."
                    disabled={disabled}
                  />
                )}
              </form.AppField>
            </GridItem>
            <GridItem>
              <form.AppField name="toleranciaEntradaMinutos">
                {(field) => (
                  <field.TextField
                    label="Tolerância de entrada (min)"
                    inputMode="numeric"
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
                    format={(value) => value.replace(/\D/g, "")}
                    disabled={disabled}
                  />
                )}
              </form.AppField>
            </GridItem>
          </Grid>
        </Section>

        <Section>
          <SectionTitle>Diária</SectionTitle>
          <Grid>
            <GridItem $span>
              <form.AppField name="periodoDiaria">
                {(field) => (
                  <form.Subscribe selector={(state) => state.values.periodoDiaria}>
                    {(periodo) => (
                      <field.TextField
                        label="Período da diária (min)"
                        inputMode="numeric"
                        hint={periodo ? `= ${formatMinutos(Number(periodo))}` : undefined}
                        format={(value) => value.replace(/\D/g, "")}
                        disabled={disabled}
                      />
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
                    format={(value) => value.replace(/[^\d.,]/g, "")}
                    disabled={disabled}
                  />
                )}
              </form.AppField>
            </GridItem>
          </Grid>
        </Section>

        <form.AppField name="ativo">
          {(field) => <field.SwitchField label="Ativo" disabled={disabled} />}
        </form.AppField>
      </>
    );
  },
});
