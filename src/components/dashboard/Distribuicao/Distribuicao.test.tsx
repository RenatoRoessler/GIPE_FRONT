import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dashboardDto } from "@/lib/api/services/dashboard.fixture";
import { fromDashboardResponse } from "@/lib/api/services/dashboard.mapper";
import { lightTheme } from "@/styles/theme";
import { renderWithTheme } from "@/test/render";
import { distribuicaoOrigem, distribuicaoRecebimento } from "../apresentacao";
import { Distribuicao } from "./Distribuicao";

const dashboard = fromDashboardResponse(dashboardDto);

describe("Distribuicao", () => {
  it("origem (exemplo): só as origens com valor, com valor e participação", () => {
    renderWithTheme(<Distribuicao titulo="De onde vem o dinheiro" distribuicao={distribuicaoOrigem(dashboard.origem)} vazio="vazio" />);

    const painel = within(screen.getByRole("region", { name: "De onde vem o dinheiro" }));
    const linhas = painel.getAllByRole("listitem");

    expect(linhas.map((linha) => linha.textContent)).toEqual(["AvulsoR$ 1.20286%", "ConvêniosR$ 1,50<1%", "Lava-rápidoR$ 20014%"]);
    expect(painel.queryByText("Mensalistas")).not.toBeInTheDocument();
  });

  it("recebimento (exemplo): as quatro formas de pagamento na ordem da API", () => {
    renderWithTheme(<Distribuicao titulo="Como você recebe" distribuicao={distribuicaoRecebimento(dashboard.recebimento)} vazio="vazio" />);

    const nomes = screen.getAllByRole("listitem").map((linha) => linha.firstElementChild?.textContent);
    expect(nomes).toEqual(["PIX", "Dinheiro", "Cartão de débito", "Cartão de crédito"]);
    expect(screen.getByText("R$ 544,50")).toBeInTheDocument();
    expect(screen.getByText("39%")).toBeInTheDocument();
  });

  it("a barra tem um segmento por linha, na cor de cada uma, e fica escondida do leitor de tela", () => {
    const { container } = renderWithTheme(<Distribuicao titulo="De onde vem o dinheiro" distribuicao={distribuicaoOrigem(dashboard.origem)} vazio="vazio" />);

    const barra = container.querySelector("[aria-hidden='true']") as HTMLElement;
    const segmentos = Array.from(barra.children);

    expect(segmentos).toHaveLength(3);
    expect(segmentos[0]).toHaveStyle({ backgroundColor: lightTheme.colors.cliente.avulso });
    expect(segmentos[1]).toHaveStyle({ backgroundColor: lightTheme.colors.cliente.conveniado });
    expect(segmentos[2]).toHaveStyle({ backgroundColor: lightTheme.colors.primary });
  });

  it("sem valor mostra só a frase de vazio, sem barra nem lista", () => {
    renderWithTheme(
      <Distribuicao titulo="Como você recebe" distribuicao={{ linhas: [], total: 0 }} vazio="Aparece quando houver recebimentos no período." />,
    );

    expect(screen.getByText("Aparece quando houver recebimentos no período.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("o título pode trazer o mês, e participação pequena mostra menos de 1%", () => {
    renderWithTheme(<Distribuicao titulo="De onde vem o dinheiro · outubro" distribuicao={distribuicaoOrigem(dashboard.origem)} vazio="vazio" />);

    expect(screen.getByRole("region", { name: "De onde vem o dinheiro · outubro" })).toBeInTheDocument();
    expect(screen.getByText("<1%")).toBeInTheDocument();
  });
});
