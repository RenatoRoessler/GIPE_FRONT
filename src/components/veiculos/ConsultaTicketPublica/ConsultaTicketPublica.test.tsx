import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TecladoProvider } from "@/components/teclado";
import { MEDIA_TOQUE } from "@/components/teclado/useTecladoCampo";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { ComprovantePorPlaca } from "@/types/veiculo";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/ticket/guid" }));
vi.mock("@/lib/api/services/patio", () => ({ consultarComprovantePorPlaca: vi.fn() }));

import { consultarComprovantePorPlaca } from "@/lib/api/services/patio";
import { ConsultaTicketPublica, LinkInvalido } from "./ConsultaTicketPublica";

const GUID = "3f2b8c1e-0000-4000-8000-000000000001";
const comprovante = { token: "P8WRVRQW", placa: "QQQ5Z88" } as ComprovantePorPlaca;

function abrir() {
  return renderWithProviders(<ConsultaTicketPublica empresaGuid={GUID} />);
}

async function buscar(placa: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Placa do veículo"), placa);
  await user.click(screen.getByRole("button", { name: /Buscar|Tentar novamente/ }));
  return user;
}

describe("ConsultaTicketPublica", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mostra o título, o campo de placa e o botão Buscar", () => {
    abrir();

    expect(screen.getByRole("heading", { level: 1, name: "Consulte seu ticket" })).toBeInTheDocument();
    expect(screen.getByLabelText("Placa do veículo")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Buscar" })).toBeEnabled();
  });

  it("normaliza a placa (minúscula, hífen e espaço) antes de consultar", async () => {
    vi.mocked(consultarComprovantePorPlaca).mockResolvedValue(comprovante);
    abrir();

    await buscar("qqq-5z 88");

    await waitFor(() => expect(consultarComprovantePorPlaca).toHaveBeenCalledWith(GUID, "QQQ5Z88"));
  });

  it("placa colada de uma vez, com hífen, não perde o último caractere", async () => {
    abrir();
    const user = userEvent.setup();
    const campo = screen.getByLabelText("Placa do veículo");

    await user.click(campo);
    await user.paste("QQQ-5Z88");

    expect(campo).toHaveValue("QQQ5Z88");
  });

  it("encontrando o veículo, abre o comprovante com o token", async () => {
    vi.mocked(consultarComprovantePorPlaca).mockResolvedValue({ ...comprovante, token: "AB/12" });
    abrir();

    await buscar("QQQ5Z88");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/comprovante/AB%2F12"));
    // Segue ocupado até a página trocar, sem mostrar o formulário parado.
    expect(screen.getByRole("button", { name: "Buscando..." })).toBeDisabled();
  });

  it.each([[""], ["QQQ"], ["QQQ5Z8"]])("placa incompleta (%j) mostra o motivo, foca o campo e não consulta", async (digitada) => {
    abrir();
    const user = userEvent.setup();
    if (digitada) await user.type(screen.getByLabelText("Placa do veículo"), digitada);

    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Informe a placa completa, com 7 caracteres.");
    expect(screen.getByLabelText("Placa do veículo")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Placa do veículo")).toHaveFocus();
    expect(consultarComprovantePorPlaca).not.toHaveBeenCalled();
  });

  it("digitar de novo limpa o motivo da placa incompleta", async () => {
    abrir();
    const user = await buscar("QQ");
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Placa do veículo"), "Q");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("enquanto busca, o botão fica ocupado e a busca é anunciada", async () => {
    vi.mocked(consultarComprovantePorPlaca).mockReturnValue(new Promise(() => {}));
    abrir();

    await buscar("QQQ5Z88");

    expect(await screen.findByRole("button", { name: "Buscando..." })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Buscando ticket");
    expect(consultarComprovantePorPlaca).toHaveBeenCalledTimes(1);
  });

  it("404 mostra 'Ticket não encontrado' no cartão e mantém a placa", async () => {
    vi.mocked(consultarComprovantePorPlaca).mockRejectedValue(new ApiError("not_found", "Ticket não encontrado.", 404));
    abrir();

    await buscar("QQQ5Z88");

    expect(await screen.findByRole("alert")).toHaveTextContent("Ticket não encontrado");
    expect(screen.getByRole("alert")).toHaveTextContent("Confira a placa digitada");
    expect(screen.getByLabelText("Placa do veículo")).toHaveValue("QQQ5Z88");
    expect(screen.getByRole("button", { name: "Buscar" })).toBeEnabled();
    expect(push).not.toHaveBeenCalled();
  });

  it("falha de rede ou do servidor oferece tentar de novo e mantém a placa", async () => {
    vi.mocked(consultarComprovantePorPlaca).mockRejectedValueOnce(new ApiError("network"));
    abrir();
    const user = await buscar("QQQ5Z88");

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível consultar");
    expect(screen.getByLabelText("Placa do veículo")).toHaveValue("QQQ5Z88");

    vi.mocked(consultarComprovantePorPlaca).mockResolvedValueOnce(comprovante);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/comprovante/P8WRVRQW"));
    expect(consultarComprovantePorPlaca).toHaveBeenCalledTimes(2);
  });

  it("resposta sem token vira falha de consulta, sem navegar", async () => {
    vi.mocked(consultarComprovantePorPlaca).mockResolvedValue({ ...comprovante, token: "" });
    abrir();

    await buscar("QQQ5Z88");

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível consultar");
    expect(push).not.toHaveBeenCalled();
  });

  it("editar a placa depois do erro some com a mensagem", async () => {
    vi.mocked(consultarComprovantePorPlaca).mockRejectedValue(new ApiError("not_found", undefined, 404));
    abrir();
    const user = await buscar("QQQ5Z88");
    await screen.findByRole("alert");

    await user.type(screen.getByLabelText("Placa do veículo"), "{Backspace}");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

function simularToque(ativo: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: ativo && query === MEDIA_TOQUE,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe("ConsultaTicketPublica: teclado de placa", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  function abrirComTeclado() {
    return renderWithProviders(
      <TecladoProvider>
        <ConsultaTicketPublica empresaGuid={GUID} />
      </TecladoProvider>,
    );
  }

  it("em aparelho de toque abre o mesmo teclado de placa da entrada e digita pelas teclas", () => {
    simularToque(true);
    abrirComTeclado();
    const campo = screen.getByLabelText("Placa do veículo");

    expect(campo).toHaveAttribute("inputmode", "none");
    act(() => campo.focus());
    expect(screen.getByRole("group", { name: "Teclado de placa" })).toBeInTheDocument();

    for (const tecla of ["q", "q", "q", "5", "z"]) {
      fireEvent.click(screen.getByRole("button", { name: tecla.toUpperCase() }));
    }

    expect(campo).toHaveValue("QQQ5Z");
  });

  it("no computador não abre o teclado de toque e filtra a placa por posição", () => {
    simularToque(false);
    abrirComTeclado();
    const campo = screen.getByLabelText("Placa do veículo");

    act(() => campo.focus());
    expect(screen.queryByRole("group", { name: "Teclado de placa" })).not.toBeInTheDocument();

    const numeroNaPrimeira = new InputEvent("beforeinput", { data: "1", inputType: "insertText", bubbles: true, cancelable: true });
    fireEvent(campo, numeroNaPrimeira);
    expect(numeroNaPrimeira.defaultPrevented).toBe(true);
  });
});

describe("LinkInvalido", () => {
  it("avisa que o link é inválido e não oferece busca", () => {
    renderWithProviders(<LinkInvalido />);

    expect(screen.getByRole("heading", { level: 1, name: "Link inválido" })).toBeInTheDocument();
    expect(screen.getByText(/Leia novamente o QR code/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Buscar" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Placa do veículo")).not.toBeInTheDocument();
  });
});
