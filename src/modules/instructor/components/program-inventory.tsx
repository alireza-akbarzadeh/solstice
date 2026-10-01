"use client";

import { EyeIcon, PencilIcon, StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import {
  featureProgram,
  publishProgram,
  removeProgram,
  type ProgramResult,
} from "@/modules/instructor/program-actions";
import type { getProgramInventory } from "@/modules/instructor/server/programs";
import { DeleteContentButton } from "./delete-content-button";

export function ProgramInventory({
  items,
}: {
  items: Awaited<ReturnType<typeof getProgramInventory>>;
}) {
  const t = useTranslations("Studio.programs");
  const router = useRouter();
  const [pending, start] = useTransition();
  const result = (value: ProgramResult) => {
    if (value.ok) toast.success(t("saved"));
    else toast.error(t(`editor.errors.${value.error}`));
  };
  return (
    <ul className="gap-space-sm flex flex-col">
      {items.map((item) => (
        <li
          key={item.slug}
          className="gap-space-md bg-surface-container-low p-space-md flex flex-col rounded-xl shadow-sm xl:flex-row xl:items-center xl:justify-between"
        >
          <div className="min-w-0">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-on-surface-variant mt-1 text-sm">
              {t("counts", {
                weeks: item.weeks,
                days: item.days,
                members: item.enrollments,
              })}
            </p>
            <div className="mt-2 flex gap-2">
              <Badge
                variant={item.status === "published" ? "default" : "secondary"}
              >
                {t(`status.${item.status}`)}
              </Badge>
              {item.featured && (
                <Badge variant="outline">{t("featured")}</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link
                href={`/instructor/programs?edit=${encodeURIComponent(item.slug)}`}
              >
                <PencilIcon data-icon="inline-start" />
                {t("edit")}
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () =>
                  result(
                    await publishProgram({
                      slug: item.slug,
                      status:
                        item.status === "published" ? "draft" : "published",
                    }),
                  ),
                )
              }
            >
              <EyeIcon data-icon="inline-start" />
              {t(item.status === "published" ? "unpublish" : "publish")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                start(async () =>
                  result(
                    await featureProgram({
                      slug: item.slug,
                      featured: !item.featured,
                    }),
                  ),
                )
              }
            >
              <StarIcon
                data-icon="inline-start"
                className={item.featured ? "text-clay fill-current" : ""}
              />
              {t(item.featured ? "unfeature" : "feature")}
            </Button>
            <DeleteContentButton
              label={t("delete")}
              title={t("editor.deleteTitle", { title: item.title })}
              description={t("editor.deleteBody", { count: item.enrollments })}
              cancelLabel={t("editor.keep")}
              confirmLabel={t("delete")}
              disabled={pending}
              onConfirm={async () => {
                const removed = await removeProgram({ slug: item.slug });
                if (!removed.ok) {
                  result(removed);
                  return false;
                }
                toast.success(t("editor.deleted"));
                router.refresh();
                return true;
              }}
            />
            {item.status === "published" && (
              <Button asChild size="sm" variant="ghost">
                <Link href={`/programs/${item.slug}`}>{t("view")}</Link>
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
