import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearPasswordChange,
  getPasswordChange,
  setPasswordChange,
  subscribePasswordChange,
} from "./passwordChangeSession";

const dados = { token: "abc", senhaAtual: "Temp@1234" };

afterEach(() => {
  clearPasswordChange();
});

describe("passwordChangeSession", () => {
  it("começa vazio", () => {
    expect(getPasswordChange()).toBeNull();
  });

  it("guarda e limpa o token e a senha temporária", () => {
    setPasswordChange(dados);
    expect(getPasswordChange()).toEqual(dados);
    clearPasswordChange();
    expect(getPasswordChange()).toBeNull();
  });

  it("devolve a mesma referência enquanto nada muda", () => {
    setPasswordChange(dados);
    expect(getPasswordChange()).toBe(getPasswordChange());
  });

  it("avisa quem assina ao guardar e ao limpar, e para de avisar depois de cancelar", () => {
    const listener = vi.fn();
    const cancelar = subscribePasswordChange(listener);
    setPasswordChange(dados);
    clearPasswordChange();
    expect(listener).toHaveBeenCalledTimes(2);
    cancelar();
    setPasswordChange(dados);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("limpar sem nada guardado não avisa ninguém", () => {
    const listener = vi.fn();
    const cancelar = subscribePasswordChange(listener);
    clearPasswordChange();
    expect(listener).not.toHaveBeenCalled();
    cancelar();
  });

  it("não grava token nem senha em cookie ou storage", () => {
    setPasswordChange({ token: "segredo-token", senhaAtual: "segredo-senha" });
    const tudo = [document.cookie, JSON.stringify({ ...localStorage }), JSON.stringify({ ...sessionStorage })].join();
    expect(tudo).not.toContain("segredo-token");
    expect(tudo).not.toContain("segredo-senha");
  });
});
