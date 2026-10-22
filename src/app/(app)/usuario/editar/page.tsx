import { redirect } from "next/navigation";

// A troca da própria senha agora é um modal no menu do usuário; a gestão de outros usuários fica em /usuarios.
export default function EditarUsuarioPage() {
  redirect("/usuarios");
}
