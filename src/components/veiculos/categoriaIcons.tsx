import type { ReactNode } from "react";
import { CATEGORIA_VEICULO, type CategoriaVeiculo } from "@/types/veiculo";

// Silhuetas de perfil em traço (usam a cor do texto); decorativas, o rótulo da categoria é o nome acessível.
const PATHS: Record<CategoriaVeiculo, ReactNode> = {
  [CATEGORIA_VEICULO.Moto]: (
    <>
      <circle cx="10" cy="22" r="6" />
      <circle cx="38" cy="22" r="6" />
      <path d="M10 22l9-10h10l9 10M22 12l-3-5h-4M29 12l4-5h5" />
    </>
  ),
  [CATEGORIA_VEICULO.CarroPequeno]: (
    <>
      <path d="M12 23h-2v-6l5-7h14l6 7h3v6h-2" />
      <circle cx="15" cy="23" r="3" />
      <circle cx="33" cy="23" r="3" />
      <path d="M18 23h12" />
    </>
  ),
  [CATEGORIA_VEICULO.CarroMedio]: (
    <>
      <path d="M8 23h-2v-6l4-1 6-6h14l7 6h5v7h-2" />
      <circle cx="12" cy="23" r="3" />
      <circle cx="36" cy="23" r="3" />
      <path d="M15 23h18" />
    </>
  ),
  [CATEGORIA_VEICULO.Caminhonete]: (
    <>
      <path d="M7 23h-4v-7l5-1 4-7h12v8h21v7h-4" />
      <circle cx="11" cy="23" r="3" />
      <circle cx="37" cy="23" r="3" />
      <path d="M14 23h20" />
    </>
  ),
  [CATEGORIA_VEICULO.Caminhao]: (
    <>
      <path d="M31 22H3V6h28v16zM31 12h8l6 6v4h-4" />
      <circle cx="10" cy="24" r="3" />
      <circle cx="37" cy="24" r="3" />
    </>
  ),
  [CATEGORIA_VEICULO.CarroGrande]: (
    <>
      <path d="M6 23h-3v-8l5-1 4-6h22l6 6h4v9h-3" />
      <circle cx="10" cy="23" r="3" />
      <circle cx="38" cy="23" r="3" />
      <path d="M13 23h22" />
    </>
  ),
};

export function CategoriaIcon({ categoria }: { categoria: CategoriaVeiculo }) {
  return (
    <svg
      width="44"
      height="30"
      viewBox="0 0 48 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[categoria]}
    </svg>
  );
}
