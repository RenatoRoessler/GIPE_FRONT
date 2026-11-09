"use client";

import { appInstalado, passosParaLiberarCamera } from "@/lib/permissaoCamera";
import { Caixa, Passos, Texto, Titulo } from "./PermissaoCamera.styles";

export interface ExplicacaoCameraProps {
  // Para que a câmera será usada, ex.: "ler a placa do veículo".
  motivo: string;
}

// Mostrada enquanto o navegador pergunta: quem entende o motivo tende a tocar em Permitir.
export function ExplicacaoCamera({ motivo }: ExplicacaoCameraProps) {
  return (
    <Caixa role="group" aria-label="Permissão da câmera">
      <Titulo>Vamos usar a câmera</Titulo>
      <Texto>
        A câmera serve só para {motivo}. Nada é gravado. Na janela do navegador, toque em <strong>Permitir</strong>.
      </Texto>
    </Caixa>
  );
}

// Câmera bloqueada: o navegador não pergunta de novo, então o usuário precisa liberar nas configurações do site.
export function PassosLiberarCamera() {
  const passos = passosParaLiberarCamera(typeof navigator === "undefined" ? "" : navigator.userAgent, appInstalado());
  return (
    <Caixa role="group" aria-label="Como liberar a câmera">
      <Titulo>A câmera está bloqueada</Titulo>
      <Passos>
        {passos.map((passo) => (
          <li key={passo}>{passo}</li>
        ))}
      </Passos>
      <Texto>Depois, toque em Tentar de novo.</Texto>
    </Caixa>
  );
}
