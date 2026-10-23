import { getToken } from "@/lib/auth";
import { isPerfilUsuario, PERFIL_USUARIO, type PerfilUsuario } from "@/types/usuario";

const CLAIM = {
  email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  role: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
} as const;

export type Session = {
  name: string;
  email: string;
  // null quando a role do token não é uma das conhecidas.
  perfil: PerfilUsuario | null;
};

// A role do token vem como número do perfil (ex.: "1") ou, em tokens antigos, pelo nome (ex.: "Administrador").
const PERFIL_POR_ROLE: Record<string, PerfilUsuario> = {
  Administrador: PERFIL_USUARIO.Administrador,
  Gerente: PERFIL_USUARIO.Gerente,
  Manobrista: PERFIL_USUARIO.Manobrista,
  Caixa: PERFIL_USUARIO.Caixa,
  AdministradorConveniada: PERFIL_USUARIO.AdministradorConveniada,
  GerenteConveniada: PERFIL_USUARIO.GerenteConveniada,
  UsuarioConveniada: PERFIL_USUARIO.UsuarioConveniada,
  Financeiro: PERFIL_USUARIO.Financeiro,
};

function perfilDeUmaRole(role: unknown): PerfilUsuario | null {
  if (typeof role === "number") {
    return isPerfilUsuario(role) ? role : null;
  }
  if (typeof role !== "string") {
    return null;
  }
  const valor = role.trim();
  if (/^\d+$/.test(valor)) {
    const numero = Number(valor);
    return isPerfilUsuario(numero) ? numero : null;
  }
  return PERFIL_POR_ROLE[valor] ?? null;
}

// O token pode trazer várias roles (array): vale a primeira que o sistema reconhece.
export function perfilDaRole(role: unknown): PerfilUsuario | null {
  const roles = Array.isArray(role) ? role : [role];
  for (const item of roles) {
    const perfil = perfilDeUmaRole(item);
    if (perfil !== null) {
      return perfil;
    }
  }
  return null;
}

function decodePayload(token: string): Record<string, unknown> | null {
  const part = token.split(".")[1];
  if (!part) {
    return null;
  }
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// Só leitura das claims para a interface: a assinatura é validada pelo back em cada chamada.
export function parseSession(token: string | null): Session | null {
  if (!token) {
    return null;
  }
  const payload = decodePayload(token);
  if (!payload) {
    return null;
  }
  const email = text(payload[CLAIM.email]);
  const name = text(payload[CLAIM.name]) || email;
  if (!email && !name) {
    return null;
  }
  return { name, email, perfil: perfilDaRole(payload[CLAIM.role]) };
}

export function getSession(): Session | null {
  return parseSession(getToken());
}
