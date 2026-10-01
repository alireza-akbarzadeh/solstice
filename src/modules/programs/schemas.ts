import { z } from "zod";

const localized = (max: number) =>
  z.object({ en: z.string().trim().max(max), fa: z.string().trim().max(max) });
const required = (max: number) =>
  z.object({
    en: z.string().trim().min(1).max(max),
    fa: z.string().trim().min(1).max(max),
  });

export const programFieldsSchema = z.object({
  title: required(200),
  description: required(1200),
  heroTitle: localized(300),
  lede: localized(1600),
  badge: localized(160),
  cta: localized(120),
  note: localized(300),
  image: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .refine((value) => {
      if (value.startsWith("/images/") && !value.includes("..")) return true;
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    }),
  imageAlt: required(300),
  tone: z.enum(["primary", "clay"]),
  icon: z.enum(["sunrise", "brain"]),
  pacing: z.enum(["daily", "self"]),
  weeks: z
    .array(
      z.object({
        label: localized(120),
        title: required(200),
        description: localized(1000),
        focus: localized(200),
        practices: z.array(z.string().trim().min(1).max(200)).max(31),
      }),
    )
    .max(12),
});

/** Enrolled members keep their day numbers: once someone joins, only the prose can change. */
export function sameCurriculum(
  before: { pacing: string; weeks: { practices: string[] }[] },
  after: { pacing: string; weeks: { practices: string[] }[] },
) {
  return (
    before.pacing === after.pacing &&
    JSON.stringify(before.weeks.map((w) => w.practices)) ===
      JSON.stringify(after.weeks.map((w) => w.practices))
  );
}

export function hasPublishableCurriculum(
  weeks: { practices: string[] }[],
  publishedSlugs: Set<string>,
) {
  return (
    weeks.length > 0 &&
    weeks.every(
      (week) =>
        week.practices.length > 0 &&
        week.practices.every((slug) => publishedSlugs.has(slug)),
    )
  );
}
