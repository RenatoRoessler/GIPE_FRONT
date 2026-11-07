"use client";

import { useMutation } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { AlvoErro, atribuirErro } from "@/lib/api/adesaoErrors";
import { saveAdesao } from "@/lib/api/services/adesao";
import { descricaoNaCredencial, ehTesteGratisNaUrl, lerPlanoDaUrl, planoDoTipo } from "@/lib/planos";
import {
  aceiteSchema,
  adminUserSchema,
  businessHoursSchema,
  companySchema,
  criarPlanoSchema,
  paymentsSchema,
} from "@/lib/schemas/adesao";
import {
  AceiteData,
  CompanyData,
  EMPTY_ACEITE_DATA,
  EMPTY_ADMIN_USER_DATA,
  EMPTY_BUSINESS_HOURS_DATA,
  EMPTY_COMPANY_DATA,
  EMPTY_PAYMENTS_DATA,
} from "@/types/adesao";
import { TipoPlanoAdesao } from "@/types/plano";
import type { GrupoEmpresa } from "./CompanyStepFields";
import { buildCredencial } from "./credencial";
import {
  ETAPA,
  MODO_ADESAO,
  etapaAnterior as etapaAnteriorNoModo,
  etapaDaPosicao,
  etapasDoModo,
  posicaoDaEtapa,
  proximaEtapa,
  type Etapa,
  type EtapaEditavel,
  type ModoAdesao,
} from "./etapas";
import { usePlanos } from "./usePlanos";

export { ETAPA };
export type { Etapa };

const PARAMETRO_PLANO = "tipoPlanoAdesao";

export const GRUPOS_EMPRESA: GrupoEmpresa[] = ["identificacao", "endereco", "capacidade"];

// Campos de `companySchema` de cada bloco da primeira etapa. O bloco "capacidade" também leva os pagamentos.
const CAMPOS_DO_GRUPO: Record<GrupoEmpresa, (keyof CompanyData)[]> = {
  identificacao: ["cnpj", "razaoSocial", "nomeFantasia", "tipoEmpresa", "telefone"],
  endereco: ["cep", "logradouro", "numero", "bairro", "cidade", "estado"],
  capacidade: ["quantidadeVagasCarro", "quantidadeVagasMoto"],
};

const INVALIDO = '[aria-invalid="true"], [data-invalid="true"]';

// Duas voltas de quadro: dá tempo de o bloco recolhido abrir antes de o foco ir ao campo.
function aposRender(acao: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(acao));
}

function focarPrimeiroInvalido() {
  aposRender(() => document.querySelector<HTMLElement>(INVALIDO)?.focus());
}

// O `fieldset` do grupo de planos é quem fica inválido, mas só o radio recebe foco.
function focarPrimeiroPlano() {
  aposRender(() => document.querySelector<HTMLElement>('fieldset[aria-invalid="true"] input[type="radio"]')?.focus());
}

export function useAdesaoWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [etapa, setEtapa] = useState<Etapa>(ETAPA.Empresa);
  // O parâmetro da URL só vale na abertura; trocar o plano na tela não reescreve a URL.
  const parametroPlano = searchParams.get(PARAMETRO_PLANO);
  // O modo é decidido na abertura e não tem setter: não muda no meio do fluxo.
  const [modo] = useState<ModoAdesao>(() =>
    ehTesteGratisNaUrl(parametroPlano) ? MODO_ADESAO.Teste : MODO_ADESAO.Plano,
  );
  // Começa a buscar já na abertura: quando o usuário chega à etapa Plano a lista normalmente está pronta.
  const consultaPlanos = usePlanos();
  const planos = consultaPlanos.data;
  // Tipo escolhido (ou vindo da URL). Pode ainda não existir na lista; por isso a seleção de fato é derivada abaixo.
  const [plano, setPlano] = useState<number | undefined>(() => lerPlanoDaUrl(parametroPlano));
  // Tipo da URL que o back-end não devolve fica sem seleção, sem erro.
  const planoSelecionado = planoDoTipo(planos, plano);
  // No teste grátis o que vale é o Trial; o plano pago só existe no outro modo.
  const planoEnviado = modo === MODO_ADESAO.Teste ? TipoPlanoAdesao.Trial : planoSelecionado?.tipo;
  // Dados do que será enviado, para mostrar valor/duração. No teste, sem a lista fica sem número, mas não bloqueia.
  const planoEscolhido = planoDoTipo(planos, planoEnviado);
  const [erroPlano, setErroPlano] = useState<string>();
  const [blocosAbertos, setBlocosAbertos] = useState<GrupoEmpresa[]>(["identificacao"]);
  const [blocosConcluidos, setBlocosConcluidos] = useState<GrupoEmpresa[]>([]);
  const [faltam, setFaltam] = useState(0);
  // Depois de "Editar" na conferência, validar a etapa corrigida já leva de volta à conferência.
  const [retornoConferencia, setRetornoConferencia] = useState(false);
  // Os aceites da conferência ficam aqui (e não em um formulário) porque são só dois booleanos; sobrevivem à troca de etapa.
  const [aceite, setAceite] = useState<AceiteData>(EMPTY_ACEITE_DATA);
  const [erroAceite, setErroAceite] = useState<Partial<Record<keyof AceiteData, string>>>({});
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const etapaAnterior = useRef(etapa);

  // Ao trocar de etapa, o foco vai para o título da nova etapa (leitores de tela e teclado). Comparar com a
  // etapa anterior (e não com um "primeiro render") evita focar o título ao abrir a página, inclusive no Strict Mode.
  useEffect(() => {
    if (etapaAnterior.current === etapa) return;
    etapaAnterior.current = etapa;
    tituloRef.current?.focus();
  }, [etapa]);

  const mutation = useMutation({
    mutationFn: saveAdesao,
    onSuccess: () => {
      router.push("/login?cadastro=sucesso");
    },
  });

  const companyForm = useAppForm({
    defaultValues: EMPTY_COMPANY_DATA,
    validators: {
      onChange: ({ value }) => {
        const result = companySchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  // Os meios de pagamento fazem parte da etapa 1, mas têm formulário próprio (regra do conjunto).
  const paymentsForm = useAppForm({
    defaultValues: EMPTY_PAYMENTS_DATA,
    validators: {
      onChange: ({ value }) => {
        const result = paymentsSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const hoursForm = useAppForm({
    defaultValues: EMPTY_BUSINESS_HOURS_DATA,
    validators: {
      onChange: ({ value }) => {
        const result = businessHoursSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const adminUserForm = useAppForm({
    defaultValues: EMPTY_ADMIN_USER_DATA,
    validators: {
      onChange: ({ value }) => {
        const result = adminUserSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const company = useSelector(companyForm.store, (state) => state.values);
  const hours = useSelector(hoursForm.store, (state) => state.values);
  const payments = useSelector(paymentsForm.store, (state) => state.values);
  const adminUser = useSelector(adminUserForm.store, (state) => state.values);

  const credencial = useMemo(
    () => buildCredencial({ company, hours, payments, plano: descricaoNaCredencial(planoEscolhido, planoEnviado) }),
    [company, hours, payments, planoEscolhido, planoEnviado],
  );

  // Campos inválidos da empresa por bloco, direto do schema (não depende de o campo ter sido tocado).
  function gruposInvalidos(): { grupo: GrupoEmpresa; quantidade: number }[] {
    const result = companySchema.safeParse(companyForm.state.values);
    const caminhos = result.success ? [] : result.error.issues.map((issue) => String(issue.path[0]));
    const pagamentosInvalidos = !paymentsSchema.safeParse(paymentsForm.state.values).success;

    return GRUPOS_EMPRESA.map((grupo) => ({
      grupo,
      quantidade:
        CAMPOS_DO_GRUPO[grupo].filter((campo) => caminhos.includes(campo)).length +
        (grupo === "capacidade" && pagamentosInvalidos ? 1 : 0),
    })).filter(({ quantidade }) => quantidade > 0);
  }

  function tocarCampos(grupo: GrupoEmpresa) {
    for (const campo of CAMPOS_DO_GRUPO[grupo]) {
      companyForm.setFieldMeta(campo, (meta) => ({ ...meta, isTouched: true }));
    }
    if (grupo === "capacidade") void paymentsForm.handleSubmit();
  }

  // Valida só o bloco: se estiver certo, recolhe e abre o próximo; senão mostra os erros dele.
  function concluirBloco(grupo: GrupoEmpresa) {
    tocarCampos(grupo);
    const invalido = gruposInvalidos().find((item) => item.grupo === grupo);
    if (invalido) {
      setFaltam(invalido.quantidade);
      focarPrimeiroInvalido();
      return;
    }

    setFaltam(0);
    const concluidos = blocosConcluidos.includes(grupo) ? blocosConcluidos : [...blocosConcluidos, grupo];
    setBlocosConcluidos(concluidos);
    const proximo = GRUPOS_EMPRESA.find((item) => !concluidos.includes(item));
    setBlocosAbertos((abertos) => [...abertos.filter((item) => item !== grupo), ...(proximo ? [proximo] : [])]);
  }

  function alternarBloco(grupo: GrupoEmpresa, aberto: boolean) {
    setBlocosAbertos((abertos) => (aberto ? [...abertos, grupo] : abertos.filter((item) => item !== grupo)));
  }

  function escolherPlano(tipo: number) {
    setPlano(tipo);
    setErroPlano(undefined);
    setFaltam(0);
  }

  async function validarEtapa(): Promise<boolean> {
    setFaltam(0);

    if (etapa === ETAPA.Plano) {
      // Sem a lista carregada não há o que validar nem o que enviar; a própria etapa mostra o estado.
      if (consultaPlanos.status !== "success") return false;

      const result = criarPlanoSchema(consultaPlanos.data.map((item) => item.tipo)).safeParse({ plano: planoSelecionado?.tipo });
      if (result.success) return true;

      setErroPlano(result.error.issues[0].message);
      setFaltam(1);
      focarPrimeiroPlano();
      return false;
    }

    if (etapa === ETAPA.Empresa) {
      await Promise.all([companyForm.handleSubmit(), paymentsForm.handleSubmit()]);
      const invalidos = gruposInvalidos();
      if (invalidos.length === 0) {
        setBlocosConcluidos(GRUPOS_EMPRESA);
        return true;
      }
      setFaltam(invalidos.reduce((total, { quantidade }) => total + quantidade, 0));
      setBlocosConcluidos(GRUPOS_EMPRESA.filter((grupo) => !invalidos.some((item) => item.grupo === grupo)));
      setBlocosAbertos(invalidos.map(({ grupo }) => grupo));
      focarPrimeiroInvalido();
      return false;
    }

    const form = etapa === ETAPA.Horarios ? hoursForm : adminUserForm;
    const schema = etapa === ETAPA.Horarios ? businessHoursSchema : adminUserSchema;
    await form.handleSubmit();
    const result = schema.safeParse(form.state.values);
    if (result.success) return true;

    setFaltam(Object.keys(zodFieldErrors(result)?.fields ?? {}).length);
    focarPrimeiroInvalido();
    return false;
  }

  async function avancar() {
    if (!(await validarEtapa())) return;
    if (retornoConferencia) {
      setRetornoConferencia(false);
      setEtapa(ETAPA.Conferir);
      return;
    }
    setEtapa((atual) => proximaEtapa(atual, modo));
  }

  function voltar() {
    setFaltam(0);
    setRetornoConferencia(false);
    setEtapa((atual) => etapaAnteriorNoModo(atual, modo));
  }

  // Só volta a etapas já vistas (o Stepper só oferece as concluídas); nenhum dado se perde.
  // O Stepper devolve a posição que o usuário vê; no teste ela difere do número da etapa.
  function irParaEtapa(posicao: number) {
    const destino = etapaDaPosicao(posicao, modo);
    if (destino < etapa) {
      setFaltam(0);
      setRetornoConferencia(false);
      setEtapa(destino);
    }
  }

  // "Editar" na conferência: vai à etapa (e ao bloco) e, ao corrigir, volta direto para a conferência.
  function editar(destino: EtapaEditavel, bloco?: GrupoEmpresa) {
    setRetornoConferencia(true);
    setEtapa(destino);
    if (destino === ETAPA.Empresa && bloco) setBlocosAbertos([bloco]);
  }

  function aceitar(documento: keyof AceiteData, aceito: boolean) {
    setAceite((atual) => ({ ...atual, [documento]: aceito }));
    setErroAceite((atual) => ({ ...atual, [documento]: undefined }));
  }

  // Sem os dois aceites não há envio: mostra o que falta junto de cada caixa e leva o foco à primeira pendente.
  function validarAceite(): boolean {
    const result = aceiteSchema.safeParse(aceite);
    if (result.success) {
      setErroAceite({});
      return true;
    }

    const erros: Partial<Record<keyof AceiteData, string>> = {};
    for (const issue of result.error.issues) erros[issue.path[0] as keyof AceiteData] = issue.message;
    setErroAceite(erros);
    focarPrimeiroInvalido();
    return false;
  }

  async function enviar() {
    // No fluxo pago a etapa Plano é obrigatória; sem plano não há o que enviar, então volta a ela.
    if (planoEnviado === undefined) {
      editar(ETAPA.Plano);
      return;
    }

    if (!validarAceite()) return;

    try {
      await mutation.mutateAsync({ plano: planoEnviado, company, hours, payments, adminUser, aceite });
    } catch {
      // O erro fica em `mutation.error` e é mostrado no topo da conferência.
    }
  }

  const erroBackend = mutation.isError ? atribuirErro(mutation.error) : undefined;

  // Leva o usuário ao campo que o backend recusou, mantendo tudo o que já foi preenchido.
  function corrigir(alvo: AlvoErro) {
    mutation.reset();
    // Os aceites ficam na própria conferência: não há etapa para onde voltar.
    if (alvo.etapa !== ETAPA.Conferir) {
      setRetornoConferencia(true);
      setEtapa(alvo.etapa);
    }
    if (alvo.etapa === ETAPA.Empresa) setBlocosAbertos(["identificacao"]);
    aposRender(() => document.querySelector<HTMLElement>(`[name="${alvo.campo}"]`)?.focus());
  }

  return {
    etapa,
    modo,
    // O que o usuário vê no Stepper: no teste grátis são quatro etapas, sem Plano.
    etapas: etapasDoModo(modo),
    posicao: posicaoDaEtapa(etapa, modo),
    tituloRef,
    companyForm,
    paymentsForm,
    hoursForm,
    adminUserForm,
    // `plano` é a seleção de fato (existe na lista), não o tipo cru da URL.
    dados: { plano: planoSelecionado?.tipo, company, hours, payments, adminUser },
    planos: {
      status: consultaPlanos.status,
      dados: planos,
      refazer: () => void consultaPlanos.refetch(),
      refazendo: consultaPlanos.isRefetching,
    },
    planoEscolhido,
    planoTeste: planoDoTipo(planos, TipoPlanoAdesao.Trial),
    aceite,
    erroAceite,
    aceitar,
    escolherPlano,
    erroPlano,
    credencial,
    blocosAbertos,
    blocosConcluidos,
    alternarBloco,
    concluirBloco,
    faltam,
    retornoConferencia,
    avancar,
    voltar,
    irParaEtapa,
    editar,
    enviar,
    enviando: mutation.isPending,
    erroBackend,
    corrigir,
  };
}
