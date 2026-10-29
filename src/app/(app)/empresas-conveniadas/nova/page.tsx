import type { Metadata } from "next";
import { NovaConveniada } from "@/components/conveniadas/NovaConveniada";

export const metadata: Metadata = {
  title: "Nova conveniada — Murel",
};

export default function Page() {
  return <NovaConveniada />;
}
