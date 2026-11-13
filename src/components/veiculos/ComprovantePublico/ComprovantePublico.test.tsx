import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { ComprovanteCliente } from "@/types/veiculo";

vi.mock("@/lib/api/services/patio", () => ({ consultarComprovante: vi.fn() }));
vi.mock("./reciboPdf", () => ({ baixarReciboPdf: vi.fn() }));

import { consultarComprovante } from "@/lib/api/services/patio";
import { ComprovantePublico } from "./ComprovantePublico";
import { baixarReciboPdf } from "./reciboPdf";

const comprovante: ComprovanteCliente = {
  cnpj: "66326569000150",
  razaoSocial: "Estacionamento Central",
  endereco: "Avenida Sete de Setembro, 123",
  telefone: "54996384949",
  placa: "LWJ2686",
  modelo: "Fusca",
  cor: "teste",
  categoriaId: 2,
  categoriaDescricao: "Carro pequeno",
  dataHoraEntrada: "2026-10-17T10:06:06.2094",
  dataHoraConsulta: "2026-10-17T11:11:21.3565059",
  minutosPermanencia: 65,
  permanencia: "1h 5min",
  sequencial: 7888,
  token: "227SUSYV",
  valorAtual: 12.5,
};

describe("ComprovantePublico", () => {
  beforeEach(() => {
    vi.mocked(consultarComprovante).mockReset();
  });

  it("mostra o carregamento e depois os dados do comprovante", async () => {
    vi.mocked(consultarComprovante).mockResolvedValue(comprovante);
    renderWithProviders(<ComprovantePublico token="227SUSYV" />);

    expect(screen.getByRole("status", { name: "Carregando comprovante" })).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("heading", { name: "Estacionamento Central" })).toBeInTheDocument();
    expect(consultarComprovante).toHaveBeenCalledWith("227SUSYV");
    expect(screen.getByText("Veículo no pátio")).toBeInTheDocument();
    expect(screen.getByText("Ticket Nº 7888")).toBeInTheDocument();
    expect(screen.getByText("1h 05min")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*12,50/)).toBeInTheDocument();
    expect(screen.getByText("LWJ-2686")).toBeInTheDocument();
    expect(screen.getByText("Fusca · teste")).toBeInTheDocument();
    expect(screen.getByText("Carro pequeno")).toBeInTheDocument();
    expect(screen.getByText(/Valor calculado em/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "QR code de saída do veículo" })).toBeInTheDocument();
    expect(screen.getByText("227SUSYV")).toBeInTheDocument();
    expect(screen.queryByText(/66\.?326/)).not.toBeInTheDocument();
  });

  it("com serviços, divide o valor em estadia e serviços e mostra o cartão de serviços", async () => {
    vi.mocked(consultarComprovante).mockResolvedValue({
      ...comprovante,
      valorAtual: 90,
      servicos: [
        { nome: "Lavagem simples", valorCentavos: 3000, status: 2, previsaoEm: "2026-11-11T22:20:00", prontoEm: null },
        { nome: "Aspiração interna", valorCentavos: 2000, status: 3, previsaoEm: null, prontoEm: "2026-11-11T21:40:00" },
      ],
    });
    renderWithProviders(<ComprovantePublico token="227SUSYV" />);

    const composicao = await screen.findByLabelText("Composição do valor");
    expect(within(composicao).getByText("Estadia").nextElementSibling).toHaveTextContent("R$ 40,00");
    expect(within(composicao).getByText("Serviços (2)").nextElementSibling).toHaveTextContent("R$ 50,00");
    expect(screen.getByText(/R\$\s*90,00/)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Seus serviços" })).toBeInTheDocument();
    expect(screen.getByText("1 de 2 prontos")).toBeInTheDocument();
  });

  it("sem serviços, o comprovante fica como antes", async () => {
    vi.mocked(consultarComprovante).mockResolvedValue(comprovante);
    renderWithProviders(<ComprovantePublico token="227SUSYV" />);

    await screen.findByRole("heading", { name: "Estacionamento Central" });
    expect(screen.queryByLabelText("Composição do valor")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Seus serviços" })).not.toBeInTheDocument();
  });

  it("com a lista de serviços vazia, também fica como antes", async () => {
    vi.mocked(consultarComprovante).mockResolvedValue({ ...comprovante, servicos: [] });
    renderWithProviders(<ComprovantePublico token="227SUSYV" />);

    await screen.findByRole("heading", { name: "Estacionamento Central" });
    expect(screen.queryByLabelText("Composição do valor")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Seus serviços" })).not.toBeInTheDocument();
  });

  it("mostra a marca Murel no topo, acima do nome da empresa", async () => {
    vi.mocked(consultarComprovante).mockResolvedValue(comprovante);
    renderWithProviders(<ComprovantePublico token="227SUSYV" />);

    const empresa = await screen.findByRole("heading", { name: "Estacionamento Central" });
    const marca = screen.getByRole("img", { name: "Murel" });
    expect(marca.compareDocumentPosition(empresa) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("murel")).toBeInTheDocument();
  });

  it("baixa o recibo em PDF com os dados do comprovante", async () => {
    vi.mocked(consultarComprovante).mockResolvedValue(comprovante);
    vi.mocked(baixarReciboPdf).mockResolvedValue();
    const user = userEvent.setup();
    renderWithProviders(<ComprovantePublico token="227SUSYV" />);
    await user.click(await screen.findByRole("button", { name: "Baixar PDF" }));
    expect(baixarReciboPdf).toHaveBeenCalledWith(comprovante, expect.stringContaining("http"));
  });

  it("avisa quando o PDF não pode ser gerado", async () => {
    vi.mocked(consultarComprovante).mockResolvedValue(comprovante);
    vi.mocked(baixarReciboPdf).mockRejectedValue(new Error("falhou"));
    const user = userEvent.setup();
    renderWithProviders(<ComprovantePublico token="227SUSYV" />);
    await user.click(await screen.findByRole("button", { name: "Baixar PDF" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível gerar o PDF");
    expect(screen.getByRole("button", { name: "Baixar PDF" })).toBeEnabled();
  });

  it("abre o mapa com o endereço do estacionamento", async () => {
    vi.mocked(consultarComprovante).mockResolvedValue(comprovante);
    renderWithProviders(<ComprovantePublico token="227SUSYV" />);
    const link = await screen.findByRole("link", { name: "Como chegar" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Avenida%20Sete%20de%20Setembro%2C%20123",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("oferece ligar para o estacionamento", async () => {
    vi.mocked(consultarComprovante).mockResolvedValue(comprovante);
    renderWithProviders(<ComprovantePublico token="227SUSYV" />);
    const link = await screen.findByRole("link", { name: "Ligar para o estacionamento" });
    expect(link).toHaveAttribute("href", "tel:54996384949");
  });

  it("omite o que não veio, sem mostrar null", async () => {
    vi.mocked(consultarComprovante).mockResolvedValue({ ...comprovante, telefone: null, endereco: null, modelo: null, cor: null });
    const { container } = renderWithProviders(<ComprovantePublico token="227SUSYV" />);
    await screen.findByRole("heading", { name: "Estacionamento Central" });
    expect(screen.queryByRole("link", { name: "Ligar para o estacionamento" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Como chegar" })).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent("null");
    expect(container).not.toHaveTextContent("undefined");
  });

  it("mostra comprovante não encontrado para token inexistente", async () => {
    vi.mocked(consultarComprovante).mockImplementation(() => Promise.reject(new ApiError("not_found", undefined, 404)));
    renderWithProviders(<ComprovantePublico token="XXXXXXXX" />);
    expect(await screen.findByRole("heading", { name: "Comprovante não encontrado" })).toBeInTheDocument();
    expect(screen.queryByText("Estacionamento Central")).not.toBeInTheDocument();
  });

  it("permite tentar novamente após um erro", async () => {
    vi.mocked(consultarComprovante).mockRejectedValueOnce(new ApiError("server", undefined, 500));
    vi.mocked(consultarComprovante).mockResolvedValueOnce(comprovante);
    const user = userEvent.setup();
    renderWithProviders(<ComprovantePublico token="227SUSYV" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o comprovante");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByRole("heading", { name: "Estacionamento Central" })).toBeInTheDocument();
    await waitFor(() => expect(consultarComprovante).toHaveBeenCalledTimes(2));
  });
});
