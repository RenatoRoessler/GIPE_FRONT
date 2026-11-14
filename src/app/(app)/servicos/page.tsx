import { Suspense } from "react";
import { FilaServicosEsqueleto, FilaServicosPage } from "@/components/servicos/FilaServicosPage";

// `FilaServicos` lê a coluna da URL: o Suspense deixa o resto da página sair pré-renderizado.
export default function FilaServicosRoute() {
  return (
    <Suspense fallback={<FilaServicosEsqueleto />}>
      <FilaServicosPage />
    </Suspense>
  );
}
