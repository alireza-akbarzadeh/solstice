import type { Metadata } from "next";

import { legalMetadata, renderLegalPage } from "@/components/legal/legal-route";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  return legalMetadata(locale, "privacy");
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  return renderLegalPage(locale, "privacy");
}
