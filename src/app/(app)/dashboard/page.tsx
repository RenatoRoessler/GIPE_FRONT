import { InstallPwaButton } from "@/components/layout/InstallPwaButton";
import { DashboardContent } from "@/components/home/DashboardContent";
import { IndicadoresPatio } from "@/components/home/IndicadoresPatio";
import { ActionRow } from "@/components/veiculos/ActionRow";
import { RegistrarEntradaButton } from "@/components/veiculos/RegistrarEntradaButton";
import { RegistrarSaidaButton } from "@/components/veiculos/RegistrarSaidaButton";

export default function DashboardPage() {
  return (
    <DashboardContent>
      <InstallPwaButton variant="full" />
      <ActionRow>
        <RegistrarEntradaButton />
        <RegistrarSaidaButton />
      </ActionRow>
      <IndicadoresPatio />
    </DashboardContent>
  );
}
