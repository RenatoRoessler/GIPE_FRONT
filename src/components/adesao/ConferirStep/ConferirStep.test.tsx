import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import {
  type AceiteData,
  EMPTY_ACEITE_DATA,
  EMPTY_ADMIN_USER_DATA,
  EMPTY_BUSINESS_HOURS_DATA,
  EMPTY_COMPANY_DATA,
  EMPTY_PAYMENTS_DATA,
  TipoEmpresa,
} from "@/types/adesao";
import { type PlanoAdesao, TipoPlanoAdesao } from "@/types/plano";
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

const MENSAL_PROMO: PlanoAdesao = {
  id: 2,
  tipo: 1,
  nome: "Mensal",
  meses: 1,
  centavosTabela: 9990,
  centavosAtual: 6990,
  emPromocao: true,
  promocaoAte: "2027-06-30",
};

const TRIAL: PlanoAdesao = {
  id: 1,
  tipo: 0,
  nome: "Teste gratuito",
  meses: 1,
  centavosTabela: 0,
  centavosAtual: 0,
  emPromocao: false,
};

interface OpcoesAceite {
  aceite?: AceiteData;
  erroAceite?: Partial<Record<keyof AceiteData, string>>;
  onAceitar?: (documento: keyof AceiteData, aceito: boolean) => void;
  desabilitado?: boolean;
  // `null` simula a falta de dados do back-end (`undefined` cai no valor padrão).
  dadosDoPlano?: PlanoAdesao | null;
  planoTeste?: PlanoAdesao | null;
}

function renderar(
  onEditar = vi.fn(),
  plano: TipoPlanoAdesao = TipoPlanoAdesao.Mensal,
  planoEditavel = true,
  {
    aceite = EMPTY_ACEITE_DATA,
    erroAceite,
    onAceitar = vi.fn(),
    desabilitado,
    // Por padrão, o plano pago recebe os dados do Mensal e o teste, os do Trial (como o wizard faz).
    dadosDoPlano = plano === TipoPlanoAdesao.Trial ? undefined : MENSAL_PROMO,
    planoTeste = TRIAL,
  }: OpcoesAceite = {},
) {
  renderWithTheme(
    <ConferirStep
      plano={plano}
      dadosDoPlano={dadosDoPlano ?? undefined}
      planoTeste={planoTeste ?? undefined}
      planoEditavel={planoEditavel}
      company={company}
      hours={EMPTY_BUSINESS_HOURS_DATA}
      payments={{ ...EMPTY_PAYMENTS_DATA, pix: true }}
      adminUser={adminUser}
      onEditar={onEditar}
      aceite={aceite}
      erroAceite={erroAceite}
      onAceitar={onAceitar}
      desabilitado={desabilitado}
    />,
  );
  return onEditar;
}

describe("ConferirStep", () => {
  it("mostra as seções com os dados informados", () => {
    renderar();
    for (const titulo of ["Empresa", "Endereço e capacidade", "Pagamentos", "Horários", "Titular", "Plano"]) {
      expect(screen.getByRole("region", { name: titulo })).toBeInTheDocument();
    }
    expect(screen.getByText("Central LTDA")).toBeInTheDocument();
    expect(screen.getByText("Av. Paulista, 1000")).toBeInTheDocument();
    expect(screen.getByText("01310-100")).toBeInTheDocument();
    expect(screen.getByText("Dinheiro, Pix")).toBeInTheDocument();
    expect(screen.getByText("Domingo").nextSibling).toHaveTextContent("Fechado");
    expect(screen.getByText("Segunda-feira").nextSibling).toHaveTextContent("08:00 às 18:00");
  });

  it("mostra o plano escolhido com valor por mês e condição do back-end", () => {
    renderar();
    const secao = screen.getByRole("region", { name: "Plano" });
    expect(secao).toHaveTextContent("Mensal");
    expect(secao).toHaveTextContent("R$ 69,90");
    expect(secao).toHaveTextContent("R$ 69,90/mês até 30/06/2027; depois, R$ 99,90/mês.");
    expect(secao).not.toHaveTextContent("12 meses");
  });

  it("em promoção risca a tabela e o leitor de tela ouve de ... por ...", () => {
    renderar();
    const secao = screen.getByRole("region", { name: "Plano" });
    const riscado = within(secao).getByText("R$ 99,90", { selector: "s" });
    expect(riscado).toHaveAttribute("aria-hidden", "true");
    expect(within(secao).getByText("Valor por mês").nextSibling).toHaveTextContent("de R$ 99,90 por R$ 69,90");
  });

  it("sem promoção mostra só o valor atual, sem riscado", () => {
    renderar(vi.fn(), TipoPlanoAdesao.Mensal, true, {
      dadosDoPlano: { ...MENSAL_PROMO, centavosAtual: 9990, emPromocao: false, promocaoAte: undefined },
    });
    const secao = screen.getByRole("region", { name: "Plano" });
    expect(secao.querySelector("s")).toBeNull();
    expect(secao).toHaveTextContent("R$ 99,90");
    expect(secao).toHaveTextContent("Cobrado todo mês");
  });

  it("em promoção sem data não cita data", () => {
    renderar(vi.fn(), TipoPlanoAdesao.Mensal, true, { dadosDoPlano: { ...MENSAL_PROMO, promocaoAte: undefined } });
    const secao = screen.getByRole("region", { name: "Plano" });
    expect(secao).toHaveTextContent("R$ 69,90/mês em promoção.");
    expect(secao.textContent).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("sem os dados do plano pago não mostra o bloco do plano", () => {
    renderar(vi.fn(), TipoPlanoAdesao.Mensal, true, { dadosDoPlano: null });
    expect(screen.queryByRole("region", { name: "Plano" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar Plano" })).not.toBeInTheDocument();
  });

  it("Editar Plano leva à etapa do plano", async () => {
    const onEditar = renderar();
    await userEvent.click(screen.getByRole("button", { name: "Editar Plano" }));
    expect(onEditar).toHaveBeenLastCalledWith(4);
  });

  describe("no teste grátis", () => {
    it("mostra o resumo do teste no lugar do plano, com a duração do back-end", () => {
      renderar(vi.fn(), TipoPlanoAdesao.Trial);
      const secao = screen.getByRole("region", { name: "1 mês grátis" });
      expect(secao).toHaveTextContent("Use o sistema completo por 1 mês.");
      expect(secao).toHaveTextContent("Depois do período grátis, você decide se quer assinar.");
      expect(screen.queryByRole("region", { name: "Plano" })).not.toBeInTheDocument();
    });

    it("a duração acompanha o número do back-end", () => {
      renderar(vi.fn(), TipoPlanoAdesao.Trial, true, { planoTeste: { ...TRIAL, meses: 2 } });
      expect(screen.getByRole("region", { name: "2 meses grátis" })).toHaveTextContent(
        "Use o sistema completo por 2 meses.",
      );
    });

    it("sem os dados do teste não cita número nem prazo", () => {
      renderar(vi.fn(), TipoPlanoAdesao.Trial, true, { planoTeste: null });
      const secao = screen.getByRole("region", { name: "Mês grátis" });
      expect(secao).toHaveTextContent("Use o sistema completo no mês grátis.");
      expect(secao).toHaveTextContent("Depois do período grátis, você decide se quer assinar.");
      expect(secao.textContent).not.toMatch(/\d/);
    });

    it("lista as três garantias numa lista real", () => {
      renderar(vi.fn(), TipoPlanoAdesao.Trial);
      const itens = within(screen.getByRole("region", { name: "1 mês grátis" })).getAllByRole("listitem");
      expect(itens.map((item) => item.textContent)).toEqual([
        "Todas as funcionalidades",
        "Sem cartão de crédito",
        "Sem compromisso",
      ]);
    });

    it("sem etapa Plano no fluxo não tem Editar, valor por mês, condição nem preço", () => {
      renderar(vi.fn(), TipoPlanoAdesao.Trial, false);
      expect(screen.queryByRole("button", { name: "Editar Plano" })).not.toBeInTheDocument();
      expect(screen.queryByText("Valor por mês")).not.toBeInTheDocument();
      expect(screen.queryByText("Condição")).not.toBeInTheDocument();
      expect(document.body.textContent).not.toContain("R$");
    });

    it("escolhido na etapa Plano, Editar leva de volta a ela", async () => {
      const onEditar = renderar(vi.fn(), TipoPlanoAdesao.Trial, true);
      await userEvent.click(screen.getByRole("button", { name: "Editar Plano" }));
      expect(onEditar).toHaveBeenLastCalledWith(4);
      expect(document.body.textContent).not.toContain("R$");
    });

    it("mantém as demais seções com Editar", () => {
      renderar(vi.fn(), TipoPlanoAdesao.Trial);
      for (const titulo of ["Empresa", "Endereço e capacidade", "Pagamentos", "Horários", "Titular"]) {
        expect(screen.getByRole("button", { name: `Editar ${titulo}` })).toBeInTheDocument();
      }
    });
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

  describe("aceite dos termos", () => {
    it.each([
      ["plano", TipoPlanoAdesao.Mensal],
      ["teste grátis", TipoPlanoAdesao.Trial],
    ])("mostra os dois blocos desmarcados no modo %s", (_modo, plano) => {
      renderar(vi.fn(), plano);
      expect(within(screen.getByRole("region", { name: "Termos de Uso" })).getByRole("checkbox")).not.toBeChecked();
      expect(within(screen.getByRole("region", { name: "Política de Privacidade" })).getByRole("checkbox")).not.toBeChecked();
    });

    it("liga cada link ao documento, em nova aba, sem marcar a caixa", async () => {
      const onAceitar = vi.fn();
      renderar(vi.fn(), TipoPlanoAdesao.Mensal, true, { onAceitar });
      const link = screen.getByRole("link", { name: /Ler Termos de Uso/ });
      expect(link).toHaveAttribute("href", "/legal/termos-de-uso.html");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(screen.getByRole("link", { name: /Ler Política de Privacidade/ })).toHaveAttribute(
        "href",
        "/legal/politica-de-privacidade.html",
      );
      link.addEventListener("click", (event) => event.preventDefault());
      await userEvent.click(link);
      expect(onAceitar).not.toHaveBeenCalled();
    });

    it("avisa qual documento foi aceito ao marcar a caixa", async () => {
      const onAceitar = vi.fn();
      renderar(vi.fn(), TipoPlanoAdesao.Mensal, true, { onAceitar });
      await userEvent.click(screen.getByRole("checkbox", { name: "Li e aceito a Política de Privacidade" }));
      expect(onAceitar).toHaveBeenCalledWith("privacidade", true);
    });

    it("mostra as caixas marcadas conforme o aceite recebido", () => {
      renderar(vi.fn(), TipoPlanoAdesao.Mensal, true, { aceite: { termos: true, privacidade: false } });
      expect(screen.getByRole("checkbox", { name: "Li e aceito os Termos de Uso" })).toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Li e aceito a Política de Privacidade" })).not.toBeChecked();
    });

    it("mostra o erro junto da caixa pendente", () => {
      renderar(vi.fn(), TipoPlanoAdesao.Mensal, true, {
        erroAceite: { privacidade: "Aceite a Política de Privacidade para continuar." },
      });
      // A mensagem fica dentro do rótulo do Checkbox, então o nome acessível a inclui.
      const caixa = screen.getByRole("checkbox", { name: /Li e aceito a Política de Privacidade/ });
      expect(caixa).toBeInvalid();
      expect(caixa).toHaveAccessibleDescription("Aceite a Política de Privacidade para continuar.");
      expect(screen.getByRole("checkbox", { name: "Li e aceito os Termos de Uso" })).toBeValid();
    });

    it("desabilita as caixas durante o envio", () => {
      renderar(vi.fn(), TipoPlanoAdesao.Mensal, true, { desabilitado: true });
      for (const caixa of screen.getAllByRole("checkbox")) expect(caixa).toBeDisabled();
    });

    it("não oferece Editar nos blocos de aceite", () => {
      renderar();
      expect(screen.queryByRole("button", { name: /Editar (Termos|Política)/ })).not.toBeInTheDocument();
    });
  });
});
