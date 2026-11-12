import { Suspense } from "react";
import { ServicosEsqueleto, ServicosPage } from "@/components/servicos/ServicosPage";

// `ServicosPage` lê a aba e a seleção da URL: o Suspense deixa o resto da página sair pré-renderizado.
export default function ServicosRoute() {
  return (
    <Suspense fallback={<ServicosEsqueleto />}>
      <ServicosPage />
    </Suspense>
  );
}
