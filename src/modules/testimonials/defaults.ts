import type { Testimonial } from "./types.ts";

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: "clara",
    name: {
      en: "Clara Lindqvist",
      fa: "کلارا لیندکویست",
    },
    quote: {
      en: "“In a world of loud 45-minute HIIT workouts disguised as yoga, Arte is a breath of cold pine air. Elena’s cues don’t command you—they hold space for you.”",
      fa: "«در دنیایی پر از تمرین‌های پرسروصدای ۴۵ دقیقه‌ای که نام یوگا بر خود گذاشته‌اند، آرته مثل نفسی از هوای خنک کاج است. راهنمایی‌های النا فرمان نمی‌دهند؛ برایت فضا نگه می‌دارند.»",
    },
    roleOrMeta: {
      en: "Practicing 18 Months • Stockholm",
      fa: "۱۸ ماه تمرین • استکهلم",
    },
    rating: 5,
    avatarColor: "bg-secondary-fixed text-on-secondary-fixed",
    hidden: false,
    order: 0,
    showOn: "all",
  },
  {
    id: "marcus",
    name: {
      en: "Marcus Thorne",
      fa: "مارکوس تورن",
    },
    quote: {
      en: "“The Somatic Nervous System Reset healed my chronic neck tension in three weeks. The audio soundscapes make my small apartment feel like a mountain sanctuary.”",
      fa: "«برنامهٔ بازتنظیم سیستم عصبی، گرفتگی مزمن گردنم را در سه هفته درمان کرد. صداهای محیطی، آپارتمان کوچکم را به پناهگاهی در کوهستان تبدیل می‌کنند.»",
    },
    roleOrMeta: {
      en: "Architect & Father • London",
      fa: "معمار و پدر • لندن",
    },
    rating: 5,
    avatarColor: "bg-primary-fixed text-primary",
    hidden: false,
    order: 1,
    showOn: "all",
  },
  {
    id: "amina",
    name: {
      en: "Amina Patel",
      fa: "آمینا پاتل",
    },
    quote: {
      en: "“Sunday Live Nidra has become non-negotiable family time. Arte feels less like an app and more like visiting a quiet temple where time moves slower.”",
      fa: "«نیدرای زندهٔ یکشنبه‌ها برای خانواده‌مان به زمانی قطعی بدل شده است. آرته کمتر شبیه یک اپلیکیشن است و بیشتر شبیه رفتن به معبدی آرام، جایی که زمان آهسته‌تر می‌گذرد.»",
    },
    roleOrMeta: {
      en: "Practicing 2 Years • Montreal",
      fa: "۲ سال تمرین • مونترال",
    },
    rating: 5,
    avatarColor: "bg-tertiary-fixed text-on-tertiary-fixed",
    hidden: false,
    order: 2,
    showOn: "all",
  },
];
