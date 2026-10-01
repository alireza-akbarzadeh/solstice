"use client";

import { BadgeCheckIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { MemberRow } from "@/modules/instructor/server/studio";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/** The tier badge reads from the membership, because a row may have no membership at all. */
function TierBadge({ member }: { member: MemberRow }) {
  const t = useTranslations("Studio.members");
  if (member.role === "instructor")
    return (
      <Badge className="bg-clay text-white">{t("tiers.instructor")}</Badge>
    );
  if (!member.status) return <Badge variant="outline">{t("tiers.none")}</Badge>;
  if (member.status === "trialing")
    return <Badge variant="secondary">{t("tiers.trial")}</Badge>;
  if (member.status === "past_due")
    return <Badge variant="destructive">{t("tiers.pastDue")}</Badge>;
  if (member.status === "canceled")
    return <Badge variant="outline">{t("tiers.canceled")}</Badge>;
  return (
    <Badge>
      {t(member.plan === "annual" ? "tiers.annual" : "tiers.monthly")}
    </Badge>
  );
}

/**
 * Stitch: studio-admin-members-access — the practitioner directory. A row opens the dossier
 * panel through the URL (`?member=`), so the selection survives a reload.
 */
export function MemberDirectory({
  members,
  selected,
}: {
  members: MemberRow[];
  selected: string | null;
}) {
  const t = useTranslations("Studio.members");
  const format = useFormatter();
  const router = useRouter();

  const open = (id: string) =>
    router.push(`/instructor/members?member=${id}`, { scroll: false });

  return (
    <>
      {/* Phones get tappable cards; a five-column table only scrolls sideways at this width. */}
      <ul className="gap-space-sm flex flex-col lg:hidden">
        {members.map((member) => (
          <li key={member.id}>
            <button
              type="button"
              onClick={() => open(member.id)}
              aria-current={selected === member.id ? "true" : undefined}
              className={cn(
                "bg-surface-container-low p-space-md active:bg-surface-container w-full rounded-xl text-start shadow-sm transition-colors",
                selected === member.id && "ring-primary ring-2",
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className="size-11 shrink-0">
                  <AvatarImage src={member.image ?? undefined} alt="" />
                  <AvatarFallback className="font-label-md text-label-md">
                    {initials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-lg text-label-lg text-on-surface truncate">
                      {member.name}
                    </span>
                    {member.role === "instructor" && (
                      <BadgeCheckIcon className="text-clay size-3.5 shrink-0" />
                    )}
                  </div>
                  <p
                    className="font-body-sm text-body-sm text-on-surface-variant truncate"
                    dir="ltr"
                  >
                    {member.email}
                  </p>
                </div>
                <TierBadge member={member} />
              </div>

              <dl className="mt-space-sm border-hairline pt-space-sm font-label-sm text-label-sm grid grid-cols-2 gap-x-3 gap-y-1 border-t">
                <div className="flex justify-between gap-2">
                  <dt className="text-outline">{t("table.sessions")}</dt>
                  <dd className="text-on-surface">
                    {format.number(member.sessions)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-outline">{t("table.lastPractice")}</dt>
                  <dd className="text-on-surface truncate">
                    {member.lastPracticeAt
                      ? format.relativeTime(
                          new Date(member.lastPracticeAt),
                          new Date(),
                        )
                      : t("table.never")}
                  </dd>
                </div>
                {member.currentPeriodEnd && (
                  <div className="col-span-2 flex justify-between gap-2">
                    <dt className="text-outline">{t("table.through")}</dt>
                    <dd className="text-on-surface">
                      {format.dateTime(member.currentPeriodEnd, {
                        dateStyle: "medium",
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </button>
          </li>
        ))}
      </ul>

      <div className="bg-surface-container-low hidden overflow-hidden rounded-xl shadow-sm lg:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container hover:bg-surface-container">
                <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">
                  {t("table.practitioner")}
                </TableHead>
                <TableHead className="font-label-sm text-label-sm tracking-wider uppercase">
                  {t("table.tier")}
                </TableHead>
                <TableHead className="font-label-sm text-label-sm hidden tracking-wider uppercase md:table-cell">
                  {t("table.lastPractice")}
                </TableHead>
                <TableHead className="font-label-sm text-label-sm hidden text-center tracking-wider uppercase sm:table-cell">
                  {t("table.sessions")}
                </TableHead>
                <TableHead className="font-label-sm text-label-sm text-end tracking-wider uppercase">
                  {t("table.access")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow
                  key={member.id}
                  onClick={() => open(member.id)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selected === member.id && "bg-surface-container/60",
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 shrink-0">
                        <AvatarImage src={member.image ?? undefined} alt="" />
                        <AvatarFallback className="font-label-md text-label-md">
                          {initials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-label-lg text-label-lg text-on-surface truncate">
                            {member.name}
                          </span>
                          {member.role === "instructor" && (
                            <BadgeCheckIcon className="text-clay size-3.5 shrink-0" />
                          )}
                        </div>
                        <p
                          className="font-body-sm text-body-sm text-on-surface-variant truncate"
                          dir="ltr"
                        >
                          {member.email}
                        </p>
                        <p className="font-label-sm text-label-sm text-outline">
                          {t("table.joined", {
                            when: format.dateTime(member.createdAt, {
                              dateStyle: "medium",
                            }),
                          })}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <TierBadge member={member} />
                      {member.cancelAtPeriodEnd && (
                        <span className="font-label-sm text-label-sm text-outline">
                          {t("table.leaving")}
                        </span>
                      )}
                      {member.currentPeriodEnd && (
                        <span className="font-label-sm text-label-sm text-outline">
                          {t("table.renews", {
                            when: format.dateTime(member.currentPeriodEnd, {
                              dateStyle: "medium",
                            }),
                          })}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    {member.lastPracticeAt ? (
                      <span className="font-body-sm text-body-sm text-on-surface">
                        {format.relativeTime(
                          new Date(member.lastPracticeAt),
                          new Date(),
                        )}
                      </span>
                    ) : (
                      <span className="font-body-sm text-body-sm text-outline">
                        {t("table.never")}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="hidden text-center sm:table-cell">
                    <span className="bg-surface font-label-md text-label-md text-on-surface inline-block rounded-md px-2.5 py-1 shadow-sm">
                      {format.number(member.sessions)}
                    </span>
                  </TableCell>

                  <TableCell className="text-end">
                    <Button
                      size="sm"
                      variant={selected === member.id ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        open(member.id);
                      }}
                    >
                      {t("table.inspect")}
                    </Button>
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
