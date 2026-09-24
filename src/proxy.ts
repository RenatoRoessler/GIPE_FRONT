import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const hasToken = request.cookies.has(AUTH_COOKIE_NAME);

  if (!hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/precos/:path*",
    "/usuarios/:path*",
    "/usuario/:path*",
    "/veiculos/:path*",
    "/relatorios/:path*",
  ],
};
