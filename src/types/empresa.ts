import type { BusinessHoursData, CompanyData, PaymentsData } from "./adesao";

export interface EmpresaFormValues {
  company: CompanyData;
  hours: BusinessHoursData;
  payments: PaymentsData;
  // Identificador público da empresa (vai no QR do cartaz). Só leitura: não é campo do formulário nem entra no PUT.
  empresaGuid?: string | null;
}
