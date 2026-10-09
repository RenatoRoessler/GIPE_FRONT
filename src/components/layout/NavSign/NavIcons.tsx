import { SVGAttributes } from "react";
import type { NavIconId } from "@/lib/nav";

type IconProps = SVGAttributes<SVGSVGElement>;

function IconBase(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 20V4M5 11l7-7 7 7" />
    </IconBase>
  );
}

function PricingIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v18M8 7.5c0-1.5 1.5-2.5 4-2.5s4 1.2 4 3-2 2.5-4 3-4 1.3-4 3 1.5 2.5 4 2.5 4-1 4-2.5" />
    </IconBase>
  );
}

function UsersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
      <path d="M16 8a3 3 0 1 1 3.2 3M21 20c0-2.5-1.8-4.4-4.5-4.9" />
    </IconBase>
  );
}

function VehicleInIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 16v-3l1.6-4.2A2 2 0 0 1 6.5 7.5h7a2 2 0 0 1 1.9 1.3L17 13v3" />
      <path d="M3 16h14M6.5 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM14 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
      <path d="M19 8v5M17 10.5h4" />
    </IconBase>
  );
}

function VehicleOutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 16v-3l1.6-4.2A2 2 0 0 1 6.5 7.5h7a2 2 0 0 1 1.9 1.3L17 13v3" />
      <path d="M3 16h14M6.5 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM14 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
      <path d="M20 7.5v5M22 10h-4" />
    </IconBase>
  );
}

function ReportsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 20V10M10 20V4M16 20v-7M4 20h16" />
    </IconBase>
  );
}

function CompanyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 20V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15M14 10h5a1 1 0 0 1 1 1v9M3 20h18" />
      <path d="M8 8h2M8 12h2M8 16h2" />
    </IconBase>
  );
}

const ICONS: Record<NavIconId, (props: IconProps) => React.JSX.Element> = {
  home: HomeIcon,
  pricing: PricingIcon,
  users: UsersIcon,
  vehicleIn: VehicleInIcon,
  vehicleOut: VehicleOutIcon,
  reports: ReportsIcon,
  company: CompanyIcon,
};

export function NavIcon({ id, ...props }: { id: NavIconId } & IconProps) {
  const Icon = ICONS[id];
  return <Icon {...props} />;
}
