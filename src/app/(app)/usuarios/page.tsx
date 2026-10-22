import type { Metadata } from "next";
import { UsuariosPage } from "@/components/usuarios/UsuariosPage";

export const metadata: Metadata = {
  title: "Gestão de Usuários — GIPE",
};

export default function Page() {
  return <UsuariosPage />;
}
