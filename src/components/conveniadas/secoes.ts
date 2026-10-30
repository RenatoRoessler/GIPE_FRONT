import { conveniadaSchema } from "@/lib/schemas/conveniada";
import type { ConveniadaFormValues } from "@/types/conveniada";

export type SecaoConveniada = "empresa" | "responsavel";

// Os campos do responsável são os com prefixo `usuario`; todo o resto é da empresa.
export function secaoDoCampo(campo: string): SecaoConveniada {
  return campo.startsWith("usuario") ? "responsavel" : "empresa";
}

// Uma seção está completa quando nenhum erro do schema cai em campo dela.
export function secaoCompleta(values: ConveniadaFormValues, secao: SecaoConveniada): boolean {
  const result = conveniadaSchema.safeParse(values);
  if (result.success) return true;
  return !result.error.issues.some((issue) => secaoDoCampo(String(issue.path[0])) === secao);
}
