import type { Metadata } from "next";

import { legalMetadata, renderLegalPage } from "@/components/legal/legal-route";

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params;
  return legalMetadata(locale, "terms");
}

export default async function TermsPage({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  return renderLegalPage(locale, "terms");
}
