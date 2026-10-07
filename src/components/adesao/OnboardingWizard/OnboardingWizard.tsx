"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AdminUserStepFields } from "@/components/adesao/AdminUserStepFields";
import { BusinessHoursStepFields } from "@/components/adesao/BusinessHoursStepFields";
import { CompanyStepFields } from "@/components/adesao/CompanyStepFields";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { PageBackground } from "@/components/ui/PageBackground";
import { Stepper } from "@/components/ui/Stepper";
import { Text } from "@/components/ui/Text";
import { saveAdesao } from "@/lib/api/services/adesao";
import { adminUserSchema, businessHoursSchema, companySchema } from "@/lib/schemas/adesao";
import {
  AdminUserData,
  BusinessHoursData,
  CompanyData,
  EMPTY_ADMIN_USER_DATA,
  EMPTY_BUSINESS_HOURS_DATA,
  EMPTY_COMPANY_DATA,
} from "@/types/adesao";
import { Actions, ErrorBanner, Form, Header, TitleGroup } from "./OnboardingWizard.styles";

const STEPS = ["Dados da empresa", "Funcionamento", "Usuário titular"];

const STEP_DESCRIPTIONS = [
  "Conte para a gente sobre a sua empresa.",
  "Quando a empresa funciona?",
  "Agora crie o usuário titular da conta.",
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const stepDescriptionRef = useRef<HTMLParagraphElement>(null);
  const isFirstRender = useRef(true);

  // Ao trocar de etapa, o foco vai para a descrição da nova etapa (leitores de tela e teclado).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    stepDescriptionRef.current?.focus();
  }, [step]);

  const mutation = useMutation({
    mutationFn: (payload: {
      company: CompanyData;
      hours: BusinessHoursData;
      adminUser: AdminUserData;
    }) => saveAdesao(payload),
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
    onSubmit: () => {
      setStep(2);
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
    onSubmit: () => {
      setStep(3);
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
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        company: companyForm.state.values,
        hours: hoursForm.state.values,
        adminUser: value,
      });
    },
  });

  function handleBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  return (
    <PageBackground>
      <Card maxWidth="640px">
        <Header>
          <TitleGroup>
            <Logo />
            <Text variant="heading" as="h1">
              Adesão ao sistema
            </Text>
            <Text variant="muted" ref={stepDescriptionRef} tabIndex={-1}>
              {STEP_DESCRIPTIONS[step - 1]}
            </Text>
          </TitleGroup>
          <Stepper steps={STEPS} currentStep={step} />
        </Header>

        {step === 1 ? (
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void companyForm.handleSubmit();
            }}
          >
            <CompanyStepFields form={companyForm} />
            <Actions>
              <Button type="submit">Próximo</Button>
            </Actions>
          </Form>
        ) : step === 2 ? (
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void hoursForm.handleSubmit();
            }}
          >
            <BusinessHoursStepFields form={hoursForm} />
            <Actions>
              <Button type="button" variant="secondary" onClick={handleBack}>
                Voltar
              </Button>
              <Button type="submit">Próximo</Button>
            </Actions>
          </Form>
        ) : (
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void adminUserForm.handleSubmit();
            }}
          >
            {mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
            <AdminUserStepFields form={adminUserForm} disabled={mutation.isPending} />
            <Actions>
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                disabled={mutation.isPending}
              >
                Voltar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </Actions>
          </Form>
        )}
      </Card>
    </PageBackground>
  );
}
