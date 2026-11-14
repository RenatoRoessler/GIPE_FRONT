import type { Servico } from "@/types/servico";
import { normalizarBusca } from "../catalogo";

export const NOME_REPETIDO = "Já existe um serviço ativo com esse nome. Use outro nome ou edite o existente.";

const comparavel = (nome: string) => normalizarBusca(nome).replace(/\s+/g, " ");

// O back recusa nome repetido entre os ativos. Conferir aqui, no catálogo já carregado, dá o aviso junto ao campo antes
// do envio; o erro do back continua valendo como rede de proteção (outra aba pode ter criado o mesmo nome). Sem acento,
// sem diferença de caixa e sem espaço sobrando; na edição, o próprio serviço não conta.
export function nomeJaExiste(nome: string, servicos: Servico[], idEditando?: number): boolean {
  const procurado = comparavel(nome);
  if (procurado === "") return false;
  return servicos.some((servico) => servico.ativo && servico.id !== idEditando && comparavel(servico.nome) === procurado);
}
