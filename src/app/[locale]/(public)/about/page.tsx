import {
  ArrowRightIcon,
  BadgeCheckIcon,
  ChevronDownIcon,
  Flower2Icon,
  HourglassIcon,
  LeafIcon,
  MailIcon,
  PersonStandingIcon,
  QuoteIcon,
  SproutIcon,
  SunIcon,
  TreesIcon,
  VolumeXIcon,
  WindIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { sanctuaryPlan } from "@/modules/memberships/plans";
import { getViewer } from "@/modules/memberships/server/viewer";

type Stat = { value: string; label: string };
type Milestone = { period: string; title: string; body: string };
type Pillar = { title: string; body: string; tag: string };
type Faq = { q: string; a: string };

const pillarIcons = [WindIcon, PersonStandingIcon, HourglassIcon, TreesIcon];
const materialIcons = [SunIcon, LeafIcon, SproutIcon, VolumeXIcon];

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "About" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { images: ["/images/brand/elena-portrait.jpg"] },
  };
}

// Stitch: about-elena-vance-desktop.html
export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, tBrand, format, viewer] = await Promise.all([getTranslations("About"), getTranslations("Brand"), getFormatter(), getViewer()]);
  const stats = t.raw("hero.stats") as Stat[];
  const credentials = t.raw("lineage.credentials") as string[];
  const story = t.raw("lineage.story") as string[];
  const milestones = t.raw("lineage.milestones") as Milestone[];
  const pillars = t.raw("pillars.items") as Pillar[];
  const materials = t.raw("studio.materials") as string[];
  const letter = t.raw("letter.paragraphs") as string[];
  const faqs = t.raw("faq.items") as Faq[];

  return (
    <>
      {/* Hero */}
      <Container className="relative pt-space-xl pb-space-2xl">
        <div className="grid grid-cols-1 items-center gap-gutter lg:grid-cols-12">
          <div className="z-10 flex flex-col justify-center space-y-space-md lg:col-span-7 lg:pe-space-lg">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-clay" />
              <span className="font-label-md text-label-md tracking-widest text-clay uppercase">{t("hero.eyebrow")}</span>
            </div>
            <h1 className="font-display-mobile text-display-mobile leading-tight tracking-tight text-primary md:font-display md:text-display md:leading-none">
              {t("hero.title")}
            </h1>
            <p className="max-w-xl pt-2 font-body-lg text-body-lg text-on-surface-variant">{t("hero.body")}</p>
            <div className="flex flex-wrap items-center gap-space-sm pt-space-sm md:gap-space-md">
              <a
                href="#personal-letter"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 font-label-lg text-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container"
              >
                {t("hero.letterCta")}
              </a>
              <a
                href="#lineage"
                className="inline-flex items-center justify-center rounded-lg bg-surface-container-low px-7 py-3.5 font-label-lg text-label-lg text-primary transition-colors hover:bg-surface-container"
              >
                {t("hero.lineageCta")}
              </a>
            </div>
            <dl className="grid grid-cols-3 gap-6 border-t border-outline-variant/30 pt-space-lg">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse">
                  <dt className="mt-1 font-label-sm text-label-sm tracking-wider text-on-surface-variant uppercase">{stat.label}</dt>
                  <dd className="font-heading text-headline-sm text-clay md:text-headline-md">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mt-space-md lg:col-span-5 lg:mt-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface-container-low shadow-xl">
              <Image
                src="/images/brand/elena-portrait.jpg"
                alt={t("hero.portraitAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover transition-transform duration-700 hover:scale-105 motion-reduce:hover:scale-100"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
              <div className="absolute inset-x-6 bottom-6 flex items-center justify-between rounded-xl bg-surface/90 p-4 shadow-sm backdrop-blur-md">
                <div>
                  <p className="font-headline-sm text-headline-sm text-primary">{tBrand("instructor")}</p>
                  <p className="font-label-sm text-label-sm tracking-wider text-clay uppercase">{t("hero.role")}</p>
                </div>
                <Flower2Icon className="size-6 text-primary" />
              </div>
            </div>
            <div aria-hidden className="absolute -end-6 -top-6 -z-10 size-32 rounded-full bg-secondary-fixed/30 blur-2xl" />
          </div>
        </div>
      </Container>

      {/* Lineage */}
      <section id="lineage" className="scroll-mt-20 bg-surface-container-low py-space-2xl">
        <Container>
          <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
            <div className="space-y-space-md lg:sticky lg:top-28 lg:col-span-4">
              <span className="font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">{t("lineage.eyebrow")}</span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
                {t("lineage.title")}
              </h2>
              <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">{t("lineage.body")}</p>
              <div className="space-y-3 rounded-xl bg-surface p-space-md">
                <span className="block font-label-md text-label-md font-semibold tracking-wider text-clay uppercase">{t("lineage.credentialsTitle")}</span>
                <ul className="space-y-2 font-body-sm text-body-sm text-on-surface-variant">
                  {credentials.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <BadgeCheckIcon className="mt-0.5 size-4 shrink-0 text-clay" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-space-lg text-on-surface lg:col-span-7 lg:col-start-6">
              <div className="space-y-space-md font-body-lg text-body-lg leading-relaxed">
                {story.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
              <figure className="relative overflow-hidden rounded-xl bg-surface-container p-space-lg">
                <QuoteIcon aria-hidden className="absolute end-4 -bottom-4 size-24 text-clay/15" />
                <blockquote className="mb-4 font-headline-sm text-headline-sm leading-relaxed text-primary italic rtl:not-italic">
                  {t("lineage.quote")}
                </blockquote>
                <figcaption className="font-label-md text-label-md tracking-wider text-clay uppercase">{t("lineage.quoteSource")}</figcaption>
              </figure>
              <ol className="grid grid-cols-1 gap-4 pt-space-sm md:grid-cols-2">
                {milestones.map((m) => (
                  <li key={m.title} className="rounded-xl bg-surface p-space-md">
                    <span className="mb-1 block font-label-md text-label-md tracking-widest text-clay uppercase">{m.period}</span>
                    <h3 className="mb-2 font-headline-sm text-headline-sm text-on-surface">{m.title}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{m.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </section>

      {/* Pillars */}
      <section className="bg-surface py-space-2xl">
        <Container>
          <div className="mx-auto mb-space-xl max-w-2xl text-center">
            <span className="mb-2 block font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">{t("pillars.eyebrow")}</span>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
              {t("pillars.title")}
            </h2>
            <p className="mt-3 font-body-md text-body-md text-on-surface-variant">{t("pillars.body")}</p>
          </div>
          <ul className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, i) => {
              const Icon = pillarIcons[i] ?? WindIcon;
              return (
                <li
                  key={pillar.title}
                  className="group flex flex-col justify-between rounded-xl bg-surface-container-low p-space-lg transition-colors duration-300 hover:bg-surface-container"
                >
                  <div>
                    <span className="mb-space-md flex size-12 items-center justify-center rounded-lg bg-surface text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-on-primary">
                      <Icon className="size-6" />
                    </span>
                    <span className="mb-1 block font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">
                      {t("pillars.label", { n: format.number(i + 1, { minimumIntegerDigits: 2 }) })}
                    </span>
                    <h3 className="mb-3 font-headline-sm text-headline-sm text-primary">{pillar.title}</h3>
                    <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{pillar.body}</p>
                  </div>
                  <div className="mt-space-md flex items-center justify-between border-t border-outline-variant/30 pt-space-sm text-clay">
                    <span className="font-label-sm text-label-sm tracking-wider uppercase">{pillar.tag}</span>
                    <ArrowRightIcon className="size-4 rtl:rotate-180" />
                  </div>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* Studio */}
      <section className="bg-surface-container py-space-2xl">
        <Container>
          <div className="mb-space-xl flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-xl">
              <span className="mb-2 block font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">{t("studio.eyebrow")}</span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
                {t("studio.title")}
              </h2>
            </div>
            <p className="max-w-md font-body-md text-body-md text-on-surface-variant">{t("studio.body")}</p>
          </div>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
            <div className="relative flex min-h-[440px] flex-col justify-end overflow-hidden rounded-2xl bg-surface shadow-sm md:col-span-8">
              <Image src="/images/about/hall.jpg" alt={t("studio.hall.alt")} fill sizes="(min-width: 768px) 66vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
              <div className="relative z-10 p-space-lg text-on-primary">
                <span className="mb-1 block font-label-sm text-label-sm tracking-widest text-on-primary-container uppercase">{t("studio.hall.eyebrow")}</span>
                <h3 className="mb-2 font-headline-md text-headline-md">{t("studio.hall.title")}</h3>
                <p className="max-w-lg font-body-sm text-body-sm text-on-primary/90">{t("studio.hall.body")}</p>
              </div>
            </div>
            <div className="flex flex-col gap-gutter md:col-span-4">
              {(["linen", "tea"] as const).map((key) => (
                <div key={key} className="relative min-h-[210px] flex-1 overflow-hidden rounded-2xl bg-surface shadow-sm">
                  <Image src={`/images/about/${key}.jpg`} alt={t(`studio.${key}.alt`)} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-surface/75 via-transparent to-transparent" />
                  <div className="absolute inset-x-4 bottom-4 text-surface">
                    <p className="font-headline-sm text-headline-sm leading-tight text-surface">{t(`studio.${key}.title`)}</p>
                    <p className="font-label-sm text-label-sm tracking-wider text-secondary-fixed uppercase opacity-90">{t(`studio.${key}.body`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <ul className="mt-space-md grid grid-cols-2 gap-4 md:grid-cols-4">
            {materials.map((material, i) => {
              const Icon = materialIcons[i] ?? LeafIcon;
              return (
                <li key={material} className="flex items-center gap-3 rounded-lg bg-surface/80 p-space-sm">
                  <Icon className="size-5 shrink-0 text-clay" />
                  <span className="font-body-sm text-body-sm font-medium text-on-surface">{material}</span>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* Letter */}
      <section id="personal-letter" className="relative scroll-mt-20 overflow-hidden bg-surface py-space-2xl">
        <div className="relative z-10 mx-auto max-w-[920px] px-margin-mobile md:px-margin">
          <article className="relative rounded-2xl bg-surface-container-low p-space-lg shadow-sm md:p-space-2xl">
            <header className="mb-space-lg flex items-center justify-between border-b border-outline-variant/30 pb-space-md">
              <div>
                <span className="font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">{t("letter.eyebrow")}</span>
                <h2 className="mt-1 font-headline-sm text-headline-sm text-primary">{t("letter.title")}</h2>
              </div>
              <MailIcon className="size-8 text-clay opacity-70" />
            </header>
            <div className="space-y-space-md font-body-lg text-body-lg leading-relaxed text-on-surface">
              {letter.map((paragraph, i) => (
                <p
                  key={paragraph.slice(0, 24)}
                  className={
                    i === 0
                      ? "first-letter:float-start first-letter:me-3 first-letter:font-heading first-letter:text-5xl first-letter:leading-none first-letter:text-primary rtl:first-letter:float-none rtl:first-letter:me-0 rtl:first-letter:text-inherit"
                      : undefined
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <footer className="flex flex-col items-start space-y-2 pt-space-xl">
              <p className="font-body-md text-body-md text-clay italic rtl:not-italic">{t("letter.signOff")}</p>
              <p className="font-heading text-headline-lg-mobile tracking-wide text-primary italic md:text-headline-lg rtl:not-italic">
                {tBrand("instructor")}
              </p>
              <p className="font-label-sm text-label-sm tracking-widest text-outline uppercase">{t("letter.role")}</p>
            </footer>
          </article>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface-container-low py-space-xl">
        <div className="mx-auto max-w-[920px] px-margin-mobile md:px-margin">
          <div className="mb-space-lg text-center">
            <span className="mb-2 block font-label-sm text-label-sm font-semibold tracking-widest text-clay uppercase">{t("faq.eyebrow")}</span>
            <h2 className="font-headline-md text-headline-md text-primary">{t("faq.title")}</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={faq.q} open={i === 0} className="group overflow-hidden rounded-xl bg-surface">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-space-md text-start [&::-webkit-details-marker]:hidden">
                  <span className="font-headline-sm text-headline-sm text-on-surface">{faq.q}</span>
                  <ChevronDownIcon className="size-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="px-space-md pb-space-md font-body-md text-body-md text-on-surface-variant">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Invitation */}
      <Container className="py-space-2xl">
        <div className="relative flex flex-col items-center overflow-hidden rounded-3xl bg-primary p-space-lg text-center text-on-primary md:p-space-2xl">
          <div aria-hidden className="pointer-events-none absolute -start-32 -top-32 size-80 rounded-full bg-primary-container/40 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -end-32 -bottom-32 size-80 rounded-full bg-clay/30 blur-3xl" />
          <div className="relative z-10 max-w-2xl space-y-space-md">
            <span className="block font-label-sm text-label-sm font-semibold tracking-widest text-on-primary-container uppercase">{t("cta.eyebrow")}</span>
            <h2 className="font-display-mobile text-display-mobile leading-tight md:font-display md:text-display">{t("cta.title")}</h2>
            <p className="mx-auto max-w-xl font-body-lg text-body-lg text-on-primary/90">{t("cta.body", { days: sanctuaryPlan.trialDays })}</p>
            <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-space-sm pt-space-md sm:flex-row">
              <Link
                href={viewer.hasAccess ? "/practices" : "/membership"}
                className="inline-flex w-full items-center justify-center rounded-lg bg-secondary-fixed px-7 py-3.5 font-label-lg text-label-lg text-on-secondary-fixed transition-colors hover:bg-secondary-fixed-dim sm:w-auto"
              >
                {viewer.hasAccess ? t("cta.member") : t("cta.trial", { days: sanctuaryPlan.trialDays })}
              </Link>
              <Link
                href="/practices"
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary-container px-7 py-3.5 font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-container/80 sm:w-auto"
              >
                {t("cta.explore")}
              </Link>
            </div>
            {!viewer.hasAccess && <p className="pt-2 font-label-sm text-label-sm tracking-wider text-on-primary/70">{t("cta.note")}</p>}
          </div>
        </div>
      </Container>
    </>
  );
}
