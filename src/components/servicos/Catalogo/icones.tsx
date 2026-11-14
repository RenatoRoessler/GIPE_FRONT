import type { SVGAttributes } from "react";

// Ícones do protótipo "Murel Serviços", com os mesmos traços (24×24, linhas arredondadas). Decorativos: o texto ao lado
// (ou o `aria-label` do botão) diz o que são.
type Props = SVGAttributes<SVGSVGElement>;

function Base({ strokeWidth = 2, children, ...props }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export const IconeLava = (props: Props) => (
  <Base {...props}>
    <path d="M12 3c-3 4-5 6.5-5 9a5 5 0 0 0 10 0c0-2.5-2-5-5-9z" />
    <path d="M10 13a2 2 0 0 0 2 2" />
  </Base>
);

export const IconeMais = (props: Props) => (
  <Base strokeWidth={2.4} {...props}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconeBusca = (props: Props) => (
  <Base {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Base>
);

export const IconeRelogio = (props: Props) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Base>
);

export const IconeP = (props: Props) => (
  <Base {...props}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3" />
  </Base>
);

export const IconeVolta = (props: Props) => (
  <Base strokeWidth={2.2} {...props}>
    <path d="M15 6l-6 6 6 6" />
  </Base>
);

export const IconeSeta = (props: Props) => (
  <Base strokeWidth={2.2} {...props}>
    <path d="M9 6l6 6-6 6" />
  </Base>
);

export const IconeX = (props: Props) => (
  <Base strokeWidth={2.2} {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const IconeOk = (props: Props) => (
  <Base strokeWidth={2.6} {...props}>
    <path d="M5 12l5 5L20 7" />
  </Base>
);

export const IconeLixo = (props: Props) => (
  <Base {...props}>
    <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />
  </Base>
);

export const IconeMoto = (props: Props) => (
  <Base {...props}>
    <circle cx="5" cy="16" r="3" />
    <circle cx="19" cy="16" r="3" />
    <path d="M7.5 14h5l2-5h2.5M12 9h3l2 7M5 16h3l2-4" />
  </Base>
);

export const IconeCarro = (props: Props) => (
  <Base {...props}>
    <path d="M5 17H3v-5l2-5h11l3 5h2v5h-2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <path d="M9 17h6" />
  </Base>
);

export const IconePickup = (props: Props) => (
  <Base {...props}>
    <path d="M5 17H2v-5h9V7h5l3 5h3v5h-2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <path d="M9 17h6" />
  </Base>
);

export const IconeCaminhao = (props: Props) => (
  <Base {...props}>
    <path d="M2 5h12v12H2zM14 9h4l4 4v4h-8" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Base>
);

const ICONE_DA_CATEGORIA: Record<number, (props: Props) => React.JSX.Element> = {
  1: IconeMoto,
  2: IconeCarro,
  3: IconeCarro,
  4: IconePickup,
  5: IconeCaminhao,
  6: IconeCarro,
};

// O ícone de cada categoria de veículo (moto, carro, caminhonete e caminhão).
export function IconeDaCategoria({ categoria, ...props }: Props & { categoria: number }) {
  const Icone = ICONE_DA_CATEGORIA[categoria] ?? IconeCarro;
  return <Icone {...props} />;
}
