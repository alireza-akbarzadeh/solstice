import { useTranslations } from "next-intl";

/**
 * A provider's own player in an iframe (YouTube, Aparat). We hand over control, so none of the
 * custom player's behaviour applies here: no chapter seeking, no timestamped reflections, no
 * preview cut-off, and no "mark complete" when the video ends.
 */
export function EmbedPlayer({ src, title }: { src: string; title: string }) {
  const t = useTranslations("PracticeDetail.player");

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-inverse-surface p-space-lg text-center shadow-2xl">
        <p className="font-body-md text-body-md text-inverse-on-surface/80">{t("embedMissing")}</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-inverse-surface shadow-2xl">
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 size-full border-0"
      />
    </div>
  );
}
