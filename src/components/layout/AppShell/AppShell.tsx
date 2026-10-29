"use client";

import { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { SideNav } from "@/components/layout/SideNav";
import { Header } from "@/components/layout/Header";
import { useModelos } from "@/components/veiculos/useModelos";
import { VeiculoModaisProvider } from "@/components/veiculos/VeiculoModais";
import { Layout, Main } from "./AppShell.styles";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Carrega a lista de modelos ao abrir o sistema; os campos de modelo reaproveitam o cache.
  useModelos();

  return (
    <VeiculoModaisProvider>
      <Layout>
        <Header />
        <Main>{children}</Main>
        <BottomNav />
        <SideNav />
      </Layout>
    </VeiculoModaisProvider>
  );
}
