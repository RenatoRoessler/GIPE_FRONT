import { GerarCartazButton } from "@/components/empresa/CartazTicket";
import { InstallPwaButton } from "@/components/layout/InstallPwaButton";
import { DashboardContent } from "@/components/home/DashboardContent";
import { IndicadoresPatio } from "@/components/home/IndicadoresPatio";
import { RepetirTourButton } from "@/components/onboarding";
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
        <GerarCartazButton />
        <RepetirTourButton />
      </ActionRow>
      <IndicadoresPatio />
    </DashboardContent>
  );
}
