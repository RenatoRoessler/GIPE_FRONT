import { redirect } from "next/navigation";

// Visitantes sem login já são enviados ao /login pelo proxy; aqui chega apenas quem está logado.
export default function Home() {
  redirect("/dashboard");
}
