import type { Localized } from "@/lib/localized";

// Practice and journal categories are rows the instructor manages at /instructor/categories
// (solstice_category). Their names are merged into the messages at request time
// (`Practice.categories` / `Journal.categories`), so any component can show a category's name.

export const categoryKinds = ["practice", "journal"] as const;
export type CategoryKind = (typeof categoryKinds)[number];

export type Category = {
  kind: CategoryKind;
  slug: string;
  name: Localized;
  sortOrder: number;
  /** Hidden categories leave the public filters; content already in them keeps its label. */
  visible: boolean;
};

/** Where each kind's names live in the messages. */
export const categoryNamespace = { practice: "Practice", journal: "Journal" } as const satisfies Record<CategoryKind, string>;

/** A category slug: lowercase words joined by hyphens (also the `?category=` filter value). */
export const CATEGORY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const isCategorySlug = (value: unknown): value is string =>
  typeof value === "string" && value.length <= 60 && CATEGORY_SLUG.test(value);

/** The categories the studio started with; seeded once, and the fallback if the table is missing. */
export const defaultCategories: Category[] = [
  ...(
    [
      ["morning", "Morning Flow", "جریان صبحگاهی"],
      ["vinyasa", "Vinyasa", "وینیاسا"],
      ["restorative", "Restorative", "ترمیمی"],
      ["yin", "Yin & Bolster", "یین و بالشتک"],
      ["pranayama", "Pranayama & Silence", "پرانایاما و سکوت"],
      ["mobility", "Mobility & Somatics", "تحرک و سوماتیک"],
      ["evening", "Evening Wind-Down", "آرامش شبانگاهی"],
    ] as const
  ).map(([slug, en, fa], sortOrder) => ({ kind: "practice" as const, slug, name: { en, fa }, sortOrder, visible: true })),
  ...(
    [
      ["somatic", "Somatic science", "علم سوماتیک"],
      ["breath", "Pranayama & breath", "پرانایاما و تنفس"],
      ["morning", "Morning rituals", "آیین‌های صبحگاهی"],
      ["sleep", "Sleep & restorative", "خواب و ترمیم"],
      ["philosophy", "Philosophy & lineage", "فلسفه و پیشینه"],
      ["space", "Sacred space", "فضای مقدس"],
    ] as const
  ).map(([slug, en, fa], sortOrder) => ({ kind: "journal" as const, slug, name: { en, fa }, sortOrder, visible: true })),
];
