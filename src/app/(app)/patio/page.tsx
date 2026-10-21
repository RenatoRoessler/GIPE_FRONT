import { PatioView } from "@/components/patio/PatioView";
import { Text } from "@/components/ui/Text";

export default function PatioPage() {
  return (
    <>
      <Text variant="heading">Pátio</Text>
      <Text variant="muted">Veículos que estão no pátio agora, com a entrada, a permanência e a saída de cada um.</Text>
      <PatioView />
    </>
  );
}
