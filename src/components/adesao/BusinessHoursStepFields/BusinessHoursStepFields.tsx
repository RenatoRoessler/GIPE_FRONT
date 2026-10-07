"use client";

import { withForm } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { DIAS_SEMANA, EMPTY_BUSINESS_HOURS_DATA } from "@/types/adesao";
import { DayList, DayName, DayRow, Toolbar, Wrapper } from "./BusinessHoursStepFields.styles";

// Segunda-feira é o ponto de partida para "copiar para os outros dias".
const MONDAY_INDEX = 1;

export const BusinessHoursStepFields = withForm({
  defaultValues: EMPTY_BUSINESS_HOURS_DATA,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled }) {
    function copyMondayToOtherDays() {
      const horarios = form.state.values.horarios;
      const monday = horarios[MONDAY_INDEX];
      form.setFieldValue(
        "horarios",
        horarios.map((day, index) => (index === MONDAY_INDEX ? day : { ...monday })),
      );
    }

    return (
      <Wrapper>
        <Toolbar>
          <Text variant="muted">Defina os horários de cada dia da semana.</Text>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={copyMondayToOtherDays}
            disabled={disabled}
          >
            Copiar segunda para os outros dias
          </Button>
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
              <form.Subscribe selector={(state) => state.values.horarios[index]}>
                {(day) => (
                  <>
                    <form.AppField name={`horarios[${index}].aberto24Horas`}>
                      {(field) => (
                        <field.SwitchField
                          label="24 horas"
                          aria-label={`${dia.label}: aberto 24 horas`}
                          disabled={disabled || !day.aberto}
                        />
                      )}
                    </form.AppField>
                    <form.AppField name={`horarios[${index}].horarioAbertura`}>
                      {(field) => (
                        <field.TextField
                          label="Abertura"
                          aria-label={`Abertura de ${dia.label}`}
                          type="time"
                          disabled={disabled || !day.aberto || day.aberto24Horas}
                        />
                      )}
                    </form.AppField>
                    <form.AppField name={`horarios[${index}].horarioFechamento`}>
                      {(field) => (
                        <field.TextField
                          label="Fechamento"
                          aria-label={`Fechamento de ${dia.label}`}
                          type="time"
                          disabled={disabled || !day.aberto || day.aberto24Horas}
                        />
                      )}
                    </form.AppField>
                  </>
                )}
              </form.Subscribe>
            </DayRow>
          ))}
        </DayList>
      </Wrapper>
    );
  },
});
