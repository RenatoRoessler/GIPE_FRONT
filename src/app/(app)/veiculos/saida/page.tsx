import { Text } from "@/components/ui/Text";
import { ActionRow } from "@/components/veiculos/ActionRow";
import { RegistrarSaidaButton } from "@/components/veiculos/RegistrarSaidaButton";

export default function SaidaVeiculosPage() {
  return (
    <>
      <Text variant="heading">Saída de Veículos</Text>
      <Text variant="muted">Consulte o valor, receba o pagamento e registre a saída de um veículo do pátio.</Text>
      <ActionRow>
        <RegistrarSaidaButton />
      </ActionRow>
    </>
  );
}
