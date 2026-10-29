"use client";

import { withForm } from "@/components/form";
import { CameraButton } from "@/components/ui/CameraButton";
import { Input } from "@/components/ui/Input";
import { ModeloField } from "@/components/veiculos/ModeloField";
import { CATEGORIA_VEICULO_OPTIONS, CORES_VEICULO } from "@/types/veiculo";
import type { TipoCategoria } from "@/types/preco";
import { CondutoresList } from "./CondutoresList";
import { categoriaDoTipo, categoriaLabel, EMPTY_MENSALISTA_VALUES } from "./mensalistaForm";
import { FieldRow, ItemBody } from "./Veiculos.styles";

export const VeiculoItem = withForm({
  defaultValues: EMPTY_MENSALISTA_VALUES,
  props: {} as {
    index: number;
    juridica: boolean;
    categoriaTipo: TipoCategoria | null;
    disabled?: boolean;
    onLerPlaca: (index: number) => void;
  },
  render: function Render({ form, index, juridica, categoriaTipo, disabled = false, onLerPlaca }) {
    const categoriaFixa = categoriaDoTipo(categoriaTipo);

    return (
      <ItemBody>
        <form.AppField
          name={`veiculos[${index}].placa`}
          listeners={{
            // Mexeu na placa: o erro que veio do servidor não vale mais.
            onChange: () =>
              form.setFieldMeta(`veiculos[${index}].placa`, (meta) => ({
                ...meta,
                errorMap: { ...meta.errorMap, onServer: undefined },
              })),
          }}
        >
          {(field) => (
            <field.PlateField
              label="Placa"
              disabled={disabled}
              action={
                <CameraButton
                  disabled={disabled}
                  aria-label={`Ler a placa do veículo ${index + 1} pela câmera`}
                  onClick={() => onLerPlaca(index)}
                />
              }
            />
          )}
        </form.AppField>

        <FieldRow>
          <form.AppField name={`veiculos[${index}].modelo`}>
            {() => <ModeloField maxLength={80} disabled={disabled} />}
          </form.AppField>

          {categoriaFixa !== "" ? (
            // Tipo de categoria específica: o operador não tem como errar a categoria.
            <Input
              label="Categoria"
              value={categoriaLabel(categoriaFixa)}
              readOnly
              hint="Definida pelo tipo de mensalidade."
            />
          ) : (
            <form.AppField name={`veiculos[${index}].categoria`}>
              {(field) => (
                <field.SelectField label="Categoria" disabled={disabled}>
                  <option value="">Selecione</option>
                  {CATEGORIA_VEICULO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </field.SelectField>
              )}
            </form.AppField>
          )}
        </FieldRow>

        <form.AppField name={`veiculos[${index}].cor`}>
          {(field) => <field.ColorField legend="Cor" options={CORES_VEICULO} disabled={disabled} />}
        </form.AppField>

        {juridica && <CondutoresList form={form} index={index} disabled={disabled} />}
      </ItemBody>
    );
  },
});
