import type { Localized } from "@/lib/localized";

import type { ProgramPacing, ProgramSpotlight } from "./types";

// Stand-in content from the Stitch designs until programs live in the database.
// Every day is a practice from the library (practices/sample-data.ts), by slug.
export type SampleProgram = {
  slug: string;
  featured: boolean;
  tone: ProgramSpotlight["tone"];
  icon: ProgramSpotlight["icon"];
  /** "daily": one new day unlocks each day after enrolling. "self": everything open at once. */
  pacing: ProgramPacing;
  badge: Localized;
  title: Localized;
  /** Long editorial title for the program page hero. */
  heroTitle: Localized;
  description: Localized;
  lede: Localized;
  weeks: {
    label: Localized;
    title: Localized;
    description: Localized;
    focus: Localized;
    practices: string[];
  }[];
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
    pacing: "daily",
    badge: { en: "Flagship Program • 30 Days", fa: "برنامهٔ شاخص • ۳۰ روز" },
    title: { en: "The 30-Day Awakening Journey", fa: "سفر ۳۰ روزهٔ بیداری" },
    heroTitle: {
      en: "Awakening Journey: Grounding, Heart Opening & Unhurried Stillness",
      fa: "سفر بیداری: ریشه‌داری، گشودن قلب و سکونی بی‌شتاب",
    },
    description: {
      en: "A daily progressive practice beginning at 10 minutes of gentle spinal unwinding, building into steady 35-minute solar flows, complemented by seated stillness.",
      fa: "تمرینی روزانه و پیش‌رونده که با ۱۰ دقیقه رهاسازی ملایم ستون فقرات آغاز می‌شود و به جریان‌های خورشیدی ۳۵ دقیقه‌ای می‌رسد، همراه با سکون در حالت نشسته.",
    },
    lede: {
      en: "A month-long somatic curriculum restoring nervous system equilibrium through 15–45 minute dawn practices, one new practice unlocking each morning, guided by Elena Vance.",
      fa: "برنامه‌ای یک‌ماهه و سوماتیک برای بازگرداندن تعادل سیستم عصبی با تمرین‌های سپیده‌دم ۱۵ تا ۴۵ دقیقه‌ای؛ هر صبح یک تمرین تازه باز می‌شود، با راهنمایی النا ونس.",
    },
    weeks: [
      {
        label: { en: "Week 01", fa: "هفتهٔ ۱" },
        title: { en: "Root & Release", fa: "ریشه و رهایی" },
        description: {
          en: "Diaphragmatic uncoiling, pelvic grounding, and cultivating slow autonomic regulation.",
          fa: "باز شدن دیافراگم، زمین‌گیری لگن و پرورش تنظیم آرام دستگاه خودکار عصبی.",
        },
        focus: { en: "Root meridian", fa: "مسیر ریشه" },
        practices: [
          "prana-awakening-spine-unfurling",
          "five-koshas-breathwork",
          "lower-back-decompression",
          "awakening-solar-flow",
          "coherent-heart-resonance-nidra",
          "vagus-nerve-decompression",
          "prana-awakening-spine-unfurling",
        ],
      },
      {
        label: { en: "Week 02", fa: "هفتهٔ ۲" },
        title: { en: "Solar Expansion", fa: "گسترش خورشیدی" },
        description: {
          en: "Heart-center release, scapular mobility, and room for the breath across the ribcage.",
          fa: "رهاسازی مرکز قلب، تحرک کتف‌ها و فضا دادن به تنفس در قفسهٔ سینه.",
        },
        focus: { en: "Heart meridian", fa: "مسیر قلب" },
        practices: [
          "awakening-solar-flow",
          "five-koshas-breathwork",
          "golden-hour-prana-flow",
          "core-stability-pelvic-balance",
          "awakening-solar-flow",
          "restorative-twilight-reset",
          "coherent-heart-resonance-nidra",
        ],
      },
      {
        label: { en: "Week 03", fa: "هفتهٔ ۳" },
        title: { en: "Spinal Axis", fa: "محور ستون فقرات" },
        description: {
          en: "Vinyasa as kinetic prayer, spiral hip openers, core buoyancy, and steady somatic vitality.",
          fa: "وینیاسا چون نیایشی در حرکت، بازکننده‌های مارپیچ لگن، سبکی مرکز بدن و سرزندگی پایدار.",
        },
        focus: { en: "Solar plexus", fa: "شبکهٔ خورشیدی" },
        practices: [
          "prana-awakening-spine-unfurling",
          "lower-back-decompression",
          "core-stability-pelvic-balance",
          "vagus-nerve-decompression",
          "golden-hour-prana-flow",
          "five-koshas-breathwork",
          "restorative-twilight-reset",
        ],
      },
      {
        label: { en: "Week 04", fa: "هفتهٔ ۴" },
        title: { en: "Integrated Stillness", fa: "سکون یکپارچه" },
        description: {
          en: "Conscious deep rest, sound integration, and a personal rhythm to carry beyond the thirty days.",
          fa: "استراحت عمیق و آگاهانه، یکپارچگی با صدا و ریتمی شخصی برای ادامه پس از سی روز.",
        },
        focus: { en: "Crown & ether", fa: "تاج و اثیر" },
        practices: [
          "coherent-heart-resonance-nidra",
          "awakening-solar-flow",
          "vagus-nerve-decompression",
          "golden-hour-prana-flow",
          "five-koshas-breathwork",
          "restorative-twilight-reset",
          "core-stability-pelvic-balance",
          "lower-back-decompression",
          "coherent-heart-resonance-nidra",
        ],
      },
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
    pacing: "self",
    badge: { en: "Somatic Series • 14 Days", fa: "مجموعهٔ سوماتیک • ۱۴ روز" },
    title: { en: "Somatic Nervous System Reset", fa: "بازتنظیم سوماتیک سیستم عصبی" },
    heroTitle: {
      en: "Somatic Reset: Unwinding the Psoas, Freeing the Breath, Resting the Nerves",
      fa: "بازتنظیم سوماتیک: رهاسازی پسواس، آزادی تنفس، آرامش اعصاب",
    },
    description: {
      en: "Developed in consultation with somatic trauma therapies. Subtle neuro-fascial unwinding, psoas release, and polyvagal grounding designed for high-stress living.",
      fa: "طراحی‌شده با مشورت درمان‌های سوماتیک تروما. رهاسازی ظریف عصبی‌ـ‌فاشیایی، آزادسازی عضلهٔ پسواس و زمین‌گیری پلی‌واگال برای زندگی پرتنش.",
    },
    lede: {
      en: "Fourteen self-paced sessions of slow neuro-fascial release and polyvagal grounding. Every session is open from the start — move through them at the pace your body asks for.",
      fa: "چهارده جلسهٔ خودگام از رهاسازی آرام عصبی‌ـ‌فاشیایی و زمین‌گیری پلی‌واگال. همهٔ جلسه‌ها از ابتدا باز هستند؛ با سرعتی که بدنتان می‌خواهد پیش بروید.",
    },
    weeks: [
      {
        label: { en: "Phase 1", fa: "مرحلهٔ ۱" },
        title: { en: "Psoas & Sacrum Unwinding", fa: "رهاسازی پسواس و خاجی" },
        description: {
          en: "Releasing the deep hip flexors and the sacrum, where held stress settles first.",
          fa: "رهاسازی خم‌کننده‌های عمیق لگن و استخوان خاجی، جایی که فشار عصبی پیش از همه می‌نشیند.",
        },
        focus: { en: "Pelvic floor", fa: "کف لگن" },
        practices: [
          "lower-back-decompression",
          "vagus-nerve-decompression",
          "restorative-twilight-reset",
          "five-koshas-breathwork",
          "lower-back-decompression",
        ],
      },
      {
        label: { en: "Phase 2", fa: "مرحلهٔ ۲" },
        title: { en: "Diaphragmatic Freedom", fa: "آزادی دیافراگم" },
        description: {
          en: "Unbinding the diaphragm and ribs so the breath can slow on its own.",
          fa: "باز کردن دیافراگم و دنده‌ها تا تنفس خودبه‌خود آرام شود.",
        },
        focus: { en: "Breath", fa: "تنفس" },
        practices: [
          "five-koshas-breathwork",
          "coherent-heart-resonance-nidra",
          "prana-awakening-spine-unfurling",
          "vagus-nerve-decompression",
          "five-koshas-breathwork",
        ],
      },
      {
        label: { en: "Phase 3", fa: "مرحلهٔ ۳" },
        title: { en: "Neural Rewiring Stillness", fa: "سکون و بازسیم‌کشی عصبی" },
        description: {
          en: "Long, supported stillness that teaches the nervous system a new resting point.",
          fa: "سکونی طولانی و حمایت‌شده که به سیستم عصبی نقطهٔ آرام تازه‌ای می‌آموزد.",
        },
        focus: { en: "Vagal tone", fa: "تون واگ" },
        practices: [
          "coherent-heart-resonance-nidra",
          "restorative-twilight-reset",
          "vagus-nerve-decompression",
          "coherent-heart-resonance-nidra",
        ],
      },
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
