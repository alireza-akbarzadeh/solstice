import { BadgeCheckIcon, Flower2Icon, HeartHandshakeIcon, PinIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { routing } from "@/i18n/routing";
import { ReflectionsPanel, type ReflectionView } from "@/modules/community/components/reflections-panel";
import { reflectAccess } from "@/modules/community/server/access";
import { getCircleFeed } from "@/modules/community/server/reflections";
import type { Reflection } from "@/modules/community/types";
import { ArticleCard } from "@/modules/journal/components/article-card";
import { getJournal } from "@/modules/journal/server/get-articles";
import { requireUser } from "@/modules/memberships/server/viewer";
import { PracticeStage } from "@/modules/practices/components/practice-stage";
import { getPracticeSummaries } from "@/modules/practices/server/get-practice";

export async function generateMetadata({ params }: PageProps<"/[locale]/community">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Community" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// Stitch: community-reflections.html (mobile). Every circle reflection across practices,
// plus posts made here; the instructor's latest pinned post is the week's intention.
export default async function CommunityPage({ params }: PageProps<"/[locale]/community">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await requireUser(locale, "/community");
  const reader = { id: viewer.user.id, isInstructor: viewer.user.role === "instructor" };
  const [t, tBrand, format, feed, journal] = await Promise.all([
    getTranslations("Community"),
    getTranslations("Brand"),
    getFormatter(),
    getCircleFeed(reader),
    getJournal(locale, { page: 1 }),
  ]);

  const slugs = [...new Set(feed.map((r) => r.practiceSlug).filter((s): s is string => s !== null))];
  const titles = new Map((await getPracticeSummaries(locale, slugs)).map((p) => [p.slug, p.title]));
  const now = new Date();

  const toView = (r: Reflection): ReflectionView => ({
    id: r.id,
    practice: r.practiceSlug ? { slug: r.practiceSlug, title: titles.get(r.practiceSlug) ?? r.practiceSlug } : null,
    author: r.author,
    body: r.body,
    tag: r.tag,
    atSeconds: r.atSeconds,
    atChapter: null,
    private: r.visibility === "private",
    pinned: r.pinned,
    ago: format.relativeTime(r.createdAt, now),
    likes: r.likes,
    liked: r.likedByViewer,
    canDelete: reader.isInstructor || reader.id === r.author.id,
    replies: r.replies.map(toView),
  });

  const intention = feed.find((r) => r.pinned && r.author.isInstructor && r.practiceSlug === null);

  return (
    <Container className="py-space-lg md:py-space-xl">
      <header className="mb-space-lg flex flex-col gap-space-xs">
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm tracking-widest text-clay uppercase">
          <Flower2Icon className="size-3.5" />
          {t("eyebrow")}
        </span>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">{t("title")}</h1>
        <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">{t("lede")}</p>
      </header>

      <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
        <div className="flex flex-col gap-space-lg lg:col-span-8">
          {intention && (
            <section className="relative overflow-hidden rounded-xl bg-primary p-space-lg text-on-primary shadow-sm">
              <div aria-hidden className="pointer-events-none absolute -end-16 -top-16 size-56 rounded-full bg-primary-container/50 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <Image
                  src={intention.author.image ?? "/images/brand/elena-closeup.jpg"}
                  alt=""
                  width={44}
                  height={44}
                  className="size-11 rounded-full object-cover ring-2 ring-on-primary/30"
                />
                <div>
                  <p className="flex items-center gap-1.5 font-label-lg text-label-lg">
                    {intention.author.name}
                    <BadgeCheckIcon className="size-4" />
                  </p>
                  <p className="font-label-sm text-label-sm tracking-wider text-on-primary-container uppercase">{t("intention.label")}</p>
                </div>
                <PinIcon className="ms-auto size-4 opacity-80" />
              </div>
              <p dir="auto" className="relative mt-space-md font-headline-sm text-headline-sm leading-relaxed whitespace-pre-line italic rtl:not-italic">
                {intention.body}
              </p>
            </section>
          )}

          {/* No video here: the stage only tells the composer there is no moment to attach. */}
          <PracticeStage hasVideo={false}>
            <ReflectionsPanel
              variant="circle"
              practiceSlug={null}
              reflections={feed.map(toView)}
              total={feed.reduce((n, r) => n + 1 + r.replies.length, 0)}
              access={reflectAccess({ access: "members" }, viewer)}
              isInstructor={reader.isInstructor}
              signInHref="/sign-in"
              membershipHref="/membership"
            />
          </PracticeStage>
        </div>

        <aside className="flex flex-col gap-space-lg lg:col-span-4">
          <section className="rounded-xl bg-surface-container-low p-space-lg">
            <div className="mb-3 flex items-center gap-2 text-clay">
              <HeartHandshakeIcon className="size-5" />
              <h2 className="font-label-md text-label-md font-semibold tracking-wider uppercase">{t("care.title")}</h2>
            </div>
            <ul className="space-y-2.5 font-body-sm text-body-sm text-on-surface-variant">
              {(["one", "two", "three"] as const).map((key) => (
                <li key={key} className="flex items-start gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {t(`care.${key}`, { name: tBrand("instructor") })}
                </li>
              ))}
            </ul>
          </section>

          {journal.featured && (
            <section className="flex flex-col gap-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("notes")}</h2>
              <ArticleCard article={journal.featured} />
            </section>
          )}
        </aside>
      </div>
    </Container>
  );
}
