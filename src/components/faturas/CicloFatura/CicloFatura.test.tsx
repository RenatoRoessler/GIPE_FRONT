import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { SITUACAO_FATURA } from "@/types/fatura";
import { fatura } from "../fixtures";
import { CicloFatura } from "./CicloFatura";

const passos = () => within(screen.getByRole("list", { name: "Ciclo da fatura" })).getAllByRole("listitem");

describe("CicloFatura", () => {
  it("aberta: emitida (quando e por quem) e aguardando pagamento com o vencimento", () => {
    renderWithTheme(<CicloFatura fatura={fatura()} />);

    expect(passos()).toHaveLength(2);
    expect(passos()[0]).toHaveTextContent("Emitida");
    expect(passos()[0]).toHaveTextContent("08/11/2026, 10:46");
    expect(passos()[0]).toHaveTextContent("Renato Rossler");
    expect(passos()[1]).toHaveTextContent("Aguardando pagamento");
    expect(passos()[1]).toHaveTextContent("Vence em 08/12/2026");
  });

  it("paga: quem, quando, forma e valor pago", () => {
    renderWithTheme(
      <CicloFatura
        fatura={fatura({
          situacao: SITUACAO_FATURA.Paga,
          dataPagamento: "2026-11-12T09:00:00",
          usuarioPagamento: "Ana",
          formaPagamento: 2,
          valorPago: 1250,
        })}
      />,
    );

    expect(passos()).toHaveLength(2);
    expect(passos()[1]).toHaveTextContent("Paga");
    expect(passos()[1]).toHaveTextContent("12/11/2026, 09:00");
    expect(passos()[1]).toHaveTextContent("Ana");
    expect(passos()[1]).toHaveTextContent("Pix");
    expect(passos()[1]).toHaveTextContent("Pago R$ 1.250,00");
    expect(screen.queryByText("Aguardando pagamento")).not.toBeInTheDocument();
  });

  it("paga com valor diferente do total mostra os dois valores", () => {
    renderWithTheme(<CicloFatura fatura={fatura({ situacao: SITUACAO_FATURA.Paga, dataPagamento: "2026-11-12T09:00:00", formaPagamento: 1, valorPago: 1200 })} />);

    expect(passos()[1]).toHaveTextContent("Pago R$ 1.200,00 de R$ 1.250,00");
  });

  it("paga sem valor pago informado mostra o total", () => {
    renderWithTheme(<CicloFatura fatura={fatura({ situacao: SITUACAO_FATURA.Paga, dataPagamento: "2026-11-12T09:00:00", formaPagamento: 1, valorPago: null })} />);

    expect(passos()[1]).toHaveTextContent("Pago R$ 1.250,00");
  });

  it("cancelada: quem e quando", () => {
    renderWithTheme(<CicloFatura fatura={fatura({ situacao: SITUACAO_FATURA.Cancelada, dataCancelamento: "2026-11-13T15:30:00", usuarioCancelamento: "Beto" })} />);

    expect(passos()).toHaveLength(2);
    expect(passos()[1]).toHaveTextContent("Cancelada");
    expect(passos()[1]).toHaveTextContent("13/11/2026, 15:30");
    expect(passos()[1]).toHaveTextContent("Beto");
    expect(screen.queryByText("Aguardando pagamento")).not.toBeInTheDocument();
  });
});
