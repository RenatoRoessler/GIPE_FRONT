import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useAppForm } from "@/components/form";
import { renderWithTheme } from "@/test/render";
import { EMPTY_PRECO_INFO, type PrecoInfoValues } from "@/types/preco";
import { inicioVigenciaDeHoje } from "../novoPreco";
import { CampoVigencia } from "./CampoVigencia";

function Harness({ info }: { info: Partial<PrecoInfoValues> }) {
  const form = useAppForm({ defaultValues: { ...EMPTY_PRECO_INFO, ...info } });
  return (
    <>
      <CampoVigencia form={form} />
      <form.Subscribe selector={(state) => [state.values.inicioVigencia, state.values.fimVigencia]}>
        {([inicio, fim]) => <output>{`inicio=${inicio};fim=${fim}`}</output>}
      </form.Subscribe>
    </>
  );
}

describe("CampoVigencia", () => {
  it("no cadastro novo (início hoje, sem fim) mostra os chips e nenhum seletor de data", () => {
    renderWithTheme(<Harness info={{ inicioVigencia: inicioVigenciaDeHoje() }} />);
    expect(screen.getByRole("radio", { name: "Começa hoje" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Sem fim" })).toBeChecked();
    expect(screen.queryByLabelText("Data de início")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Data de fim")).not.toBeInTheDocument();
  });

  it("Escolher data mostra o seletor e Começa hoje volta a gravar hoje", async () => {
    renderWithTheme(<Harness info={{ inicioVigencia: "2026-01-02T00:00" }} />);
    expect(screen.getByRole("radio", { name: "Escolher data" })).toBeChecked();
    expect(screen.getByLabelText("Data de início")).toHaveValue("2026-01-02T00:00");

    await userEvent.click(screen.getByRole("radio", { name: "Começa hoje" }));
    expect(screen.queryByLabelText("Data de início")).not.toBeInTheDocument();
    expect(screen.getByText(`inicio=${inicioVigenciaDeHoje()};fim=`)).toBeInTheDocument();
  });

  it("Escolher data a partir de hoje abre o seletor sem mudar o valor", async () => {
    renderWithTheme(<Harness info={{ inicioVigencia: inicioVigenciaDeHoje() }} />);
    await userEvent.click(screen.getByRole("radio", { name: "Escolher data" }));
    expect(screen.getByLabelText("Data de início")).toHaveValue(inicioVigenciaDeHoje());
  });

  it("Termina em… mostra o seletor, grava o fim digitado e Sem fim o apaga", async () => {
    renderWithTheme(<Harness info={{ inicioVigencia: inicioVigenciaDeHoje() }} />);
    await userEvent.click(screen.getByRole("radio", { name: "Termina em…" }));
    const fim = screen.getByLabelText("Data de fim");
    await userEvent.type(fim, "2030-05-06T07:08");
    expect(screen.getByText(`inicio=${inicioVigenciaDeHoje()};fim=2030-05-06T07:08`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: "Sem fim" }));
    expect(screen.queryByLabelText("Data de fim")).not.toBeInTheDocument();
    expect(screen.getByText(`inicio=${inicioVigenciaDeHoje()};fim=`)).toBeInTheDocument();
  });

  it("ao editar uma tabela com fim, os chips refletem os valores salvos", () => {
    renderWithTheme(<Harness info={{ inicioVigencia: "2026-01-02T00:00", fimVigencia: "2026-12-31T23:59" }} />);
    expect(screen.getByRole("radio", { name: "Escolher data" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Termina em…" })).toBeChecked();
    expect(screen.getByLabelText("Data de fim")).toHaveValue("2026-12-31T23:59");
  });
});
