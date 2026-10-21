import { describe, expect, it } from "vitest";
import { mapMensalistaServerError } from "./serverErrors";

const veiculos = [{ placa: "ABC1D23" }, { placa: "BRA-2E19" }, { placa: "" }];

describe("mapMensalistaServerError", () => {
  it("liga a mensagem ao veículo cuja placa ela cita", () => {
    expect(mapMensalistaServerError("A placa BRA2E19 pertence a outro mensalista.", veiculos)).toEqual({ index: 1 });
  });

  it("reconhece a placa com hífen, minúsculas e pontuação colada", () => {
    expect(mapMensalistaServerError("Placa abc-1d23, já cadastrada em outro mensalista", veiculos)).toEqual({ index: 0 });
    expect(mapMensalistaServerError("Placa (ABC1D23) inválida", veiculos)).toEqual({ index: 0 });
  });

  it("com mais de uma placa citada, fica com a primeira da lista", () => {
    expect(mapMensalistaServerError("Placas BRA2E19 e ABC1D23 repetidas", veiculos)).toEqual({ index: 0 });
  });

  it("mensagem sem placa conhecida cai no banner", () => {
    expect(mapMensalistaServerError("A categoria do veículo difere da do tipo.", veiculos)).toBeNull();
    expect(mapMensalistaServerError("A placa XYZ9K88 pertence a outro mensalista.", veiculos)).toBeNull();
  });

  it("não confunde palavras longas nem veículos sem placa", () => {
    expect(mapMensalistaServerError("Veículos duplicados", veiculos)).toBeNull();
    expect(mapMensalistaServerError("", [{ placa: "" }])).toBeNull();
  });
});
