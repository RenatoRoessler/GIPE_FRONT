export const AUTH_COOKIE_NAME = "gipe_token";

export function saveToken(token: string): void {
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 8}`;
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`));
  return match ? match.slice(AUTH_COOKIE_NAME.length + 1) || null : null;
}

export function clearToken(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
}
