import { PERFIL_USUARIO, type Usuario } from "@/types/usuario";

function adminAtivo(usuario: Pick<Usuario, "perfil" | "ativo">): boolean {
  return usuario.perfil === PERFIL_USUARIO.Administrador && usuario.ativo;
}

// A empresa precisa de ao menos um Administrador ativo. Serve só para orientar a tela: quem decide é a API,
// e a lista pode estar desatualizada.
export function ehUltimoAdminAtivo(usuario: Usuario, lista: Usuario[]): boolean {
  if (!adminAtivo(usuario)) {
    return false;
  }
  return lista.filter((item) => item.usuarioId !== usuario.usuarioId && adminAtivo(item)).length === 0;
}
