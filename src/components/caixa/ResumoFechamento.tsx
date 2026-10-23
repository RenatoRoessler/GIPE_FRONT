"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import type { Turno } from "@/types/caixa";
import { FieldStack, ResumoTitulo } from "./Caixa.styles";
import { Diferenca } from "./Diferenca";
import { formaPagamentoLabel, formatDateTime, formatMoeda } from "./format";
import { baixarComprovanteTurnoPdf } from "./pdf/comprovanteTurnoPdf";
import type { EmpresaPdf } from "./pdf/modelos";
import { useEmpresaPdf } from "./useEmpresaPdf";

export interface ResumoFechamentoProps {
  tipo: "fechamento" | "passagem";
  // Turno encerrado, com esperado, informado e diferença por forma de pagamento.
  turno: Turno;
  // Passagem: quem assume o turno (aparece no comprovante).
  novoResponsavel?: string | null;
  onConcluir: () => void;
  // Para teste e uso fora da árvore de dados; por padrão busca a empresa quando o perfil pode.
  empresa?: EmpresaPdf;
  // Troca a geração do PDF (testes).
  gerarPdf?: typeof baixarComprovanteTurnoPdf;
}

// Mostrado no lugar do formulário quando o caixa é fechado ou o turno é passado: o que foi conferido e o que sobrou ou faltou.
export function ResumoFechamento({ tipo, turno, novoResponsavel = null, onConcluir, empresa, gerarPdf = baixarComprovanteTurnoPdf }: ResumoFechamentoProps) {
  const empresaDoPerfil = useEmpresaPdf();
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [gerando, setGerando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const titulo = tipo === "fechamento" ? "Caixa fechado" : "Turno passado";

  // Depois do sucesso o foco vai para o resumo, para o leitor de tela anunciar o resultado.
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  async function baixar() {
    setGerando(true);
    setFalhou(false);
    try {
      await gerarPdf({ tipo, turno, novoResponsavel, empresa: empresa ?? empresaDoPerfil });
    } catch {
      setFalhou(true);
    } finally {
      setGerando(false);
    }
  }

  return (
    <Modal
      open
      title={titulo}
      size="lg"
      onClose={onConcluir}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={() => void baixar()} disabled={gerando}>
            {gerando ? "Gerando…" : "Baixar comprovante (PDF)"}
          </Button>
          <Button type="button" onClick={onConcluir}>
            Concluir
          </Button>
        </>
      }
    >
      <FieldStack>
        <ResumoTitulo ref={tituloRef} tabIndex={-1}>
          Resumo do turno de {turno.usuario}
        </ResumoTitulo>
        <Text variant="muted">
          {formatDateTime(turno.dataHoraInicio)} até {formatDateTime(turno.dataHoraFim)} · fundo do turno {formatMoeda(turno.valorFundoCaixa)}
          {novoResponsavel ? ` · assume ${novoResponsavel}` : ""}
        </Text>
        {falhou && <ErrorBanner role="alert">Não foi possível gerar o comprovante. Tente novamente.</ErrorBanner>}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell head>Forma de pagamento</TableCell>
              <TableCell head align="right">
                Esperado
              </TableCell>
              <TableCell head align="right">
                Informado
              </TableCell>
              <TableCell head align="right">
                Diferença
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {turno.formasPagamento.map((forma) => (
              <TableRow key={forma.formaPagamento}>
                <TableCell data-label="Forma de pagamento">{forma.descricao || formaPagamentoLabel(forma.formaPagamento)}</TableCell>
                <TableCell align="right" numeric data-label="Esperado">
                  {formatMoeda(forma.valorEsperado)}
                </TableCell>
                <TableCell align="right" numeric data-label="Informado">
                  {forma.valorInformado === null ? "—" : formatMoeda(forma.valorInformado)}
                </TableCell>
                <TableCell align="right" numeric data-label="Diferença">
                  <Diferenca value={forma.diferenca} />
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell data-label="Total">
                <strong>Total</strong>
              </TableCell>
              <TableCell align="right" numeric data-label="Esperado">
                <strong>{formatMoeda(turno.saldoCaixa)}</strong>
              </TableCell>
              <TableCell align="right" numeric data-label="Informado">
                <strong>{turno.saldoCaixaInformado === null ? "—" : formatMoeda(turno.saldoCaixaInformado)}</strong>
              </TableCell>
              <TableCell align="right" numeric data-label="Diferença">
                <Diferenca value={turno.totalDiferenca} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Text variant="muted">No dinheiro, os valores não incluem o fundo de caixa.</Text>
        {turno.observacao && <Text>Observação: {turno.observacao}</Text>}
      </FieldStack>
    </Modal>
  );
}
