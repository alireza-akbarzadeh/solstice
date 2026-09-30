import type { Localized } from "@/lib/localized";

import type { JournalCategory } from "./types";

// Stand-in essays from the Stitch journal screens until posts live in the database.

type L = Localized;

export type SampleBlock =
  | { type: "p"; text: L }
  | { type: "h2"; text: L }
  | { type: "quote"; text: L; source: L }
  | { type: "figure"; image: string; alt: L; caption: L }
  | { type: "steps"; title: L; intro: L; items: { title: L; body: L }[] };

export type SampleAuthor = "elena" | "aris" | "maya" | "kavi";

export type SampleArticle = {
  slug: string;
  featured?: boolean;
  category: JournalCategory;
  issue: number;
  tags: L[];
  author: SampleAuthor;
  publishedAt: string;
  image: string;
  imageAlt: L;
  title: L;
  excerpt: L;
  body: SampleBlock[];
  practices: string[];
};

export const sampleAuthors: Record<
  SampleAuthor,
  { name: L; role: L; image: string | null }
> = {
  elena: {
    name: { en: "Elena Vance", fa: "النا ونس" },
    role: {
      en: "Somatic movement director & lineage guide",
      fa: "مدیر حرکت سوماتیک و راهنمای سنت",
    },
    image: "/images/brand/elena-closeup.jpg",
  },
  aris: {
    name: { en: "Dr. Aris Thorne", fa: "دکتر آریس تورن" },
    role: {
      en: "Respiratory physiologist · guest writer",
      fa: "فیزیولوژیست تنفس · نویسندهٔ مهمان",
    },
    image: null,
  },
  maya: {
    name: { en: "Maya Lin-Geller", fa: "مایا لین‌گلر" },
    role: {
      en: "Architect & home-practice designer · guest writer",
      fa: "معمار و طراح فضای تمرین خانگی · نویسندهٔ مهمان",
    },
    image: null,
  },
  kavi: {
    name: { en: "Kavi Mehta", fa: "کاوی مهتا" },
    role: {
      en: "Yoga nidra teacher · guest writer",
      fa: "مربی یوگا نیدرا · نویسندهٔ مهمان",
    },
    image: null,
  },
};

export const sampleArticles: SampleArticle[] = [
  {
    slug: "vagus-nerve-in-movement",
    featured: true,
    category: "somatic",
    issue: 34,
    tags: [
      { en: "Neuro-somatic health", fa: "سلامت عصبی‌ـ‌سوماتیک" },
      { en: "Polyvagal theory", fa: "نظریهٔ پلی‌واگال" },
      { en: "Vagus nerve", fa: "عصب واگ" },
    ],
    author: "elena",
    publishedAt: "2024-10-14",
    image: "/images/journal/vagus-nerve.jpg",
    imageAlt: {
      en: "A practitioner moving slowly on a limestone floor in morning light",
      fa: "تمرین‌کننده‌ای در حال حرکت آرام روی کف سنگی در نور صبح",
    },
    title: {
      en: "The Vagus Nerve in Movement: Why Slow Transitions Rewire the Autonomic Nervous System",
      fa: "عصب واگ در حرکت: چرا گذارهای آرام سیستم عصبی خودکار را بازسیم‌کشی می‌کنند",
    },
    excerpt: {
      en: "In high-intensity fitness, speed is mistaken for vigor. But true healing happens in the millimeter between poses. Here is how slow somatic vinyasa softens chronic fight-or-flight guarding and restores heart rate variability.",
      fa: "در ورزش‌های پرشدت، سرعت با نیرومندی اشتباه گرفته می‌شود. اما ترمیم واقعی در فاصلهٔ میلی‌متری میان حرکت‌ها رخ می‌دهد. وینیاسای آرام سوماتیک چگونه گاردِ مزمن جنگ‌وگریز را نرم می‌کند و تغییرپذیری ضربان قلب را بازمی‌گرداند.",
    },
    body: [
      {
        type: "figure",
        image: "/images/journal/vagus-plate.jpg",
        alt: {
          en: "A slow spinal wave on a linen mat in a sunlit sanctuary",
          fa: "موج آرام ستون فقرات روی مت کتانی در پناهگاهی آفتابی",
        },
        caption: {
          en: "Plate 01: Spinal articulation in slow transition",
          fa: "تصویر ۰۱: مفصل‌بندی ستون فقرات در گذاری آرام",
        },
      },
      {
        type: "p",
        text: {
          en: "The prevailing dogma of Western physical conditioning is organized around conquest: more repetitions, faster intervals, sweat as the measure of redemption. We bring this same accelerated ambition onto the yoga mat, hurtling from Chaturanga into Upward Dog before the body has even mapped the descent. In doing so, we reinforce the very pattern we arrived to dissolve.",
          fa: "باور رایج در آمادگی جسمانی غربی بر پایهٔ فتح بنا شده است: تکرار بیشتر، فاصله‌های سریع‌تر و عرق به‌عنوان معیار رستگاری. همین جاه‌طلبی شتاب‌زده را به مت یوگا می‌آوریم و پیش از آنکه بدن فرود را نقشه‌برداری کند، از چاتورانگا به سگ رو به بالا می‌پریم. با این کار همان الگویی را تقویت می‌کنیم که برای رها شدن از آن آمده بودیم.",
        },
      },
      {
        type: "p",
        text: {
          en: "Through the lens of polyvagal theory, rapid transitions trigger a sense of urgency. When the inner ear detects abrupt changes in height without enough stability, the body reads danger: stress hormones rise, the pupils widen, and the psoas — our primary protective muscle — shortens defensively.",
          fa: "از دریچهٔ نظریهٔ پلی‌واگال، گذارهای سریع حس فوریت را برمی‌انگیزند. وقتی گوش درونی تغییر ناگهانی ارتفاع را بدون ثبات کافی تشخیص می‌دهد، بدن آن را خطر می‌خواند: هورمون‌های استرس بالا می‌روند، مردمک‌ها گشاد می‌شوند و پسواس ـ عضلهٔ محافظ اصلی ما ـ به حالت دفاعی کوتاه می‌شود.",
        },
      },
      {
        type: "quote",
        text: {
          en: "“The nervous system does not register presence when rushed. It registers emergency. To heal, the pace must match the speed of bone and breath.”",
          fa: "«سیستم عصبی در شتاب، حضور را ثبت نمی‌کند؛ اضطرار را ثبت می‌کند. برای ترمیم، ریتم باید با سرعت استخوان و نفس هماهنگ شود.»",
        },
        source: {
          en: "— Elena Vance · Notebooks on Somatic Architecture",
          fa: "— النا ونس · یادداشت‌هایی دربارهٔ معماری سوماتیک",
        },
      },
      {
        type: "h2",
        text: {
          en: "The ventral vagal anchor in asana",
          fa: "لنگر واگ شکمی در آسانا",
        },
      },
      {
        type: "p",
        text: {
          en: "The tenth cranial nerve descends from the brainstem, past the throat, around the heart, and into the lungs and belly. Most of its fibers carry messages upward — from the body to the brain, not the other way round. The body is constantly reporting whether it feels safe.",
          fa: "دهمین عصب جمجمه‌ای از ساقهٔ مغز پایین می‌آید، از کنار گلو می‌گذرد، دور قلب می‌پیچد و به ریه‌ها و شکم می‌رسد. بیشتر رشته‌های آن پیام‌ها را رو به بالا می‌برند ـ از بدن به مغز، نه برعکس. بدن بی‌وقفه گزارش می‌دهد که آیا احساس امنیت می‌کند یا نه.",
        },
      },
      {
        type: "p",
        text: {
          en: "When we slow a transition — twelve full seconds to move from Low Lunge into Warrior III — we invite that report to change. The heart rate settles, the exhale lengthens, and the rhythm between breath and heartbeat grows more coherent. The pose becomes a message of safety rather than a demand.",
          fa: "وقتی گذاری را آهسته می‌کنیم ـ دوازده ثانیهٔ کامل برای رفتن از لانج پایین به جنگجوی سه ـ از بدن دعوت می‌کنیم گزارشش را تغییر دهد. ضربان قلب آرام می‌گیرد، بازدم بلندتر می‌شود و ریتم میان نفس و ضربان هماهنگ‌تر می‌شود. حرکت به‌جای یک خواستهٔ سخت، به پیام امنیت بدل می‌شود.",
        },
      },
      {
        type: "steps",
        title: {
          en: "A 3-step micro-practice for today: the 4:7 extended exhale",
          fa: "یک تمرین کوچک سه‌مرحله‌ای برای امروز: بازدم کشیدهٔ ۴:۷",
        },
        intro: {
          en: "You do not need an hour of silent retreat to change your state. Begin with this on your mat or seated on a cushion.",
          fa: "برای تغییر حالتتان به یک ساعت خلوت خاموش نیاز ندارید. این تمرین را روی مت یا نشسته روی یک کوسن آغاز کنید.",
        },
        items: [
          {
            title: {
              en: "Diaphragmatic priming (4 counts)",
              fa: "آماده‌سازی دیافراگم (۴ شمارش)",
            },
            body: {
              en: "Inhale softly through the nose, widening the lower ribs like the wings of a swallow. Keep the shoulders and collarbones quiet.",
              fa: "آرام از بینی دم بگیرید و دنده‌های پایینی را مانند بال‌های پرستو باز کنید. شانه‌ها و ترقوه‌ها را آرام نگه دارید.",
            },
          },
          {
            title: {
              en: "The suspended threshold (2 counts)",
              fa: "آستانهٔ معلق (۲ شمارش)",
            },
            body: {
              en: "Pause gently without clamping the throat. Soften the tongue and let the eyes unfix from the horizon.",
              fa: "بی‌آنکه گلو را ببندید، به‌نرمی مکث کنید. زبان را نرم کنید و بگذارید نگاه از افق رها شود.",
            },
          },
          {
            title: {
              en: "The ocean-whisper exhale (7 counts)",
              fa: "بازدم زمزمهٔ دریا (۷ شمارش)",
            },
            body: {
              en: "Empty through softly pursed lips, as if moving a candle flame without putting it out. Feel the belly hollow, a signal of safety to the heart.",
              fa: "از میان لب‌های نیمه‌بسته خالی کنید، گویی شعلهٔ شمعی را بی‌آنکه خاموش شود تکان می‌دهید. فرورفتن شکم را حس کنید؛ پیامی از امنیت به قلب.",
            },
          },
        ],
      },
      {
        type: "figure",
        image: "/images/journal/vagus-hands.jpg",
        alt: {
          en: "Hands resting on a woven meditation cushion",
          fa: "دست‌هایی آرمیده روی کوسن مدیتیشن بافته",
        },
        caption: {
          en: "Plate 02: Tactile grounding between sequences",
          fa: "تصویر ۰۲: زمین‌گیری لمسی میان توالی‌ها",
        },
      },
      {
        type: "p",
        text: {
          en: "When we step off the mat, life rarely slows down for us. Deadlines multiply and notifications hum. This is exactly why slow sequencing matters: by teaching the body to hover in the spaces between without panic, we cultivate a poise that lasts long after practice ends.",
          fa: "وقتی از مت پایین می‌آییم، زندگی به‌ندرت برایمان آهسته می‌شود. ضرب‌الاجل‌ها زیاد می‌شوند و اعلان‌ها بی‌وقفه صدا می‌کنند. دقیقاً به همین دلیل توالی‌های آرام اهمیت دارند: با آموختن به بدن که بی‌هراس در فاصله‌ها بماند، آرامشی می‌پروریم که مدت‌ها پس از پایان تمرین باقی می‌ماند.",
        },
      },
    ],
    practices: ["awakening-solar-flow", "vagus-nerve-decompression"],
  },
  {
    slug: "morning-agni",
    category: "morning",
    issue: 33,
    tags: [{ en: "Morning rituals", fa: "آیین‌های صبحگاهی" }],
    author: "elena",
    publishedAt: "2024-10-11",
    image: "/images/journal/morning-agni.jpg",
    imageAlt: {
      en: "Herbal tea beside a rolled cork mat in morning sun",
      fa: "دم‌نوش گیاهی کنار مت چوب‌پنبه‌ای لوله‌شده در آفتاب صبح",
    },
    title: {
      en: "Morning Agni: 5 Unhurried Postures to Kindle Digestion and Mental Clarity",
      fa: "آگنی صبحگاهی: پنج حرکت بی‌شتاب برای روشن کردن آتش گوارش و وضوح ذهن",
    },
    excerpt: {
      en: "Waking the inner fire without the adrenaline rush. A gentle 15-minute floor routine that favors spinal flexion and soft abdominal movement.",
      fa: "بیدار کردن آتش درون بی‌هجوم آدرنالین. یک برنامهٔ ملایم ۱۵ دقیقه‌ای روی زمین با تکیه بر خم شدن ستون فقرات و حرکت نرم شکم.",
    },
    body: [
      {
        type: "p",
        text: {
          en: "In Ayurveda, agni is the digestive fire — the intelligence that transforms what we take in, from breakfast to the day’s first emails. Many of us try to light it with coffee and urgency. The morning practice offers a gentler match.",
          fa: "در آیورودا، آگنی آتش گوارش است؛ هوشی که آنچه دریافت می‌کنیم را دگرگون می‌کند، از صبحانه تا نخستین ایمیل‌های روز. بسیاری از ما می‌کوشیم آن را با قهوه و شتاب روشن کنیم. تمرین صبحگاهی کبریت ملایم‌تری پیشنهاد می‌دهد.",
        },
      },
      {
        type: "h2",
        text: {
          en: "Five postures, fifteen minutes",
          fa: "پنج حرکت، پانزده دقیقه",
        },
      },
      {
        type: "p",
        text: {
          en: "Begin lying down with knees hugged in, rocking side to side. Move into slow cat–cow on all fours, then a low lunge with a gentle twist toward the front knee. Rest in child’s pose with the belly softening onto the thighs, and finish seated, hands on the belly, for twelve slow breaths.",
          fa: "دراز بکشید، زانوها را در آغوش بگیرید و آرام به دو طرف تاب بخورید. روی چهار دست‌وپا به گربه‌ـ‌گاو آهسته بروید، سپس لانج پایین با چرخشی نرم رو به زانوی جلو. در حالت کودک استراحت کنید و بگذارید شکم روی ران‌ها نرم شود، و در پایان نشسته با دست‌هایی روی شکم، دوازده نفس آرام بکشید.",
        },
      },
      {
        type: "p",
        text: {
          en: "None of these shapes is dramatic. That is the point: the belly responds to rhythm and warmth, not force. Practiced before breakfast, the sequence leaves you awake without the jitter.",
          fa: "هیچ‌کدام از این حالت‌ها چشمگیر نیست و نکته همین است: شکم به ریتم و گرما پاسخ می‌دهد، نه به زور. اگر پیش از صبحانه تمرین شود، شما را بیدار می‌کند بی‌آنکه لرزش و بی‌قراری به جا بگذارد.",
        },
      },
    ],
    practices: ["prana-awakening-spine-unfurling"],
  },
  {
    slug: "art-of-kumbhaka",
    category: "breath",
    issue: 33,
    tags: [{ en: "Pranayama", fa: "پرانایاما" }],
    author: "aris",
    publishedAt: "2024-10-08",
    image: "/images/journal/kumbhaka.jpg",
    imageAlt: {
      en: "Light rippling through sheer woven linen",
      fa: "نوری که از میان کتان نازک بافته موج می‌زند",
    },
    title: {
      en: "The Art of Kumbhaka: Navigating the Space Between Inhale and Exhale",
      fa: "هنر کومباکا: پیمودن فاصلهٔ میان دم و بازدم",
    },
    excerpt: {
      en: "Retention is not breath-holding; it is settling into suspension. How the pauses between breaths train composure in volatile moments.",
      fa: "نگه‌داشتن نفس، حبس کردن آن نیست؛ جا گرفتن در حالت تعلیق است. مکث‌های میان نفس‌ها چگونه آرامش را در لحظه‌های پرتلاطم می‌پرورند.",
    },
    body: [
      {
        type: "p",
        text: {
          en: "Most people meet breath retention as a test of endurance: hold, strain, gasp. Kumbhaka asks for something quieter. The pause is not a wall you push against; it is a room you learn to rest inside.",
          fa: "بیشتر مردم نگه‌داشتن نفس را آزمون استقامت می‌دانند: نگه دار، فشار بیاور، نفس‌نفس بزن. کومباکا چیز آرام‌تری می‌خواهد. مکث دیواری نیست که به آن فشار بیاوری؛ اتاقی است که یاد می‌گیری در آن بیاسایی.",
        },
      },
      {
        type: "p",
        text: {
          en: "Physiologically, a soft pause after the exhale lets carbon dioxide rise gently, which relaxes smooth muscle and deepens the next inhale. Practiced without force, it teaches the body that a moment without air is not an emergency.",
          fa: "از نظر فیزیولوژیک، مکثی نرم پس از بازدم اجازه می‌دهد دی‌اکسید کربن آرام بالا برود؛ این کار عضلات صاف را شل می‌کند و دم بعدی را عمیق‌تر. اگر بی‌زور تمرین شود، به بدن می‌آموزد که لحظه‌ای بی‌هوا، اضطرار نیست.",
        },
      },
      {
        type: "h2",
        text: { en: "Begin with two counts", fa: "با دو شمارش شروع کنید" },
      },
      {
        type: "p",
        text: {
          en: "Breathe in for four, out for six, then rest empty for two. If the next inhale arrives in a rush, the pause was too long. Composure, not capacity, is the measure.",
          fa: "چهار شمارش دم، شش شمارش بازدم، سپس دو شمارش خالی بمانید. اگر دم بعدی با عجله آمد، مکث زیادی طولانی بوده است. معیار، آرامش است نه ظرفیت.",
        },
      },
    ],
    practices: ["five-koshas-breathwork"],
  },
  {
    slug: "linen-cork-and-silence",
    category: "space",
    issue: 32,
    tags: [{ en: "Sacred space", fa: "فضای مقدس" }],
    author: "maya",
    publishedAt: "2024-09-29",
    image: "/images/journal/home-sanctuary.jpg",
    imageAlt: {
      en: "An uncluttered meditation corner with cork blocks and a clay bowl",
      fa: "گوشهٔ مدیتیشن خلوت با بلوک‌های چوب‌پنبه و کاسه‌ای سفالی",
    },
    title: {
      en: "Linen, Cork, and Silence: Building an Uncluttered Home Sanctuary on Any Budget",
      fa: "کتان، چوب‌پنبه و سکوت: ساختن پناهگاهی خلوت در خانه با هر بودجه‌ای",
    },
    excerpt: {
      en: "Designing a small corner that invites ritual — quiet to the eye and ear — without a costly renovation.",
      fa: "طراحی گوشه‌ای کوچک که به آیین دعوت می‌کند ـ آرام برای چشم و گوش ـ بی‌نیاز به بازسازی پرهزینه.",
    },
    body: [
      {
        type: "p",
        text: {
          en: "A home practice space does not need a spare room. It needs a boundary: a rug, a corner, a lamp that only turns on when you practice. The body learns quickly that this place means slowing down.",
          fa: "فضای تمرین خانگی به اتاق اضافه نیاز ندارد؛ به یک مرز نیاز دارد: یک فرش، یک گوشه، چراغی که فقط هنگام تمرین روشن می‌شود. بدن زود یاد می‌گیرد که این مکان یعنی آهسته شدن.",
        },
      },
      {
        type: "h2",
        text: { en: "Subtract before you add", fa: "پیش از افزودن، کم کنید" },
      },
      {
        type: "p",
        text: {
          en: "Clear the sightline from your mat before buying anything. Replace one bright overhead light with a low warm lamp. Choose natural materials where your hands and feet touch — cork blocks, a wool blanket, a cotton strap — and keep them in a basket so the space resets in a minute.",
          fa: "پیش از خرید هر چیزی، دید خود از روی مت را خلوت کنید. یک چراغ سقفی تند را با چراغی پایین و گرم عوض کنید. جایی که دست و پایتان لمس می‌کند مواد طبیعی انتخاب کنید ـ بلوک چوب‌پنبه، پتوی پشمی، تسمهٔ نخی ـ و آن‌ها را در سبدی نگه دارید تا فضا در یک دقیقه مرتب شود.",
        },
      },
    ],
    practices: [],
  },
  {
    slug: "rest-is-not-a-reward",
    category: "philosophy",
    issue: 32,
    tags: [{ en: "Philosophy & lineage", fa: "فلسفه و پیشینه" }],
    author: "elena",
    publishedAt: "2024-09-24",
    image: "/images/journal/rest-not-reward.jpg",
    imageAlt: {
      en: "A figure resting in savasana under a wool blanket",
      fa: "پیکری آرمیده در شواسانا زیر پتوی پشمی",
    },
    title: {
      en: "Why Rest Is Not a Reward: Unlearning the Guilt of Savasana",
      fa: "چرا استراحت پاداش نیست: رها شدن از احساس گناه شواسانا",
    },
    excerpt: {
      en: "We are taught to treat non-doing as something earned. An inquiry into rest as a birthright rather than a prize.",
      fa: "به ما آموخته‌اند که «انجام ندادن» را چیزی بدانیم که باید به دستش آورد. کاوشی در استراحت چون حقی ذاتی، نه جایزه.",
    },
    body: [
      {
        type: "p",
        text: {
          en: "Watch any class approach savasana and you will see it: people rolling up mats, checking phones, slipping out. Rest feels optional because we have been taught it must be earned by effort first.",
          fa: "به هر کلاسی که به شواسانا نزدیک می‌شود نگاه کنید، این را می‌بینید: کسانی که مت‌ها را جمع می‌کنند، تلفن را نگاه می‌کنند و بی‌صدا بیرون می‌روند. استراحت اختیاری به نظر می‌رسد، چون آموخته‌ایم که نخست باید با تلاش به دستش آورد.",
        },
      },
      {
        type: "quote",
        text: {
          en: "“Savasana is not the end of the practice. It is the part where the practice finally reaches you.”",
          fa: "«شواسانا پایان تمرین نیست؛ بخشی است که تمرین سرانجام به شما می‌رسد.»",
        },
        source: { en: "— Elena Vance", fa: "— النا ونس" },
      },
      {
        type: "p",
        text: {
          en: "The old texts describe rest as a return to what is always here beneath effort. Try it this week: stay in savasana for a full ten minutes, and notice the voice that insists you have not done enough to deserve it.",
          fa: "متون کهن استراحت را بازگشتی به چیزی توصیف می‌کنند که همیشه زیر تلاش حاضر است. این هفته امتحانش کنید: ده دقیقهٔ کامل در شواسانا بمانید و به صدایی توجه کنید که اصرار دارد هنوز آن‌قدر کار نکرده‌اید که سزاوارش باشید.",
        },
      },
    ],
    practices: ["restorative-twilight-reset"],
  },
  {
    slug: "yoga-nidra-for-insomnia",
    category: "sleep",
    issue: 31,
    tags: [{ en: "Sleep & restorative", fa: "خواب و ترمیم" }],
    author: "kavi",
    publishedAt: "2024-09-19",
    image: "/images/journal/nidra-insomnia.jpg",
    imageAlt: {
      en: "Moonlight falling across teaware and a resting cushion",
      fa: "نور ماه که روی ظرف‌های چای و یک کوسن استراحت افتاده است",
    },
    title: {
      en: "Yoga Nidra for Insomnia: The Science of Conscious Rest",
      fa: "یوگا نیدرا برای بی‌خوابی: علم استراحت آگاهانه",
    },
    excerpt: {
      en: "Slipping past a busy mind to the threshold between waking and sleep — and why lying still on purpose helps you fall asleep later.",
      fa: "گذشتن از ذهن پرمشغله تا آستانهٔ میان بیداری و خواب ـ و اینکه چرا آگاهانه بی‌حرکت دراز کشیدن بعداً به خوابیدن کمک می‌کند.",
    },
    body: [
      {
        type: "p",
        text: {
          en: "Insomnia is rarely a lack of tiredness. It is a mind that keeps checking whether it is safe to let go. Yoga nidra gives that mind a simple task — follow the voice, move attention through the body — so that the rest of you can drift.",
          fa: "بی‌خوابی به‌ندرت از کمبود خستگی است؛ ذهنی است که مدام بررسی می‌کند آیا رها کردن امن است یا نه. یوگا نیدرا به آن ذهن کاری ساده می‌دهد ـ صدا را دنبال کن، توجه را در بدن بگردان ـ تا باقی وجودتان آرام رها شود.",
        },
      },
      {
        type: "h2",
        text: {
          en: "Practice in the evening, not in bed",
          fa: "عصر تمرین کنید، نه در تخت",
        },
      },
      {
        type: "p",
        text: {
          en: "Do your nidra an hour before sleep, on the floor, with a blanket. Keeping the practice separate from the bed builds the skill of resting while awake — which is exactly what the sleepless mind has forgotten.",
          fa: "نیدرا را یک ساعت پیش از خواب، روی زمین و با یک پتو انجام دهید. جدا نگه داشتن تمرین از تخت، مهارت آرام بودن در بیداری را می‌سازد ـ همان چیزی که ذهن بی‌خواب فراموش کرده است.",
        },
      },
    ],
    practices: ["coherent-heart-resonance-nidra"],
  },
  {
    slug: "living-practice-off-the-mat",
    category: "somatic",
    issue: 31,
    tags: [{ en: "Somatic science", fa: "علم سوماتیک" }],
    author: "elena",
    publishedAt: "2024-09-12",
    image: "/images/journal/off-the-mat.jpg",
    imageAlt: {
      en: "Hands resting in chin mudra on a woven wrap",
      fa: "دست‌هایی آرمیده در مودرای چین روی شالی بافته",
    },
    title: {
      en: "Living Practice Off the Mat: Non-Violent Communication Through Somatic Listening",
      fa: "تمرین در زندگی: ارتباط بدون خشونت از راه گوش سپردن به بدن",
    },
    excerpt: {
      en: "Before conflict becomes words, it tightens the jaw, the diaphragm and the psoas. How to read those signals before you react.",
      fa: "پیش از آنکه اختلاف به کلمه تبدیل شود، فک، دیافراگم و پسواس را منقبض می‌کند. چگونه این نشانه‌ها را پیش از واکنش بخوانیم.",
    },
    body: [
      {
        type: "p",
        text: {
          en: "The body always speaks first. Long before a sharp reply leaves your mouth, the breath has shortened and the shoulders have lifted. Somatic listening is the practice of catching that moment.",
          fa: "بدن همیشه نخست سخن می‌گوید. مدت‌ها پیش از آنکه پاسخی تند از دهانتان بیرون بیاید، نفس کوتاه شده و شانه‌ها بالا رفته‌اند. گوش سپردن به بدن، تمرینِ به‌دست آوردن همان لحظه است.",
        },
      },
      {
        type: "p",
        text: {
          en: "Next time a conversation heats up, lengthen one exhale before you answer. Feel your feet. Name one sensation silently — “tight jaw”, “hot face”. That single breath is the mat, carried into the room.",
          fa: "دفعهٔ بعد که گفت‌وگویی داغ شد، پیش از پاسخ دادن یک بازدم را بلند کنید. پاهایتان را حس کنید. یک حس را در دل نام ببرید ـ «فک منقبض»، «صورت داغ». همان یک نفس، مت شماست که به اتاق آورده شده.",
        },
      },
    ],
    practices: ["vagus-nerve-decompression"],
  },
];
