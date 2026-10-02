"use client";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type PageInventoryItem = {
  slug: string;
  title: string;
  path: string;
  builtin: boolean;
  live: boolean;
  changed: boolean;
};
export function PageInventory({ items }: { items: PageInventoryItem[] }) {
  const t = useTranslations("Studio.pages");
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {items.map((page) => (
        <li
          key={page.slug}
          className="border-hairline bg-surface flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5"
        >
          <div className="min-w-0">
            <h3 className="font-semibold">{page.title}</h3>
            <p
              dir="ltr"
              className="text-on-surface-variant mt-1 text-start text-sm"
            >
              {page.path}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={page.live ? "default" : "secondary"}>
                {t(page.live ? "live" : "draft")}
              </Badge>
              {page.changed && (
                <Badge variant="outline">{t("unsavedLiveChanges")}</Badge>
              )}
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/instructor/pages?edit=${page.slug}`}>
              <PencilIcon data-icon="inline-start" />
              {t("edit")}
            </Link>
          </Button>
        </li>
      ))}
    </ul>
  );
}
