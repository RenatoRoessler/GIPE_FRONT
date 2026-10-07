import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./context";
import { SelectField } from "./SelectField";
import { SwitchField } from "./SwitchField";
import { TextField } from "./TextField";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    SelectField,
    SwitchField,
  },
  formComponents: {},
});
