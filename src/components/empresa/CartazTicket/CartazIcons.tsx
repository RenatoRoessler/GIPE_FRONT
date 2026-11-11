import type { ReactNode } from "react";

// Ícones decorativos de traço (o texto ao lado é o conteúdo). Em SVG, sem imagem externa, para a impressão não depender de carregamento.
function Icon({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function IconeCamera({ size = 18 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </Icon>
  );
}

export function IconeCelular({ size = 22 }: { size?: number }) {
  return (
    <Icon size={size}>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </Icon>
  );
}

export function IconeUsuarioRiscado({ size = 22 }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6M4 4l16 16" />
    </Icon>
  );
}

export function IconePapelRiscado({ size = 22 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M4 4l16 16" />
    </Icon>
  );
}
