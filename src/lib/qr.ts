const TOKEN = /^[A-Za-z0-9]{4,32}$/;
const COMPROVANTE_SEGMENT = "comprovante";

// O QR do cupom de entrada traz o link `.../comprovante/<token>`; também aceita o token solto.
export function extrairTokenComprovante(texto: string): string | null {
  const value = String(texto ?? "").trim();
  if (TOKEN.test(value)) {
    return value;
  }

  let pathname: string;
  try {
    pathname = new URL(value).pathname;
  } catch {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const last = segments.at(-1);
  if (last === undefined || segments.at(-2) !== COMPROVANTE_SEGMENT) {
    return null;
  }
  const token = decodeURIComponent(last);
  return TOKEN.test(token) ? token : null;
}
