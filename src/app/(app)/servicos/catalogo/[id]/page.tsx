import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ServicoFormEsqueleto, ServicoFormPagina } from "@/components/servicos/Catalogo/ServicoFormPagina";

// Só números inteiros positivos chegam à edição; qualquer outra coisa nem consulta o catálogo.
const ID_PATTERN = /^[1-9]\d{0,9}$/;

export default async function EditarServicoRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!ID_PATTERN.test(id)) {
    notFound();
  }

  return (
    <Suspense fallback={<ServicoFormEsqueleto />}>
      <ServicoFormPagina id={Number(id)} />
    </Suspense>
  );
}
