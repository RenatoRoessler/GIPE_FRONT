import type { PerfilUsuario } from "./usuario";

export type CurrentUser = {
  id: string;
  name: string;
  email?: string;
  // null quando a role do token não é conhecida.
  perfil?: PerfilUsuario | null;
};
