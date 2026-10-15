import { DashboardContent } from "@/components/home/DashboardContent";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { ActionRow } from "@/components/veiculos/ActionRow";
import { RegistrarEntradaButton } from "@/components/veiculos/RegistrarEntradaButton";
import { RegistrarSaidaButton } from "@/components/veiculos/RegistrarSaidaButton";

export default function DashboardPage() {
  return (
    <DashboardContent>
      <Card maxWidth="640px">
        <Text variant="heading">Bem-vindo ao GIPE</Text>
        <Text variant="muted">Mais informações aparecerão aqui em breve.</Text>
      </Card>
      <ActionRow>
        <RegistrarEntradaButton />
        <RegistrarSaidaButton />
      </ActionRow>
    </DashboardContent>
  );
}
