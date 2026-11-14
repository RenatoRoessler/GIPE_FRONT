import { Suspense } from "react";
import { ServicoFormEsqueleto, ServicoFormPagina } from "@/components/servicos/Catalogo/ServicoFormPagina";

// O cadastro de um serviço novo, em página inteira.
export default function NovoServicoRoute() {
  return (
    <Suspense fallback={<ServicoFormEsqueleto />}>
      <ServicoFormPagina />
    </Suspense>
  );
}
