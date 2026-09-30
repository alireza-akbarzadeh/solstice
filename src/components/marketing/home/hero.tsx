import { AudioLinesIcon, BookOpenIcon, CompassIcon, Flower2Icon, UsersIcon, Volume2Icon } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Fragment } from "react";

import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";

export async function Hero() {
  const t = await getTranslations("Home.hero");
  const stats = [
    { icon: Flower2Icon, label: t("statPractices") },
    { icon: BookOpenIcon, label: t("statPrograms") },
    { icon: UsersIcon, label: t("statLive") },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-surface-container-low pt-12 pb-20 lg:pt-16 lg:pb-32">
      <Container>
        <div className="grid grid-cols-1 items-center gap-gutter lg:grid-cols-12">
          <div className="z-10 flex flex-col justify-center lg:col-span-6">
            <div className="mb-6 inline-flex items-center gap-2 self-start rounded-full bg-secondary-fixed/40 px-3 py-1">
              <span className="size-1.5 rounded-full bg-clay" />
              <span className="font-label-md text-label-md tracking-widest text-on-secondary-fixed-variant uppercase">
                {t("eyebrow")}
              </span>
            </div>
            <h1 className="mb-6 font-display-mobile text-display-mobile tracking-tight text-primary md:font-display md:text-display">
              {t("titleLine1")}
              <br />
              <em className="font-normal italic rtl:not-italic">{t("titleLine2")}</em>
              <br />
              {t("titleLine3")}
            </h1>
            <p className="mb-10 max-w-xl font-body-lg text-body-lg text-on-surface-variant">{t("subtitle")}</p>

            <div className="mb-14 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Link
                href="/membership"
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 font-label-lg text-label-lg text-on-primary shadow-md transition-all duration-300 hover:bg-primary-container hover:shadow-lg"
              >
                {t("primaryCta")}
              </Link>
              <Link
                href="/practices"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-surface px-8 py-3.5 font-label-lg text-label-lg text-on-surface shadow-sm transition-all duration-300 hover:bg-surface-container"
              >
                <CompassIcon className="size-4 text-clay" />
                {t("secondaryCta")}
              </Link>
            </div>

            <ul className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl bg-surface-container/60 p-4">
              {stats.map(({ icon: Icon, label }, i) => (
                <Fragment key={label}>
                  {i > 0 && <li aria-hidden className="hidden size-1 rounded-full bg-outline-variant sm:block" />}
                  <li className="flex items-center gap-2">
                    <Icon className="size-3.5 text-clay" />
                    <span className="font-label-sm text-label-sm tracking-wider text-on-surface-variant uppercase">{label}</span>
                  </li>
                </Fragment>
              ))}
            </ul>
          </div>

          <div className="relative mt-10 lg:col-span-6 lg:mt-0">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-surface-container shadow-xl">
              <Image
                src="/images/home/03.jpg"
                alt={t("imageAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 600px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl bg-surface/90 p-4 shadow-lg backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                    <AudioLinesIcon className="size-5" />
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm tracking-wider text-clay uppercase">{t("nowPlaying")}</p>
                    <p className="font-headline-sm text-headline-sm text-on-surface">{t("nowPlayingTitle")}</p>
                  </div>
                </div>
                {/* Soundscape playback isn't built yet; this mirrors the design without a dead control. */}
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"
                >
                  <Volume2Icon className="size-5" />
                </span>
              </div>
            </div>
            <div className="absolute -start-6 -top-5 hidden items-center gap-3 rounded-2xl bg-surface-container-highest/90 p-4 shadow-md backdrop-blur-sm sm:flex">
              <span className="size-3 rounded-full bg-primary motion-safe:animate-pulse" />
              <p className="font-label-md text-label-md tracking-wide text-on-surface">
                {t("nextLive")} <span className="font-bold">{t("nextLiveTitle")}</span>
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
