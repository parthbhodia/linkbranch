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

// The picker reads ?template= and ?import=, which it used to do in the client.
// Reading them here leaves it a plain component with no `useSearchParams`, so
// the route does not need a Suspense boundary -- and with one, the static HTML
// shipped the fallback and every visitor watched it swap to the real picker.
export const dynamic = "force-dynamic";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; import?: string }>;
}) {
  const { template, import: importFlow } = await searchParams;
  return (
    <TemplatePicker
      requestedTemplate={template}
      importFlow={importFlow === "1"}
    />
  );
}
