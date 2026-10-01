"use client";

import {
  EllipsisIcon,
  EyeIcon,
  FilmIcon,
  PencilIcon,
  StarIcon,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  featurePractice,
  publishPractice,
  removePractice,
} from "@/modules/instructor/actions";
import { DeleteContentButton } from "./delete-content-button";
import type { InventoryItem } from "@/modules/instructor/server/content";

/**
 * Stitch: the inventory table at the foot of studio-admin-content-video-publisher.
 * Publishing and featuring happen inline; everything else opens the editor above.
 */
export function PracticeInventory({
  items,
  editing,
}: {
  items: InventoryItem[];
  editing: string | null;
}) {
  const t = useTranslations("Studio.practices");
  const tPractice = useTranslations("Practice");
  const format = useFormatter();
  const router = useRouter();
  const [pending, start] = useTransition();

  const togglePublished = (item: InventoryItem) =>
    start(async () => {
      const next = item.status === "published" ? "draft" : "published";
      const result = await publishPractice({ slug: item.slug, status: next });
      if (result.ok)
        toast.success(
          t(next === "published" ? "published" : "unpublished", {
            title: item.title,
          }),
        );
      else
        toast.error(
          t(result.error === "video" ? "editor.video.missing" : "actionFailed"),
        );
    });

  const toggleFeatured = (item: InventoryItem) =>
    start(async () => {
      const result = await featurePractice({
        slug: item.slug,
        featured: !item.featured,
      });
      if (result.ok)
        toast.success(
          t(item.featured ? "unfeatured" : "featured", { title: item.title }),
        );
      else toast.error(t("actionFailed"));
    });

  const deleteButton = (item: InventoryItem) => (
    <DeleteContentButton
      label={t("editor.delete")}
      title={t("editor.deleteTitle", { title: item.title })}
      description={t("editor.deleteUsage", {
        saves: item.saves,
        reflections: item.reflections,
        sessions: item.sessions,
      })}
      cancelLabel={t("editor.keep")}
      confirmLabel={t("editor.confirmDelete")}
      disabled={pending || item.programs > 0}
      onConfirm={async () => {
        const result = await removePractice({ slug: item.slug });
        if (result.ok) {
          toast.success(t("editor.deleted"));
          if (editing === item.slug) router.replace("/instructor/videos");
          else router.refresh();
          return true;
        }
        toast.error(
          t(result.error === "inUse" ? "editor.inUseError" : "actionFailed"),
        );
        return false;
      }}
    />
  );

  return (
    <>
      {/* Phones get cards: the five-column table only scrolls sideways at this width. */}
      <ul className="gap-space-sm flex flex-col lg:hidden">
        {items.map((item) => (
          <li
            key={item.slug}
            className={cn(
              "bg-surface-container-low p-space-md rounded-xl shadow-sm",
              editing === item.slug && "ring-primary ring-2",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  item.videoAssetId
                    ? "bg-primary-container/40 text-primary"
                    : "bg-surface-container-highest text-outline",
                )}
                title={
                  item.videoAssetId ? t("table.hasVideo") : t("table.noVideo")
                }
              >
                <FilmIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-lg text-label-lg text-on-surface truncate">
                    {item.title}
                  </span>
                  {item.featured && (
                    <span
                      title={t("table.featured")}
                      className="text-clay shrink-0"
                    >
                      <StarIcon className="size-3.5 fill-current" />
                    </span>
                  )}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {item.series}
                </p>
                <p className="font-label-sm text-label-sm text-outline">
                  {tPractice(`categories.${item.category}`)} ·{" "}
                  {tPractice("minutes", { count: item.durationMinutes })}
                </p>
              </div>
            </div>

            <div className="mt-space-sm flex flex-wrap items-center gap-1.5">
              <Badge
                variant={item.status === "published" ? "default" : "secondary"}
              >
                {t(`status.${item.status}`)}
              </Badge>
              <Badge variant="outline">{t(`access.${item.access}`)}</Badge>
              <span className="font-label-sm text-label-sm text-outline ms-auto">
                {format.number(item.sessions)} · {format.number(item.saves)} ·{" "}
                {format.number(item.reflections)}
              </span>
            </div>

            <div className="mt-space-sm border-hairline pt-space-sm flex flex-wrap items-center gap-1.5 border-t">
              <Button
                size="sm"
                variant={editing === item.slug ? "default" : "outline"}
                className="flex-1"
                onClick={() =>
                  router.push(`/instructor/videos?edit=${item.slug}`)
                }
              >
                <PencilIcon data-icon="inline-start" />
                {t("table.edit")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => togglePublished(item)}
              >
                <EyeIcon data-icon="inline-start" />
                {t(
                  item.status === "published"
                    ? "table.unpublish"
                    : "table.publish",
                )}
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={pending}
                onClick={() => toggleFeatured(item)}
                aria-label={t("table.feature")}
              >
                <StarIcon
                  className={cn(item.featured && "text-clay fill-current")}
                />
              </Button>
              {deleteButton(item)}
              {item.programs > 0 && (
                <p className="text-on-surface-variant w-full text-xs">
                  {t("editor.inUse", { count: item.programs })}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="bg-surface-container-low hidden overflow-hidden rounded-xl shadow-sm lg:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container hover:bg-surface-container">
                <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">
                  {t("table.practice")}
                </TableHead>
                <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">
                  {t("table.state")}
                </TableHead>
                <TableHead className="font-label-sm text-label-sm hidden tracking-wider uppercase md:table-cell">
                  {t("table.access")}
                </TableHead>
                <TableHead className="font-label-sm text-label-sm hidden text-center tracking-wider uppercase sm:table-cell">
                  {t("table.engagement")}
                </TableHead>
                <TableHead className="font-label-sm text-label-sm text-end tracking-wider uppercase">
                  {t("table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.slug}
                  className={cn(
                    "transition-colors",
                    editing === item.slug && "bg-surface-container/60",
                  )}
                >
                  <TableCell>
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                          item.videoAssetId
                            ? "bg-primary-container/40 text-primary"
                            : "bg-surface-container-highest text-outline",
                        )}
                        title={
                          item.videoAssetId
                            ? t("table.hasVideo")
                            : t("table.noVideo")
                        }
                      >
                        <FilmIcon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-label-lg text-label-lg text-on-surface truncate">
                            {item.title}
                          </span>
                          {item.featured && (
                            <span
                              title={t("table.featured")}
                              className="text-clay shrink-0"
                            >
                              <StarIcon className="size-3.5 fill-current" />
                            </span>
                          )}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                          {item.series}
                        </p>
                        <p className="font-label-sm text-label-sm text-outline">
                          {tPractice(`categories.${item.category}`)} ·{" "}
                          {tPractice("minutes", {
                            count: item.durationMinutes,
                          })}
                          {item.chapters > 0 &&
                            ` · ${t("table.chapters", { count: item.chapters })}`}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Badge
                        variant={
                          item.status === "published" ? "default" : "secondary"
                        }
                      >
                        {t(`status.${item.status}`)}
                      </Badge>
                      <span className="font-label-sm text-label-sm text-outline">
                        {t("table.updated", {
                          when: format.relativeTime(item.updatedAt, new Date()),
                        })}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">
                      {t(`access.${item.access}`)}
                    </Badge>
                    {item.access === "members" && item.previewSeconds ? (
                      <p className="font-label-sm text-label-sm text-outline mt-1">
                        {t("table.preview", { seconds: item.previewSeconds })}
                      </p>
                    ) : null}
                  </TableCell>

                  <TableCell className="hidden text-center sm:table-cell">
                    <div className="font-label-md text-label-md text-on-surface flex justify-center gap-3">
                      <span title={t("table.sessions")}>
                        {format.number(item.sessions)}
                      </span>
                      <span className="text-outline">·</span>
                      <span title={t("table.saves")}>
                        {format.number(item.saves)}
                      </span>
                      <span className="text-outline">·</span>
                      <span title={t("table.reflections")}>
                        {format.number(item.reflections)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-end">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={editing === item.slug ? "default" : "outline"}
                        onClick={() =>
                          router.push(`/instructor/videos?edit=${item.slug}`)
                        }
                      >
                        <PencilIcon data-icon="inline-start" />
                        {t("table.edit")}
                      </Button>
                      {deleteButton(item)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={t("table.more", { title: item.title })}
                          >
                            <EllipsisIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              disabled={pending}
                              onSelect={() => togglePublished(item)}
                            >
                              <EyeIcon />
                              {t(
                                item.status === "published"
                                  ? "table.unpublish"
                                  : "table.publish",
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={pending}
                              onSelect={() => toggleFeatured(item)}
                            >
                              <StarIcon />
                              {t(
                                item.featured
                                  ? "table.unfeature"
                                  : "table.feature",
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                              <Link href={`/practices/${item.slug}`}>
                                {t("table.view")}
                              </Link>
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
    </>
  );
}
