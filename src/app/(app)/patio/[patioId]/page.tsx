import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PatioEsqueleto, PatioView } from "@/components/patio/PatioView";
import { TicketView } from "@/components/patio/TicketView";

// Só números inteiros positivos chegam ao ticket; qualquer outra coisa nem consulta a lista.
const ID_PATTERN = /^[1-9]\d{0,9}$/;

export default async function TicketPage({ params }: { params: Promise<{ patioId: string }> }) {
  const { patioId } = await params;

  if (!ID_PATTERN.test(patioId)) {
    notFound();
  }

  // O ticket é um popup sobre a lista do Pátio. As duas telas leem a busca e os filtros da URL: o Suspense deixa o
  // resto da página sair pré-renderizado.
  return (
    <>
      <Suspense fallback={<PatioEsqueleto />}>
        <PatioView />
      </Suspense>
      <Suspense>
        <TicketView patioId={Number(patioId)} />
      </Suspense>
    </>
  );
}
