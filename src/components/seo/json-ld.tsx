import type { PracticeDetail } from "@/modules/practices/types";
import type { ProgramDetail } from "@/modules/programs/types";
import type { StudioContact } from "@/modules/contact/types";

export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Organization / Yoga Studio Structured Data
 */
export function StudioJsonLd({
  locale,
  contact,
  studioName = "Arte Yoga Studio",
  instructorName = "Elena Vance",
  siteUrl = "https://arteyogastudio.com",
}: {
  locale: string;
  contact?: StudioContact;
  studioName?: string;
  instructorName?: string;
  siteUrl?: string;
}) {
  const address = contact?.address ? (contact.address[locale as "en" | "fa"] ?? contact.address.en) : undefined;
  const sameAs = contact?.socials?.map((s) => s.url).filter(Boolean) ?? [];

  const schema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "SportsActivityLocation", "HealthAndBeautyBusiness"],
    name: studioName,
    url: siteUrl,
    logo: `${siteUrl}/images/brand/logo.png`,
    description:
      locale === "fa"
        ? "استودیو یوگای دیجیتال آرته — تمرین‌ها، دوره‌ها و پناهگاهی آرام برای ذهن و جسم."
        : "A private digital yoga sanctuary — practices, immersion programs, and a calm community.",
    founder: {
      "@type": "Person",
      name: instructorName,
    },
    ...(address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: address,
          },
        }
      : {}),
    ...(contact?.email ? { email: contact.email } : {}),
    ...(contact?.phone ? { telephone: contact.phone } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return <JsonLd data={schema} />;
}

/**
 * Practice VideoObject Structured Data for Google rich results
 */
export function PracticeVideoJsonLd({
  practice,
  siteUrl = "https://arteyogastudio.com",
  instructorName = "Elena Vance",
}: {
  practice: PracticeDetail;
  siteUrl?: string;
  instructorName?: string;
}) {
  const posterUrl = practice.poster.startsWith("http")
    ? practice.poster
    : `${siteUrl}${practice.poster.startsWith("/") ? "" : "/"}${practice.poster}`;

  // ISO 8601 duration: e.g. PT25M
  const durationIso = `PT${Math.max(1, practice.durationMinutes)}M`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: practice.title,
    description: practice.summary,
    thumbnailUrl: [posterUrl],
    uploadDate: "2026-01-01T00:00:00Z",
    duration: durationIso,
    contentUrl: `${siteUrl}/practices/${practice.slug}`,
    embedUrl: `${siteUrl}/practices/${practice.slug}`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: practice.rating,
      reviewCount: Math.max(1, practice.reviewCount),
    },
    author: {
      "@type": "Person",
      name: instructorName,
    },
  };

  return <JsonLd data={schema} />;
}

/**
 * Program Course Structured Data for Google search rich courses
 */
export function ProgramCourseJsonLd({
  program,
  siteUrl = "https://arteyogastudio.com",
}: {
  program: ProgramDetail;
  siteUrl?: string;
}) {
  const imageUrl = program.image.startsWith("http")
    ? program.image
    : `${siteUrl}${program.image.startsWith("/") ? "" : "/"}${program.image}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: program.title,
    description: program.description,
    image: imageUrl,
    provider: {
      "@type": "Organization",
      name: "Arte Yoga Studio",
      sameAs: siteUrl,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${program.totalDays * 30}M`,
    },
  };

  return <JsonLd data={schema} />;
}

/**
 * FAQPage Structured Data for Google FAQ accordion results
 */
export function FaqJsonLd({
  faqs,
}: {
  faqs: Array<{ q: string; a: string }>;
}) {
  if (!faqs || faqs.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return <JsonLd data={schema} />;
}
