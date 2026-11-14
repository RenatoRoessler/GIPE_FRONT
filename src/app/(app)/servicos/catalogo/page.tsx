import { Suspense } from "react";
import { CatalogoServicosEsqueleto, CatalogoServicosPage } from "@/components/servicos/CatalogoServicosPage";

// `ServicosMasterDetail` lê a seleção da URL: o Suspense deixa o resto da página sair pré-renderizado.
export default function CatalogoServicosRoute() {
  return (
    <Suspense fallback={<CatalogoServicosEsqueleto />}>
      <CatalogoServicosPage />
    </Suspense>
  );
}
