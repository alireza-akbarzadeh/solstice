"use client";

import { EllipsisIcon, EyeIcon, PencilIcon, StarIcon } from "lucide-react";
import Image from "next/image";
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
import { featureJournalArticle, publishJournalArticle } from "@/modules/instructor/journal-actions";
import type { JournalInventoryItem } from "@/modules/instructor/server/journal";

/** The shelf of essays: publish, feature and open for editing. Cards on phones, a table above lg. */
export function JournalInventory({ items, editing }: { items: JournalInventoryItem[]; editing: string | null }) {
  const t = useTranslations("Studio.journal");
  const tJournal = useTranslations("Journal");
  const format = useFormatter();
  const router = useRouter();
  const [pending, start] = useTransition();

  const togglePublished = (item: JournalInventoryItem) =>
    start(async () => {
      const status = item.status === "published" ? "draft" : "published";
      const result = await publishJournalArticle({ slug: item.slug, status });
      if (result.ok) toast.success(t(status === "published" ? "published" : "unpublished", { title: item.title }));
      else toast.error(t("actionFailed"));
    });

  const toggleFeatured = (item: JournalInventoryItem) =>
    start(async () => {
      const result = await featureJournalArticle({ slug: item.slug, featured: !item.featured });
      if (result.ok) toast.success(t(item.featured ? "unfeatured" : "featured", { title: item.title }));
      else toast.error(t("actionFailed"));
    });

  const edit = (slug: string) => router.push(`/instructor/journal?edit=${slug}`);

  const Actions = ({ item }: { item: JournalInventoryItem }) => (
    <div className="inline-flex items-center gap-1.5">
      <Button size="sm" variant={editing === item.slug ? "default" : "outline"} onClick={() => edit(item.slug)}>
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
          {item.status === "published" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href={`/journal/${item.slug}`}>{t("table.view")}</Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const Meta = ({ item }: { item: JournalInventoryItem }) => (
    <>
      <Badge variant={item.status === "published" ? "default" : "secondary"}>{t(`status.${item.status}`)}</Badge>
      {item.featured && (
        <Badge className="gap-1 bg-clay text-white">
          <StarIcon className="fill-current" />
          {t("table.featured")}
        </Badge>
      )}
      <Badge variant="outline">{tJournal(`categories.${item.category}`)}</Badge>
    </>
  );

  return (
    <>
      <ul className="flex flex-col gap-space-sm lg:hidden">
        {items.map((item) => (
          <li key={item.slug} className={cn("rounded-xl bg-surface-container-low p-space-md shadow-sm", editing === item.slug && "ring-2 ring-primary")}>
            <div className="flex items-start gap-3">
              {item.image && <Image src={item.image} alt="" width={56} height={56} sizes="56px" className="size-14 shrink-0 rounded object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-label-lg text-label-lg text-on-surface">{item.title}</p>
                <p className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{item.excerpt}</p>
                <p className="font-label-sm text-label-sm text-outline">
                  {t("table.issue", { issue: item.issue })} · {item.authorName} · {t("table.blocks", { count: item.blocks })}
                </p>
              </div>
            </div>
            <div className="mt-space-sm flex flex-wrap items-center gap-1.5">
              <Meta item={item} />
            </div>
            <div className="mt-space-sm border-t border-hairline pt-space-sm">
              <Actions item={item} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-xl bg-surface-container-low shadow-sm lg:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container hover:bg-surface-container">
                <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">{t("table.essay")}</TableHead>
                <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">{t("table.state")}</TableHead>
                <TableHead className="hidden font-label-sm text-label-sm tracking-wider uppercase xl:table-cell">{t("table.published")}</TableHead>
                <TableHead className="text-end font-label-sm text-label-sm tracking-wider uppercase">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.slug} className={cn("transition-colors", editing === item.slug && "bg-surface-container/60")}>
                  <TableCell>
                    <div className="flex min-w-0 items-start gap-3">
                      {item.image && <Image src={item.image} alt="" width={64} height={48} sizes="64px" className="h-12 w-16 shrink-0 rounded object-cover" />}
                      <div className="min-w-0">
                        <p className="truncate font-label-lg text-label-lg text-on-surface">{item.title}</p>
                        <p className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{item.excerpt}</p>
                        <p className="font-label-sm text-label-sm text-outline">
                          {t("table.issue", { issue: item.issue })} · {item.authorName} · {t("table.blocks", { count: item.blocks })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Meta item={item} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden font-body-sm text-body-sm text-on-surface-variant xl:table-cell">
                    {item.publishedAt ? format.dateTime(item.publishedAt, { dateStyle: "medium" }) : <span className="text-outline">—</span>}
                  </TableCell>
                  <TableCell className="text-end">
                    <Actions item={item} />
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
