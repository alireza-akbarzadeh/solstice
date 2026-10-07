import { StarIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { localize } from "@/lib/localized";
import { getActiveTestimonials } from "@/modules/testimonials/server/testimonials";

export async function MembershipTestimonials() {
  const [t, locale, testimonials] = await Promise.all([
    getTranslations("Membership.testimonials"),
    getLocale(),
    getActiveTestimonials("membership"),
  ]);

  if (testimonials.length === 0) return null;

  return (
    <section className="mt-space-2xl w-full border-t border-outline-variant/20 pt-space-2xl">
      <Container>
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          align="center"
          className="mb-14 max-w-xl"
        />
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          {testimonials.map((item) => {
            const name = localize(item.name, locale);
            const quote = localize(item.quote, locale);
            const meta = localize(item.roleOrMeta, locale);

            return (
              <figure
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 p-7 shadow-xs transition-colors hover:border-outline-variant/50"
              >
                <div className="space-y-4">
                  <div role="img" aria-label="5 stars" className="flex gap-1 text-clay">
                    {Array.from({ length: item.rating }, (_, i) => (
                      <StarIcon key={i} aria-hidden className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <blockquote className="font-body-md text-body-md italic text-on-surface rtl:not-italic">
                    {quote}
                  </blockquote>
                </div>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-outline-variant/15 pt-5">
                  <span
                    aria-hidden
                    className={`flex size-10 items-center justify-center rounded-full font-heading font-bold ${item.avatarColor}`}
                  >
                    {name.charAt(0) || "A"}
                  </span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{name}</p>
                    {meta && <p className="font-body-sm text-body-sm text-outline">{meta}</p>}
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
