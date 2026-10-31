import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import {
  EMPTY_ADMIN_USER_DATA,
  EMPTY_BUSINESS_HOURS_DATA,
  EMPTY_COMPANY_DATA,
  EMPTY_PAYMENTS_DATA,
  TipoEmpresa,
} from "@/types/adesao";
import { ConferirStep } from "./ConferirStep";

const company = {
  ...EMPTY_COMPANY_DATA,
  cnpj: "11.222.333/0001-81",
  razaoSocial: "Central LTDA",
  nomeFantasia: "Central",
  tipoEmpresa: TipoEmpresa.Estacionamento,
  telefone: "(11) 98765-4321",
  cep: "01310100",
  logradouro: "Av. Paulista",
  numero: "1000",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  estado: "SP",
  quantidadeVagasCarro: "80",
  quantidadeVagasMoto: "20",
};

const adminUser = {
  ...EMPTY_ADMIN_USER_DATA,
  nome: "Maria Silva",
  cpf: "111.444.777-35",
  email: "maria@exemplo.com",
  celular: "(11) 91234-5678",
  senha: "SenhaSecreta#1",
  repetirSenha: "SenhaSecreta#1",
};

function renderar(onEditar = vi.fn()) {
  renderWithTheme(
    <ConferirStep
      company={company}
      hours={EMPTY_BUSINESS_HOURS_DATA}
      payments={{ ...EMPTY_PAYMENTS_DATA, pix: true }}
      adminUser={adminUser}
      onEditar={onEditar}
    />,
  );
  return onEditar;
}

describe("ConferirStep", () => {
  it("mostra as cinco seções com os dados informados", () => {
    renderar();
    for (const titulo of ["Empresa", "Endereço e capacidade", "Pagamentos", "Horários", "Titular"]) {
      expect(screen.getByRole("region", { name: titulo })).toBeInTheDocument();
    }
    expect(screen.getByText("Central LTDA")).toBeInTheDocument();
    expect(screen.getByText("Av. Paulista, 1000")).toBeInTheDocument();
    expect(screen.getByText("01310-100")).toBeInTheDocument();
    expect(screen.getByText("Dinheiro, Pix")).toBeInTheDocument();
    expect(screen.getByText("Domingo").nextSibling).toHaveTextContent("Fechado");
    expect(screen.getByText("Segunda-feira").nextSibling).toHaveTextContent("08:00 às 18:00");
  });

  it("nunca exibe a senha", () => {
    
    renderar();
    expect(screen.getByText("••••••••")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("SenhaSecreta#1");
  });

  it("cada seção tem Editar que aponta para a etapa e o bloco certos", async () => {
    const onEditar = renderar();

    await userEvent.click(screen.getByRole("button", { name: "Editar Empresa" }));
    expect(onEditar).toHaveBeenLastCalledWith(1, "identificacao");

    await userEvent.click(screen.getByRole("button", { name: "Editar Endereço e capacidade" }));
    expect(onEditar).toHaveBeenLastCalledWith(1, "endereco");

    await userEvent.click(screen.getByRole("button", { name: "Editar Pagamentos" }));
    expect(onEditar).toHaveBeenLastCalledWith(1, "capacidade");

    await userEvent.click(screen.getByRole("button", { name: "Editar Horários" }));
    expect(onEditar).toHaveBeenLastCalledWith(2);

    await userEvent.click(screen.getByRole("button", { name: "Editar Titular" }));
    expect(onEditar).toHaveBeenLastCalledWith(3);
  });
});
