"use client";

import { useState } from "react";
import { ArrowUpRightIcon, EyeIcon, PencilIcon, UsersIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getPathname, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pagePreviewPath } from "@/modules/pages/preview";
import { WorkshopAttendeesDialog } from "./workshop-attendees-dialog";

export type PageInventoryItem = {
  slug: string;
  title: string;
  path: string;
  builtin: boolean;
  live: boolean;
  changed: boolean;
  navigation: boolean;
  footer: boolean;
  isEvent?: boolean;
};

export function PageInventory({ items }: { items: PageInventoryItem[] }) {
  const t = useTranslations("Studio.pages");
  const tWorkshops = useTranslations("Workshops.studio");
  const locale = useLocale();
  const [selectedWorkshop, setSelectedWorkshop] = useState<{
    slug: string;
    title: string;
  } | null>(null);

  return (
    <>
      <ul className="grid gap-3 lg:grid-cols-2">
        {items.map((page) => (
          <li
            key={page.slug}
            className="border-hairline bg-surface flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5"
          >
            <div className="min-w-0">
              <h3 className="break-words font-semibold">{page.title}</h3>
              <p
                dir="ltr"
                className="text-on-surface-variant mt-1 break-all text-start text-sm"
              >
                {getPathname({ href: page.path, locale })}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={page.live ? "default" : "secondary"}>
                  {t(page.live ? "live" : "draft")}
                </Badge>
                {page.isEvent && (
                  <Badge
                    variant="outline"
                    className="border-primary/40 bg-primary/5 text-primary"
                  >
                    {tWorkshops("tabTitle")}
                  </Badge>
                )}
                {page.changed && (
                  <Badge variant="outline">{t("unsavedLiveChanges")}</Badge>
                )}
                {page.navigation && (
                  <Badge variant="outline">{t("menuPlacement")}</Badge>
                )}
                {page.footer && (
                  <Badge variant="outline">{t("footerPlacement")}</Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {page.isEvent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelectedWorkshop({ slug: page.slug, title: page.title })
                  }
                  className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <UsersIcon className="size-3.5" />
                  <span>{tWorkshops("viewAttendees")}</span>
                </Button>
              )}
              {(page.live || page.builtin) && (
                <Button asChild size="sm" variant="outline">
                  <Link href={page.path} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRightIcon data-icon="inline-start" />
                    {t("viewLive")}
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <Link
                  href={pagePreviewPath(page.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <EyeIcon data-icon="inline-start" />
                  {t("preview")}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/instructor/pages?edit=${page.slug}`}>
                  <PencilIcon data-icon="inline-start" />
                  {t("edit")}
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {selectedWorkshop && (
        <WorkshopAttendeesDialog
          open={!!selectedWorkshop}
          onOpenChange={(open) => {
            if (!open) setSelectedWorkshop(null);
          }}
          pageSlug={selectedWorkshop.slug}
          pageTitle={selectedWorkshop.title}
        />
      )}
    </>
  );
}
