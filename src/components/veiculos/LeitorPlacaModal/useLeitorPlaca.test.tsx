import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { marcarExplicacaoCameraVista } from "@/lib/permissaoCamera";
import { useLeitorPlaca } from "./useLeitorPlaca";

const reconhecer = vi.hoisted(() => vi.fn());
const encerrar = vi.hoisted(() => vi.fn());
const criarReconhecedorPlaca = vi.hoisted(() => vi.fn());
vi.mock("@/lib/reconhecedorPlaca", () => ({ criarReconhecedorPlaca }));

interface HarnessProps {
  ativo: boolean;
  onPlaca?: (placa: string) => void;
  tempoLimiteMs?: number;
  continuo?: boolean;
}

function Harness({ ativo, onPlaca = () => {}, tempoLimiteMs, continuo }: HarnessProps) {
  const { videoRef, estado, contextoSeguro, iniciar, permitir } = useLeitorPlaca({
    ativo,
    onPlaca,
    tempoLimiteMs,
    continuo,
    intervaloMs: 5,
  });
  return (
    <div>
      <video ref={videoRef} data-testid="video" />
      <span data-testid="estado">{estado}</span>
      <span data-testid="seguro">{String(contextoSeguro)}</span>
      <button type="button" onClick={iniciar}>
        iniciar
      </button>
      <button type="button" onClick={permitir}>
        permitir
      </button>
    </div>
  );
}

const stopTrack = vi.fn();
const getUserMedia = vi.fn();

function fakeStream() {
  return { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
}

beforeEach(() => {
  marcarExplicacaoCameraVista();
  stopTrack.mockReset();
  encerrar.mockReset().mockResolvedValue(undefined);
  reconhecer.mockReset().mockResolvedValue("");
  criarReconhecedorPlaca.mockReset().mockResolvedValue({ reconhecer, encerrar });
  getUserMedia.mockReset().mockResolvedValue(fakeStream());
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(4);
});

afterEach(() => {
  window.localStorage.clear();
  Reflect.deleteProperty(navigator, "permissions");
  vi.restoreAllMocks();
});

const estado = () => screen.getByTestId("estado").textContent;

describe("useLeitorPlaca", () => {
  it("abre a câmera traseira, sem áudio, e passa a ler o vídeo", async () => {
    render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("lendo"));
    await waitFor(() => expect(reconhecer).toHaveBeenCalled());
    expect(reconhecer.mock.calls[0][0]).toBe(screen.getByTestId("video"));
    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: { ideal: "environment" } }, audio: false });
    expect(criarReconhecedorPlaca).toHaveBeenCalledTimes(1);
  });

  it("não abre a câmera enquanto estiver inativo", async () => {
    render(<Harness ativo={false} />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(estado()).toBe("ocioso");
  });

  it("entrega a placa só depois de duas leituras iguais seguidas e libera tudo", async () => {
    reconhecer.mockResolvedValue("ABC1D23\n");
    const onPlaca = vi.fn();
    render(<Harness ativo onPlaca={onPlaca} />);
    await waitFor(() => expect(onPlaca).toHaveBeenCalledWith("ABC1D23"));
    expect(onPlaca).toHaveBeenCalledTimes(1);
    expect(reconhecer.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(encerrar).toHaveBeenCalledTimes(1);
  });

  it("ignora texto que não é placa e não confirma leituras diferentes", async () => {
    reconhecer
      .mockResolvedValueOnce("ABC1D23")
      .mockResolvedValueOnce("ruído")
      .mockResolvedValueOnce("ABC1D23")
      .mockResolvedValue("XYZ9K88");
    const onPlaca = vi.fn();
    render(<Harness ativo onPlaca={onPlaca} />);
    await waitFor(() => expect(onPlaca).toHaveBeenCalledWith("XYZ9K88"));
    expect(onPlaca).toHaveBeenCalledTimes(1);
  });

  it("informa quando o navegador não tem câmera", async () => {
    Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
    render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("indisponivel"));
    expect(screen.getByTestId("seguro")).toHaveTextContent("true");
  });

  it("diferencia a falta de conexão segura", async () => {
    Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
    Object.defineProperty(window, "isSecureContext", { value: false, configurable: true });
    render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("indisponivel"));
    expect(screen.getByTestId("seguro")).toHaveTextContent("false");
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
  });

  it("informa quando a permissão é negada", async () => {
    getUserMedia.mockRejectedValue(new DOMException("negado", "NotAllowedError"));
    render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("negada"));
  });

  it("fica indisponível quando a câmera não abre por outro motivo", async () => {
    getUserMedia.mockRejectedValue(new DOMException("ocupada", "NotReadableError"));
    render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("indisponivel"));
  });

  it("fica indisponível, sem deixar a câmera ligada, se o OCR não carregar", async () => {
    criarReconhecedorPlaca.mockRejectedValue(new Error("falhou"));
    render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("indisponivel"));
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });

  it("desiste depois do tempo limite sem placa e permite tentar de novo", async () => {
    render(<Harness ativo tempoLimiteMs={40} />);
    await waitFor(() => expect(estado()).toBe("sem-leitura"));
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(encerrar).toHaveBeenCalledTimes(1);

    await act(async () => screen.getByRole("button", { name: "iniciar" }).click());
    await waitFor(() => expect(estado()).toBe("lendo"));
    expect(getUserMedia).toHaveBeenCalledTimes(2);
  });

  it("para a câmera e o OCR quando fica inativo", async () => {
    const { rerender } = render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("lendo"));
    rerender(<Harness ativo={false} />);
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(encerrar).toHaveBeenCalledTimes(1);
    expect((screen.getByTestId("video") as HTMLVideoElement).srcObject).toBeNull();
    expect(estado()).toBe("ocioso");
  });

  it("para a câmera e o OCR ao desmontar", async () => {
    const { unmount } = render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("lendo"));
    unmount();
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(encerrar).toHaveBeenCalledTimes(1);
  });

  it("libera a câmera e o OCR que abriram depois de o leitor ser desativado", async () => {
    let liberar: (stream: MediaStream) => void = () => {};
    getUserMedia.mockReturnValue(new Promise<MediaStream>((resolve) => (liberar = resolve)));
    const { rerender } = render(<Harness ativo />);
    await waitFor(() => expect(getUserMedia).toHaveBeenCalled());
    rerender(<Harness ativo={false} />);
    await act(async () => liberar(fakeStream()));
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(encerrar).toHaveBeenCalledTimes(1);
  });

  describe("modo contínuo", () => {
    it("segue lendo depois da primeira placa, com a câmera ligada", async () => {
      reconhecer.mockResolvedValue("ABC1D23\n");
      const onPlaca = vi.fn();
      render(<Harness ativo continuo onPlaca={onPlaca} />);

      await waitFor(() => expect(onPlaca.mock.calls.length).toBeGreaterThanOrEqual(2));
      expect(onPlaca).toHaveBeenCalledWith("ABC1D23");
      expect(estado()).toBe("lendo");
      expect(stopTrack).not.toHaveBeenCalled();
    });

    it("cada placa lida recomeça o tempo limite; sem placas, a câmera desiste", async () => {
      reconhecer.mockResolvedValue("ABC1D23\n");
      const onPlaca = vi.fn();
      render(<Harness ativo continuo onPlaca={onPlaca} tempoLimiteMs={120} />);

      // Lê placas por mais tempo que o limite sem desistir.
      await waitFor(() => expect(onPlaca.mock.calls.length).toBeGreaterThanOrEqual(2));
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(estado()).toBe("lendo");

      // Sem mais placas, passado o limite, para e libera a câmera.
      reconhecer.mockResolvedValue("");
      await waitFor(() => expect(estado()).toBe("sem-leitura"), { timeout: 1000 });
      expect(stopTrack).toHaveBeenCalled();
    });

    it("sem a opção, para na primeira placa (comportamento padrão)", async () => {
      reconhecer.mockResolvedValue("ABC1D23\n");
      const onPlaca = vi.fn();
      render(<Harness ativo onPlaca={onPlaca} />);

      await waitFor(() => expect(onPlaca).toHaveBeenCalledTimes(1));
      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(onPlaca).toHaveBeenCalledTimes(1);
      expect(stopTrack).toHaveBeenCalled();
    });
  });
});

describe("permissão da câmera", () => {
  function simularPermissao(state: PermissionState | null) {
    Object.defineProperty(navigator, "permissions", {
      value: state === null ? undefined : { query: vi.fn().mockResolvedValue({ state }) },
      configurable: true,
    });
  }

  it("na primeira vez, antes do pedido do navegador, explica e espera o usuário permitir", async () => {
    window.localStorage.clear();
    simularPermissao("prompt");
    render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("explicando"));
    expect(getUserMedia).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "permitir" }));
    await waitFor(() => expect(estado()).toBe("lendo"));
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("sem a consulta de permissão (ex.: Safari) também explica na primeira vez e não repete depois", async () => {
    window.localStorage.clear();
    simularPermissao(null);
    const primeira = render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("explicando"));
    await userEvent.click(screen.getByRole("button", { name: "permitir" }));
    await waitFor(() => expect(estado()).toBe("lendo"));
    primeira.unmount();

    render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("lendo"));
  });

  it("com a permissão já concedida abre direto, sem explicar", async () => {
    window.localStorage.clear();
    simularPermissao("granted");
    render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("lendo"));
  });

  it("com a câmera bloqueada nem tenta abrir: vai para negada, e Tentar de novo vale depois de liberar", async () => {
    simularPermissao("denied");
    render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("negada"));
    expect(getUserMedia).not.toHaveBeenCalled();

    simularPermissao("granted");
    await userEvent.click(screen.getByRole("button", { name: "iniciar" }));
    await waitFor(() => expect(estado()).toBe("lendo"));
  });
});
