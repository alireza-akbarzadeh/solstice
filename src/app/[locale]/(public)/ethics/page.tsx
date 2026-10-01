import type { Metadata } from "next";

import { legalMetadata, renderLegalPage } from "@/components/legal/legal-route";

export async function generateMetadata({ params }: PageProps<"/[locale]/ethics">): Promise<Metadata> {
  const { locale } = await params;
  return legalMetadata(locale, "ethics");
}

export default async function EthicsPage({ params }: PageProps<"/[locale]/ethics">) {
  const { locale } = await params;
  return renderLegalPage(locale, "ethics");
}
