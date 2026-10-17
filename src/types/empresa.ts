import type { BusinessHoursData, CompanyData, PaymentsData } from "./adesao";

export interface EmpresaFormValues {
  company: CompanyData;
  hours: BusinessHoursData;
  payments: PaymentsData;
}
