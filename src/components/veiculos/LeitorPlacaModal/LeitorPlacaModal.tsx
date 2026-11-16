"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ExplicacaoCamera, PassosLiberarCamera } from "@/components/camera/PermissaoCamera";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { formatPlacaExibicao, isValidPlaca, normalizePlaca } from "@/lib/placa";
import { Mira, Video, VisuallyHidden } from "../LeitorQrSaida/LeitorQrSaida.styles";
import {
  Acoes,
  CaractereEmDuvida,
  Conferencia,
  Content,
  Duvida,
  Mensagem,
  Moldura,
  PlacaLida,
  Pilula,
  Visor,
} from "./LeitorPlacaModal.styles";
import { useLeitorPlaca, type LeitorPlacaEstado } from "./useLeitorPlaca";
import { TECLADO_PLACA } from "@/lib/teclado/tipos";

export interface LeitorPlacaModalProps {
  open: boolean;
  onClose: () => void;
  // Placa confirmada pelo operador, já normalizada e válida.
  onConfirm: (placa: string) => void;
  // "Digitar": fecha e deixa o operador informar a placa à mão (por padrão, só fecha).
  onDigitar?: () => void;
  // Câmera negada ou indisponível: quem abriu o leitor assume (ex.: abre o teclado da placa). Quando informado, o leitor
  // não mostra a tela de erro da câmera; sem ele, mostra a explicação com "Tentar de novo" e "Digitar".
  onFalha?: (motivo: FalhaCamera) => void;
}

export type FalhaCamera = "negada" | "indisponivel";

const MENSAGENS: Record<Exclude<LeitorPlacaEstado, "indisponivel">, string> = {
  ocioso: "Preparando leitura…",
  abrindo: "Preparando leitura…",
  "pre-leitura": "Preparando leitura…",
  pedindo: "Aguardando a permissão da câmera…",
  lendo: "Aponte a câmera para a placa",
  negada: "Permita o acesso à câmera nas configurações do navegador e tente novamente.",
  "sem-leitura": "Não consegui ler a placa. Tente de novo ou digite.",
};

// Leitura certa: a mira fica verde por este tempo, o suficiente para o operador sentir a vibração, e o fluxo segue sozinho.
export const CONFIRMACAO_AUTOMATICA_MS = 500;

const MSG_INDISPONIVEL = "A câmera não está disponível neste aparelho ou navegador.";
const MSG_INSEGURO = "A câmera só funciona em conexão segura (HTTPS).";

// Estado novo a cada abertura: o conteúdo só existe enquanto o modal está aberto.
export function LeitorPlacaModal({ open, ...props }: LeitorPlacaModalProps) {
  if (!open) {
    return null;
  }
  return <LeitorPlacaAberto {...props} />;
}

function LeitorPlacaAberto({ onClose, onConfirm, onDigitar = onClose, onFalha }: Omit<LeitorPlacaModalProps, "open">) {
  const [etapa, setEtapa] = useState<"leitura" | "conferencia">("leitura");
  const [placa, setPlaca] = useState("");
  // Placa que acabou de ser lida: certa (segue sozinha) ou duvidosa (vai para a conferência com o caractere destacado).
  const [leitura, setLeitura] = useState<{ placa: string; duvida: number | null } | null>(null);
  const confirmacaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onConfirmRef = useRef(onConfirm);
  useEffect(() => {
    onConfirmRef.current = onConfirm;
  });
  useEffect(
    () => () => {
      if (confirmacaoRef.current) {
        clearTimeout(confirmacaoRef.current);
      }
    },
    [],
  );

  const { videoRef, estado, contextoSeguro, iniciar } = useLeitorPlaca({
    ativo: etapa === "leitura",
    onPlaca: (lida, info) => {
      const duvida = info?.duvida ?? null;
      setPlaca(lida);
      setLeitura({ placa: lida, duvida });
      if (duvida !== null) {
        setEtapa("conferencia");
        return;
      }
      confirmacaoRef.current = setTimeout(() => onConfirmRef.current(normalizePlaca(lida)), CONFIRMACAO_AUTOMATICA_MS);
    },
  });

  const placaValida = isValidPlaca(placa);

  // Avisa uma vez por abertura: tentar de novo dentro do leitor reabre a câmera sem repetir o aviso.
  const falhaAvisada = useRef(false);
  const falhaDaCamera: FalhaCamera | null = estado === "negada" || estado === "indisponivel" ? estado : null;
  useEffect(() => {
    if (onFalha && falhaDaCamera && !falhaAvisada.current) {
      falhaAvisada.current = true;
      onFalha(falhaDaCamera);
    }
  }, [falhaDaCamera, onFalha]);

  function handleConfirmar(event: FormEvent) {
    event.preventDefault();
    if (placaValida) {
      onConfirm(normalizePlaca(placa));
    }
  }

  // Quem abriu o leitor cuida da falha da câmera: nada de tela de erro entre a falha e a troca de tela.
  if (onFalha && falhaDaCamera) {
    return null;
  }

  // A conferência só mostra o destaque enquanto a placa é a que foi lida (depois de corrigida à mão, já não há dúvida).
  const duvidaNaPlaca = leitura && leitura.duvida !== null && placa === leitura.placa ? leitura.duvida : null;

  if (etapa === "conferencia") {
    return (
      <Modal
        open
        title="Confirmar placa"
        onClose={onClose}
        closeOnBackdrop={false}
        footer={
          <Acoes>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setLeitura(null);
                setEtapa("leitura");
              }}
            >
              Ler de novo
            </Button>
            <Button type="submit" form="confirmar-placa" disabled={!placaValida}>
              Usar placa
            </Button>
          </Acoes>
        }
      >
        <Conferencia id="confirmar-placa" onSubmit={handleConfirmar}>
          <PlacaLida>
            <PlateDisplay value={placa} />
          </PlacaLida>
          {duvidaNaPlaca !== null && (
            <Duvida role="status">
              Confira o {duvidaNaPlaca + 1}º caractere:{" "}
              {Array.from(leitura?.placa ?? "").map((caractere, indice) =>
                indice === duvidaNaPlaca ? <CaractereEmDuvida key={indice}>{caractere}</CaractereEmDuvida> : caractere,
              )}
            </Duvida>
          )}
          <Input
            label="Placa lida"
            hint="Confira se a placa está correta e corrija se precisar."
            value={placa}
            onChange={(event) => setPlaca(normalizePlaca(event.target.value))}
            maxLength={7}
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            teclado={TECLADO_PLACA}
          />
        </Conferencia>
      </Modal>
    );
  }

  const falhou = estado === "sem-leitura" || estado === "negada" || estado === "indisponivel";
  const mensagemDaCamera = estado === "indisponivel" ? (contextoSeguro ? MSG_INDISPONIVEL : MSG_INSEGURO) : MENSAGENS[estado];
  const mensagem = leitura !== null && leitura.duvida === null ? `Placa lida: ${formatPlacaExibicao(leitura.placa)}` : mensagemDaCamera;
  // Sem câmera, tentar de novo não adianta; nos demais erros sim.
  const podeTentarDeNovo = estado === "sem-leitura" || estado === "negada";
  // Câmera abrindo: o visor fica limpo (só a mira). Com a imagem já na tela e o leitor carregando, o aviso é uma pílula
  // sobre a imagem, não um texto grande sob ela.
  const avisoSobreImagem = estado === "pre-leitura" && leitura === null;
  const mensagemVisivel = estado !== "ocioso" && estado !== "abrindo" && !avisoSobreImagem && leitura === null;
  // Leitura certa: a mira fica verde e diz a placa lida até o fluxo seguir sozinho.
  const placaLidaCerta = leitura !== null && leitura.duvida === null ? formatPlacaExibicao(leitura.placa) : null;
  const tomDaMira = placaLidaCerta ? "ok" : falhou ? "invalido" : "neutro";

  return (
    <Modal
      open
      title="Ler placa"
      onClose={onClose}
      closeOnBackdrop={false}
      footer={
        <Acoes>
          {falhou ? (
            <>
              {podeTentarDeNovo && (
                <Button type="button" onClick={iniciar}>
                  Tentar de novo
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={onDigitar}>
                Digitar
              </Button>
            </>
          ) : (
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
          )}
        </Acoes>
      }
    >
      <Content>
        <Visor $tom={placaLidaCerta ? "ok" : "neutro"}>
          <Video ref={videoRef} playsInline muted />
          <Moldura aria-hidden="true">
            <Mira $canto="tl" $tom={tomDaMira} />
            <Mira $canto="tr" $tom={tomDaMira} />
            <Mira $canto="bl" $tom={tomDaMira} />
            <Mira $canto="br" $tom={tomDaMira} />
          </Moldura>
          {avisoSobreImagem && <Pilula aria-hidden="true">{mensagem}</Pilula>}
        </Visor>
        {estado === "pedindo" && <ExplicacaoCamera motivo="ler a placa do veículo" />}
        {estado === "negada" && <PassosLiberarCamera />}
        {(mensagemVisivel || placaLidaCerta !== null) && <Mensagem aria-hidden="true">{mensagem}</Mensagem>}
        <VisuallyHidden role="status" aria-live="polite">
          {mensagem}
        </VisuallyHidden>
      </Content>
    </Modal>
  );
}
