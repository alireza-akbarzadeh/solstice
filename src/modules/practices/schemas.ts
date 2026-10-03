import { z } from "zod";

import { parseVideoAsset } from "@/infrastructure/video/assets";

import { isCategorySlug } from "@/modules/categories/types";

/** A cover or poster: a local `/images/…` path or an https:// address. */
export const isCoverUrl = (value: string) => {
  if (value.startsWith("/images/") && !value.includes("..")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const required = (max: number) =>
  z.object({ en: z.string().trim().min(1).max(max), fa: z.string().trim().min(1).max(max) });
const optional = (max: number) => z.object({ en: z.string().trim().max(max), fa: z.string().trim().max(max) });

/** A practice's metadata as the server stores it (the studio actions validate with this). */
export const practiceFieldsSchema = z.object({
  title: required(200),
  summary: required(600),
  series: required(200),
  category: z.string().refine(isCategorySlug),
  intensityLevel: z.enum(["gentle", "moderate", "fire"]),
  intensityLabel: required(120),
  props: z.enum(["none", "bolster-blocks", "strap"]),
  durationMinutes: z.number().int().min(1).max(600),
  access: z.enum(["open", "members"]),
  previewSeconds: z.number().int().min(0).max(3600).nullable(),
  image: z.string().trim().min(1).max(2000).refine(isCoverUrl),
  imageAlt: required(300),
  poster: z
    .string()
    .trim()
    .max(2000)
    .refine((value) => !value || isCoverUrl(value))
    .nullable(),
});

/**
 * The studio editor's form. It accepts anything typed, derives what may be left blank — a
 * YouTube thumbnail for an empty cover, the title for empty alt text, no preview on an open
 * practice — then checks the result against the server's own schema, so the editor flags
 * exactly what the action would refuse, all at once.
 */
export const practiceFormSchema = z
  .object({
    title: optional(200),
    summary: optional(600),
    series: optional(200),
    category: z.string(),
    intensityLevel: z.enum(["gentle", "moderate", "fire"]),
    intensityLabel: optional(120),
    props: z.enum(["none", "bolster-blocks", "strap"]),
    durationMinutes: z.number(),
    access: z.enum(["open", "members"]),
    previewSeconds: z.number().nullable(),
    image: z.string(),
    imageAlt: optional(300),
    poster: z.string(),
    videoUrl: z.string(),
  })
  .transform(({ videoUrl, ...form }) => {
    const video = parseVideoAsset(videoUrl);
    return {
      ...form,
      previewSeconds: form.access === "members" ? form.previewSeconds : null,
      image:
        form.image.trim() || (video?.providerId === "youtube" ? `https://i.ytimg.com/vi/${video.assetId}/hqdefault.jpg` : ""),
      imageAlt: {
        en: form.imageAlt.en.trim() || form.title.en,
        fa: form.imageAlt.fa.trim() || form.title.fa,
      },
      poster: form.poster.trim() ? form.poster.trim() : null,
      videoUrl: videoUrl.trim(),
    };
  })
  // Every rule runs here, after the derivations, so all problems are reported together.
  .pipe(
    practiceFieldsSchema.extend({
      videoUrl: z
        .string()
        .max(2000)
        .refine((value) => !value || !!parseVideoAsset(value)),
    }),
  );

export type PracticeFormValues = z.input<typeof practiceFormSchema>;
export type PracticeFormOutput = z.output<typeof practiceFormSchema>;
