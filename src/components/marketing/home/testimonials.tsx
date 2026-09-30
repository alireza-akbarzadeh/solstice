import { StarIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/marketing/section-heading";

const members = [
  { key: "clara", avatar: "bg-secondary-fixed text-on-secondary-fixed" },
  { key: "marcus", avatar: "bg-primary-fixed text-primary" },
  { key: "amina", avatar: "bg-tertiary-fixed text-on-tertiary-fixed" },
] as const;

export async function Testimonials() {
  const t = await getTranslations("Home.testimonials");

  return (
    <section className="w-full bg-surface-container py-20 lg:py-24">
      <Container>
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          align="center"
          className="mb-16 max-w-xl"
        />
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          {members.map(({ key, avatar }) => {
            const name = t(`${key}.name`);
            return (
              <figure key={key} className="flex flex-col justify-between rounded-2xl bg-surface p-8 shadow-sm">
                <div className="space-y-4">
                  <div role="img" aria-label={t("rating")} className="flex gap-1 text-clay">
                    {Array.from({ length: 5 }, (_, i) => (
                      <StarIcon key={i} aria-hidden className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <blockquote className="font-body-md text-body-md text-on-surface italic rtl:not-italic">
                    {t(`${key}.quote`)}
                  </blockquote>
                </div>
                <figcaption className="mt-6 flex items-center gap-3 pt-6">
                  <span
                    aria-hidden
                    className={`flex size-10 items-center justify-center rounded-full font-heading font-bold ${avatar}`}
                  >
                    {name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{name}</p>
                    <p className="font-body-sm text-body-sm text-outline">{t(`${key}.meta`)}</p>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
