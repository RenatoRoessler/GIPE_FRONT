import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { ApiError, isForbiddenError, normalizeError } from "./errors";

function axiosError(status: number, data: unknown): AxiosError {
  const response = { status, data } as AxiosResponse;
  return new AxiosError("falhou", "ERR_BAD_REQUEST", undefined, undefined, response);
}

describe("normalizeError", () => {
  it("lê `message` (formato antigo)", () => {
    const error = normalizeError(axiosError(400, { message: "Mensagem antiga" }));
    expect(error.message).toBe("Mensagem antiga");
    expect(error.kind).toBe("validation");
  });

  it("lê `detail` quando não há `message`", () => {
    const error = normalizeError(axiosError(400, { detail: "Token inválido." }));
    expect(error.message).toBe("Token inválido.");
  });

  it("lê errors[0].message quando `errors` é um array", () => {
    const body = { errors: [{ code: "NOT_FOUND", message: "Contrato não encontrado." }] };
    const error = normalizeError(axiosError(404, body));
    expect(error.message).toBe("Contrato não encontrado.");
    expect(error.kind).toBe("not_found");
    expect(error.details).toEqual(body.errors);
  });

  it("lê erros[0].mensagem (401)", () => {
    const error = normalizeError(axiosError(401, { erros: [{ mensagem: "Token inválido ou não informado." }] }));
    expect(error.message).toBe("Token inválido ou não informado.");
    expect(error.kind).toBe("unauthorized");
  });

  it("mantém o formato antigo de `errors` (Record)", () => {
    const errors = { documento: ["Documento inválido"] };
    const error = normalizeError(axiosError(400, { errors }));
    expect(error.details).toEqual(errors);
    expect(error.message).toBe("Os dados enviados são inválidos.");
  });

  it("prefere message > detail > errors > erros", () => {
    const body = { message: "a", detail: "b", errors: [{ message: "c" }], erros: [{ mensagem: "d" }] };
    expect(normalizeError(axiosError(400, body)).message).toBe("a");
    expect(normalizeError(axiosError(400, { ...body, message: "" })).message).toBe("b");
    expect(normalizeError(axiosError(400, { ...body, message: "", detail: "" })).message).toBe("c");
  });

  it("classifica 429 como rate_limited com mensagem própria", () => {
    const error = normalizeError(axiosError(429, ""));
    expect(error.kind).toBe("rate_limited");
    expect(error.message).toBe("Muitas tentativas. Aguarde um pouco e tente de novo.");
  });

  it("403 sempre usa o texto padrão de permissão, mesmo com mensagem do back", () => {
    const error = normalizeError(axiosError(403, { message: "Forbidden: policy Caixa.Sangria" }));
    expect(error.kind).toBe("forbidden");
    expect(error.message).toBe("Você não tem permissão para realizar esta ação.");
  });

  it("isForbiddenError só vale para ApiError de permissão", () => {
    expect(isForbiddenError(new ApiError("forbidden"))).toBe(true);
    expect(isForbiddenError(new ApiError("server"))).toBe(false);
    expect(isForbiddenError(new Error("x"))).toBe(false);
  });

  it("usa a mensagem padrão do kind sem corpo útil", () => {
    expect(normalizeError(axiosError(500, "<html>")).message).toBe("Erro no servidor. Tente novamente em instantes.");
  });

  it("devolve o mesmo ApiError sem reembrulhar", () => {
    const original = new ApiError("forbidden");
    expect(normalizeError(original)).toBe(original);
  });
});
