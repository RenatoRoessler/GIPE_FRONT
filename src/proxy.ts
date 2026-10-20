import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

// Únicas rotas acessíveis sem login: a adesão, o fluxo de acesso (login e recuperação de senha) e o comprovante do cliente.
const PUBLIC_PATHS = ["/adesao", "/login", "/recuperar-senha", "/alterar-senha", "/comprovante"];

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
  // Todas as rotas, exceto arquivos estáticos, public/assets (a logo aparece na adesão, sem login) e os arquivos do PWA
  // (manifest, service worker, ícones e página offline) e do OCR da placa (public/ocr), que o navegador busca sem cookie.
  matcher: ["/((?!_next/static|_next/image|assets|icons|favicon.ico|icon.png|ocr|manifest.webmanifest|sw.js|offline.html).*)"],
};
