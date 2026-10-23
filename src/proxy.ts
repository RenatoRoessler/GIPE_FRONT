import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { areaDaRota, podeAcessar } from "@/lib/permissoes";
import { parseSession } from "@/lib/session";

// Únicas rotas acessíveis sem login: a adesão, o fluxo de acesso (login, recuperação de senha e primeiro acesso), o comprovante e o
// recibo do cliente (abertos pelo QR) e o contrato do mensalista (aceite pelo link do e-mail).
const PUBLIC_PATHS = ["/adesao", "/login", "/recuperar-senha", "/alterar-senha", "/primeiro-acesso", "/comprovante", "/recibo", "/contrato"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return isPublicPath(pathname) ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));
  }

  // Só barra a área que o perfil não pode abrir; a assinatura do token é validada pelo back em cada chamada.
  // Token ilegível ou sem role conhecida vale como perfil nulo, que só acessa o início.
  const area = areaDaRota(pathname);
  if (area && !podeAcessar(parseSession(token)?.perfil, area)) {
    return NextResponse.redirect(new URL("/acesso-negado", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Todas as rotas, exceto arquivos estáticos, public/assets (a logo aparece na adesão, sem login) e os arquivos do PWA
  // (manifest, service worker, ícones e página offline) e do OCR da placa (public/ocr), que o navegador busca sem cookie.
  matcher: ["/((?!_next/static|_next/image|assets|icons|favicon.ico|icon.png|ocr|manifest.webmanifest|sw.js|offline.html).*)"],
};
