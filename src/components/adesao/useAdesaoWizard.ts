"use client";

import { useMutation } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { AlvoErro, atribuirErro } from "@/lib/api/adesaoErrors";
import { saveAdesao } from "@/lib/api/services/adesao";
import { adminUserSchema, businessHoursSchema, companySchema, paymentsSchema } from "@/lib/schemas/adesao";
import {
  CompanyData,
  EMPTY_ADMIN_USER_DATA,
  EMPTY_BUSINESS_HOURS_DATA,
  EMPTY_COMPANY_DATA,
  EMPTY_PAYMENTS_DATA,
} from "@/types/adesao";
import type { GrupoEmpresa } from "./CompanyStepFields";
import { buildCredencial } from "./credencial";

export type Etapa = 1 | 2 | 3 | 4;

export const ETAPAS = ["Empresa", "Horários", "Titular", "Conferir"];

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

function proximaEtapa(etapa: Etapa): Etapa {
  return Math.min(4, etapa + 1) as Etapa;
}

export function useAdesaoWizard() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [blocosAbertos, setBlocosAbertos] = useState<GrupoEmpresa[]>(["identificacao"]);
  const [blocosConcluidos, setBlocosConcluidos] = useState<GrupoEmpresa[]>([]);
  const [faltam, setFaltam] = useState(0);
  // Depois de "Editar" na conferência, validar a etapa corrigida já leva de volta à conferência.
  const [retornoConferencia, setRetornoConferencia] = useState(false);
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

  const credencial = useMemo(() => buildCredencial({ company, hours, payments }), [company, hours, payments]);

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

  async function validarEtapa(): Promise<boolean> {
    setFaltam(0);

    if (etapa === 1) {
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

    const form = etapa === 2 ? hoursForm : adminUserForm;
    const schema = etapa === 2 ? businessHoursSchema : adminUserSchema;
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
      setEtapa(4);
      return;
    }
    setEtapa((atual) => proximaEtapa(atual));
  }

  function voltar() {
    setFaltam(0);
    setRetornoConferencia(false);
    setEtapa((atual) => Math.max(1, atual - 1) as Etapa);
  }

  // Só volta a etapas já vistas (o Stepper só oferece as concluídas); nenhum dado se perde.
  function irParaEtapa(destino: number) {
    if (destino < etapa) {
      setFaltam(0);
      setRetornoConferencia(false);
      setEtapa(destino as Etapa);
    }
  }

  // "Editar" na conferência: vai à etapa (e ao bloco) e, ao corrigir, volta direto para a conferência.
  function editar(destino: 1 | 2 | 3, bloco?: GrupoEmpresa) {
    setRetornoConferencia(true);
    setEtapa(destino);
    if (destino === 1 && bloco) setBlocosAbertos([bloco]);
  }

  async function enviar() {
    try {
      await mutation.mutateAsync({ company, hours, payments, adminUser });
    } catch {
      // O erro fica em `mutation.error` e é mostrado no topo da conferência.
    }
  }

  const erroBackend = mutation.isError ? atribuirErro(mutation.error) : undefined;

  // Leva o usuário ao campo que o backend recusou, mantendo tudo o que já foi preenchido.
  function corrigir(alvo: AlvoErro) {
    mutation.reset();
    setRetornoConferencia(true);
    setEtapa(alvo.etapa);
    if (alvo.etapa === 1) setBlocosAbertos(["identificacao"]);
    aposRender(() => document.querySelector<HTMLElement>(`[name="${alvo.campo}"]`)?.focus());
  }

  return {
    etapa,
    etapas: ETAPAS,
    tituloRef,
    companyForm,
    paymentsForm,
    hoursForm,
    adminUserForm,
    dados: { company, hours, payments, adminUser },
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
