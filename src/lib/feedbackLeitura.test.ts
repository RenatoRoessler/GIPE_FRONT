import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const oscilador = { frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
const ganho = { gain: { value: 0 }, connect: vi.fn() };
const resume = vi.fn().mockResolvedValue(undefined);
const criados = vi.hoisted(() => ({ contextos: 0 }));

function FakeAudioContext(this: Record<string, unknown>) {
  criados.contextos += 1;
  this.state = "running";
  this.currentTime = 1;
  this.destination = {};
  this.createOscillator = () => oscilador;
  this.createGain = () => ganho;
  this.resume = resume;
}

beforeEach(() => {
  vi.resetModules();
  criados.contextos = 0;
  oscilador.connect.mockReset();
  oscilador.start.mockReset();
  oscilador.stop.mockReset();
  ganho.connect.mockReset();
  resume.mockClear();
  vi.stubGlobal("AudioContext", FakeAudioContext);
  Object.defineProperty(navigator, "vibrate", { value: vi.fn().mockReturnValue(true), configurable: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "vibrate");
});

async function carregar() {
  return import("./feedbackLeitura");
}

describe("confirmarLeitura", () => {
  it("vibra uma vez, curto, e toca um bip curto", async () => {
    const { confirmarLeitura } = await carregar();

    confirmarLeitura();

    expect(navigator.vibrate).toHaveBeenCalledTimes(1);
    expect(navigator.vibrate).toHaveBeenCalledWith(80);
    expect(oscilador.start).toHaveBeenCalledTimes(1);
    expect(oscilador.stop).toHaveBeenCalledWith(1 + 0.08);
    expect(oscilador.frequency.value).toBe(880);
    expect(ganho.gain.value).toBeGreaterThan(0);
    expect(ganho.gain.value).toBeLessThan(0.5);
  });

  it("reaproveita o mesmo contexto de áudio nas leituras seguintes", async () => {
    const { confirmarLeitura } = await carregar();
    confirmarLeitura();
    confirmarLeitura();
    expect(criados.contextos).toBe(1);
  });

  it("retoma o áudio quando o navegador o deixou suspenso", async () => {
    function Suspenso(this: Record<string, unknown>) {
      FakeAudioContext.call(this);
      this.state = "suspended";
    }
    vi.stubGlobal("AudioContext", Suspenso);
    const { confirmarLeitura } = await carregar();

    confirmarLeitura();

    expect(resume).toHaveBeenCalledTimes(1);
  });

  it("sem vibração no aparelho ainda toca o bip", async () => {
    Reflect.deleteProperty(navigator, "vibrate");
    const { confirmarLeitura } = await carregar();
    expect(() => confirmarLeitura()).not.toThrow();
    expect(oscilador.start).toHaveBeenCalledTimes(1);
  });

  it("sem áudio no aparelho ainda vibra, sem erro", async () => {
    vi.stubGlobal("AudioContext", undefined);
    const { confirmarLeitura } = await carregar();
    expect(() => confirmarLeitura()).not.toThrow();
    expect(navigator.vibrate).toHaveBeenCalledWith(80);
  });

  it("falha do navegador ao vibrar ou tocar não derruba a leitura", async () => {
    Object.defineProperty(navigator, "vibrate", {
      value: vi.fn(() => {
        throw new Error("bloqueado");
      }),
      configurable: true,
    });
    oscilador.start.mockImplementation(() => {
      throw new Error("sem áudio");
    });
    const { confirmarLeitura } = await carregar();
    expect(() => confirmarLeitura()).not.toThrow();
    oscilador.start.mockReset();
  });
});

describe("leituraDuvidosa", () => {
  it("vibra duas vezes e não toca som", async () => {
    const { leituraDuvidosa } = await carregar();

    leituraDuvidosa();

    expect(navigator.vibrate).toHaveBeenCalledTimes(1);
    expect(navigator.vibrate).toHaveBeenCalledWith([80, 80, 80]);
    expect(oscilador.start).not.toHaveBeenCalled();
    expect(criados.contextos).toBe(0);
  });

  it("sem vibração no aparelho não faz nada nem dá erro", async () => {
    Reflect.deleteProperty(navigator, "vibrate");
    const { leituraDuvidosa } = await carregar();
    expect(() => leituraDuvidosa()).not.toThrow();
  });
});
