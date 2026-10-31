import { ApiError } from "./errors";

export type CampoAdesao = "cnpj" | "cpf" | "email";

export interface AlvoErro {
  etapa: 1 | 3;
  campo: CampoAdesao;
  rotulo: string;
}

export interface ErroAdesao {
  mensagem: string;
  alvo?: AlvoErro;
}

const ALVOS: Record<CampoAdesao, AlvoErro> = {
  cnpj: { etapa: 1, campo: "cnpj", rotulo: "CNPJ" },
  cpf: { etapa: 3, campo: "cpf", rotulo: "CPF" },
  email: { etapa: 3, campo: "email", rotulo: "e-mail" },
};

const PALAVRAS_CHAVE: { campo: CampoAdesao; padrao: RegExp }[] = [
  { campo: "cnpj", padrao: /cnpj/i },
  { campo: "cpf", padrao: /\bcpf\b/i },
  { campo: "email", padrao: /e-?mail/i },
];

// O formato de erro do backend ainda é pouco conhecido: a atribuição é por palavra-chave e isolada aqui, para
// ser trocada por um mapeamento por código quando o contrato existir.
function textosDoErro(error: ApiError): string[] {
  const { details } = error;
  const textos = [error.message];

  if (Array.isArray(details)) {
    for (const item of details) textos.push(item.code ?? "", item.message ?? "");
  } else if (details) {
    for (const [chave, mensagens] of Object.entries(details)) textos.push(chave, ...mensagens);
  }

  return textos;
}

export function atribuirErro(error: unknown): ErroAdesao {
  if (!(error instanceof Error)) {
    return { mensagem: "Ocorreu um erro inesperado." };
  }
  if (!(error instanceof ApiError) || error.kind !== "validation") {
    return { mensagem: error.message };
  }

  const texto = textosDoErro(error).join(" ");
  const encontrado = PALAVRAS_CHAVE.find(({ padrao }) => padrao.test(texto));

  return { mensagem: error.message, alvo: encontrado ? ALVOS[encontrado.campo] : undefined };
}
