import { notFound } from "next/navigation";
import { PrecoWizard } from "@/components/precos/PrecoWizard";

export default async function EditarPrecoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return <PrecoWizard id={Number(id)} />;
}
