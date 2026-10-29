import { RedirecionarInicio } from "@/components/layout/RedirecionarInicio";

// Visitantes sem login já são enviados ao /login pelo proxy; aqui chega apenas quem está logado.
export default function Home() {
  return <RedirecionarInicio />;
}
