import type { ConveniadaResultado } from "@/types/conveniada";

type Resultado = Pick<ConveniadaResultado, "novaEmpresa" | "novoUsuario">;

// A resposta não diz se o convênio foi reativado; a primeira frase fala só de empresa e convênio.
export function mensagemCadastro({ novaEmpresa, novoUsuario }: Resultado): string {
  const empresa = novaEmpresa
    ? "Empresa cadastrada e convênio registrado."
    : "Empresa já cadastrada: dados mantidos e convênio registrado.";
  const responsavel = novoUsuario
    ? "O acesso foi enviado por e-mail ao responsável."
    : "O usuário já cadastrado ganhou acesso a esta conveniada.";
  return `${empresa} ${responsavel}`;
}

// O resultado volta para a listagem em `?cadastro=` (só flags, nenhum dado pessoal).
export function cadastroParam({ novaEmpresa, novoUsuario }: Resultado): string {
  return `${novaEmpresa ? 1 : 0}${novoUsuario ? 1 : 0}`;
}

export function parseCadastroParam(value: string | null): Resultado | null {
  if (value === null || !/^[01]{2}$/.test(value)) {
    return null;
  }
  return { novaEmpresa: value[0] === "1", novoUsuario: value[1] === "1" };
}
