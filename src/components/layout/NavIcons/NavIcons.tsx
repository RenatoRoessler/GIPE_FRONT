import { SVGAttributes } from "react";
import type { NavIconId } from "@/lib/nav";

type IconProps = SVGAttributes<SVGSVGElement>;

// Ícones do menu (pórtico do computador, barra inferior e painel do celular): os do protótipo aprovado, em traço de 2,4.
function IconBase(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z" />
    </IconBase>
  );
}

function PricingIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v18M16 7.5c-.6-1.2-2-2-4-2-2.4 0-4 1.2-4 3s1.6 2.6 4 3 4 1.2 4 3-1.6 3-4 3c-2 0-3.4-.8-4-2" />
    </IconBase>
  );
}

function UsersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
    </IconBase>
  );
}

// Entrada: seta entrando por uma porta.
function VehicleInIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 12h11M10 8l4 4-4 4" />
      <path d="M14 5h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
    </IconBase>
  );
}

function MembersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </IconBase>
  );
}

// Saída: seta saindo por uma porta.
function VehicleOutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 12H10M17 8l4 4-4 4" />
      <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" />
    </IconBase>
  );
}

// Estacionamento: a letra P num quadrado.
function YardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3" />
    </IconBase>
  );
}

function CashierIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </IconBase>
  );
}

// Nota fiscal: folha com a dobra no canto e duas linhas de texto.
function InvoiceIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6" />
    </IconBase>
  );
}


function CompanyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 20V6l8-3v17M12 9h8v11M8 9v.01M8 13v.01M8 17v.01M16 13v.01M16 17v.01" />
    </IconBase>
  );
}

const ICONS: Record<NavIconId, (props: IconProps) => React.JSX.Element> = {
  home: HomeIcon,
  pricing: PricingIcon,
  users: UsersIcon,
  members: MembersIcon,
  vehicleIn: VehicleInIcon,
  vehicleOut: VehicleOutIcon,
  yard: YardIcon,
  cashier: CashierIcon,
  invoice: InvoiceIcon,
  company: CompanyIcon,
};

export function NavIcon({ id, ...props }: { id: NavIconId } & IconProps) {
  const Icon = ICONS[id];
  return <Icon {...props} />;
}
