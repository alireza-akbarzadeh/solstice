import { InboxIcon, SettingsIcon, SparklesIcon, UsersRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StudioCrumb } from "@/components/layout/studio-breadcrumb";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { InboxThread } from "@/modules/conversations/components/inbox-thread";
import { WaitlistButton } from "@/modules/conversations/components/waitlist-button";
import { countWaiting, getConversation, getThread, getUserContact, listInbox, markRead, type InboxFilter } from "@/modules/conversations/server/conversations";
import { getGuidancePlaces, isFull } from "@/modules/conversations/server/guidance";
import { getChatSettings } from "@/modules/conversations/server/settings";
import type { InboxRow } from "@/modules/conversations/types";
import { StudioFilterPills } from "@/modules/instructor/components/studio-filter-pills";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { requireInstructor } from "@/modules/memberships/server/viewer";

export async function generateMetadata({ params }: PageProps<"/[locale]/instructor/inbox">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.inbox" });
  return { title: t("metaTitle"), robots: { index: false } };
}

const filters = ["guidance", "assistant", "closed"] as const satisfies readonly InboxFilter[];

// No Stitch screen yet (studio style). Guidance questions from members and quick-help chats
// handed to a person, waiting ones first; open one to read everything (AI replies marked) and
// answer — the member gets a push and an email.
export default async function StudioInboxPage({ params, searchParams }: PageProps<"/[locale]/instructor/inbox">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await requireInstructor(locale, "/instructor/inbox");
  const query = await searchParams;
  const one = (key: string) => (Array.isArray(query[key]) ? query[key][0] : query[key]);
  const filter: InboxFilter = filters.find((f) => f === one("view")) ?? "guidance";

  const [t, format, rows, places, waitingGuidance, waitingAssistant, settings] = await Promise.all([
    getTranslations("Studio.inbox"),
    getFormatter(),
    listInbox(filter),
    getGuidancePlaces(locale),
    countWaiting("guidance"),
    countWaiting("assistant"),
    getChatSettings(),
  ]);

  const now = new Date();
  const requested = Number(one("c"));
  const conversation = Number.isInteger(requested) && requested > 0 ? await getConversation(requested) : rows[0] ? await getConversation(rows[0].id) : null;
  let selected: { thread: Awaited<ReturnType<typeof getThread>>; who: InboxRow["who"]; userId: string | null } | null = null;
  if (conversation) {
    await markRead(conversation.id, "staff");
    const listed = rows.find((row) => row.id === conversation.id);
    const contact = !listed && conversation.userId ? await getUserContact(conversation.userId) : null;
    selected = {
      thread: await getThread(conversation, locale, "staff"),
      userId: conversation.userId,
      who: listed?.who ?? {
        name: contact?.name ?? conversation.guestName ?? "",
        email: contact?.email ?? conversation.guestEmail,
        member: !!conversation.userId,
        plan: null,
      },
    };
  }
  // Phones show the list or one conversation; wide screens show both, the first preselected.
  const chosen = !!one("c");
  const keep: Record<string, string> = filter === "guidance" ? {} : { view: filter };
  const href = (id: number) => `/instructor/inbox?${new URLSearchParams({ ...keep, c: String(id) })}`;

  return (
    <div className="flex flex-col gap-space-lg">
      <StudioCrumb items={[]} />
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede")}
        actions={
          <Link
            href="/instructor/inbox/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface-container-low px-4 py-2 font-label-lg text-label-lg text-on-surface transition-colors hover:bg-surface-container"
          >
            <SettingsIcon className="size-4" />
            {t("settingsLink")}
          </Link>
        }
      />

      <div className="flex flex-wrap gap-gutter">
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3">
          <SparklesIcon className={cn("size-4", settings.assistantOn ? "text-primary" : "text-outline")} />
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            {t(`assistantState.${settings.assistantOn ? settings.mode : "off"}`)}
            {settings.guidanceAi && settings.assistantOn ? ` · ${t("assistantState.guidanceAi")}` : ""}
          </span>
        </div>
        {places.map((p) => (
          <div key={p.planId} className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3">
            <UsersRoundIcon className="size-4 text-primary" />
            <span className="font-body-sm text-body-sm text-on-surface">
              <span className="font-label-lg text-label-lg">{p.name}</span> ·{" "}
              {p.places === 0
                ? t("places.unlimited", { used: format.number(p.used) })
                : t(isFull(p) ? "places.full" : "places.used", { used: format.number(p.used), places: format.number(p.places) })}
            </span>
            {p.waitlist > 0 && <WaitlistButton planId={p.planId} count={p.waitlist} />}
          </div>
        ))}
      </div>

      <StudioFilterPills
        basePath="/instructor/inbox"
        param="view"
        active={filter}
        options={filters.map((f) => ({
          value: f,
          label: t(`filters.${f}`),
          count: f === "guidance" ? waitingGuidance : f === "assistant" ? waitingAssistant : undefined,
        }))}
      />

      {rows.length === 0 && !selected ? (
        <Empty className="rounded-xl bg-surface-container-low">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>{t(`empty.${filter}.title`)}</EmptyTitle>
            <EmptyDescription>{t(`empty.${filter}.body`)}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
          <ul className={cn("flex flex-col gap-2 xl:col-span-4", selected && chosen && "hidden xl:flex")}>
            {rows.map((row) => {
              const active = selected?.thread.id === row.id;
              return (
                <li key={row.id}>
                  <Link
                    href={href(row.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col gap-1 rounded-xl p-3.5 transition-colors",
                      active ? "bg-surface-container-lowest shadow-sm ring-1 ring-primary/30" : "bg-surface-container-low hover:bg-surface-container",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 font-label-lg text-label-lg text-on-surface">
                        {row.unread && <span className="size-2 shrink-0 rounded-full bg-clay" aria-label={t("unread")} />}
                        <span className="truncate">{row.who.name || (row.who.member ? t("thread.member") : t("thread.visitor"))}</span>
                      </span>
                      <time className="shrink-0 font-label-sm text-label-sm text-outline" dateTime={row.lastMessageAt}>
                        {format.relativeTime(new Date(row.lastMessageAt), now)}
                      </time>
                    </span>
                    <span className="truncate font-body-sm text-body-sm font-semibold text-on-surface">{row.subject || t("thread.untitled")}</span>
                    <span className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">
                      {row.previewAuthor === "ai" ? `${t("aiPrefix")} ` : row.previewAuthor === "instructor" ? `${t("youPrefix")} ` : ""}
                      {row.preview}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-label-sm text-label-sm",
                          row.status === "waiting" ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container-high text-on-surface-variant",
                        )}
                      >
                        {row.status === "waiting" && row.waitingSince
                          ? t("waitingFor", { time: format.relativeTime(new Date(row.waitingSince), now) })
                          : t(`status.${row.status}`)}
                      </span>
                      {row.escalated && <span className="rounded bg-primary-fixed px-1.5 py-0.5 font-label-sm text-label-sm text-on-primary-fixed">{t("askedForPerson")}</span>}
                      {row.kind === "assistant" && !row.escalated && (
                        <span className="rounded bg-surface-container-high px-1.5 py-0.5 font-label-sm text-label-sm text-on-surface-variant">{t("aiOnly")}</span>
                      )}
                      {row.who.plan && <span className="rounded bg-surface-container-high px-1.5 py-0.5 font-label-sm text-label-sm text-on-surface-variant">{row.who.plan}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {selected && (
            <section className={cn("rounded-xl bg-surface-container-low p-space-md shadow-sm xl:col-span-8", !chosen && "hidden xl:block")}>
              <Link href={filter === "guidance" ? "/instructor/inbox" : `/instructor/inbox?view=${filter}`} className="mb-space-sm inline-block font-label-md text-label-md text-primary xl:hidden">
                {t("back")}
              </Link>
              <InboxThread key={selected.thread.id} thread={selected.thread} who={selected.who} userId={selected.userId} instructorName={viewer.user.name} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
