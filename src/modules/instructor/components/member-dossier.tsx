"use client";

import { BadgeCheckIcon, CalendarOffIcon, GiftIcon, KeyRoundIcon, PlayIcon, RotateCcwIcon, ShieldIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import {
  changeMemberRole,
  endMemberAccess,
  grantMemberAccess,
  sendMemberPasswordReset,
  setMemberCancelAtPeriodEnd,
} from "@/modules/instructor/actions";
import type { MemberDossier } from "@/modules/instructor/server/members";

import type { StudioPlanOption } from "./member-directory";

/**
 * Stitch: the practitioner dossier drawer on studio-admin-members-access. Every control here
 * is a real mutation; the gift pass writes a membership against the "studio" provider, since
 * nothing was charged.
 */
export function MemberDossierPanel({ dossier, isSelf, plans }: { dossier: MemberDossier; isSelf: boolean; plans: StudioPlanOption[] }) {
  const t = useTranslations("Studio.members.dossier");
  const format = useFormatter();
  const [months, setMonths] = useState("1");
  const onSale = plans.filter((p) => p.active);
  const [plan, setPlan] = useState(onSale[0]?.id ?? plans[0]?.id ?? "");
  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id;
  const [pending, start] = useTransition();

  const { account, membership } = dossier;
  const run = (work: () => Promise<{ ok: boolean }>, success: string) =>
    start(async () => {
      const result = await work();
      if (result.ok) toast.success(success);
      else toast.error(t("failed"));
    });

  const active = membership && (membership.status === "active" || membership.status === "trialing") && membership.currentPeriodEnd > new Date();

  return (
    <aside className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md shadow-md md:p-space-lg xl:sticky xl:top-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">{t("eyebrow")}</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{account.name}</h2>
        </div>
        <Badge variant={active ? "default" : "outline"} className="shrink-0">
          {active ? t("active") : t("inactive")}
        </Badge>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-surface p-space-sm shadow-sm">
        <Avatar className="size-12 shrink-0">
          <AvatarImage src={account.image ?? undefined} alt="" />
          <AvatarFallback>{account.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-label-md text-label-md font-semibold text-on-surface" dir="ltr">
            {account.email}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {t("joined", { when: format.dateTime(account.createdAt, { dateStyle: "long" }) })}
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {account.role === "instructor" && (
              <Badge variant="secondary" className="gap-1">
                <BadgeCheckIcon />
                {t("instructor")}
              </Badge>
            )}
            {account.emailVerified ? (
              <Badge variant="outline">{t("verified")}</Badge>
            ) : (
              <Badge variant="destructive">{t("unverified")}</Badge>
            )}
            {account.practiceRhythm && <Badge variant="outline">{t(`rhythm.${account.practiceRhythm}`)}</Badge>}
          </div>
        </div>
      </div>

      <dl className="flex flex-col gap-1.5 rounded-lg bg-surface p-space-md shadow-sm">
        {[
          [t("tier"), membership ? planName(membership.plan) : t("plans.none")],
          [t("state"), membership ? t(`states.${membership.status}`) : t("plans.none")],
          [t("paidThrough"), membership ? format.dateTime(membership.currentPeriodEnd, { dateStyle: "medium" }) : "—"],
          [t("provider"), membership ? membership.provider : "—"],
          [t("sessions"), format.number(dossier.sessions)],
          [t("minutes"), format.number(dossier.minutes)],
          [t("saves"), format.number(dossier.saves)],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt className="font-label-sm text-label-sm text-on-surface-variant uppercase">{label}</dt>
            <dd className="font-label-md text-label-md text-on-surface">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-space-sm">
        <span className="font-label-sm text-label-sm tracking-wider text-on-surface-variant uppercase">{t("grantTitle")}</span>
        <div className="flex gap-space-xs">
          <ResponsiveSelect
            label={t("grantPlan")}
            value={plan}
            onValueChange={setPlan}
            className="flex-1"
            options={(onSale.length ? onSale : plans).map((p) => ({ value: p.id, label: p.name }))}
          />
          <ResponsiveSelect
            label={t("grantMonths")}
            value={months}
            onValueChange={setMonths}
            className="w-28"
            options={["1", "3", "6", "12"].map((m) => ({ value: m, label: t("months", { count: Number(m) }) }))}
          />
        </div>
        <Button
          disabled={pending}
          onClick={() => run(() => grantMemberAccess({ userId: account.id, plan, months: Number(months) }), t("granted"))}
        >
          <GiftIcon data-icon="inline-start" />
          {t("grant")}
        </Button>
      </section>

      <Separator />

      <section className="flex flex-col gap-space-xs">
        <span className="font-label-sm text-label-sm tracking-wider text-on-surface-variant uppercase">{t("controlsTitle")}</span>
        <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2">
          {membership && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(
                  () => setMemberCancelAtPeriodEnd({ userId: account.id, cancel: !membership.cancelAtPeriodEnd }),
                  membership.cancelAtPeriodEnd ? t("resumed") : t("canceled"),
                )
              }
            >
              {membership.cancelAtPeriodEnd ? <PlayIcon data-icon="inline-start" /> : <RotateCcwIcon data-icon="inline-start" />}
              {membership.cancelAtPeriodEnd ? t("resume") : t("cancelAtEnd")}
            </Button>
          )}

          <Button
            variant="outline"
            disabled={pending}
            onClick={() => run(() => sendMemberPasswordReset({ email: account.email }), t("resetSent"))}
          >
            <KeyRoundIcon data-icon="inline-start" />
            {t("sendReset")}
          </Button>

          {!isSelf && (
            <ResponsiveDialog>
              <ResponsiveDialogTrigger asChild>
                <Button variant="outline" disabled={pending}>
                  <ShieldIcon data-icon="inline-start" />
                  {account.role === "instructor" ? t("makeMember") : t("makeInstructor")}
                </Button>
              </ResponsiveDialogTrigger>
              <ResponsiveDialogContent>
                <ResponsiveDialogHeader>
                  <ResponsiveDialogTitle>{account.role === "instructor" ? t("makeMember") : t("makeInstructor")}</ResponsiveDialogTitle>
                  <ResponsiveDialogDescription>
                    {account.role === "instructor" ? t("makeMemberBody", { name: account.name }) : t("makeInstructorBody", { name: account.name })}
                  </ResponsiveDialogDescription>
                </ResponsiveDialogHeader>
                <ResponsiveDialogFooter>
                  <ResponsiveDialogClose asChild>
                    <Button variant="outline">{t("cancelAction")}</Button>
                  </ResponsiveDialogClose>
                  <ResponsiveDialogClose asChild>
                    <Button
                      onClick={() =>
                        run(() => changeMemberRole({ userId: account.id, role: account.role === "instructor" ? "member" : "instructor" }), t("roleChanged"))
                      }
                    >
                      {t("confirm")}
                    </Button>
                  </ResponsiveDialogClose>
                </ResponsiveDialogFooter>
              </ResponsiveDialogContent>
            </ResponsiveDialog>
          )}

          {membership && (
            <ResponsiveDialog>
              <ResponsiveDialogTrigger asChild>
                <Button variant="outline" disabled={pending} className="text-destructive">
                  <CalendarOffIcon data-icon="inline-start" />
                  {t("endNow")}
                </Button>
              </ResponsiveDialogTrigger>
              <ResponsiveDialogContent>
                <ResponsiveDialogHeader>
                  <ResponsiveDialogTitle>{t("endNow")}</ResponsiveDialogTitle>
                  <ResponsiveDialogDescription>{t("endNowBody", { name: account.name })}</ResponsiveDialogDescription>
                </ResponsiveDialogHeader>
                <ResponsiveDialogFooter>
                  <ResponsiveDialogClose asChild>
                    <Button variant="outline">{t("cancelAction")}</Button>
                  </ResponsiveDialogClose>
                  <ResponsiveDialogClose asChild>
                    <Button variant="destructive" onClick={() => run(() => endMemberAccess({ userId: account.id }), t("ended"))}>
                      {t("confirm")}
                    </Button>
                  </ResponsiveDialogClose>
                </ResponsiveDialogFooter>
              </ResponsiveDialogContent>
            </ResponsiveDialog>
          )}
        </div>
      </section>

      {dossier.recent.length > 0 && (
        <section className="flex flex-col gap-space-xs">
          <span className="font-label-sm text-label-sm tracking-wider text-on-surface-variant uppercase">{t("streamTitle")}</span>
          <ul className="flex flex-col gap-1.5">
            {dossier.recent.map((session, i) => (
              <li key={`${session.practiceSlug}-${i}`} className="flex items-center gap-2.5 rounded-lg bg-surface p-2 shadow-sm">
                <span className="flex size-8 shrink-0 items-center justify-center rounded bg-primary-container/40 text-primary">
                  <PlayIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <Link href={`/practices/${session.practiceSlug}`} className="block truncate font-label-md text-label-md text-on-surface hover:text-primary">
                    {session.title}
                  </Link>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {t("sessionLine", { minutes: session.minutes, when: format.relativeTime(session.completedAt, new Date()) })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dossier.reflections.length > 0 && (
        <section className="flex flex-col gap-space-xs">
          <span className="font-label-sm text-label-sm tracking-wider text-on-surface-variant uppercase">{t("reflectionsTitle")}</span>
          <ul className="flex flex-col gap-1.5">
            {dossier.reflections.map((reflection) => (
              <li key={reflection.id} className="rounded-lg bg-surface p-2.5 shadow-sm">
                <p dir="auto" className="line-clamp-3 font-body-sm text-body-sm text-on-surface">
                  {reflection.body}
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-label-sm text-label-sm text-outline">
                  {reflection.visibility === "private" && <Badge variant="outline">{t("private")}</Badge>}
                  {format.relativeTime(reflection.createdAt, new Date())}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
