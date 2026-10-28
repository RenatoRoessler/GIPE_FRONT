import { Suspense } from "react";
import { PatioEsqueleto, PatioView } from "@/components/patio/PatioView";

// `PatioView` lê a busca e os filtros da URL: o Suspense deixa o resto da página sair pré-renderizado.
export default function PatioPage() {
  return (
    <Suspense fallback={<PatioEsqueleto />}>
      <PatioView />
    </Suspense>
  );
}
