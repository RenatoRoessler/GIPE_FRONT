export const AUTH_COOKIE_NAME = "gipe_token";

// Secure só em HTTPS (em http://localhost de desenvolvimento o navegador descartaria o cookie).
// SameSite=Lax barra o envio em requisições de outros sites sem quebrar links abertos de e-mails.
function attributes(maxAge: number): string {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  return `; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function saveToken(token: string): void {
  document.cookie = `${AUTH_COOKIE_NAME}=${token}${attributes(60 * 60 * 8)}`;
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`));
  return match ? match.slice(AUTH_COOKIE_NAME.length + 1) || null : null;
}

export function clearToken(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=${attributes(0)}`;
}
