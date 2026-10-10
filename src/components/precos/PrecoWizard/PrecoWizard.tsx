"use client";

import { createPreco } from "@/lib/api/services/preco";
import { EMPTY_PRECO_FORM_VALUES } from "@/types/preco";
import { PrecoWizardForm } from "./PrecoWizardForm";

// Cadastro: formulário vazio. A edição (carregar o preço por id) entra na fase D.
export function PrecoWizard() {
  return (
    <PrecoWizardForm
      title="Novo preço"
      initial={EMPTY_PRECO_FORM_VALUES}
      onSave={createPreco}
      savedFlag="criado"
    />
  );
}
