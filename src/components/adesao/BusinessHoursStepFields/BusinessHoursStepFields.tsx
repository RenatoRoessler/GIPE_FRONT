"use client";

import { useSelector } from "@tanstack/react-form";
import { withForm } from "@/components/form";
import { DIAS_SEMANA, EMPTY_BUSINESS_HOURS_DATA } from "@/types/adesao";
import { AtalhosHorario } from "../AtalhosHorario";
import { Chip } from "../AtalhosHorario/AtalhosHorario.styles";
import { DayList, DayName, DayRow, Toolbar, Wrapper } from "./BusinessHoursStepFields.styles";

export const BusinessHoursStepFields = withForm({
  defaultValues: EMPTY_BUSINESS_HOURS_DATA,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled }) {
    const horarios = useSelector(form.store, (state) => state.values.horarios);

    return (
      <Wrapper>
        <Toolbar>
          <AtalhosHorario
            hours={{ horarios }}
            disabled={disabled}
            onAplicar={(hours) => form.setFieldValue("horarios", hours.horarios)}
          />
        </Toolbar>
        <DayList>
          {DIAS_SEMANA.map((dia, index) => (
            <DayRow key={dia.codigo} role="group" aria-label={dia.label}>
              <DayName>{dia.label}</DayName>
              <form.AppField name={`horarios[${index}].aberto`}>
                {(field) => (
                  <field.SwitchField
                    label="Aberto"
                    aria-label={`${dia.label}: aberto`}
                    disabled={disabled}
                    onChange={(checked) => {
                      if (!checked) {
                        form.setFieldValue(`horarios[${index}].aberto24Horas`, false);
                      }
                    }}
                  />
                )}
              </form.AppField>
              <form.Field name={`horarios[${index}].aberto24Horas`}>
                {(field) => (
                  <Chip
                    type="button"
                    aria-pressed={field.state.value}
                    aria-label={`${dia.label}: aberto 24 horas`}
                    disabled={disabled || !horarios[index].aberto}
                    onClick={() => field.handleChange(!field.state.value)}
                  >
                    24 horas
                  </Chip>
                )}
              </form.Field>
              <form.AppField name={`horarios[${index}].horarioAbertura`}>
                {(field) => (
                  <field.TextField
                    label="Abertura"
                    aria-label={`Abertura de ${dia.label}`}
                    type="time"
                    disabled={disabled || !horarios[index].aberto || horarios[index].aberto24Horas}
                  />
                )}
              </form.AppField>
              <form.AppField name={`horarios[${index}].horarioFechamento`}>
                {(field) => (
                  <field.TextField
                    label="Fechamento"
                    aria-label={`Fechamento de ${dia.label}`}
                    type="time"
                    disabled={disabled || !horarios[index].aberto || horarios[index].aberto24Horas}
                  />
                )}
              </form.AppField>
            </DayRow>
          ))}
        </DayList>
      </Wrapper>
    );
  },
});
