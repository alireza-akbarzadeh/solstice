import type { MilestoneDefinition } from "./types.ts";

export const SANCTUARY_MILESTONES: MilestoneDefinition[] = [
  {
    id: "first_breath",
    category: "volume",
    icon: "sparkles",
    target: 1,
    type: "total_sessions",
    title: {
      en: "First Breath",
      fa: "نخستین دم",
    },
    description: {
      en: "Completed your first practice in the sanctuary.",
      fa: "تکمیل نخستین تمرین در پناهگاه.",
    },
  },
  {
    id: "rhythm_awakened",
    category: "volume",
    icon: "flame",
    target: 5,
    type: "total_sessions",
    title: {
      en: "Rhythm Awakened",
      fa: "بیداری ریتم",
    },
    description: {
      en: "Completed 5 practices. A daily rhythm begins to take root.",
      fa: "تکمیل ۵ تمرین؛ ریتم پیوسته در جان شما ریشه می‌دواند.",
    },
  },
  {
    id: "sanctuary_devotion",
    category: "volume",
    icon: "heart",
    target: 10,
    type: "total_sessions",
    title: {
      en: "Sanctuary Devotion",
      fa: "انس با پناهگاه",
    },
    description: {
      en: "Completed 10 practices. Consistency transforms into presence.",
      fa: "تکمیل ۱۰ تمرین؛ استمرار به حضور و آگاهی دگرگون می‌شود.",
    },
  },
  {
    id: "golden_thread",
    category: "volume",
    icon: "sun",
    target: 25,
    type: "total_sessions",
    title: {
      en: "Golden Thread",
      fa: "رشتهٔ زرین",
    },
    description: {
      en: "Completed 25 practices. Mindfulness weaves through everyday moments.",
      fa: "تکمیل ۲۵ تمرین؛ رشتهٔ زرین توجه و آرامش در تاروپود روزمرگی بافته شده است.",
    },
  },
  {
    id: "deep_roots",
    category: "depth",
    icon: "tree",
    target: 50,
    type: "total_sessions",
    title: {
      en: "Deep Roots",
      fa: "ریشه‌های کهن",
    },
    description: {
      en: "Completed 50 practices. Grounded, centered, and steady.",
      fa: "تکمیل ۵۰ تمرین؛ پایداری، آرامش و ریشه‌داری در مسیر.",
    },
  },
  {
    id: "centennial_sangha",
    category: "depth",
    icon: "crown",
    target: 100,
    type: "total_sessions",
    title: {
      en: "Century of Calm",
      fa: "سدهٔ آرامش",
    },
    description: {
      en: "Completed 100 practices. A milestone of unwavering sanctuary dedication.",
      fa: "تکمیل ۱۰۰ تمرین؛ گامی ماندگار در خودشناسی و سرسپردگی به آرامش.",
    },
  },
  {
    id: "pranayama_mastery",
    category: "style",
    icon: "wind",
    target: 5,
    type: "category_sessions",
    targetCategory: ["breathwork", "pranayama"],
    title: {
      en: "Breath Alchemist",
      fa: "کیمیای دم",
    },
    description: {
      en: "Completed 5 pranayama and breathwork sessions.",
      fa: "تکمیل ۵ نشست پرانایاما و تمرین‌های تنفسی.",
    },
  },
  {
    id: "evening_stillness",
    category: "style",
    icon: "moon",
    target: 5,
    type: "category_sessions",
    targetCategory: ["nidra", "yin", "restorative"],
    title: {
      en: "Quiet Waters",
      fa: "آب‌های آرام",
    },
    description: {
      en: "Completed 5 restorative, yin, or yoga nidra sessions.",
      fa: "تکمیل ۵ جلسه تمرین ترمیمی، یین یوگا یا یوگا نیدرا.",
    },
  },
  {
    id: "solar_vitality",
    category: "style",
    icon: "sunrise",
    target: 5,
    type: "category_sessions",
    targetCategory: ["vinyasa", "solar", "flow", "hatha"],
    title: {
      en: "Solar Flow",
      fa: "جریان خورشیدی",
    },
    description: {
      en: "Completed 5 energetic flow or solar vitality practices.",
      fa: "تکمیل ۵ جلسه تمرین جریان پرانرژی خورشید.",
    },
  },
];
