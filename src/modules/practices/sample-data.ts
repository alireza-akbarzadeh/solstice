import type { Localized } from "@/lib/localized";

import type { PracticeTone } from "./types";

// Stand-in content from the Stitch designs until practices live in the database.
export type SamplePractice = {
  slug: string;
  featured: boolean;
  title: Localized;
  summary: Localized;
  category: Localized;
  categoryTone: PracticeTone;
  style: Localized;
  intensity: Localized;
  durationMinutes: number;
  image: string;
  imageAlt: Localized;
};

export const samplePractices: SamplePractice[] = [
  {
    slug: "prana-awakening-spine-unfurling",
    featured: true,
    title: { en: "Prana Awakening & Spine Unfurling", fa: "بیداری پرانا و گشودن ستون فقرات" },
    summary: {
      en: "Release sleep rigidity, rehydrate fascia, and expand tidal lung volume through rhythmic undulating vinyasa.",
      fa: "با وینیاسایی موج‌وار و ریتمیک، خشکی خواب را رها کنید، فاشیا را دوباره آبرسانی کنید و ظرفیت تنفس را گسترش دهید.",
    },
    category: { en: "Morning Flow", fa: "جریان صبحگاهی" },
    categoryTone: "primary",
    style: { en: "Vinyasa Somatics", fa: "وینیاسای سوماتیک" },
    intensity: { en: "Gentle Pulse", fa: "ضربان ملایم" },
    durationMinutes: 15,
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
    category: { en: "Restorative", fa: "ترمیمی" },
    categoryTone: "tertiary",
    style: { en: "Parasympathetic", fa: "پاراسمپاتیک" },
    intensity: { en: "Deep Stillness", fa: "سکون عمیق" },
    durationMinutes: 28,
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
    category: { en: "Breathwork & Nidra", fa: "تنفس و نیدرا" },
    categoryTone: "clay",
    style: { en: "Kumbhaka Ritual", fa: "آیین کومبهاکا" },
    intensity: { en: "All Levels", fa: "همهٔ سطوح" },
    durationMinutes: 35,
    image: "/images/home/06.jpg",
    imageAlt: {
      en: "Woman practicing seated alternate-nostril breathing in warm window light",
      fa: "زنی در حال تنفس متناوب بینی در حالت نشسته، در نور گرم پنجره",
    },
  },
];
