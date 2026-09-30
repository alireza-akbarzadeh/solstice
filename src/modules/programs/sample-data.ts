import type { Localized } from "@/lib/localized";

import type { ProgramSpotlight } from "./types";

// Stand-in content from the Stitch designs until programs live in the database.
export type SampleProgram = {
  slug: string;
  featured: boolean;
  tone: ProgramSpotlight["tone"];
  icon: ProgramSpotlight["icon"];
  badge: Localized;
  title: Localized;
  description: Localized;
  phases: { label: Localized; title: Localized }[];
  cta: Localized;
  note: Localized;
  image: string;
  imageAlt: Localized;
};

export const samplePrograms: SampleProgram[] = [
  {
    slug: "30-day-awakening",
    featured: true,
    tone: "primary",
    icon: "sunrise",
    badge: { en: "Flagship Program • 30 Days", fa: "برنامهٔ شاخص • ۳۰ روز" },
    title: { en: "The 30-Day Awakening Journey", fa: "سفر ۳۰ روزهٔ بیداری" },
    description: {
      en: "A daily progressive practice beginning at 10 minutes of gentle spinal unwinding, building into steady 35-minute solar flows, complemented by seated stillness.",
      fa: "تمرینی روزانه و پیش‌رونده که با ۱۰ دقیقه رهاسازی ملایم ستون فقرات آغاز می‌شود و به جریان‌های خورشیدی ۳۵ دقیقه‌ای می‌رسد، همراه با سکون در حالت نشسته.",
    },
    phases: [
      { label: { en: "Week 01", fa: "هفتهٔ ۱" }, title: { en: "Root & Release", fa: "ریشه و رهایی" } },
      { label: { en: "Week 02", fa: "هفتهٔ ۲" }, title: { en: "Solar Expansion", fa: "گسترش خورشیدی" } },
      { label: { en: "Week 03", fa: "هفتهٔ ۳" }, title: { en: "Spinal Axis", fa: "محور ستون فقرات" } },
      { label: { en: "Week 04", fa: "هفتهٔ ۴" }, title: { en: "Integrated Stillness", fa: "سکون یکپارچه" } },
    ],
    cta: { en: "View Syllabus & Enroll", fa: "مشاهدهٔ سرفصل‌ها و ثبت‌نام" },
    note: { en: "Included with Sanctuary Membership", fa: "در عضویت پناهگاه گنجانده شده است" },
    image: "/images/home/07.jpg",
    imageAlt: {
      en: "Sequence of yoga postures in warm studio light with soft architectural shadows",
      fa: "توالی حرکات یوگا در نور گرم استودیو با سایه‌های نرم معماری",
    },
  },
  {
    slug: "somatic-nervous-system-reset",
    featured: true,
    tone: "clay",
    icon: "brain",
    badge: { en: "Somatic Series • 14 Days", fa: "مجموعهٔ سوماتیک • ۱۴ روز" },
    title: { en: "Somatic Nervous System Reset", fa: "بازتنظیم سوماتیک سیستم عصبی" },
    description: {
      en: "Developed in consultation with somatic trauma therapies. Subtle neuro-fascial unwinding, psoas release, and polyvagal grounding designed for high-stress living.",
      fa: "طراحی‌شده با مشورت درمان‌های سوماتیک تروما. رهاسازی ظریف عصبی‌ـ‌فاشیایی، آزادسازی عضلهٔ پسواس و زمین‌گیری پلی‌واگال برای زندگی پرتنش.",
    },
    phases: [
      { label: { en: "Phase 1", fa: "مرحلهٔ ۱" }, title: { en: "Psoas & Sacrum Unwinding", fa: "رهاسازی پسواس و خاجی" } },
      { label: { en: "Phase 2", fa: "مرحلهٔ ۲" }, title: { en: "Diaphragmatic Freedom", fa: "آزادی دیافراگم" } },
      { label: { en: "Phase 3", fa: "مرحلهٔ ۳" }, title: { en: "Neural Rewiring Stillness", fa: "سکون و بازسیم‌کشی عصبی" } },
    ],
    cta: { en: "Explore Reset Ritual", fa: "کاوش در آیین بازتنظیم" },
    note: { en: "Self-Paced Sanctuary Access", fa: "دسترسی با سرعت دلخواه" },
    image: "/images/home/08.jpg",
    imageAlt: {
      en: "Woman resting on a wool mat with hands on heart and belly, breathing deeply",
      fa: "زنی آرمیده روی مت پشمی با دست‌هایی روی قلب و شکم، در حال تنفس عمیق",
    },
  },
];
