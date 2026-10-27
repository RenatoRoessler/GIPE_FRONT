import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { PatioVeiculo } from "@/types/patio";
import { PatioTabela } from "./PatioTabela";

let proximoId = 1;

function veiculo(extra: Partial<PatioVeiculo> = {}): PatioVeiculo {
  return {
    patioId: proximoId++,
    placa: "BRA2E19",
    categoria: 2,
    modelo: "Gol",
    cor: "PRATA",
    codigoTicket: 24024,
    sequencial: 5059,
    mensalista: false,
    dataHoraEntrada: "2026-10-17T15:30:22.574332",
    minutosPermanencia: 5860,
    permanencia: "4d 1h 40min",
    rotatividadeDescricao: "valores padrões atualizado",
    usuarioEntrada: "operador teste",
    token: "ABCD1234",
    ...extra,
  };
}

const onRegistrarSaida = vi.fn();

function renderTabela(veiculos: PatioVeiculo[]) {
  onRegistrarSaida.mockReset();
  return renderWithTheme(<PatioTabela veiculos={veiculos} onRegistrarSaida={onRegistrarSaida} />);
}

const linhaDe = (placa: string) => screen.getByText(placa).closest("tr") as HTMLElement;

describe("PatioTabela", () => {
  it("tem cabeçalho de verdade, com as seis colunas", () => {
    renderTabela([veiculo()]);

    const cabecalhos = screen.getAllByRole("columnheader").map((th) => th.textContent);
    expect(cabecalhos).toEqual(["Placa", "Veículo", "Entrada", "Permanência", "Tabela e operador", "Ações"]);
  });

  it("mostra os dados de cada veículo na linha dele", () => {
    renderTabela([veiculo()]);
    const linha = within(linhaDe("BRA2E19"));

    expect(linha.getByText("Gol")).toBeInTheDocument();
    expect(linha.getByText("PRATA")).toBeInTheDocument();
    expect(linha.getByText("Carro pequeno")).toBeInTheDocument();
    expect(linha.getByText(/17\/10\/\d{2,4}.*15:30/)).toBeInTheDocument();
    expect(linha.getByText("Seq. 5059 · Ticket 24024")).toBeInTheDocument();
    expect(linha.getByText("4d 1h 40min")).toBeInTheDocument();
    expect(linha.getByText("valores padrões atualizado")).toBeInTheDocument();
    expect(linha.getByText("operador teste")).toBeInTheDocument();
  });

  it("a permanência e o texto longo da tabela têm o texto completo no title", () => {
    renderTabela([veiculo()]);

    expect(screen.getByTitle("valores padrões atualizado")).toBeInTheDocument();
    expect(screen.getByTitle("operador teste")).toBeInTheDocument();
  });

  it("o selo Mensalista só aparece para mensalista", () => {
    renderTabela([veiculo({ placa: "MEN1A11", mensalista: true }), veiculo({ placa: "AVU1A11", mensalista: false })]);

    expect(within(linhaDe("MEN1A11")).getByText("Mensalista")).toBeInTheDocument();
    expect(within(linhaDe("AVU1A11")).queryByText("Mensalista")).not.toBeInTheDocument();
  });

  it("o ticket só aparece quando existe", () => {
    renderTabela([veiculo({ codigoTicket: null, sequencial: 2464 })]);

    expect(screen.getByText("Seq. 2464")).toBeInTheDocument();
    expect(screen.queryByText(/Ticket/)).not.toBeInTheDocument();
  });

  describe("quadro de chaves", () => {
    const onGuardarChave = vi.fn();

    function renderComQuadros(veiculos: PatioVeiculo[], comQuadros = true) {
      onGuardarChave.mockReset();
      return renderWithTheme(
        <PatioTabela veiculos={veiculos} onRegistrarSaida={vi.fn()} comQuadros={comQuadros} onGuardarChave={onGuardarChave} />,
      );
    }

    it("mostra o botão da chave com a posição, ou convida a guardar quando está fora do quadro", () => {
      renderComQuadros([veiculo({ placa: "COM1A11", posicaoChave: "A2" }), veiculo({ placa: "SEM1A11", posicaoChave: null })]);

      expect(within(linhaDe("COM1A11")).getByRole("button", { name: /hoje no gancho A2/ })).toHaveTextContent("A2");
      expect(within(linhaDe("SEM1A11")).getByRole("button", { name: /Guardar a chave de SEM1A11/ })).toBeInTheDocument();
    });

    it("tocar no botão entrega o veículo da linha", async () => {
      const v = veiculo({ placa: "SEM1A11", posicaoChave: null });
      renderComQuadros([v]);
      await userEvent.click(screen.getByRole("button", { name: /Guardar a chave de SEM1A11/ }));
      expect(onGuardarChave).toHaveBeenCalledWith(v);
    });

    it("sem quadros na empresa não há botão nem texto de chave", () => {
      renderComQuadros([veiculo({ placa: "COM1A11", posicaoChave: "A2" }), veiculo({ placa: "SEM1A11" })], false);

      expect(screen.queryByText(/Chave/)).not.toBeInTheDocument();
      expect(screen.queryByText("Fora do quadro")).not.toBeInTheDocument();
    });

    it("o botão de saída continua achável pelo atributo próprio", () => {
      renderComQuadros([veiculo({ placa: "COM1A11" })]);
      expect(linhaDe("COM1A11").querySelectorAll("[data-saida-botao]")).toHaveLength(1);
    });
  });

  it("campos ausentes mostram um traço, sem quebrar", () => {
    renderTabela([veiculo({ modelo: null, cor: null, rotatividadeDescricao: null, usuarioEntrada: null, permanencia: "" })]);
    const linha = within(linhaDe("BRA2E19"));

    // Modelo, cor, tabela de preço, operador e permanência.
    expect(linha.getAllByText("—")).toHaveLength(5);
  });

  it("cor conhecida ganha amostra; cor livre aparece só como texto", () => {
    const { container } = renderTabela([veiculo({ placa: "PRA1A11", cor: "PRATA" }), veiculo({ placa: "LIV1A11", cor: "teste" })]);

    const amostras = (linha: HTMLElement) => linha.querySelectorAll('span[aria-hidden="true"]').length;
    expect(amostras(linhaDe("PRA1A11"))).toBeGreaterThan(0);
    expect(within(linhaDe("LIV1A11")).getByText("teste")).toBeInTheDocument();
    expect(container).toBeTruthy();
  });

  it("categoria desconhecida vira Categoria N, sem ícone, e não quebra", () => {
    renderTabela([veiculo({ categoria: 42 })]);

    expect(screen.getByText("Categoria 42")).toBeInTheDocument();
  });

  it("o botão de saída cita a placa e entrega o veículo", async () => {
    const dados = veiculo({ placa: "KVN1F76" });
    renderTabela([dados]);

    await userEvent.click(screen.getByRole("button", { name: "Registrar saída de KVN1F76" }));

    expect(onRegistrarSaida).toHaveBeenCalledWith(dados);
  });

  describe("comprovante", () => {
    it("é um link para a página pública, em nova aba, com nome que cita a placa", () => {
      renderTabela([veiculo({ placa: "KVN1F76", token: "XYZ98765" })]);

      const link = screen.getByRole("link", { name: "Ver comprovante de KVN1F76 (abre em nova aba)" });
      expect(link).toHaveAttribute("href", "/comprovante/XYZ98765");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("sem token o ícone não é oferecido", () => {
      renderTabela([veiculo({ token: null })]);

      expect(screen.queryByRole("link", { name: /comprovante/i })).not.toBeInTheDocument();
    });

    it("o token nunca aparece como texto na tela", () => {
      const { container } = renderTabela([veiculo({ token: "SEGREDO99" })]);

      expect(container.textContent).not.toContain("SEGREDO99");
      expect(screen.queryByText("SEGREDO99")).not.toBeInTheDocument();
    });
  });

  it("lista vazia mostra só o cabeçalho", () => {
    renderTabela([]);

    expect(screen.queryAllByRole("row")).toHaveLength(1);
  });
});
