import type { Localized } from "@/lib/localized";
import type { LiveClassAccess, LiveClassStatus } from "./types";

export type SampleLiveClass = {
  slug: string;
  status: LiveClassStatus;
  title: Localized;
  description: Localized;
  instructorName: Localized;
  locationName: Localized;
  scheduledAt: Date;
  durationMinutes: number;
  joinUrl: string;
  capacity: number | null;
  access: LiveClassAccess;
  replayPracticeSlug: string | null;
  coverImage: string;
  soundscapeDetails: string | null;
};

// Generates dates relative to today so sample classes always appear relevant in local times
const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
tomorrow.setHours(17, 30, 0, 0);

const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
inThreeDays.setHours(9, 0, 0, 0);

const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
nextWeek.setHours(19, 0, 0, 0);

export const sampleLiveClasses: SampleLiveClass[] = [
  {
    slug: "autumn-equinox-satsang",
    status: "scheduled",
    title: {
      en: "Autumn Equinox Gathering: Kyoto Pavilion Sunday Satsang",
      fa: "گردهمایی اعتدال پاییزی: ساتسانگ یکشنبه پاویون کیوتو",
    },
    description: {
      en: "A meditative gathering exploring breath of stillness, ribcage somatic integration, and subtle nervous system calming. Includes collective pranayama cadence and 432Hz singing bowl resonance.",
      fa: "یک گردهمایی مراقبه‌ای برای کاوش در تنفس سکون، هماهنگی سوماتیک قفسه سینه و آرامش عمیق سیستم عصبی. همراه با ریتم پرانایامای جمعی و ارتعاش کاسه‌های تبتی ۴۳۲ هرتز.",
    },
    instructorName: {
      en: "Elena Vance",
      fa: "النا ونس",
    },
    locationName: {
      en: "Kyoto Pavilion · Pavilion Main",
      fa: "پاویون کیوتو · تالار اصلی",
    },
    scheduledAt: tomorrow,
    durationMinutes: 75,
    joinUrl: "https://meet.jit.si/ArteYogaSanctuary-Equinox",
    capacity: 60,
    access: "members_only",
    replayPracticeSlug: null,
    coverImage: "/images/classes/kyoto-pavilion-stage.jpg",
    soundscapeDetails: "Elena + 432Hz Bowls · Voice 70% · Chimes 30%",
  },
  {
    slug: "morning-solar-vinyasa",
    status: "scheduled",
    title: {
      en: "Morning Solar Vinyasa: Fluid Spine & Pelvic Stability",
      fa: "وینیاسای خورشیدی صبحگاهی: ستون فقرات سیال و ثبات لگن",
    },
    description: {
      en: "An invigorating yet unhurried dawn flow designed to mobilize synovial fluid in the joints and awaken vitality without nervous exhaustion.",
      fa: "جریان حرکتی پرانرژی و در عین حال آرام سحرگاهی برای به حرکت درآوردن مفاصل و بیداری شادابی بدون خستگی سیستم عصبی.",
    },
    instructorName: {
      en: "Elena Vance",
      fa: "النا ونس",
    },
    locationName: {
      en: "Ojai Light Studio",
      fa: "استودیو نور اوهای",
    },
    scheduledAt: inThreeDays,
    durationMinutes: 60,
    joinUrl: "https://meet.jit.si/ArteYogaSanctuary-Solar",
    capacity: 45,
    access: "members_only",
    replayPracticeSlug: null,
    coverImage: "/images/classes/kyoto-pavilion-mobile.jpg",
    soundscapeDetails: "Binaural 528Hz Ambient Solfeggio",
  },
  {
    slug: "somatic-yin-restoration",
    status: "scheduled",
    title: {
      en: "Somatic Yin & Deep Nervous System Down-Regulation",
      fa: "یین یوگای سوماتیک و آرام‌سازی عمیق سیستم عصبی",
    },
    description: {
      en: "Long, supported floor postures utilizing bolsters, blocks, and mindful breathing to release chronic fascia holding patterns around the sacrum and thoracic spine.",
      fa: "آسانا‌های طولانی و با تکیه‌گاه همراه با بولستر، آجر و تنفس آگاهانه برای رهاسازی انقباض‌های مزمن فاشیا در ناحیه خاجی و ستون مهره پشتی.",
    },
    instructorName: {
      en: "Elena Vance",
      fa: "النا ونس",
    },
    locationName: {
      en: "Cedar Tea Room & Hearth",
      fa: "چایخانه سدر و آتشگاه",
    },
    scheduledAt: nextWeek,
    durationMinutes: 90,
    joinUrl: "https://meet.jit.si/ArteYogaSanctuary-Yin",
    capacity: null,
    access: "open",
    replayPracticeSlug: null,
    coverImage: "/images/classes/kyoto-pavilion-stage.jpg",
    soundscapeDetails: "Tibetan Cedar Bowls & Rain Resonance",
  },
];
