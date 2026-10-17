import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./context";
import { ColorField } from "./ColorField";
import { OptionField } from "./OptionField";
import { PlateField } from "./PlateField";
import { SelectField } from "./SelectField";
import { SwitchField } from "./SwitchField";
import { TextField } from "./TextField";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    ColorField,
    OptionField,
    PlateField,
    SelectField,
    SwitchField,
  },
  formComponents: {},
});
