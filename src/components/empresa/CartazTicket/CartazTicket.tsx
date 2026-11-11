"use client";

import { ThemeProvider } from "styled-components";
import { Logo } from "@/components/ui/Logo";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { QrCode } from "@/components/ui/QrCode";
import { darkTheme, lightTheme } from "@/styles/theme";
import { IconeCamera, IconeCelular, IconePapelRiscado, IconeUsuarioRiscado } from "./CartazIcons";
import {
  Beneficios,
  Body,
  Content,
  FaixaAmarela,
  Header,
  Lead,
  Marca,
  Marcador,
  Numero,
  Passo,
  Passos,
  PassoTexto,
  PlacaExemplo,
  PrintStyles,
  QrCard,
  QrLegenda,
  QrRotulo,
  Root,
  Rodape,
  Selo,
  Title,
} from "./CartazTicket.styles";

export interface CartazTicketProps {
  // Endereço da consulta pública da empresa: é o que o QR code abre.
  link: string;
}

// O QR deixa a leitura de 1 a 2 metros: 220 px a 96 dpi são cerca de 58 mm, acima do mínimo de 5 cm.
const QR_SIZE = 220;

// Cartaz A4 do ticket digital. É um objeto de marca: sai sempre no tema claro, qualquer que seja o tema do aparelho,
// e só existe na impressão (o nó `#cartaz-print-root` fica oculto na tela).
export function CartazTicket({ link }: CartazTicketProps) {
  return (
    <ThemeProvider theme={lightTheme}>
      <PrintStyles />
      <Root id="cartaz-print-root">
        <ThemeProvider theme={darkTheme}>
          <Header>
            <Logo align="start" size={48} />
            <Selo>Ticket digital</Selo>
          </Header>
        </ThemeProvider>

        <Content>
          <div>
            <Title>
              Seu ticket <br />
              está no <Marcador>celular.</Marcador>
            </Title>
            <Lead>Aqui não tem papel para perder. Acompanhe o tempo e o valor do seu estacionamento direto na tela do celular.</Lead>
          </div>

          <Body>
            <Passos>
              <Passo>
                <Numero aria-hidden="true">1</Numero>
                <PassoTexto>
                  <h2>Aponte a câmera</h2>
                  <p>Abra a câmera do celular e mire no QR Code ao lado. Toque no link que aparecer.</p>
                </PassoTexto>
              </Passo>
              <Passo>
                <Numero aria-hidden="true">2</Numero>
                <PassoTexto>
                  <h2>Digite a placa</h2>
                  <p>Informe a placa do seu veículo, do jeito que está nele.</p>
                  <PlacaExemplo>
                    <PlateDisplay value="MUR3L26" size="sm" />
                  </PlacaExemplo>
                </PassoTexto>
              </Passo>
              <Passo>
                <Numero aria-hidden="true">3</Numero>
                <PassoTexto>
                  <h2>Pronto, acompanhe</h2>
                  <p>Veja a hora de entrada, o tempo e o valor. Na saída, mostre o ticket ao operador.</p>
                </PassoTexto>
              </Passo>
            </Passos>

            <QrCard>
              <QrRotulo>Aponte a câmera</QrRotulo>
              <QrCode value={link} label="QR code para consultar o ticket" size={QR_SIZE} />
              <QrLegenda>
                <IconeCamera />
                Use a câmera do celular
              </QrLegenda>
            </QrCard>
          </Body>

          <Beneficios>
            <li>
              <IconeCelular />
              Sem baixar app
            </li>
            <li>
              <IconeUsuarioRiscado />
              Sem cadastro
            </li>
            <li>
              <IconePapelRiscado />
              Sem papel
            </li>
          </Beneficios>

          <Rodape>
            <div>
              <h2>Dúvidas? Fale com o operador.</h2>
              <p>Ele também mostra o ticket na tela dele para você fotografar.</p>
            </div>
            <Marca>
              <Logo align="start" size={32} />
              <span>murel.com.br</span>
            </Marca>
          </Rodape>
        </Content>
        <FaixaAmarela />
      </Root>
    </ThemeProvider>
  );
}
