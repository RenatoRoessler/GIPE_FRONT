import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLeitorPlaca } from "./useLeitorPlaca";

const reconhecer = vi.hoisted(() => vi.fn());
const encerrar = vi.hoisted(() => vi.fn());
const criarReconhecedorPlaca = vi.hoisted(() => vi.fn());
vi.mock("@/lib/ocrPlaca", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ocrPlaca")>()),
  criarReconhecedorPlaca,
}));

interface HarnessProps {
  ativo: boolean;
  onPlaca?: (placa: string) => void;
  tempoLimiteMs?: number;
}

function Harness({ ativo, onPlaca = () => {}, tempoLimiteMs }: HarnessProps) {
  const { videoRef, estado, contextoSeguro, iniciar } = useLeitorPlaca({
    ativo,
    onPlaca,
    tempoLimiteMs,
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
    </div>
  );
}

const stopTrack = vi.fn();
const getUserMedia = vi.fn();

function fakeStream() {
  return { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
}

beforeEach(() => {
  stopTrack.mockReset();
  encerrar.mockReset().mockResolvedValue(undefined);
  reconhecer.mockReset().mockResolvedValue("");
  criarReconhecedorPlaca.mockReset().mockResolvedValue({ reconhecer, encerrar });
  getUserMedia.mockReset().mockResolvedValue(fakeStream());
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(4);
  vi.spyOn(HTMLVideoElement.prototype, "videoWidth", "get").mockReturnValue(640);
  vi.spyOn(HTMLVideoElement.prototype, "videoHeight", "get").mockReturnValue(480);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
    getImageData: () => ({ data: new Uint8ClampedArray([10, 20, 30, 255, 200, 210, 220, 255]) }),
    putImageData: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const estado = () => screen.getByTestId("estado").textContent;

describe("useLeitorPlaca", () => {
  it("abre a câmera traseira, sem áudio, e passa a ler", async () => {
    render(<Harness ativo />);
    await waitFor(() => expect(estado()).toBe("lendo"));
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
});
