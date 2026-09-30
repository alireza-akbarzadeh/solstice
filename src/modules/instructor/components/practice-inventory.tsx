"use client";

import { EllipsisIcon, EyeIcon, FilmIcon, PencilIcon, StarIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { featurePractice, publishPractice } from "@/modules/instructor/actions";
import type { InventoryItem } from "@/modules/instructor/server/content";

/**
 * Stitch: the inventory table at the foot of studio-admin-content-video-publisher.
 * Publishing and featuring happen inline; everything else opens the editor above.
 */
export function PracticeInventory({ items, editing }: { items: InventoryItem[]; editing: string | null }) {
  const t = useTranslations("Studio.practices");
  const tPractice = useTranslations("Practice");
  const format = useFormatter();
  const router = useRouter();
  const [pending, start] = useTransition();

  const togglePublished = (item: InventoryItem) =>
    start(async () => {
      const next = item.status === "published" ? "draft" : "published";
      const result = await publishPractice({ slug: item.slug, status: next });
      if (result.ok) toast.success(t(next === "published" ? "published" : "unpublished", { title: item.title }));
      else toast.error(t("actionFailed"));
    });

  const toggleFeatured = (item: InventoryItem) =>
    start(async () => {
      const result = await featurePractice({ slug: item.slug, featured: !item.featured });
      if (result.ok) toast.success(t(item.featured ? "unfeatured" : "featured", { title: item.title }));
      else toast.error(t("actionFailed"));
    });

  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-low shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-container hover:bg-surface-container">
              <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">{t("table.practice")}</TableHead>
              <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">{t("table.state")}</TableHead>
              <TableHead className="hidden font-label-sm text-label-sm tracking-wider uppercase md:table-cell">{t("table.access")}</TableHead>
              <TableHead className="hidden text-center font-label-sm text-label-sm tracking-wider uppercase sm:table-cell">{t("table.engagement")}</TableHead>
              <TableHead className="text-end font-label-sm text-label-sm tracking-wider uppercase">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.slug} className={cn("transition-colors", editing === item.slug && "bg-surface-container/60")}>
                <TableCell>
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                        item.videoAssetId ? "bg-primary-container/40 text-primary" : "bg-surface-container-highest text-outline",
                      )}
                      title={item.videoAssetId ? t("table.hasVideo") : t("table.noVideo")}
                    >
                      <FilmIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-label-lg text-label-lg text-on-surface">{item.title}</span>
                        {item.featured && (
                          <span title={t("table.featured")} className="shrink-0 text-clay">
                            <StarIcon className="size-3.5 fill-current" />
                          </span>
                        )}
                      </div>
                      <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{item.series}</p>
                      <p className="font-label-sm text-label-sm text-outline">
                        {tPractice(`categories.${item.category}`)} · {tPractice("minutes", { count: item.durationMinutes })}
                        {item.chapters > 0 && ` · ${t("table.chapters", { count: item.chapters })}`}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <Badge variant={item.status === "published" ? "default" : "secondary"}>{t(`status.${item.status}`)}</Badge>
                    <span className="font-label-sm text-label-sm text-outline">
                      {t("table.updated", { when: format.relativeTime(item.updatedAt, new Date()) })}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">{t(`access.${item.access}`)}</Badge>
                  {item.access === "members" && item.previewSeconds ? (
                    <p className="mt-1 font-label-sm text-label-sm text-outline">{t("table.preview", { seconds: item.previewSeconds })}</p>
                  ) : null}
                </TableCell>

                <TableCell className="hidden text-center sm:table-cell">
                  <div className="flex justify-center gap-3 font-label-md text-label-md text-on-surface">
                    <span title={t("table.sessions")}>{format.number(item.sessions)}</span>
                    <span className="text-outline">·</span>
                    <span title={t("table.saves")}>{format.number(item.saves)}</span>
                    <span className="text-outline">·</span>
                    <span title={t("table.reflections")}>{format.number(item.reflections)}</span>
                  </div>
                </TableCell>

                <TableCell className="text-end">
                  <div className="inline-flex items-center gap-1.5">
                    <Button size="sm" variant={editing === item.slug ? "default" : "outline"} onClick={() => router.push(`/instructor/videos?edit=${item.slug}`)}>
                      <PencilIcon data-icon="inline-start" />
                      {t("table.edit")}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-sm" variant="ghost" aria-label={t("table.more", { title: item.title })}>
                          <EllipsisIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem disabled={pending} onSelect={() => togglePublished(item)}>
                            <EyeIcon />
                            {t(item.status === "published" ? "table.unpublish" : "table.publish")}
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={pending} onSelect={() => toggleFeatured(item)}>
                            <StarIcon />
                            {t(item.featured ? "table.unfeature" : "table.feature")}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem asChild>
                            <Link href={`/practices/${item.slug}`}>{t("table.view")}</Link>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
