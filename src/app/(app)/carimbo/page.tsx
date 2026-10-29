import type { Metadata } from "next";
import { CarimboPage } from "@/components/carimbo/CarimboPage";

export const metadata: Metadata = {
  title: "Carimbar ticket — Murel",
};

export default function Page() {
  return <CarimboPage />;
}
