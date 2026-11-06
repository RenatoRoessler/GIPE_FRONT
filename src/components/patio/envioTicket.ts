import { isValidEmail } from "@/lib/email";
import { isValidPhone } from "@/lib/phone";

export type CanalEnvio = "whatsapp" | "email";

export interface DadosEnvio {
  placa: string;
  estacionamento?: string;
  link: string;
}

// Código do Brasil: o produto não atende outros países, então o popup não pede o DDI.
const DDI_BRASIL = "55";

export function mensagemDoTicket({ placa, estacionamento, link }: DadosEnvio): string {
  const local = estacionamento ? ` no ${estacionamento}` : "";
  return `Olá! Segue o ticket do veículo ${placa}${local}: ${link}`;
}

export function assuntoDoEmail({ placa, estacionamento }: Pick<DadosEnvio, "placa" | "estacionamento">): string {
  return `Ticket de entrada — ${placa}${estacionamento ? ` · ${estacionamento}` : ""}`;
}

export function hrefDoEnvio(canal: CanalEnvio, contato: string, dados: DadosEnvio): string {
  const mensagem = encodeURIComponent(mensagemDoTicket(dados));
  if (canal === "whatsapp") {
    return `https://wa.me/${DDI_BRASIL}${contato.replace(/\D/g, "")}?text=${mensagem}`;
  }
  return `mailto:${contato.trim()}?subject=${encodeURIComponent(assuntoDoEmail(dados))}&body=${mensagem}`;
}

// Mensagem de erro do contato para o canal, ou null quando está válido.
export function validarContato(canal: CanalEnvio, valor: string): string | null {
  if (canal === "whatsapp") {
    return isValidPhone(valor) ? null : "Informe o WhatsApp com DDD.";
  }
  return isValidEmail(valor) ? null : "Informe um e-mail válido, como nome@dominio.com.";
}
