import { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TecladoProvider } from "@/components/teclado";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <TecladoProvider>
      <AppShell>{children}</AppShell>
    </TecladoProvider>
  );
}
