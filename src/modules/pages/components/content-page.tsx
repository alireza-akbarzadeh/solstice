import Image from "next/image";
import { getFormatter } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { EmbedPlayer } from "@/modules/practices/components/embed-player";
import { parseYouTubeId } from "@/infrastructure/video/assets";
import type { PageContent } from "../types";

/** Content is rendered as React text/structured blocks; arbitrary HTML is never executed. */
export async function ContentPage({
  content,
  locale,
}: {
  content: PageContent;
  locale: Locale;
}) {
  const format = await getFormatter({ locale });
  const text = (value: { en: string; fa: string }) => localize(value, locale);
  const videoId = parseYouTubeId(content.videoUrl);
  return (
    <article className="max-w-content px-margin-mobile py-space-xl md:px-margin md:py-space-2xl mx-auto w-full">
      <header className="mb-space-xl mx-auto max-w-3xl">
        <h1 className="break-words font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-display md:text-display">
          {text(content.title)}
        </h1>
        <p className="text-body-lg font-body-lg text-on-surface-variant mt-5 leading-relaxed whitespace-pre-line">
          {text(content.description)}
        </p>
      </header>
      <div className="gap-space-md font-body-lg text-body-lg mx-auto flex max-w-3xl flex-col leading-relaxed">
        {content.image && (
          <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-2xl">
            <Image
              src={content.image}
              alt={text(content.imageAlt)}
              fill
              priority
              sizes="(min-width:768px) 768px,100vw"
              className="object-cover"
            />
          </div>
        )}
        {videoId && (
          <div className="mb-5">
            <EmbedPlayer
              src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`}
              title={text(content.title)}
            />
          </div>
        )}
        {content.body.map((block, index) => {
          switch (block.type) {
            case "p":
              return (
                <p key={index} className="whitespace-pre-line">
                  {text(block.text)}
                </p>
              );
            case "h2":
              return (
                <h2
                  key={index}
                  className="font-headline-md text-headline-md text-primary pt-5"
                >
                  {text(block.text)}
                </h2>
              );
            case "quote":
              return (
                <figure
                  key={index}
                  className="bg-surface-container-low p-space-lg my-4 rounded-xl"
                >
                  <blockquote className="font-headline-sm text-headline-sm text-primary whitespace-pre-line italic rtl:not-italic">
                    {text(block.text)}
                  </blockquote>
                  {(block.source.en || block.source.fa) && (
                    <figcaption className="text-body-sm font-body-sm text-clay mt-3">
                      {text(block.source)}
                    </figcaption>
                  )}
                </figure>
              );
            case "figure":
              return block.image ? (
                <figure key={index} className="my-4">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                    <Image
                      src={block.image}
                      alt={text(block.alt)}
                      fill
                      sizes="(min-width:768px) 768px,100vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="text-body-sm font-body-sm text-on-surface-variant mt-2 text-center">
                    {text(block.caption)}
                  </figcaption>
                </figure>
              ) : null;
            case "steps":
              return (
                <section
                  key={index}
                  className="bg-surface-container-low p-space-lg my-4 rounded-xl"
                >
                  <h2 className="font-headline-sm text-headline-sm text-primary">
                    {text(block.title)}
                  </h2>
                  <p className="mt-2 whitespace-pre-line">
                    {text(block.intro)}
                  </p>
                  <ol className="mt-5 flex flex-col gap-5">
                    {block.items.map((item, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="text-clay">
                          {format.number(i + 1)}
                        </span>
                        <div>
                          <h3 className="font-semibold">{text(item.title)}</h3>
                          <p className="text-on-surface-variant whitespace-pre-line">
                            {text(item.body)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              );
          }
        })}
        {content.actionHref && (
          <div className="mt-6">
            <Link
              href={content.actionHref}
              className="bg-primary font-label-lg text-label-lg text-on-primary hover:bg-primary-container inline-flex min-h-12 items-center justify-center rounded-xl px-7 py-3"
            >
              {text(content.actionLabel)}
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
