import type { Metadata } from "next";
import { TemplatePicker } from "@/components/template-picker";

export const metadata: Metadata = {
  title: "Choose a template | Cueful",
  description: "Choose a starting style for your Cueful profile.",
  alternates: {
    canonical: "/templates",
  },
  openGraph: {
    title: "Cueful profile templates",
    description:
      "Choose a focused starting point for a creator, freelancer, or referral profile.",
    url: "/templates",
  },
};

export default function TemplatesPage() {
  return <TemplatePicker />;
}
