import {
  BoxesIcon,
  CableIcon,
  ChevronRightIcon,
  CylinderIcon,
  DiscIcon,
  Flower2Icon,
  LayersIcon,
  PackageIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { ShareButton } from "@/components/share-button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { LockedPracticeStage } from "@/modules/practices/components/locked-practice-stage";
import { PracticeChapters } from "@/modules/practices/components/practice-chapters";
import { PracticePlayer } from "@/modules/practices/components/practice-player";
import { PracticeStage } from "@/modules/practices/components/practice-stage";
import { videoProvider } from "@/infrastructure/video";
import { withNext } from "@/lib/safe-next";
import { PracticeReflections } from "@/modules/community/components/practice-reflections";
import { CompleteButton, SaveButton } from "@/modules/progress/components/practice-actions";
import { hasCompletedRecently } from "@/modules/progress/server/completions";
import { isFavorite } from "@/modules/progress/server/favorites";
import { sanctuaryPlan } from "@/modules/memberships/plans";
import { getViewer } from "@/modules/memberships/server/viewer";
import { resolvePracticeAccess, toPlaybackGrant } from "@/modules/practices/server/access";
import { getPractice, getRelatedPractices } from "@/modules/practices/server/get-practice";
import type { ImplementKind } from "@/modules/practices/types";

const implementIcons: Record<ImplementKind, typeof BoxesIcon> = {
  blocks: BoxesIcon,
  strap: CableIcon,
  blanket: LayersIcon,
  bolster: CylinderIcon,
  cushion: DiscIcon,
};

export async function generateMetadata({ params }: PageProps<"/[locale]/practices/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const practice = await getPractice(locale, slug);
  if (!practice) return {};
  return {
    title: practice.title,
    description: practice.summary,
    openGraph: { title: practice.title, description: practice.summary, images: [practice.poster] },
  };
}

// Stitch: practice-detail-player-desktop.html, locked: practice-detail-locked-sanctuary-preview.html
export default async function PracticePage({ params }: PageProps<"/[locale]/practices/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const practice = await getPractice(locale, slug);
  if (!practice) notFound();

  const [t, tPractice, tBrand, tPractices, viewer, related] = await Promise.all([
    getTranslations("PracticeDetail"),
    getTranslations("Practice"),
    getTranslations("Brand"),
    getTranslations("Practices"),
    getViewer(),
    getRelatedPractices(locale, practice),
  ]);
  const access = resolvePracticeAccess(practice, viewer);
  const [saved, completed] = viewer.user
    ? await Promise.all([isFavorite(viewer.user.id, practice.slug), hasCompletedRecently(viewer.user.id, practice.slug)])
    : [false, false];
  const playback = access.mode === "locked" ? null : await videoProvider.getPlayback(practice.slug, toPlaybackGrant(access));

  // Account first, then payment, then straight back to this practice.
  const here = `/practices/${practice.slug}`;
  const membershipHref = withNext("/membership", here);
  const gate = {
    signedIn: !!viewer.user,
    primaryHref: viewer.user ? membershipHref : withNext("/sign-up", membershipHref),
    signInHref: withNext("/sign-in", here),
    trialDays: sanctuaryPlan.trialDays,
  };
  const categoryLabel = tPractice(`categories.${practice.category}`);
  const durationSeconds = practice.durationMinutes * 60;

  const chips = [
    categoryLabel,
    t("minutesLong", { count: practice.durationMinutes }),
    practice.intensity.label,
    tPractice(`props.${practice.props}`),
  ];

  return (
    <Container className="py-space-lg">
      <nav aria-label={t("breadcrumb")} className="mb-space-md">
        <ol className="flex flex-wrap items-center gap-space-xs text-on-surface-variant">
          <li>
            <Link href="/practices" className="font-label-md text-label-md tracking-widest uppercase transition-colors hover:text-primary">
              {tPractices("metaTitle")}
            </Link>
          </li>
          <ChevronRightIcon aria-hidden className="size-4 text-outline rtl:rotate-180" />
          <li>
            <Link
              href={`/practices?category=${practice.category}`}
              className="font-label-md text-label-md tracking-widest uppercase transition-colors hover:text-primary"
            >
              {categoryLabel}
            </Link>
          </li>
          <ChevronRightIcon aria-hidden className="size-4 text-outline rtl:rotate-180" />
          <li aria-current="page" className="font-label-md text-label-md font-semibold tracking-widest text-primary uppercase">
            {practice.series}
          </li>
        </ol>
      </nav>

      {/* One stage for the player, chapters and reflections: timestamps seek the video. */}
      <PracticeStage hasVideo={!!playback} limitSeconds={playback?.limitSeconds}>
        <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
          <section className="flex flex-col gap-space-lg lg:col-span-8">
            {playback ? (
              <PracticePlayer
                videoUrl={playback.src}
                poster={practice.poster}
                posterAlt={practice.imageAlt}
                categoryLabel={categoryLabel}
                durationSeconds={durationSeconds}
                gate={gate}
              />
            ) : (
              <LockedPracticeStage
                poster={practice.poster}
                posterAlt={practice.imageAlt}
                durationMinutes={practice.durationMinutes}
                primaryHref={gate.primaryHref}
                signInHref={viewer.user ? undefined : gate.signInHref}
              />
            )}

            <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-start">
              <div className="space-y-2">
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
                  {practice.title}
                </h1>
                <ul className="flex flex-wrap items-center gap-2 font-label-md text-label-md text-on-surface">
                  {chips.map((chip) => (
                    <li key={chip} className="rounded bg-surface-container px-2.5 py-1">
                      {chip}
                    </li>
                  ))}
                  <li className="rounded bg-secondary-container px-2.5 py-1 font-semibold text-on-secondary-container">
                    {t("ledBy", { name: tBrand("instructor") })}
                  </li>
                </ul>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SaveButton practiceSlug={practice.slug} saved={saved} signInHref={viewer.user ? undefined : gate.signInHref} />
                {access.mode === "full" && (
                  <CompleteButton practiceSlug={practice.slug} completed={completed} signInHref={viewer.user ? undefined : gate.signInHref} />
                )}
                <ShareButton
                  title={practice.title}
                  label={t("shareTitle")}
                  copiedLabel={t("copied")}
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-container text-on-surface shadow-sm transition-colors hover:bg-surface-container-high"
                />
              </div>
            </div>

            <p className="max-w-3xl font-body-lg text-body-lg text-on-surface-variant">{practice.summary}</p>

            {practice.instructorNote && (
              <div className="flex flex-col items-start gap-space-md rounded-xl bg-surface-container-low p-space-lg shadow-sm sm:flex-row">
                <Image
                  src="/images/brand/elena-closeup.jpg"
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 shrink-0 rounded-full object-cover ring-4 ring-surface"
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">
                      {t("noteTitle", { name: tBrand("instructor") })}
                    </h2>
                    <span className="font-label-sm text-label-sm tracking-wider text-clay uppercase">• {t("masterGuide")}</span>
                  </div>
                  <blockquote className="font-body-md text-body-md text-on-surface-variant italic rtl:not-italic">
                    “{practice.instructorNote}”
                  </blockquote>
                </div>
              </div>
            )}

            {(practice.focus.length > 0 || practice.implements.length > 0) && (
              <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
                {practice.focus.length > 0 && (
                  <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-clay">
                      <Flower2Icon className="size-4" />
                      <h2 className="font-label-md text-label-md font-semibold tracking-wider uppercase">{t("focusTitle")}</h2>
                    </div>
                    <ul className="space-y-2.5 font-body-sm text-body-sm text-on-surface-variant">
                      {practice.focus.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {practice.implements.length > 0 && (
                  <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-clay">
                      <PackageIcon className="size-4" />
                      <h2 className="font-label-md text-label-md font-semibold tracking-wider uppercase">{t("implementsTitle")}</h2>
                    </div>
                    <ul className="mt-2 grid grid-cols-3 gap-2">
                      {practice.implements.map((item) => {
                        const Icon = implementIcons[item.kind];
                        return (
                          <li key={item.name} className="flex flex-col items-center rounded-lg bg-surface-container p-3 text-center">
                            <Icon className="mb-1 size-6 text-clay" />
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface">{item.name}</span>
                            <span className="font-label-sm text-label-sm text-outline">{item.detail}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {practice.chapters.length > 0 && (
              <PracticeChapters chapters={practice.chapters} durationSeconds={durationSeconds} />
            )}
          </section>

          <aside className="flex flex-col gap-space-lg lg:col-span-4">
            <section className="space-y-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("relatedTitle")}</h2>
                <Link href="/practices" className="font-label-sm text-label-sm tracking-wider text-clay uppercase transition-colors hover:text-primary">
                  {t("viewAll")}
                </Link>
              </div>
              <ul className="space-y-3">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/practices/${item.slug}`} className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-surface-container">
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-surface-dim">
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          sizes="96px"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <span className="absolute end-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 font-label-sm text-[10px] text-white">
                          {tPractice("minutes", { count: item.durationMinutes })}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-col justify-center">
                        <span className="truncate font-label-sm text-label-sm tracking-wider text-clay uppercase">{item.series}</span>
                        <h3 className="line-clamp-2 font-heading text-[0.95rem] leading-tight text-on-surface transition-colors group-hover:text-primary">
                          {item.title}
                        </h3>
                        <span className="mt-0.5 font-body-sm text-[12px] text-outline">
                          {item.intensity.label} • {tPractice(`categories.${item.category}`)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

              <PracticeReflections practice={practice} viewer={viewer} signInHref={gate.signInHref} membershipHref={gate.primaryHref} />
          </aside>
        </div>
      </PracticeStage>
    </Container>
  );
}
