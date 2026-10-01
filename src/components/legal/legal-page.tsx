import { InfoIcon } from "lucide-react";

import { Container } from "@/components/layout/container";

/** One block of a policy: a heading, its prose, and an optional list. */
export type LegalSection = {
  heading: string;
  paragraphs: string[];
  items?: string[];
};

/**
 * The shared shape of /privacy, /terms and /ethics. No Stitch screen covers these, so they are
 * composed from the same tokens as the journal reader: a narrow measure, generous leading, and
 * headings that stay quiet.
 */
export function LegalPage({
  eyebrow,
  title,
  lede,
  updated,
  notice,
  sections,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  updated: string;
  /** Shown above the text where the page is still a draft, or carries a health warning. */
  notice?: { title: string; body: string };
  sections: LegalSection[];
}) {
  return (
    <Container className="py-space-lg md:py-space-xl">
      <article className="mx-auto max-w-3xl">
        <header className="mb-space-lg">
          <span className="font-label-md text-label-md tracking-widest text-clay uppercase">{eyebrow}</span>
          <h1 className="mt-1 font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
            {title}
          </h1>
          <p className="mt-space-sm font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{lede}</p>
          <p className="mt-space-sm font-label-sm text-label-sm tracking-wider text-outline uppercase">{updated}</p>
        </header>

        {notice && (
          <aside className="mb-space-lg flex items-start gap-3 rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <InfoIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-clay" />
            <div>
              <p className="font-label-lg text-label-lg text-on-surface">{notice.title}</p>
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{notice.body}</p>
            </div>
          </aside>
        )}

        <div className="flex flex-col gap-space-lg">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-space-sm font-headline-sm text-headline-sm text-on-surface">{section.heading}</h2>
              <div className="flex flex-col gap-space-sm">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.items && (
                <ul className="mt-space-sm flex flex-col gap-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 font-body-md text-body-md text-on-surface-variant">
                      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </Container>
  );
}
