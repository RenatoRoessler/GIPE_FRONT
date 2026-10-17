import type { ReactNode } from "react";

// Ícones em traço (usam a cor do texto); decorativos, o rótulo da forma de pagamento é o nome acessível.
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const DinheiroIcon = (
  <Icon>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01M18 12h.01" />
  </Icon>
);

export const CreditoIcon = (
  <Icon>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20M6 15h4" />
  </Icon>
);

export const DebitoIcon = (
  <Icon>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M6 10h4M6 14h2M15 12h4M17 10l2 2-2 2" />
  </Icon>
);

export const PixIcon = (
  <Icon>
    <path d="M12 3l9 9-9 9-9-9z" />
    <path d="M8.5 12h7" />
  </Icon>
);
