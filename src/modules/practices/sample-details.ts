import type { Localized } from "@/lib/localized";

import type { ImplementKind } from "./types";

// Stand-in detail content (practice-detail-player-desktop). Practices without an entry
// render the detail page without the note, focus, implements and chapters sections.
export type SamplePracticeDetail = {
  poster?: string;
  instructorNote: Localized;
  focus: Localized[];
  implements: { kind: ImplementKind; name: Localized; detail: Localized }[];
  chapters: { title: Localized; description: Localized; startSeconds: number }[];
};

export const samplePracticeDetails: Record<string, SamplePracticeDetail> = {
  "awakening-solar-flow": {
    poster: "/images/practices/solar-flow-stage.jpg",
    instructorNote: {
      en: "Notice where you hold unconscious guarding across the collarbones and sternum today. As we move through the chest expansions, resist the urge to pinch the shoulder blades together. Instead, lengthen laterally from the solar plexus toward the fingertips, letting your breath create buoyant internal space.",
      fa: "امروز ببینید کجا ناخودآگاه دور ترقوه‌ها و جناغ سینه را منقبض نگه می‌دارید. هنگام گشودن سینه، تیغه‌های شانه را به هم نفشارید؛ به‌جای آن از شبکهٔ خورشیدی به سمت نوک انگشتان کشیده شوید و بگذارید نفس، فضایی سبک در درون بسازد.",
    },
    focus: [
      {
        en: "Release chronic tension across pectoralis minor and anterior deltoids",
        fa: "رهایی از تنش مزمن در عضلات سینه‌ای کوچک و جلوی شانه",
      },
      {
        en: "Stimulate the heart centre (Anahata) and unburden the thoracic spine",
        fa: "بیدار کردن مرکز قلب (آناهاتا) و سبک کردن ستون فقرات سینه‌ای",
      },
      {
        en: "Activate diaphragmatic rib mobility through rhythmic Ujjayi breathing",
        fa: "فعال کردن تحرک دنده‌ها و دیافراگم با تنفس ریتمیک اوجایی",
      },
    ],
    implements: [
      { kind: "blocks", name: { en: "Cork Blocks", fa: "بلوک چوب‌پنبه" }, detail: { en: "Two (Medium)", fa: "دو عدد (متوسط)" } },
      { kind: "strap", name: { en: "Linen Strap", fa: "بند کتانی" }, detail: { en: "8-foot looped", fa: "۲٫۵ متری، حلقه‌دار" } },
      { kind: "blanket", name: { en: "Wool Blanket", fa: "پتوی پشمی" }, detail: { en: "Under knees", fa: "زیر زانوها" } },
    ],
    chapters: [
      {
        title: { en: "Centering & Diaphragmatic Breath", fa: "مرکزیابی و تنفس دیافراگمی" },
        description: { en: "Seated Sukhasana with collarbone grounding", fa: "سوکهاسانا با زمین‌گیری ترقوه‌ها" },
        startSeconds: 0,
      },
      {
        title: { en: "Cat-Cow & Thoracic Waving", fa: "گربه‌ـ‌گاو و موج سینه‌ای" },
        description: { en: "Mobilizing the scapulae and cervical transition", fa: "تحرک تیغه‌های شانه و گذر گردن" },
        startSeconds: 271,
      },
      {
        title: { en: "Sun Salutation A Variations", fa: "گونه‌های سلام به خورشید A" },
        description: { en: "Heart-opening upward dogs and extended low lunges", fa: "سگ رو به بالا با گشودن قلب و لانج‌های کشیده" },
        startSeconds: 586,
      },
      {
        title: { en: "Warrior II & Interlaced Humble Heart", fa: "جنگجوی ۲ و قلب فروتن" },
        description: { en: "Deep shoulder girdle unraveling and grounded strength", fa: "گشودن عمیق کمربند شانه و قدرت زمین‌گیر" },
        startSeconds: 1036,
      },
      {
        title: { en: "Supported Savasana & Grounding Seal", fa: "شاواسانای حمایت‌شده و مهر پایانی" },
        description: { en: "Resting integration with bolster along the spine", fa: "یکپارچگی در استراحت با بالشتک در امتداد ستون فقرات" },
        startSeconds: 1421,
      },
    ],
  },
  "restorative-twilight-reset": {
    instructorNote: {
      en: "Let every prop do the holding tonight. If a shape asks for effort, add support until it doesn't. The work here is to stop working, and let the long exhale carry you down.",
      fa: "امشب بگذارید وسایل همه‌چیز را نگه دارند. اگر حرکتی تلاش می‌خواهد، آن‌قدر حمایت اضافه کنید تا دیگر نخواهد. کار اینجا دست کشیدن از کار است؛ بگذارید بازدم بلند شما را پایین ببرد.",
    },
    focus: [
      { en: "Down-regulate the nervous system through long-held supported shapes", fa: "آرام کردن سیستم عصبی با حرکات حمایت‌شده و طولانی" },
      { en: "Soften the jaw, brow and base of the skull", fa: "نرم کردن فک، پیشانی و پایهٔ جمجمه" },
      { en: "Prepare the body for deep, restorative sleep", fa: "آماده کردن بدن برای خوابی عمیق و ترمیمی" },
    ],
    implements: [
      { kind: "bolster", name: { en: "Bolster", fa: "بالشتک" }, detail: { en: "Firm, full length", fa: "سفت، تمام‌قد" } },
      { kind: "blocks", name: { en: "Cork Blocks", fa: "بلوک چوب‌پنبه" }, detail: { en: "Two", fa: "دو عدد" } },
      { kind: "blanket", name: { en: "Wool Blankets", fa: "پتوی پشمی" }, detail: { en: "Two, folded", fa: "دو عدد، تاشده" } },
    ],
    chapters: [
      { title: { en: "Arriving & Body Scan", fa: "رسیدن و اسکن بدن" }, description: { en: "Reclined, bolster under the knees", fa: "درازکش، بالشتک زیر زانوها" }, startSeconds: 0 },
      { title: { en: "Supported Child's Pose", fa: "حالت کودک حمایت‌شده" }, description: { en: "Torso draped over the bolster", fa: "تنه روی بالشتک رها شده" }, startSeconds: 420 },
      { title: { en: "Reclined Heart Opener", fa: "بازکنندهٔ قلب در حالت درازکش" }, description: { en: "Bolster along the spine", fa: "بالشتک در امتداد ستون فقرات" }, startSeconds: 1140 },
      { title: { en: "Legs Up the Wall & Rest", fa: "پاها روی دیوار و استراحت" }, description: { en: "Long exhale into stillness", fa: "بازدم بلند به سوی سکون" }, startSeconds: 1860 },
    ],
  },
  "five-koshas-breathwork": {
    instructorNote: {
      en: "We'll move inward one layer at a time. There's nothing to achieve in the silence at the end: simply notice what remains when the breath is left alone.",
      fa: "لایه به لایه به درون می‌رویم. در سکوت پایانی چیزی برای رسیدن نیست؛ فقط ببینید وقتی نفس را به حال خود رها می‌کنید، چه باقی می‌ماند.",
    },
    focus: [
      { en: "Balance the nervous system with alternate-nostril breathing", fa: "تعادل سیستم عصبی با تنفس متناوب بینی" },
      { en: "Move attention from body sensation to subtle awareness", fa: "بردن توجه از حس بدن به آگاهی لطیف" },
      { en: "Rest in extended, unguided silence", fa: "آرمیدن در سکوتی طولانی و بدون راهنما" },
    ],
    implements: [
      { kind: "cushion", name: { en: "Meditation Cushion", fa: "کوسن مراقبه" }, detail: { en: "Or a folded blanket", fa: "یا پتوی تاشده" } },
    ],
    chapters: [
      { title: { en: "Annamaya: The Physical Body", fa: "آنامایا: بدن جسمانی" }, description: { en: "Settling the seat and spine", fa: "استقرار نشستن و ستون فقرات" }, startSeconds: 0 },
      { title: { en: "Pranamaya: Nadi Shodhana", fa: "پرانامایا: نادی شودانا" }, description: { en: "Alternate-nostril breathing", fa: "تنفس متناوب بینی" }, startSeconds: 240 },
      { title: { en: "Manomaya to Anandamaya", fa: "از مانومایا تا آناندامایا" }, description: { en: "Guided inward attention", fa: "توجه درونی با راهنما" }, startSeconds: 600 },
      { title: { en: "Spacious Silence", fa: "سکوت گسترده" }, description: { en: "Unguided sitting", fa: "نشستن بدون راهنما" }, startSeconds: 900 },
    ],
  },
};
