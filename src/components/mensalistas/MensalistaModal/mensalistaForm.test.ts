import { describe, expect, it } from "vitest";
import type { CondutorFormValues, VeiculoFormValues } from "@/types/mensalista";
import {
  ajustarCategorias,
  categoriaDoTipo,
  mesclarCondutores,
  novoVeiculo,
  resumoVeiculo,
  tituloVeiculo,
  veiculoVazio,
} from "./mensalistaForm";

const condutor = (cpf: string, nome = "Ana", uid = cpf): CondutorFormValues => ({ uid, nome, cpf });
const veiculo = (extra: Partial<VeiculoFormValues> = {}): VeiculoFormValues => ({
  uid: "v1",
  placa: "",
  modelo: "",
  cor: "PRATA",
  categoria: "",
  condutores: [],
  ...extra,
});

describe("novoVeiculo", () => {
  it("pessoa jurídica já nasce com um condutor em branco", () => {
    const novo = novoVeiculo({ juridica: true, categoriaTipo: 99 });
    expect(novo.condutores).toHaveLength(1);
    expect(novo.condutores[0]).toMatchObject({ nome: "", cpf: "" });
  });

  it("pessoa física nasce sem condutores", () => {
    expect(novoVeiculo({ juridica: false, categoriaTipo: null }).condutores).toEqual([]);
  });

  it("usa a categoria do tipo específico; com 'todas' ou sem tipo deixa para escolher", () => {
    expect(novoVeiculo({ juridica: false, categoriaTipo: 2 }).categoria).toBe("2");
    expect(novoVeiculo({ juridica: false, categoriaTipo: 99 }).categoria).toBe("");
    expect(novoVeiculo({ juridica: false, categoriaTipo: null }).categoria).toBe("");
  });

  it("gera um uid diferente a cada veículo", () => {
    const a = novoVeiculo({ juridica: false, categoriaTipo: null });
    const b = novoVeiculo({ juridica: false, categoriaTipo: null });
    expect(a.uid).not.toBe(b.uid);
  });
});

describe("categoriaDoTipo", () => {
  it("só tipos específicos definem a categoria", () => {
    expect(categoriaDoTipo(3)).toBe("3");
    expect(categoriaDoTipo(99)).toBe("");
    expect(categoriaDoTipo(null)).toBe("");
  });
});

describe("veiculoVazio", () => {
  it("vazio: só os padrões e condutores em branco", () => {
    expect(veiculoVazio(veiculo({ condutores: [condutor("", "")] }))).toBe(true);
  });

  it("com placa, modelo ou condutor preenchidos não é vazio", () => {
    expect(veiculoVazio(veiculo({ placa: "ABC1D23" }))).toBe(false);
    expect(veiculoVazio(veiculo({ modelo: "Gol" }))).toBe(false);
    expect(veiculoVazio(veiculo({ condutores: [condutor("", "Ana")] }))).toBe(false);
  });
});

describe("ajustarCategorias", () => {
  const veiculos = [veiculo({ uid: "a", categoria: "2" }), veiculo({ uid: "b", categoria: "5" })];

  it("tipo específico: todos os veículos passam a ter a categoria dele", () => {
    const resultado = ajustarCategorias(veiculos, 3);
    expect(resultado.alterou).toBe(true);
    expect(resultado.veiculos.map((item) => item.categoria)).toEqual(["3", "3"]);
  });

  it("não avisa quando nada mudou", () => {
    const resultado = ajustarCategorias([veiculo({ categoria: "3" })], 3);
    expect(resultado.alterou).toBe(false);
  });

  it("tipo 'todas' preserva as categorias que já estavam", () => {
    const resultado = ajustarCategorias(veiculos, 99);
    expect(resultado.alterou).toBe(false);
    expect(resultado.veiculos).toBe(veiculos);
  });
});

describe("mesclarCondutores", () => {
  it("soma os condutores do outro veículo sem repetir CPF, mesmo com máscara diferente", () => {
    const destino = [condutor("529.982.247-25", "Ana")];
    const origem = [condutor("52998224725", "Ana (repetida)"), condutor("111.444.777-35", "Bruno")];
    const resultado = mesclarCondutores(destino, origem);
    expect(resultado.map((item) => item.nome)).toEqual(["Ana", "Bruno"]);
  });

  it("descarta a linha em branco do destino", () => {
    const resultado = mesclarCondutores([condutor("", "")], [condutor("111.444.777-35", "Bruno")]);
    expect(resultado.map((item) => item.nome)).toEqual(["Bruno"]);
  });

  it("copia com uids novos para não colidir com o veículo de origem", () => {
    const origem = [condutor("111.444.777-35", "Bruno", "u-origem")];
    expect(mesclarCondutores([], origem)[0].uid).not.toBe("u-origem");
  });

  it("sem nada a copiar mantém o destino como estava", () => {
    const destino = [condutor("", "")];
    expect(mesclarCondutores(destino, [condutor("", "")])).toBe(destino);
  });
});

describe("título e resumo do veículo", () => {
  it("título usa a placa normalizada ou 'Novo veículo'", () => {
    expect(tituloVeiculo(veiculo())).toBe("Novo veículo");
    expect(tituloVeiculo(veiculo({ placa: "abc-1d23" }))).toBe("ABC1D23");
  });

  it("resumo junta modelo, cor e categoria, ignorando o que falta", () => {
    expect(resumoVeiculo(veiculo({ modelo: "Gol", categoria: "2" }))).toBe("Gol · Prata · Carro pequeno");
    expect(resumoVeiculo(veiculo({ cor: "Verde-musgo" }))).toBe("Verde-musgo");
  });
});
