import { Suspense } from "react";
import { ConferenciaEsqueleto, ConferenciaPage } from "@/components/conferencia/ConferenciaPage";

// `ConferenciaPage` lê a etapa da URL: o Suspense deixa o resto da página sair pré-renderizado.
export default function ConferenciaPatioPage() {
  return (
    <Suspense fallback={<ConferenciaEsqueleto />}>
      <ConferenciaPage />
    </Suspense>
  );
}
