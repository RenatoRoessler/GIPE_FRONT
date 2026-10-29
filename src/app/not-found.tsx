import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RedirecionarInicio } from "@/components/layout/RedirecionarInicio";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

// Rota inexistente: logado volta à tela inicial; sem login, ao login.
export default async function NotFound() {
  const cookieStore = await cookies();
  if (!cookieStore.has(AUTH_COOKIE_NAME)) redirect("/login");
  return <RedirecionarInicio />;
}
