"use client";

import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { removeNewsletterSubscriber } from "@/modules/instructor/actions";
import type { NewsletterSubscriber } from "@/modules/newsletter/server/subscribers";

import { DeleteContentButton } from "./delete-content-button";

/** The newsletter list: cards on phones, a table above lg, each address removable. */
export function SubscriberList({ items }: { items: NewsletterSubscriber[] }) {
  const t = useTranslations("Studio.subscribers");
  const format = useFormatter();

  const Remove = ({ item }: { item: NewsletterSubscriber }) => (
    <DeleteContentButton
      label={t("remove")}
      title={t("removeTitle")}
      description={t("removeBody", { email: item.email })}
      cancelLabel={t("cancel")}
      confirmLabel={t("removeConfirm")}
      onConfirm={async () => {
        const result = await removeNewsletterSubscriber({ id: item.id });
        if (result.ok) toast.success(t("removed", { email: item.email }));
        else toast.error(t("actionFailed"));
        return result.ok;
      }}
    />
  );

  const Meta = ({ item }: { item: NewsletterSubscriber }) => (
    <>
      <Badge variant="outline">{t(`locale.${item.locale === "fa" ? "fa" : "en"}`)}</Badge>
      <Badge variant="secondary">{t(`source.${item.source}`)}</Badge>
    </>
  );

  const date = (value: Date) => format.dateTime(value, { dateStyle: "medium" });

  return (
    <>
      <ul className="flex flex-col gap-space-sm lg:hidden">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <p dir="ltr" className="truncate text-start font-label-lg text-label-lg text-on-surface">
              {item.email}
            </p>
            <p className="font-label-sm text-label-sm text-outline">{date(item.createdAt)}</p>
            <div className="mt-space-sm flex flex-wrap items-center gap-1.5">
              <Meta item={item} />
            </div>
            <div className="mt-space-sm border-t border-hairline pt-space-sm">
              <Remove item={item} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-xl bg-surface-container-low shadow-sm lg:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container hover:bg-surface-container">
                <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">{t("table.email")}</TableHead>
                <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">{t("table.details")}</TableHead>
                <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">{t("table.date")}</TableHead>
                <TableHead className="text-end font-label-sm text-label-sm tracking-wider uppercase">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell dir="ltr" className="text-start font-label-md text-label-md text-on-surface">
                    {item.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Meta item={item} />
                    </div>
                  </TableCell>
                  <TableCell className="font-body-sm text-body-sm text-on-surface-variant">{date(item.createdAt)}</TableCell>
                  <TableCell className="text-end">
                    <Remove item={item} />
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
