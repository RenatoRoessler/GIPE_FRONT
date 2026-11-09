import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { marcarExplicacaoCameraVista } from "@/lib/permissaoCamera";
import { useLeitorQr } from "./useLeitorQr";

const jsqrMock = vi.hoisted(() => vi.fn());
vi.mock("jsqr", () => ({ default: jsqrMock }));

function Harness({ ativo, onTexto }: { ativo: boolean; onTexto: (texto: string) => void }) {
  const { videoRef, estado, iniciar, permitir } = useLeitorQr({ ativo, onTexto });
  return (
    <div>
      <video ref={videoRef} data-testid="video" />
      <span data-testid="estado">{estado}</span>
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

function setBarcodeDetector(detect: () => Promise<{ rawValue: string }[]>) {
  class FakeDetector {
    detect = detect;
  }
  Object.defineProperty(window, "BarcodeDetector", { value: FakeDetector, configurable: true, writable: true });
}

beforeEach(() => {
  marcarExplicacaoCameraVista();
  stopTrack.mockReset();
  getUserMedia.mockReset().mockResolvedValue(fakeStream());
  Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(4);
  vi.spyOn(HTMLVideoElement.prototype, "videoWidth", "get").mockReturnValue(640);
  vi.spyOn(HTMLVideoElement.prototype, "videoHeight", "get").mockReturnValue(480);
  setBarcodeDetector(() => Promise.resolve([]));
});

afterEach(() => {
  window.localStorage.clear();
  Reflect.deleteProperty(navigator, "permissions");
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "BarcodeDetector");
});

const estado = () => screen.getByTestId("estado").textContent;

describe("useLeitorQr", () => {
  it("abre a câmera traseira, sem áudio, e passa a ler", async () => {
    render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(estado()).toBe("lendo"));
    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: { ideal: "environment" } }, audio: false });
  });

  it("não abre a câmera enquanto estiver inativo", async () => {
    render(<Harness ativo={false} onTexto={() => {}} />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(estado()).toBe("ocioso");
  });

  it("informa quando o navegador não tem câmera", async () => {
    Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
    render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(estado()).toBe("indisponivel"));
  });

  it("informa quando a permissão é negada", async () => {
    getUserMedia.mockRejectedValue(new DOMException("negado", "NotAllowedError"));
    render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(estado()).toBe("negada"));
  });

  it("volta a ocioso em outros erros e tenta de novo ao tocar", async () => {
    getUserMedia.mockRejectedValueOnce(new DOMException("ocupada", "NotReadableError"));
    render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(estado()).toBe("ocioso"));
    await act(async () => screen.getByRole("button", { name: "iniciar" }).click());
    await waitFor(() => expect(estado()).toBe("lendo"));
    expect(getUserMedia).toHaveBeenCalledTimes(2);
  });

  it("entrega o texto lido pelo BarcodeDetector", async () => {
    setBarcodeDetector(() => Promise.resolve([{ rawValue: "https://gipe.com.br/comprovante/7K3Q9X" }]));
    const onTexto = vi.fn();
    render(<Harness ativo onTexto={onTexto} />);
    await waitFor(() => expect(onTexto).toHaveBeenCalledWith("https://gipe.com.br/comprovante/7K3Q9X"));
  });

  it("usa o jsqr quando o navegador não tem BarcodeDetector", async () => {
    Reflect.deleteProperty(window, "BarcodeDetector");
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    } as unknown as CanvasRenderingContext2D);
    jsqrMock.mockReturnValue({ data: "7K3Q9X" });
    const onTexto = vi.fn();
    render(<Harness ativo onTexto={onTexto} />);
    await waitFor(() => expect(onTexto).toHaveBeenCalledWith("7K3Q9X"));
    expect(jsqrMock).toHaveBeenCalled();
  });

  it("ignora o mesmo texto repetido em sequência e aceita de novo depois do intervalo", async () => {
    let agora = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => agora);
    setBarcodeDetector(() => Promise.resolve([{ rawValue: "lixo" }]));
    const onTexto = vi.fn();
    render(<Harness ativo onTexto={onTexto} />);
    await waitFor(() => expect(onTexto).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(onTexto).toHaveBeenCalledTimes(1);

    agora += 2000;
    await waitFor(() => expect(onTexto).toHaveBeenCalledTimes(2));
  });

  it("para a câmera quando fica inativo", async () => {
    const { rerender } = render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(estado()).toBe("lendo"));
    rerender(<Harness ativo={false} onTexto={() => {}} />);
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect((screen.getByTestId("video") as HTMLVideoElement).srcObject).toBeNull();
    expect(estado()).toBe("ocioso");
  });

  it("para a câmera ao desmontar", async () => {
    const { unmount } = render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(estado()).toBe("lendo"));
    unmount();
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });

  it("libera a câmera que abriu depois de o leitor ser desativado", async () => {
    let liberar: (stream: MediaStream) => void = () => {};
    getUserMedia.mockReturnValue(new Promise<MediaStream>((resolve) => (liberar = resolve)));
    const { rerender } = render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(getUserMedia).toHaveBeenCalled());
    rerender(<Harness ativo={false} onTexto={() => {}} />);
    await act(async () => liberar(fakeStream()));
    expect(stopTrack).toHaveBeenCalledTimes(1);
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
    render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(estado()).toBe("explicando"));
    expect(getUserMedia).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "permitir" }));
    await waitFor(() => expect(estado()).toBe("lendo"));
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("sem a consulta de permissão (ex.: Safari) também explica na primeira vez e não repete depois", async () => {
    window.localStorage.clear();
    simularPermissao(null);
    const primeira = render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(estado()).toBe("explicando"));
    await userEvent.click(screen.getByRole("button", { name: "permitir" }));
    await waitFor(() => expect(estado()).toBe("lendo"));
    primeira.unmount();

    render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(estado()).toBe("lendo"));
  });

  it("com a permissão já concedida abre direto, sem explicar", async () => {
    window.localStorage.clear();
    simularPermissao("granted");
    render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(estado()).toBe("lendo"));
  });

  it("com a câmera marcada como bloqueada ainda tenta abrir; se o navegador recusar, vai para negada", async () => {
    simularPermissao("denied");
    getUserMedia.mockRejectedValueOnce(new DOMException("bloqueada", "NotAllowedError"));
    render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(estado()).toBe("negada"));
    expect(getUserMedia).toHaveBeenCalledTimes(1);

    // Liberada nos ajustes: Tentar de novo abre a câmera.
    simularPermissao("granted");
    await userEvent.click(screen.getByRole("button", { name: "iniciar" }));
    await waitFor(() => expect(estado()).toBe("lendo"));
  });

  it("consulta desatualizada (bloqueada, mas a câmera abre): abre normalmente, sem explicação", async () => {
    window.localStorage.clear();
    simularPermissao("denied");
    render(<Harness ativo onTexto={() => {}} />);
    await waitFor(() => expect(estado()).toBe("lendo"));
  });
});
