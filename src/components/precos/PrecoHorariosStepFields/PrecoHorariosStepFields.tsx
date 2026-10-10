"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { withForm } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import {
  DIAS_SEMANA_PRECO,
  EMPTY_PRECO_HORARIO,
  type PrecoHorariosValues,
} from "@/types/preco";
import {
  EmptyHint,
  LiveRegion,
  Row,
  RowList,
  Toolbar,
  ToolbarActions,
  Wrapper,
} from "../shared/RepeatableRows.styles";
import { Period, PeriodFields, RowFields, RowFooter } from "./PrecoHorariosStepFields.styles";

const DEFAULT_VALUES: PrecoHorariosValues = { horarios: [] };

export const PrecoHorariosStepFields = withForm({
  defaultValues: DEFAULT_VALUES,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled }) {
    function addRow() {
      form.pushFieldValue("horarios", { ...EMPTY_PRECO_HORARIO });
    }

    function removeRow(index: number) {
      form.removeFieldValue("horarios", index);
    }

    // Caso comum: o mesmo horário todos os dias. Usa o primeiro horário cadastrado (ou o padrão).
    function applyToAllDays() {
      const base = form.state.values.horarios[0] ?? EMPTY_PRECO_HORARIO;
      form.setFieldValue(
        "horarios",
        DIAS_SEMANA_PRECO.map((dia) => ({ ...base, diaSemana: String(dia.codigo) })),
      );
    }

    return (
      <form.Subscribe selector={(state) => state.values.horarios.length}>
        {(count) => (
          <HorariosList count={count}>
            <Wrapper>
              <Toolbar>
                <Text variant="muted">Defina quando esta tabela de preço vale.</Text>
                <ToolbarActions>
                  <Button type="button" variant="secondary" size="sm" onClick={applyToAllDays} disabled={disabled}>
                    Aplicar a todos os dias
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={addRow} disabled={disabled}>
                    Adicionar horário
                  </Button>
                </ToolbarActions>
              </Toolbar>

              {count === 0 ? (
                <EmptyHint>
                  <Text variant="muted">Nenhum horário cadastrado.</Text>
                </EmptyHint>
              ) : (
                <RowList>
                  {Array.from({ length: count }, (_, index) => (
                    <Row key={index} role="group" aria-label={`Horário ${index + 1}`} data-row={index}>
                      <RowFields>
                        <form.AppField name={`horarios[${index}].diaSemana`}>
                          {(field) => (
                            <field.SelectField label={`Dia da semana — horário ${index + 1}`} disabled={disabled}>
                              {DIAS_SEMANA_PRECO.map((dia) => (
                                <option key={dia.codigo} value={dia.codigo}>
                                  {dia.label}
                                </option>
                              ))}
                            </field.SelectField>
                          )}
                        </form.AppField>
                        <form.AppField name={`horarios[${index}].horaInicio`}>
                          {(field) => (
                            <field.TextField
                              label={`Hora de início — horário ${index + 1}`}
                              type="time"
                              disabled={disabled}
                            />
                          )}
                        </form.AppField>
                        <form.AppField name={`horarios[${index}].horaFim`}>
                          {(field) => (
                            <field.TextField
                              label={`Hora de fim — horário ${index + 1}`}
                              type="time"
                              disabled={disabled}
                            />
                          )}
                        </form.AppField>
                      </RowFields>
                      <RowFooter>
                        <form.AppField name={`horarios[${index}].ativo`}>
                          {(field) => (
                            <field.SwitchField
                              label="Ativo"
                              aria-label={`Horário ${index + 1} ativo`}
                              disabled={disabled}
                            />
                          )}
                        </form.AppField>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => removeRow(index)}
                          disabled={disabled}
                          aria-label={`Remover horário ${index + 1}`}
                        >
                          Remover
                        </Button>
                        <Period>
                          <summary>Período específico (opcional)</summary>
                          <PeriodFields>
                            <form.AppField name={`horarios[${index}].dataInicio`}>
                              {(field) => (
                                <field.TextField
                                  label={`Data de início — horário ${index + 1}`}
                                  type="date"
                                  disabled={disabled}
                                />
                              )}
                            </form.AppField>
                            <form.AppField name={`horarios[${index}].dataFim`}>
                              {(field) => (
                                <field.TextField
                                  label={`Data final — horário ${index + 1}`}
                                  type="date"
                                  disabled={disabled}
                                />
                              )}
                            </form.AppField>
                          </PeriodFields>
                        </Period>
                      </RowFooter>
                    </Row>
                  ))}
                </RowList>
              )}
            </Wrapper>
          </HorariosList>
        )}
      </form.Subscribe>
    );
  },
});

interface HorariosListProps {
  count: number;
  children: ReactNode;
}

// Cuida do foco e do anúncio para leitores de tela quando a quantidade de linhas muda:
// ao adicionar uma linha, o foco vai ao primeiro campo dela.
function HorariosList({ count, children }: HorariosListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef(count);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const previous = previousCountRef.current;
    previousCountRef.current = count;
    if (count === previous) {
      return;
    }
    if (count === previous + 1) {
      containerRef.current?.querySelector<HTMLElement>(`[data-row="${count - 1}"] select`)?.focus();
      setAnnouncement(`Horário ${count} adicionado.`);
    } else if (count < previous) {
      setAnnouncement("Horário removido.");
    } else {
      setAnnouncement("Horários atualizados.");
    }
  }, [count]);

  return (
    <div ref={containerRef}>
      {children}
      <LiveRegion role="status" aria-live="polite">
        {announcement}
      </LiveRegion>
    </div>
  );
}
