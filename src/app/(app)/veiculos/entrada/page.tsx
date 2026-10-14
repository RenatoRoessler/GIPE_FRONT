import { Text } from "@/components/ui/Text";
import { ActionRow } from "@/components/veiculos/ActionRow";
import { RegistrarEntradaButton } from "@/components/veiculos/RegistrarEntradaButton";

export default function EntradaVeiculosPage() {
  return (
    <>
      <Text variant="heading">Entrada de Veículos</Text>
      <Text variant="muted">Registre a entrada de um veículo no pátio.</Text>
      <ActionRow>
        <RegistrarEntradaButton />
      </ActionRow>
    </>
  );
}
