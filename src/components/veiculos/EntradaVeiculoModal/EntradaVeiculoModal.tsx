"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useConfiguracao } from "@/components/configuracoes/useConfiguracao";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { formatDateTime, formatTime } from "@/components/caixa/format";
import { Button } from "@/components/ui/Button";
import { CameraButton } from "@/components/ui/CameraButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Link } from "@/components/ui/Link";
import { Modal } from "@/components/ui/Modal";
import { MEDIA_TOQUE } from "@/components/teclado/useTecladoCampo";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { usePatio } from "@/components/patio/usePatio";
import { EscolherGancho } from "@/components/quadros/EscolherGancho";
import { ApiError } from "@/lib/api/errors";
import { registrarEntrada } from "@/lib/api/services/patio";
import { isValidPlaca, normalizePlaca } from "@/lib/placa";
import { PRISMA_INTERVALO_MESSAGE, prismaDoTexto } from "@/lib/prisma";
import { prismaExigido } from "@/lib/schemas/regrasEntrada";
import { criarEntradaVeiculoSchema, type EntradaVeiculoValues } from "@/lib/schemas/veiculo";
import {
  CATEGORIA_VEICULO,
  CATEGORIA_VEICULO_OPTIONS,
  CORES_VEICULO,
  matchCor,
  type EntradaRegistrada,
} from "@/types/veiculo";
import { CardMensalista } from "../CardMensalista";
import { CategoriaIcon } from "../categoriaIcons";
import { LeitorPlacaModal } from "../LeitorPlacaModal";
import { ReciboEntradaStep } from "../ReciboEntradaStep";
import { ModeloField } from "../ModeloField";
import { useModelos } from "../useModelos";
import { usePlacaLookup, type PlacaLookupStatus } from "../usePlacaLookup";
import { Confirmacao, Form, JaNoPatio, Pendencia } from "./EntradaVeiculoModal.styles";

export interface EntradaVeiculoModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const CATEGORIAS = CATEGORIA_VEICULO_OPTIONS.map((option) => String(option.value));

// Carros do menor para o maior, depois moto e utilitários (o carro médio é o mais comum no pátio).
const ORDEM_CATEGORIAS: number[] = [
  CATEGORIA_VEICULO.CarroPequeno,
  CATEGORIA_VEICULO.CarroMedio,
  CATEGORIA_VEICULO.CarroGrande,
  CATEGORIA_VEICULO.Moto,
  CATEGORIA_VEICULO.Caminhonete,
  CATEGORIA_VEICULO.Caminhao,
];

const CATEGORIA_OPTIONS = [...CATEGORIA_VEICULO_OPTIONS]
  .sort((a, b) => ORDEM_CATEGORIAS.indexOf(a.value) - ORDEM_CATEGORIAS.indexOf(b.value))
  .map((option) => ({
  value: String(option.value),
  label: option.label,
  icon: <CategoriaIcon categoria={option.value} />,
}));

function placaHint(status: PlacaLookupStatus): { hint?: string; tone?: "muted" | "success" | "danger" } {
  switch (status.state) {
    case "loading":
      return { hint: "Consultando placa…", tone: "muted" };
    case "found":
      return { hint: "Dados do cadastro preenchidos.", tone: "success" };
    case "not_found":
      return { hint: "Placa sem cadastro: preencha o modelo e escolha a categoria.", tone: "muted" };
    case "error":
      return { hint: "Não foi possível consultar a placa. Preencha os dados manualmente.", tone: "danger" };
    default:
      return {};
  }
}

// "categoria", "categoria e cor", "categoria, modelo e cor".
function listaEmPortugues(itens: string[]): string {
  return itens.length > 1 ? `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}` : (itens[0] ?? "");
}

// O back devolve um texto genérico ("Um ou mais erros ocorreram") e as mensagens de verdade em `errors`.
function mensagensDoErro(error: Error): string[] {
  const detalhes: string[] = [];
  const erros = error instanceof ApiError ? error.details : undefined;
  if (Array.isArray(erros)) {
    // Regras de negócio: [{ code, message }].
    for (const erro of erros) {
      if (erro.message) {
        detalhes.push(erro.message);
      }
    }
  } else if (erros) {
    // Validação do modelo: { campo: [mensagens] }.
    detalhes.push(...Object.values(erros).flat());
  }
  return detalhes.length > 0 ? detalhes : [error.message];
}

export function EntradaVeiculoModal({ onClose, onSuccess }: EntradaVeiculoModalProps) {
  const formId = useId();
  const pendenciaId = useId();
  const { status, cadastro, lookup, reset: resetLookup } = usePlacaLookup();
  // Com a entrada registrada, o modal passa do formulário para a escolha do gancho da chave e, depois, para o comprovante.
  const [entrada, setEntrada] = useState<EntradaRegistrada | null>(null);
  const [etapaGancho, setEtapaGancho] = useState(true);
  const irParaRecibo = useCallback(() => setEtapaGancho(false), []);

  // O que a consulta da placa preencheu (e que ainda não foi mexido): sai junto quando a placa muda.
  const autoPreenchido = useRef<{ modelo?: string; cor?: string; categoria?: string }>({});
  // Cor do cadastro que não existe na lista de cores: aparece como texto, sem escolher outra no lugar.
  const [corForaDaLista, setCorForaDaLista] = useState<string | null>(null);

  // O que a empresa exige (modelo, cor e prisma). O prisma não vale para mensalista, que pode entrar sem ele.
  const { configuracao } = useConfiguracao();
  const mensalista = cadastro?.mensalista === true;
  const { modelo: exigeModelo, cor: exigeCor, prisma: exigePrismaDaEmpresa } = configuracao;
  const regras = useMemo(
    () => ({ modelo: exigeModelo, cor: exigeCor, prisma: exigePrismaDaEmpresa, mensalista }),
    [exigeModelo, exigeCor, exigePrismaDaEmpresa, mensalista],
  );
  const schema = useMemo(() => criarEntradaVeiculoSchema(regras), [regras]);
  const exigePrisma = prismaExigido(regras);

  const queryClient = useQueryClient();
  const mutation = useMutation({
    // O código do ticket é gerado pelo backend.
    mutationFn: (values: EntradaVeiculoValues) =>
      registrarEntrada({
        placa: normalizePlaca(values.placa),
        categoria: Number(values.categoria),
        // Quem decide é o cadastro da placa: fora do plano contratado o back devolve false e a entrada é rotativa.
        mensalista,
        // Campo que a empresa não exige não aparece no formulário e não vai (mesmo que a consulta da placa o tenha preenchido).
        ...(exigeModelo && values.modelo.trim() !== "" ? { modelo: values.modelo.trim() } : {}),
        ...(exigeCor && values.cor !== "" ? { cor: values.cor } : {}),
        ...(exigePrisma && prismaDoTexto(values.prisma) !== null ? { prisma: prismaDoTexto(values.prisma) as number } : {}),
      }),
    onSuccess: (registrada) => {
      setEntrada(registrada);
      // O veículo entrou no pátio: a lista do pátio precisa mostrá-lo.
      void queryClient.invalidateQueries({ queryKey: PATIO_QUERY_KEY });
    },
  });

  const form = useAppForm({
    defaultValues: { placa: "", categoria: "", modelo: "", cor: "", prisma: "" } as EntradaVeiculoValues,
    validators: {
      onChange: ({ value }) => {
        const result = schema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    // Só chega aqui com o schema satisfeito (a cor já está escolhida, se a empresa a exige).
    onSubmit: ({ value }) => mutation.mutate(schema.parse(value)),
  });

  const hasChanges = useStore(
    form.store,
    ({ values }) => values.placa !== "" || values.categoria !== "" || values.modelo !== "" || values.cor !== "" || values.prisma !== "",
  );
  const placaAtual = useStore(form.store, ({ values }) => values.placa);
  const categoriaAtual = useStore(form.store, ({ values }) => values.categoria);
  const modeloAtual = useStore(form.store, ({ values }) => values.modelo);
  const corAtual = useStore(form.store, ({ values }) => values.cor);
  const prismaAtual = useStore(form.store, ({ values }) => values.prisma);
  // Placa que já está no pátio: a lista já é a do Pátio (mesma consulta), atualizada ao abrir o modal.
  const { data: patio } = usePatio({ pausado: true });
  const placaNormalizada = normalizePlaca(placaAtual);
  const jaNoPatio = isValidPlaca(placaNormalizada) ? patio?.find((veiculo) => veiculo.placa === placaNormalizada) : undefined;
  // Placa e categoria sempre; modelo, cor e prisma conforme a empresa: o rodapé diz o que falta.
  const faltando = [
    exigeModelo && modeloAtual.trim() === "" && "modelo",
    !CATEGORIAS.includes(categoriaAtual) && "categoria",
    exigeCor && corAtual === "" && "cor",
    exigePrisma && prismaAtual.trim() === "" && "prisma",
  ].filter((item): item is string => item !== false);
  const prismaInvalido = exigePrisma && prismaAtual.trim() !== "" && prismaDoTexto(prismaAtual) === null;
  const motivoPendente = jaNoPatio
    ? "Esta placa já está no pátio."
    : !isValidPlaca(placaAtual)
      ? "Informe a placa completa."
      : faltando.length > 0
        ? `Falta: ${listaEmPortugues(faltando)}.`
        : prismaInvalido
          ? `${PRISMA_INTERVALO_MESSAGE}.`
          : null;
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [leitorAberto, setLeitorAberto] = useState(false);
  // No celular a leitura da placa pela câmera já abre junto com a tela. Abre depois que o modal da entrada
  // está aberto: um modal aberto antes ficaria por baixo dele, escondendo a câmera e o pedido de permissão.
  useEffect(() => {
    if (typeof window.matchMedia !== "function" || !window.matchMedia(MEDIA_TOQUE).matches) {
      return;
    }
    const timer = setTimeout(() => setLeitorAberto(true), 0);
    return () => clearTimeout(timer);
  }, []);
  const { data: modelos = [] } = useModelos();

  // O listener do campo pode ser recriado a cada render; a ref garante a lista mais recente.
  const modelosRef = useRef(modelos);
  useEffect(() => {
    modelosRef.current = modelos;
  }, [modelos]);

  const isSending = mutation.isPending;

  function handleConcluir() {
    onSuccess("Entrada registrada.");
    onClose();
  }

  function handleClose() {
    // A entrada já foi registrada: fechar o comprovante não descarta nada.
    if (entrada) {
      handleConcluir();
      return;
    }
    if (isSending) {
      return;
    }
    // Com dados em andamento, pede confirmação antes de descartar.
    if (hasChanges) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  async function handlePlacaBlur(rawPlaca: string) {
    const placa = normalizePlaca(rawPlaca);
    if (!isValidPlaca(placa)) {
      return;
    }
    const cadastro = await lookup(placa);
    // Descarta a resposta se a placa mudou enquanto a consulta estava em andamento.
    if (!cadastro || normalizePlaca(form.getFieldValue("placa")) !== placa) {
      return;
    }
    const preenchido: typeof autoPreenchido.current = {};
    if (cadastro.modelo) {
      form.setFieldValue("modelo", cadastro.modelo, { dontRunListeners: true });
      preenchido.modelo = cadastro.modelo;
    }
    // A cor do cadastro é texto livre: só vale se for uma das cores da lista; senão aparece como texto.
    const cor = matchCor(cadastro.cor);
    if (cor) {
      form.setFieldValue("cor", cor);
      preenchido.cor = cor;
    }
    setCorForaDaLista(!cor && cadastro.cor ? cadastro.cor : null);
    if (cadastro.categoria !== null && CATEGORIAS.includes(String(cadastro.categoria))) {
      form.setFieldValue("categoria", String(cadastro.categoria));
      preenchido.categoria = String(cadastro.categoria);
    }
    autoPreenchido.current = preenchido;
  }

  // Trocou a placa: o que veio do cadastro da anterior sai, para não registrar a categoria (e a tarifa) de outro veículo.
  // O que o operador digitou ou mudou à mão fica.
  function limparPreenchidos() {
    const auto = autoPreenchido.current;
    autoPreenchido.current = {};
    setCorForaDaLista(null);
    if (auto.modelo !== undefined && form.getFieldValue("modelo") === auto.modelo) {
      form.setFieldValue("modelo", "", { dontRunListeners: true });
    }
    if (auto.cor !== undefined && form.getFieldValue("cor") === auto.cor) {
      form.setFieldValue("cor", "");
    }
    if (auto.categoria !== undefined && form.getFieldValue("categoria") === auto.categoria) {
      form.setFieldValue("categoria", "");
    }
  }

  // Com tudo pronto o Enter registra. Senão leva ao primeiro campo que falta, em vez de disparar os erros do formulário.
  function handlePlacaKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || motivoPendente === null) {
      return;
    }
    event.preventDefault();
    if (jaNoPatio) {
      return;
    }
    const formulario = document.getElementById(formId);
    const grupos = Array.from(formulario?.querySelectorAll<HTMLFieldSetElement>("fieldset") ?? []);
    const primeiroRadio = (grupo?: HTMLFieldSetElement) => {
      const radios = Array.from(grupo?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? []);
      return radios.find((radio) => radio.checked) ?? radios[0];
    };
    const alvo =
      exigeModelo && modeloAtual.trim() === ""
        ? formulario?.querySelector<HTMLInputElement>('input[role="combobox"]')
        : !CATEGORIAS.includes(categoriaAtual)
          ? primeiroRadio(grupos[0])
          : primeiroRadio(grupos[grupos.length - 1]);
    alvo?.focus();
  }

  function handlePlacaLida(placa: string) {
    setLeitorAberto(false);
    // Mesmo caminho da digitação: preenche o campo e consulta o cadastro da placa, sem registrar nada.
    form.setFieldValue("placa", placa);
    void handlePlacaBlur(placa);
  }

  function handleDigitarPlaca() {
    setLeitorAberto(false);
    // O modal devolve o foco ao botão que o abriu ao fechar; o campo da placa toma o foco logo depois.
    setTimeout(() => document.getElementById(formId)?.querySelector<HTMLInputElement>('input[name="placa"]')?.focus());
  }

  function handleModeloChange(texto: string) {
    const nome = texto.trim().toLowerCase();
    const sugestao = modelosRef.current.find((modelo) => modelo.nome.toLowerCase() === nome);
    if (sugestao && CATEGORIAS.includes(String(sugestao.categoria))) {
      form.setFieldValue("categoria", String(sugestao.categoria));
    }
  }

  const { hint, tone } = placaHint(status);

  return (
    <Modal
      open
      title={entrada && etapaGancho ? "Quadro de chaves" : "Registrar entrada"}
      size={entrada && !etapaGancho ? "lg" : "md"}
      onClose={handleClose}
      closeOnBackdrop={false}
      footer={
        entrada ? undefined : (
          <>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form={formId}
              disabled={isSending || motivoPendente !== null}
              aria-describedby={motivoPendente ? pendenciaId : undefined}
            >
              {isSending ? "Registrando..." : "Registrar entrada"}
            </Button>
            {motivoPendente && !isSending && <Pendencia id={pendenciaId}>{motivoPendente}</Pendencia>}
          </>
        )
      }
    >
      {entrada && etapaGancho ? (
        <>
          {/* O mesmo número do comprovante: o back pode devolver `codigoTicket` nulo. */}
          <Confirmacao role="status">
            {`Entrada registrada · Ticket nº ${entrada.sequencial} · ${formatTime(entrada.dataHoraEntrada)}`}
          </Confirmacao>
          <EscolherGancho
            patioId={entrada.patioId}
            placa={entrada.placa}
            modelo={entrada.modelo}
            cor={entrada.cor}
            onGuardado={irParaRecibo}
            onPular={irParaRecibo}
          />
        </>
      ) : entrada ? (
        <ReciboEntradaStep entrada={entrada} onConcluir={handleConcluir} />
      ) : (
        <>
          {mutation.isError && (
            <ErrorBanner role="alert">
              {mensagensDoErro(mutation.error).map((mensagem) => (
                <div key={mensagem}>{mensagem}</div>
              ))}
            </ErrorBanner>
          )}
          <Form
            id={formId}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              // O botão já fica desabilitado; isto cobre o Enter em outro campo.
              if (jaNoPatio) {
                return;
              }
              void form.handleSubmit();
            }}
          >
            <form.AppField
              name="placa"
              listeners={{
                onChange: () => {
                  resetLookup();
                  limparPreenchidos();
                },
                onBlur: ({ value }) => void handlePlacaBlur(value),
              }}
            >
              {(field) => (
                <field.PlateField
                  label="Placa"
                  data-autofocus=""
                  hint={hint}
                  hintTone={tone}
                  disabled={isSending}
                  onKeyDown={handlePlacaKeyDown}
                  // A câmera é uma alternativa para digitar: fora da ordem do Tab, que vai da placa direto à categoria.
                  action={<CameraButton tabIndex={-1} disabled={isSending} onClick={() => setLeitorAberto(true)} />}
                />
              )}
            </form.AppField>
            {jaNoPatio && (
              <JaNoPatio role="alert">
                <p>
                  <strong>{jaNoPatio.placa}</strong> já está no pátio desde {formatDateTime(jaNoPatio.dataHoraEntrada)}.
                </p>
                <p>Para registrar uma nova entrada, dê a saída antes.</p>
                <Link href={`/patio/${jaNoPatio.patioId}`} onClick={onClose}>
                  Ver o ticket e dar saída
                </Link>
              </JaNoPatio>
            )}
            {cadastro?.dadosMensalista && (
              <CardMensalista
                contexto="entrada"
                variante={cadastro.mensalista ? "mensalista" : "rotativo"}
                nome={cadastro.dadosMensalista.nome}
                horario={cadastro.dadosMensalista.intervaloPermitido}
              />
            )}
            {exigeModelo && (
              <form.AppField name="modelo" listeners={{ onChange: ({ value }) => handleModeloChange(value) }}>
                {() => <ModeloField maxLength={60} disabled={isSending} required />}
              </form.AppField>
            )}
            <form.AppField name="categoria">
              {(field) => (
                <field.OptionField legend="Categoria (define a tarifa)" options={CATEGORIA_OPTIONS} disabled={isSending} />
              )}
            </form.AppField>
            {exigeCor && (
              <form.AppField name="cor">
                {(field) => (
                  <field.ColorField
                    legend="Cor"
                    options={CORES_VEICULO}
                    disabled={isSending}
                    hint={corForaDaLista ? `Cor no cadastro: ${corForaDaLista}. Escolha a mais próxima, se quiser.` : undefined}
                  />
                )}
              </form.AppField>
            )}
            {exigePrisma && (
              <form.AppField name="prisma">
                {(field) => <field.PrismaField disabled={isSending} />}
              </form.AppField>
            )}
          </Form>
        </>
      )}
      <LeitorPlacaModal
        open={leitorAberto}
        onClose={() => setLeitorAberto(false)}
        onConfirm={handlePlacaLida}
        onDigitar={handleDigitarPlaca}
      />
      {confirmingClose && (
        <ConfirmDialog
          title="Descartar entrada?"
          message="Os dados preenchidos serão perdidos e a entrada não será registrada."
          confirmLabel="Descartar"
          cancelLabel="Continuar editando"
          onConfirm={onClose}
          onCancel={() => setConfirmingClose(false)}
        />
      )}
    </Modal>
  );
}
