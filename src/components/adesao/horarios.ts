import { BusinessHoursData, DayHours, DIAS_SEMANA } from "@/types/adesao";

const ABERTURA_PADRAO = "08:00";
const FECHAMENTO_PADRAO = "18:00";

const DOMINGO = 0;
const SEGUNDA = 1;
const SABADO = DIAS_SEMANA.length - 1;

const FECHADO: DayHours = {
  aberto: false,
  aberto24Horas: false,
  horarioAbertura: "",
  horarioFechamento: "",
};

const EXPEDIENTE: DayHours = {
  aberto: true,
  aberto24Horas: false,
  horarioAbertura: ABERTURA_PADRAO,
  horarioFechamento: FECHAMENTO_PADRAO,
};

const VINTE_E_QUATRO_HORAS: DayHours = {
  aberto: true,
  aberto24Horas: true,
  horarioAbertura: "",
  horarioFechamento: "",
};

// Índice = posição em DIAS_SEMANA (domingo a sábado). Todas as funções devolvem um novo objeto.
function porDia(dia: (index: number) => DayHours): BusinessHoursData {
  return { horarios: DIAS_SEMANA.map((_, index) => ({ ...dia(index) })) };
}

export function aplicarSegSex(): BusinessHoursData {
  return porDia((index) => (index === DOMINGO || index === SABADO ? FECHADO : EXPEDIENTE));
}

export function aplicarTodosOsDias(): BusinessHoursData {
  return porDia(() => EXPEDIENTE);
}

export function aplicar24Horas(): BusinessHoursData {
  return porDia(() => VINTE_E_QUATRO_HORAS);
}

// A segunda-feira é o ponto de partida para "copiar para os outros dias".
export function copiarSegunda(hours: BusinessHoursData): BusinessHoursData {
  const segunda = hours.horarios[SEGUNDA];
  return porDia(() => segunda);
}
