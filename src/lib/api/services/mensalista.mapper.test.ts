import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mensalista, MensalistaFormValues, MensalistaTipo, TipoFormValues } from "@/types/mensalista";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

import { api } from "../client";
import { createMensalista, listMensalistas, listTiposMensalidade, updateMensalista } from "./mensalista";
import {
  fromMensalista,
  fromMensalistaResponse,
  fromTipo,
  fromTipoResponse,
  toMensalistaPayload,
  toTipoPayload,
} from "./mensalista.mapper";

const form: MensalistaFormValues = {
  mensalistaTipoId: "3",
  tipoPessoa: "1",
  documento: "529.982.247-25",
  nome: " Maria Souza ",
  email: " maria@exemplo.com ",
  celular: "(11) 91234-5678",
  diaVencimento: "5",
  ativo: true,
  veiculos: [],
};

describe("toMensalistaPayload", () => {
  it("envia documento e celular sem máscara e números convertidos", () => {
    expect(toMensalistaPayload(form)).toEqual({
      mensalistaTipoId: 3,
      tipoPessoa: 1,
      documento: "52998224725",
      nome: "Maria Souza",
      email: "maria@exemplo.com",
      celular: "11912345678",
      diaVencimento: 5,
      ativo: true,
      veiculos: [],
    });
  });

  it("mantém CNPJ alfanumérico em maiúsculas", () => {
    expect(toMensalistaPayload({ ...form, tipoPessoa: "2", documento: "12.abc.345/01de-35" }).documento).toBe(
      "12ABC34501DE35",
    );
  });
});

describe("fromMensalista", () => {
  const mensalista: Mensalista = {
    mensalistaId: 1,
    mensalistaTipoId: 3,
    tipoMensal: "Diurno",
    categoria: 2,
    valorMensalidade: 280,
    tipoPessoa: 1,
    documento: "52998224725",
    nome: "Maria Souza",
    email: "maria@exemplo.com",
    celular: "11912345678",
    diaVencimento: 5,
    ativo: false,
    veiculos: [],
    situacao: null,
    dataProximoVencimento: null,
    diasAteProximoVencimento: null,
  };

  it("formata documento e celular para o formulário", () => {
    expect(fromMensalista(mensalista)).toEqual({
      mensalistaTipoId: "3",
      tipoPessoa: "1",
      documento: "529.982.247-25",
      nome: "Maria Souza",
      email: "maria@exemplo.com",
      celular: "(11) 91234-5678",
      diaVencimento: "5",
      ativo: false,
      veiculos: [],
    });
  });

  it("tolera resposta sem campos opcionais", () => {
    const parsed = fromMensalistaResponse({ mensalistaId: 9, nome: "Ana" });
    expect(parsed.nome).toBe("Ana");
    expect(parsed.cadastradoPor).toBeNull();
    expect(parsed.ativo).toBe(true);
  });
});

const tipoForm: TipoFormValues = {
  tipoMensal: " Diurno ",
  categoria: "99",
  valorMensalidade: "280,00",
  horarioEntrada: "",
  horarioSaida: "",
  ativo: true,
};

describe("toTipoPayload", () => {
  it("converte o valor e envia horários vazios como null", () => {
    expect(toTipoPayload(tipoForm)).toEqual({
      tipoMensal: "Diurno",
      categoria: 99,
      valorMensalidade: 280,
      horarioEntrada: null,
      horarioSaida: null,
      ativo: true,
    });
  });

  it("envia os horários em HH:mm", () => {
    const payload = toTipoPayload({ ...tipoForm, horarioEntrada: "19:00", horarioSaida: "07:00" });
    expect(payload.horarioEntrada).toBe("19:00");
    expect(payload.horarioSaida).toBe("07:00");
  });
});

describe("fromTipo", () => {
  const tipo: MensalistaTipo = {
    mensalistaTipoId: 1,
    tipoMensal: "Noturno",
    categoria: 2,
    valorMensalidade: 199.9,
    horarioEntrada: "19:00:00",
    horarioSaida: null,
    ativo: true,
  };

  it("aceita HH:mm:ss e null, e formata o valor", () => {
    expect(fromTipo(tipo)).toEqual({
      tipoMensal: "Noturno",
      categoria: "2",
      valorMensalidade: "199,90",
      horarioEntrada: "19:00",
      horarioSaida: "",
      ativo: true,
    });
  });

  it("tolera resposta sem horários", () => {
    const parsed = fromTipoResponse({ mensalistaTipoId: 2, tipoMensal: "X" });
    expect(parsed.horarioEntrada).toBeNull();
    expect(parsed.ativo).toBe(true);
  });
});

describe("serviço de mensalistas", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.put).mockReset();
  });

  it("envia a busca de documento sem máscara", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [], page: 1, pageSize: 20, totalRecords: 0, totalPages: 0 } });
    await listMensalistas({ pagina: 2, tamanhoPagina: 20, documento: "529.982" });
    expect(api.get).toHaveBeenCalledWith("/Mensalista", {
      params: { pagina: 2, tamanhoPagina: 20, documento: "529982" },
    });
  });

  it("não envia o parâmetro documento quando a busca está vazia", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [] } });
    await listMensalistas({ pagina: 1, tamanhoPagina: 20, documento: "  " });
    expect(api.get).toHaveBeenCalledWith("/Mensalista", { params: { pagina: 1, tamanhoPagina: 20 } });
  });

  it("cadastra e edita com o payload completo", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { mensalistaId: 7 } });
    await expect(createMensalista(form)).resolves.toEqual({ mensalistaId: 7 });
    expect(vi.mocked(api.post).mock.calls[0][0]).toBe("/Mensalista");

    await updateMensalista(7, form);
    expect(vi.mocked(api.put).mock.calls[0][0]).toBe("/Mensalista/7");
    expect(vi.mocked(api.put).mock.calls[0][1]).toMatchObject({ documento: "52998224725", ativo: true });
  });

  it("lista tipos tolerando resposta vazia", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: null });
    await expect(listTiposMensalidade()).resolves.toEqual([]);
  });
});

describe("veículos e condutores", () => {
  const veiculoForm = {
    uid: "u1",
    placa: "abc-1d23",
    modelo: " Gol ",
    cor: " Prata ",
    categoria: "2",
    condutores: [{ uid: "c1", nome: " Ana Lima ", cpf: "529.982.247-25" }],
  };

  it("PJ envia condutores com CPF só dígitos e sem uid", () => {
    const payload = toMensalistaPayload({ ...form, tipoPessoa: "2", veiculos: [veiculoForm] });
    expect(payload.veiculos).toEqual([
      {
        placa: "ABC1D23",
        modelo: "Gol",
        cor: "Prata",
        categoria: 2,
        condutores: [{ nome: "Ana Lima", cpf: "52998224725" }],
      },
    ]);
  });

  it("PF não envia a chave condutores", () => {
    const [veiculo] = toMensalistaPayload({ ...form, tipoPessoa: "1", veiculos: [veiculoForm] }).veiculos;
    expect(veiculo).not.toHaveProperty("condutores");
  });

  it("sem veículos envia lista vazia (no PUT remove todos)", () => {
    expect(toMensalistaPayload(form).veiculos).toEqual([]);
  });

  it("resposta tolerante: veículos ausentes viram lista vazia e a placa é normalizada", () => {
    expect(fromMensalistaResponse({ nome: "X" }).veiculos).toEqual([]);
    const mensalista = fromMensalistaResponse({
      veiculos: [{ placa: "abc-1234", modelo: "Uno", cor: "Azul", categoria: 2, condutores: [{ nome: "Ana", cpf: "529.982.247-25" }] }],
      situacao: "Em Dia",
      dataProximoVencimento: "2026-11-05",
      diasAteProximoVencimento: 15,
    });
    expect(mensalista.veiculos[0]).toEqual({
      placa: "ABC1234",
      modelo: "Uno",
      cor: "Azul",
      categoria: 2,
      condutores: [{ nome: "Ana", cpf: "52998224725" }],
    });
    expect(mensalista.situacao).toBe("Em Dia");
    expect(mensalista.diasAteProximoVencimento).toBe(15);
  });

  it("resposta sem situação nem vencimento vira null", () => {
    const mensalista = fromMensalistaResponse({});
    expect(mensalista.situacao).toBeNull();
    expect(mensalista.dataProximoVencimento).toBeNull();
    expect(mensalista.diasAteProximoVencimento).toBeNull();
  });

  it("ida e volta: gera uid, mascara o CPF e preserva cor fora da lista", () => {
    const mensalista = fromMensalistaResponse({
      tipoPessoa: 2,
      veiculos: [
        { placa: "ABC1D23", modelo: "Fiorino", cor: "Branco", categoria: 3, condutores: [{ nome: "Ana", cpf: "52998224725" }] },
        { placa: "BRA2E19", modelo: "Kombi", cor: "Verde-musgo", categoria: 3, condutores: [] },
      ],
    });
    const { veiculos } = fromMensalista(mensalista);
    expect(veiculos[0]).toMatchObject({ placa: "ABC1D23", cor: "BRANCO", categoria: "3" });
    expect(veiculos[0].condutores[0]).toMatchObject({ nome: "Ana", cpf: "529.982.247-25" });
    expect(veiculos[0].uid).toBeTruthy();
    expect(veiculos[0].uid).not.toBe(veiculos[1].uid);
    expect(veiculos[1].cor).toBe("Verde-musgo");

    // O PUT reenvia o texto da cor intacto.
    const payload = toMensalistaPayload({ ...fromMensalista(mensalista), mensalistaTipoId: "1" });
    expect(payload.veiculos[1].cor).toBe("Verde-musgo");
  });
});
