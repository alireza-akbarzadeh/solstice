import type { Localized } from "@/lib/localized";

import type { IntensityLevel, PracticeAccess, PracticeCategory, PropSetup } from "./types";

// Stand-in content from the Stitch designs until practices live in the database.
export type SamplePractice = {
  slug: string;
  featured: boolean;
  title: Localized;
  summary: Localized;
  category: PracticeCategory;
  series: Localized;
  intensity: { level: IntensityLevel; label: Localized };
  props: PropSetup;
  durationMinutes: number;
  rating: number;
  reviewCount: number;
  access: PracticeAccess;
  /** Members-only practices: free preview length for non-members. Omit for no preview. */
  previewSeconds?: number;
  image: string;
  imageAlt: Localized;
};

export const samplePractices: SamplePractice[] = [
  {
    slug: "awakening-solar-flow",
    featured: false,
    title: { en: "Awakening Solar Flow: Heart & Shoulders", fa: "جریان خورشیدی بیداری: قلب و شانه‌ها" },
    summary: {
      en: "Gradual thoracic spine awakening with expansive anahatasana transitions, mobilizing rotator cuffs and elevating circulation for the hours ahead.",
      fa: "بیداری تدریجی ستون فقرات سینه‌ای با انتقال‌های گشادهٔ آناهاتاسانا؛ تحرک مفصل شانه و گردش خون بهتر برای ساعت‌های پیش رو.",
    },
    category: "morning",
    series: { en: "Solar Series • Sequence IV", fa: "مجموعهٔ خورشیدی • توالی ۴" },
    intensity: { level: "moderate", label: { en: "Moderate Agni", fa: "آگنی متوسط" } },
    props: "none",
    durationMinutes: 28,
    rating: 4.9,
    reviewCount: 148,
    access: "open",
    image: "/images/practices/solar-flow.jpg",
    imageAlt: {
      en: "Practitioner in a sun salutation in a limewashed studio with morning light",
      fa: "تمرین‌کننده در حرکت سلام به خورشید در استودیویی روشن با نور صبح",
    },
  },
  {
    slug: "restorative-twilight-reset",
    featured: false,
    title: { en: "Restorative Twilight & Nervous System Reset", fa: "گرگ‌ومیش ترمیمی و بازتنظیم سیستم عصبی" },
    summary: {
      en: "Long-held supported postures targeting the vagus nerve. Employs rhythmic down-regulation to relieve deep cranial tension and invite restorative sleep.",
      fa: "حرکات حمایت‌شده و طولانی با تمرکز بر عصب واگ. آرام‌سازی ریتمیک برای رهایی از تنش عمیق سر و دعوت به خوابی ترمیمی.",
    },
    category: "restorative",
    series: { en: "Soma Recovery • Phase I", fa: "بازیابی سوما • مرحلهٔ ۱" },
    intensity: { level: "gentle", label: { en: "Gentle Somatic", fa: "سوماتیک ملایم" } },
    props: "bolster-blocks",
    durationMinutes: 42,
    rating: 5,
    reviewCount: 203,
    access: "members",
    previewSeconds: 300,
    image: "/images/practices/restorative-twilight.jpg",
    imageAlt: {
      en: "Restorative posture on cotton bolsters and wool blankets in candlelight",
      fa: "حرکت ترمیمی روی بالشتک‌های کتانی و پتوهای پشمی در نور شمع",
    },
  },
  {
    slug: "five-koshas-breathwork",
    featured: false,
    title: { en: "Five Koshas Breathwork & Silent Meditation", fa: "تنفس پنج کوشا و مراقبهٔ خاموش" },
    summary: {
      en: "Traverse the layers of presence from physical sensation to the anandamaya kosha. Features nadi shodhana followed by extended spacious silence.",
      fa: "گذر از لایه‌های حضور، از حس جسمانی تا آناندامایا کوشا. همراه با نادی شودانا و سپس سکوتی گسترده.",
    },
    category: "pranayama",
    series: { en: "Breath Architecture", fa: "معماری نفس" },
    intensity: { level: "gentle", label: { en: "Subtle Body", fa: "بدن لطیف" } },
    props: "none",
    durationMinutes: 20,
    rating: 4.9,
    reviewCount: 92,
    access: "open",
    image: "/images/practices/five-koshas.jpg",
    imageAlt: {
      en: "Yogi in seated lotus meditation with hands in jnana mudra, golden window light",
      fa: "تمرین‌کننده در مراقبهٔ نیلوفری با دست‌ها در جنانا مودرا، در نور طلایی پنجره",
    },
  },
  {
    slug: "lower-back-decompression",
    featured: false,
    title: { en: "Lower Back Decompression & Hip Unwinding", fa: "رهاسازی کمر و گشودن لگن" },
    summary: {
      en: "Gentle psoas release, sacral traction, and somatic pendulation designed specifically for practitioners seeking structural ease after prolonged sitting.",
      fa: "رهاسازی ملایم پسواس، کشش خاجی و نوسان سوماتیک؛ ویژهٔ کسانی که پس از نشستن طولانی به دنبال آسودگی ساختاری‌اند.",
    },
    category: "mobility",
    series: { en: "Pelvic Balance Series", fa: "مجموعهٔ تعادل لگن" },
    intensity: { level: "gentle", label: { en: "Gentle", fa: "ملایم" } },
    props: "strap",
    durationMinutes: 34,
    rating: 4.8,
    reviewCount: 115,
    access: "members",
    previewSeconds: 600,
    image: "/images/practices/lower-back.jpg",
    imageAlt: {
      en: "Yogi reclining with legs elevated along an oak wall in soft daylight",
      fa: "تمرین‌کننده در حالت درازکش با پاهای بالا کنار دیوار چوبی در نور ملایم روز",
    },
  },
  {
    slug: "core-stability-pelvic-balance",
    featured: false,
    title: { en: "Dynamic Core Stability & Pelvic Balance", fa: "ثبات پویای مرکز بدن و تعادل لگن" },
    summary: {
      en: "Deliberate integration of the transverse abdominis, pelvic floor engagement, and slow, precise transitions that build endurance without tension.",
      fa: "درگیر کردن آگاهانهٔ عضلات عمقی شکم و کف لگن، با انتقال‌های آهسته و دقیق که بدون تنش استقامت می‌سازند.",
    },
    category: "vinyasa",
    series: { en: "Foundation Work", fa: "کار پایه" },
    intensity: { level: "fire", label: { en: "Deep Fire", fa: "آتش عمیق" } },
    props: "bolster-blocks",
    durationMinutes: 38,
    rating: 4.9,
    reviewCount: 176,
    access: "members",
    previewSeconds: 300,
    image: "/images/practices/core-stability.jpg",
    imageAlt: {
      en: "Practitioner in a balanced side plank on a cork mat among terracotta pottery",
      fa: "تمرین‌کننده در حالت تختهٔ جانبی روی مت چوب‌پنبه، کنار ظروف سفالی",
    },
  },
  {
    slug: "golden-hour-prana-flow",
    featured: false,
    title: { en: "Golden Hour Prana Flow", fa: "جریان پرانای ساعت طلایی" },
    summary: {
      en: "An unhurried, rhythmic asana mandala synchronizing oceanic breath with intuitive spinal waves as dusk settles into quiet resting awareness.",
      fa: "ماندالایی آهسته و ریتمیک از آسانا که نفس اقیانوسی را با موج‌های ستون فقرات هم‌نوا می‌کند، تا غروب در آگاهی آرام فرو نشیند.",
    },
    category: "evening",
    series: { en: "Solar Sunset Ritual", fa: "آیین غروب خورشید" },
    intensity: { level: "moderate", label: { en: "Moderate Flow", fa: "جریان متوسط" } },
    props: "none",
    durationMinutes: 45,
    rating: 5,
    reviewCount: 264,
    access: "members",
    previewSeconds: 600,
    image: "/images/practices/golden-hour.jpg",
    imageAlt: {
      en: "Dancer pose in golden afternoon light through linen curtains",
      fa: "حرکت رقصنده در نور طلایی عصر که از پرده‌های کتان می‌تابد",
    },
  },
  {
    slug: "prana-awakening-spine-unfurling",
    featured: true,
    title: { en: "Prana Awakening & Spine Unfurling", fa: "بیداری پرانا و گشودن ستون فقرات" },
    summary: {
      en: "Release sleep rigidity, rehydrate fascia, and expand tidal lung volume through rhythmic undulating vinyasa.",
      fa: "با وینیاسایی موج‌وار و ریتمیک، خشکی خواب را رها کنید، فاشیا را دوباره آبرسانی کنید و ظرفیت تنفس را گسترش دهید.",
    },
    category: "morning",
    series: { en: "Vinyasa Somatics", fa: "وینیاسای سوماتیک" },
    intensity: { level: "gentle", label: { en: "Gentle Pulse", fa: "ضربان ملایم" } },
    props: "none",
    durationMinutes: 15,
    rating: 4.9,
    reviewCount: 131,
    access: "open",
    image: "/images/home/04.jpg",
    imageAlt: {
      en: "Yogi moving through a morning sun salutation on a cork mat in soft diagonal light",
      fa: "تمرین‌کننده در حال سلام به خورشید صبحگاهی روی مت چوب‌پنبه در نور ملایم",
    },
  },
  {
    slug: "vagus-nerve-decompression",
    featured: true,
    title: { en: "Vagus Nerve Decompression & Bolster Release", fa: "رهاسازی عصب واگ با بالشتک" },
    summary: {
      en: "Supported forward folds and reclined heart openers engineered to quiet sympathetic overdrive after demanding days.",
      fa: "خم‌شدن‌های رو به جلوی حمایت‌شده و بازکننده‌های قلب در حالت درازکش، برای آرام کردن فشار عصبی پس از روزهای پرتنش.",
    },
    category: "restorative",
    series: { en: "Parasympathetic", fa: "پاراسمپاتیک" },
    intensity: { level: "gentle", label: { en: "Deep Stillness", fa: "سکون عمیق" } },
    props: "bolster-blocks",
    durationMinutes: 28,
    rating: 5,
    reviewCount: 187,
    access: "members",
    previewSeconds: 300,
    image: "/images/home/05.jpg",
    imageAlt: {
      en: "Restorative setup with cotton bolsters, folded linen blankets and warm candlelight",
      fa: "چیدمان تمرین ترمیمی با بالشتک‌های کتانی، پتوهای تاشده و نور گرم شمع",
    },
  },
  {
    slug: "coherent-heart-resonance-nidra",
    featured: true,
    title: { en: "Coherent Heart Resonance & Yoga Nidra", fa: "هم‌نوایی قلب و یوگا نیدرا" },
    summary: {
      en: "Structured box breathing accompanied by a slow rotation of consciousness leading toward theta restorative sleep.",
      fa: "تنفس مربعی ساختارمند همراه با چرخش آرام آگاهی، به سوی خواب ترمیمی تتا.",
    },
    category: "pranayama",
    series: { en: "Kumbhaka Ritual", fa: "آیین کومبهاکا" },
    intensity: { level: "gentle", label: { en: "All Levels", fa: "همهٔ سطوح" } },
    props: "none",
    durationMinutes: 35,
    rating: 4.8,
    reviewCount: 96,
    access: "open",
    image: "/images/home/06.jpg",
    imageAlt: {
      en: "Woman practicing seated alternate-nostril breathing in warm window light",
      fa: "زنی در حال تنفس متناوب بینی در حالت نشسته، در نور گرم پنجره",
    },
  },
];
