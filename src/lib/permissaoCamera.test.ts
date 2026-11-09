import { afterEach, describe, expect, it, vi } from "vitest";
import {
  consultarPermissaoCamera,
  detectarNavegador,
  explicacaoCameraVista,
  marcarExplicacaoCameraVista,
  passosParaLiberarCamera,
} from "./permissaoCamera";

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("consultarPermissaoCamera", () => {
  it("devolve o estado informado pelo navegador", async () => {
    vi.stubGlobal("navigator", { permissions: { query: vi.fn().mockResolvedValue({ state: "denied" }) } });
    expect(await consultarPermissaoCamera()).toBe("denied");
  });

  it("sem a consulta, ou se ela falhar, devolve desconhecida", async () => {
    vi.stubGlobal("navigator", {});
    expect(await consultarPermissaoCamera()).toBe("desconhecida");
    vi.stubGlobal("navigator", { permissions: { query: vi.fn().mockRejectedValue(new TypeError("camera")) } });
    expect(await consultarPermissaoCamera()).toBe("desconhecida");
  });
});

describe("explicação vista", () => {
  it("começa não vista e lembra depois de marcada", () => {
    expect(explicacaoCameraVista()).toBe(false);
    marcarExplicacaoCameraVista();
    expect(explicacaoCameraVista()).toBe(true);
  });
});

describe("navegador e passos", () => {
  const IPHONE_SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
  const IPHONE_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120.0 Mobile/15E148 Safari/604.1";
  const ANDROID_CHROME = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36";

  it("reconhece o navegador", () => {
    expect(detectarNavegador(IPHONE_SAFARI)).toBe("ios-safari");
    expect(detectarNavegador(IPHONE_CHROME)).toBe("ios-chrome");
    expect(detectarNavegador(ANDROID_CHROME)).toBe("chrome");
    expect(detectarNavegador("Mozilla/5.0 Firefox/120.0")).toBe("firefox");
    expect(detectarNavegador("algo estranho")).toBe("outro");
  });

  it("dá os passos do caminho de cada navegador", () => {
    expect(passosParaLiberarCamera(IPHONE_SAFARI)[0]).toMatch(/aA/);
    expect(passosParaLiberarCamera(ANDROID_CHROME)[0]).toMatch(/cadeado/);
  });
});
