import { ClapperboardIcon, HelpCircleIcon, LockIcon, MessageCirclePlusIcon, ShieldCheckIcon, SparklesIcon, UserRoundCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { joinGuidanceWaitlist } from "@/modules/conversations/actions";
import { GuidanceThread, NewGuidanceThread } from "@/modules/conversations/components/guidance-thread";
import { INSTRUCTOR_IMAGE } from "@/modules/conversations/components/message-bubble";
import { getOwnedConversation, getThread, listOwnerThreads } from "@/modules/conversations/server/conversations";
import { getGuidancePlaces, hasGuidanceAccess, isFull, isOnWaitlist } from "@/modules/conversations/server/guidance";
import { getChatSettings } from "@/modules/conversations/server/settings";
import type { GuidanceTopic } from "@/modules/conversations/types";
import { getAllPlans } from "@/modules/memberships/server/plans";
import { requireUser } from "@/modules/memberships/server/viewer";
import { getAllPracticeSummaries } from "@/modules/practices/server/get-practice";
import { SocialIcon } from "@/modules/contact/components/social-icon";
import { getStudioContact } from "@/modules/contact/server/contact";

export async function generateMetadata({ params }: PageProps<"/[locale]/guidance">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Conversations.guidance" });
  return { title: t("metaTitle"), robots: { index: false } };
}

const commonQuestions = ["beginners", "props", "pain", "pause"] as const;

// Stitch: "Sanctuary Dialogue & Somatic Guidance" (design/screen (1).png). Members on a plan
// with 1:1 guidance write to the instructor; questions wait in a queue for a personal reply. AI
// replies, when the studio turns them on, are labeled as AI — the design's "no chatbots" copy
// was rewritten to say so honestly. Voice notes and clips wait for file storage (roadmap #8).
export default async function GuidancePage({ params, searchParams }: PageProps<"/[locale]/guidance">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await requireUser(locale, "/guidance");
  if (viewer.user.role === "instructor") return redirect({ href: "/instructor/inbox", locale });
  const query = await searchParams;
  const one = (key: string) => (Array.isArray(query[key]) ? query[key][0] : query[key]);

  const [t, tBrand, settings, access, contact] = await Promise.all([
    getTranslations("Conversations.guidance"),
    getTranslations("Brand"),
    getChatSettings(),
    hasGuidanceAccess(viewer),
    getStudioContact(),
  ]);
  const instructorName = tBrand("instructor");
  const telegramUrl = contact.socials.find((s) => s.network === "telegram")?.url ?? "https://t.me/solstice_yoga";
  const instagramUrl = contact.socials.find((s) => s.network === "instagram")?.url ?? "https://instagram.com/solstice_yoga";

  const hero = (
    <section className="flex flex-col gap-space-md">
      <p className="w-fit rounded-full bg-surface-container px-4 py-1.5 font-label-md text-label-md tracking-widest text-on-surface-variant uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="max-w-3xl font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
        {t("title", { name: instructorName })}
      </h1>
      <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">{t("lede", { name: instructorName })}</p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-3 rounded-xl bg-surface-container-low px-3 py-2">
          <Image src={INSTRUCTOR_IMAGE} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
          <span className="flex flex-col">
            <span className="font-label-lg text-label-lg text-on-surface">{instructorName}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">{t("replyTime", { hours: settings.replyHours })}</span>
          </span>
        </span>
        <span className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2 font-label-md text-label-md text-on-surface-variant">
          <ShieldCheckIcon className="size-4" />
          {t("privacy", { name: instructorName })}
        </span>
        {telegramUrl && (
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface-container-low px-3.5 py-2 font-label-md text-label-md text-on-surface transition-colors hover:border-[#229ED9]/50 hover:bg-surface hover:text-[#229ED9]"
          >
            <SocialIcon network="telegram" className="size-4 text-[#229ED9]" />
            <span>{t("telegram")}</span>
          </a>
        )}
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface-container-low px-3.5 py-2 font-label-md text-label-md text-on-surface transition-colors hover:border-[#E1306C]/50 hover:bg-surface hover:text-[#E1306C]"
          >
            <SocialIcon network="instagram" className="size-4 text-[#E1306C]" />
            <span>{t("instagram")}</span>
          </a>
        )}
      </div>
    </section>
  );

  const principles = (
    <section className="flex flex-col items-center gap-space-lg border-t border-hairline pt-space-xl text-center">
      <div className="flex max-w-2xl flex-col gap-space-sm">
        <p className="font-label-md text-label-md tracking-widest text-clay uppercase">{t("principles.eyebrow")}</p>
        <h2 className="font-headline-md text-headline-md text-primary">{t("principles.title")}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">{t("principles.lede", { name: instructorName })}</p>
      </div>
      <div className="grid w-full grid-cols-1 gap-gutter text-start md:grid-cols-3">
        {(
          [
            ["personal", UserRoundCheckIcon],
            ["moments", ClapperboardIcon],
            ["honest", SparklesIcon],
          ] as const
        ).map(([key, Icon]) => (
          <article key={key} className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
            <Icon className="size-6 text-primary" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{t(`principles.${key}.title`)}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t(`principles.${key}.body`, { name: instructorName })}</p>
          </article>
        ))}
      </div>
    </section>
  );

  // ——— Without a plan that includes guidance ———
  if (!access) {
    const [plans, places, format] = await Promise.all([getAllPlans(), getGuidancePlaces(locale), getFormatter()]);
    const offers = plans
      .filter((plan) => plan.status === "active" && plan.guidance)
      .map((plan) => ({ plan, places: places.find((p) => p.planId === plan.id) }));
    const waiting = await Promise.all(offers.map(({ plan }) => isOnWaitlist(plan.id, viewer.user.id)));

    return (
      <Container className="flex flex-col gap-space-xl py-space-lg md:py-space-xl">
        {hero}
        <section className="relative overflow-hidden rounded-2xl bg-surface-container-low p-space-lg md:p-space-xl">
          <div className="flex max-w-2xl flex-col gap-space-md">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <LockIcon className="size-5" />
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface">{t("locked.title", { name: instructorName })}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {offers.length ? t("locked.body", { name: instructorName }) : t("locked.noPlans", { name: instructorName })}
            </p>
            <ul className="flex flex-col gap-3">
              {offers.map(({ plan, places: p }, index) => {
                const full = p ? isFull(p) : false;
                return (
                  <li key={plan.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                    <div>
                      <p className="font-label-lg text-label-lg text-on-surface">{localize(plan.name, locale)}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {!p || p.places === 0
                          ? t("locked.open")
                          : full
                            ? t("locked.full", { places: format.number(p.places) })
                            : t("locked.left", { left: format.number(p.places - p.used), places: format.number(p.places) })}
                      </p>
                    </div>
                    {full ? (
                      waiting[index] ? (
                        <span className="rounded-lg bg-secondary-fixed px-4 py-2 font-label-md text-label-md text-on-secondary-fixed">{t("locked.onWaitlist")}</span>
                      ) : (
                        <form action={joinGuidanceWaitlist}>
                          <input type="hidden" name="plan" value={plan.id} />
                          <button type="submit" className="rounded-lg border border-on-surface px-4 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high">
                            {t("locked.joinWaitlist")}
                          </button>
                        </form>
                      )
                    ) : (
                      <Link
                        href={viewer.hasAccess ? "/profile" : `/membership?plan=${plan.id}`}
                        className="rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-on-primary transition-colors hover:bg-primary-container"
                      >
                        {viewer.hasAccess ? t("locked.switch") : t("locked.join")}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="font-body-sm text-body-sm text-outline">{t("locked.quickHelp")}</p>
            {(telegramUrl || instagramUrl) && (
              <div className="mt-2 flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4">
                <span className="font-label-sm text-label-sm font-semibold tracking-wider text-clay uppercase">
                  {t("directChannels")}
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {telegramUrl && (
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 font-label-md text-label-md text-on-surface transition-colors hover:border-[#229ED9]/50 hover:text-[#229ED9]"
                    >
                      <SocialIcon network="telegram" className="size-4 text-[#229ED9]" />
                      <span>{t("telegram")}</span>
                    </a>
                  )}
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 font-label-md text-label-md text-on-surface transition-colors hover:border-[#E1306C]/50 hover:text-[#E1306C]"
                    >
                      <SocialIcon network="instagram" className="size-4 text-[#E1306C]" />
                      <span>{t("instagram")}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
        {principles}
      </Container>
    );
  }

  // ——— The room ———
  const owner = { userId: viewer.user.id };
  const [threads, practices] = await Promise.all([listOwnerThreads(owner, "guidance"), getAllPracticeSummaries(locale)]);
  const requested = Number(one("c"));
  const row = Number.isInteger(requested) && requested > 0 ? await getOwnedConversation(requested, owner) : null;
  const starting = one("new") === "1" || (!row && !threads.length);
  const selected = !starting ? (row ?? (threads[0] ? await getOwnedConversation(threads[0].id, owner) : null)) : null;
  const thread = selected?.kind === "guidance" ? await getThread(selected, locale, "member") : null;
  const topic: GuidanceTopic = one("topic") === "practice" ? "practice" : "path";
  const shared = {
    practices: practices.map((p) => ({ slug: p.slug, title: p.title })),
    instructorName,
    replyHours: settings.replyHours,
  };
  const format = await getFormatter();
  const now = new Date();

  return (
    <Container className="flex flex-col gap-space-xl py-space-lg md:py-space-xl">
      {hero}

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
        <aside className="flex flex-col gap-gutter lg:col-span-4">
          <section className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
            <div className="flex items-center justify-between">
              <h2 className="font-label-md text-label-md tracking-widest text-on-surface-variant uppercase">{t("threads.title")}</h2>
              <span className="font-label-sm text-label-sm text-outline">{t("threads.count", { count: threads.length })}</span>
            </div>
            <Link
              href="/guidance?new=1"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 font-label-lg text-label-lg transition-colors",
                starting ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-primary hover:bg-surface",
              )}
            >
              <MessageCirclePlusIcon className="size-4" />
              {t("threads.new")}
            </Link>
            <ul className="flex flex-col gap-2">
              {threads.map((item) => {
                const active = thread?.id === item.id;
                return (
                  <li key={item.id}>
                    <Link
                      href={`/guidance?c=${item.id}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex flex-col gap-1 rounded-lg p-3 transition-colors",
                        active ? "bg-surface-container-lowest shadow-sm ring-1 ring-primary/30" : "bg-surface-container hover:bg-surface-container-high",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                          {item.unread && <span className="size-2 rounded-full bg-clay" aria-label={t("threads.unread")} />}
                          {t(`threads.status.${item.status}`)}
                        </span>
                        <time className="font-label-sm text-label-sm text-outline" dateTime={item.lastMessageAt}>
                          {format.relativeTime(new Date(item.lastMessageAt), now)}
                        </time>
                      </span>
                      <span className="truncate font-headline-sm text-[1.0625rem] leading-snug text-on-surface">{item.subject}</span>
                      <span className="line-clamp-1 font-body-sm text-body-sm text-on-surface-variant">
                        {item.previewAuthor === "ai" ? `${t("threads.aiPrefix")} ` : ""}
                        {item.preview}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
            <p className="font-label-md text-label-md tracking-widest text-on-surface-variant uppercase">{t("common.eyebrow")}</p>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("common.title")}</h2>
            <ul className="flex flex-col gap-2">
              {commonQuestions.map((key) => (
                <li key={key}>
                  <Link
                    href={`/guidance?new=1&topic=${key === "pain" ? "practice" : "path"}&subject=${encodeURIComponent(t(`common.${key}`))}`}
                    className="flex items-start gap-2 rounded-lg bg-surface-container-lowest p-3 font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary"
                  >
                    <HelpCircleIcon className="mt-0.5 size-4 shrink-0" />
                    {t(`common.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-space-sm rounded-xl bg-surface-container p-space-md">
            <div className="flex items-center gap-3">
              <Image src={INSTRUCTOR_IMAGE} alt="" width={56} height={56} className="size-14 rounded-lg object-cover" />
              <div>
                <p className="font-headline-sm text-headline-sm text-on-surface">{instructorName}</p>
                <p className="font-label-sm text-label-sm tracking-wider text-clay uppercase">{t("instructor.role")}</p>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t("instructor.bio")}</p>
            <div className="rounded-lg bg-surface-container-lowest p-3">
              <p className="font-label-md text-label-md text-on-surface">{t("instructor.ethosTitle")}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {settings.guidanceAi ? t("instructor.ethosAi", { name: instructorName }) : t("instructor.ethos", { name: instructorName })}
              </p>
            </div>
            {(telegramUrl || instagramUrl) && (
              <div className="mt-2 flex flex-col gap-2 border-t border-hairline/60 pt-3">
                <span className="font-label-sm text-label-sm font-semibold tracking-wider text-clay uppercase">
                  {t("directChannels")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {telegramUrl && (
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 font-label-md text-label-md text-on-surface shadow-xs transition-colors hover:text-[#229ED9]"
                    >
                      <SocialIcon network="telegram" className="size-4 text-[#229ED9]" />
                      <span>{t("telegram")}</span>
                    </a>
                  )}
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 font-label-md text-label-md text-on-surface shadow-xs transition-colors hover:text-[#E1306C]"
                    >
                      <SocialIcon network="instagram" className="size-4 text-[#E1306C]" />
                      <span>{t("instagram")}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </section>
        </aside>

        <section className="rounded-2xl bg-surface-container-low p-space-md md:p-space-lg lg:col-span-8">
          {thread ? (
            <GuidanceThread key={thread.id} thread={thread} memberName={viewer.user.name} {...shared} />
          ) : (
            <NewGuidanceThread key={`${topic}-${one("subject") ?? ""}`} initialTopic={topic} initialSubject={(one("subject") ?? "").slice(0, 120)} {...shared} />
          )}
        </section>
      </div>

      {principles}
    </Container>
  );
}
