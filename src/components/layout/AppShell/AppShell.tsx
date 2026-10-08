"use client";

import { ReactNode, useState } from "react";
import { AppFooter } from "@/components/layout/AppFooter";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Content, Layout, Main } from "./AppShell.styles";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Layout>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Content>
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Main>{children}</Main>
        <AppFooter />
      </Content>
    </Layout>
  );
}
