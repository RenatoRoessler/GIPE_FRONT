import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

// Únicas rotas acessíveis sem login: a adesão e o fluxo de acesso (login e recuperação de senha).
const PUBLIC_PATHS = ["/adesao", "/login", "/recuperar-senha", "/alterar-senha"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function proxy(request: NextRequest) {
  const hasToken = request.cookies.has(AUTH_COOKIE_NAME);

  if (!hasToken && !isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Todas as rotas, exceto arquivos estáticos e a pasta public/assets (a logo aparece na adesão, sem login).
  matcher: ["/((?!_next/static|_next/image|assets|favicon.ico|icon.png).*)"],
};
