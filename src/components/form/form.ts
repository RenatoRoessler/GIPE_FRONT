import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./context";
import { SelectField } from "./SelectField";
import { TextField } from "./TextField";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    SelectField,
  },
  formComponents: {},
});
