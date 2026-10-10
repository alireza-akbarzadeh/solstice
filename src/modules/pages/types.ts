import type { Localized } from "@/lib/localized";
import type { JournalStoredBlock } from "@/modules/journal/types";
import type { WorkshopEventDetails } from "@/modules/workshops/types";

export type CopyTree = string | CopyTree[] | { [key: string]: CopyTree };
export type CopyRecord = Record<string, CopyTree>;
export type PageContent = {
  title: Localized;
  description: Localized;
  seoTitle: Localized;
  image: string;
  imageAlt: Localized;
  videoUrl: string;
  actionLabel: Localized;
  actionHref: string;
  showInFooter: boolean;
  showInNavigation: boolean;
  body: JournalStoredBlock[];
  copy: { en: CopyRecord; fa: CopyRecord };
  assets: Record<string, string>;
  event?: WorkshopEventDetails;
};

export type PageDefinition = {
  slug: string;
  path: string;
  title: Localized;
  namespaces: string[];
  assets: Record<string, string>;
  manage?: string;
  /** Studio page for related settings this page shows (contact details, social links). */
  settings?: string;
};
