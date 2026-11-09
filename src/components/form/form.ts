import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./context";
import { ColorField } from "./ColorField";
import { ComboboxField } from "./ComboboxField";
import { OptionField } from "./OptionField";
import { PlateField } from "./PlateField";
import { PrismaField } from "@/components/veiculos/PrismaField";
import { SelectField } from "./SelectField";
import { StepperField } from "./StepperField";
import { SwitchField } from "./SwitchField";
import { TextareaField } from "./TextareaField";
import { TextField } from "./TextField";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    ColorField,
    ComboboxField,
    OptionField,
    PlateField,
    PrismaField,
    SelectField,
    StepperField,
    SwitchField,
  },
  formComponents: {},
});
