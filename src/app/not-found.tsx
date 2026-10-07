import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

// Rota inexistente: logado volta à home; sem login, ao login.
export default async function NotFound() {
  const cookieStore = await cookies();
  redirect(cookieStore.has(AUTH_COOKIE_NAME) ? "/dashboard" : "/login");
}
