import { create } from "zustand";
import type { BreathPhase, InquiryItem, IntentionItem, SanctuaryTab } from "./types";

interface SanctuaryState {
  // Audio & mixer
  isMuted: boolean;
  voicePercent: number;

  // Tabs
  activeTab: SanctuaryTab;

  // Pranayama breath cycle
  breathPhase: BreathPhase;
  breathSeconds: number;
  sharedBreaths: number;
  exhalePulse: boolean;

  // Intentions
  intentions: IntentionItem[];
  userHearts: Record<number, boolean>;
  newIntentionText: string;

  // Inquiries Q&A
  questions: InquiryItem[];

  // Actions
  toggleMute: () => void;
  setVoicePercent: (percent: number) => void;
  setActiveTab: (tab: SanctuaryTab) => void;
  tickBreath: () => void;
  triggerExhale: () => void;
  setNewIntentionText: (text: string) => void;
  addIntention: (author: string, location: string) => void;
  toggleHeart: (id: number) => void;
  upvoteInquiry: (id: number) => void;
  initLocale: (locale: string) => void;
}

const NEXT_PHASE: Record<BreathPhase, BreathPhase> = {
  inhale: "retain",
  retain: "exhale",
  exhale: "empty",
  empty: "inhale",
};

export const useSanctuaryStore = create<SanctuaryState>((set, get) => ({
  isMuted: false,
  voicePercent: 70,

  activeTab: "intentions",

  breathPhase: "inhale",
  breathSeconds: 4,
  sharedBreaths: 1842,
  exhalePulse: false,

  intentions: [],
  userHearts: {},
  newIntentionText: "",

  questions: [],

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  setVoicePercent: (percent) => set({ voicePercent: percent }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  tickBreath: () => {
    const { breathSeconds, breathPhase } = get();
    if (breathSeconds <= 1) {
      set({
        breathPhase: NEXT_PHASE[breathPhase],
        breathSeconds: 4,
      });
    } else {
      set({ breathSeconds: breathSeconds - 1 });
    }
  },

  triggerExhale: () => {
    set((state) => ({
      sharedBreaths: state.sharedBreaths + 1,
      exhalePulse: true,
    }));
    setTimeout(() => {
      set({ exhalePulse: false });
    }, 800);
  },

  setNewIntentionText: (text) => set({ newIntentionText: text }),

  addIntention: (author, location) => {
    const { newIntentionText, intentions } = get();
    const trimmed = newIntentionText.trim();
    if (!trimmed) return;

    const newItem: IntentionItem = {
      id: Date.now(),
      author,
      location,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      body: trimmed,
      hearts: 1,
      isPin: false,
    };

    set({
      intentions: [...intentions, newItem],
      newIntentionText: "",
    });
  },

  toggleHeart: (id) => {
    set((state) => {
      const isHearted = Boolean(state.userHearts[id]);
      const nextHearts = { ...state.userHearts, [id]: !isHearted };
      const updatedIntentions = state.intentions.map((item) =>
        item.id === id
          ? { ...item, hearts: item.hearts + (isHearted ? -1 : 1) }
          : item,
      );
      return {
        userHearts: nextHearts,
        intentions: updatedIntentions,
      };
    });
  },

  upvoteInquiry: (id) => {
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, votes: q.votes + 1 } : q,
      ),
    }));
  },

  initLocale: (locale) => {
    // Only initialize if empty to prevent wiping state on re-render
    if (get().intentions.length > 0) return;

    const initialIntentions: IntentionItem[] = [
      {
        id: 1,
        author: "Leonie",
        location: "Kyoto",
        time: "10:14",
        body:
          locale === "fa"
            ? "تعظیم عمیق در برابر مقدمه آرام‌بخش النا. احساس رهایی آنی در ناحیه مهره‌های کمری."
            : "Bowing deeply to Elena’s opening invocation on the kidneys. Feeling an immediate release across my lumbar spine.",
        hearts: 14,
        isPin: false,
      },
      {
        id: 2,
        author: "Raul",
        location: "Madrid",
        time: "10:19",
        body:
          locale === "fa"
            ? "روشن کردن عود سدر سفید همراه با جمع. سپاس برای این تالار مشترک در سراسر قاره‌ها."
            : "Lighting white cedar incense with the group. Autumn equinox gratitude for this shared sanctuary across continents.",
        hearts: 29,
        isPin: false,
      },
      {
        id: 3,
        author: locale === "fa" ? "میزبان تالار" : "Sanctuary Host",
        location: "Elena Vance",
        time: "10:22",
        body:
          locale === "fa"
            ? "«النا از تمام همراهان دعوت می‌کند پیش از ورود به خم‌های جانبی نشسته، فک و شقیقه‌ها را رها سازند.»"
            : "“Elena invites all practitioners to soften the jaw before we transition into the seated lateral arches.”",
        hearts: 42,
        isPin: true,
      },
    ];

    const initialQuestions: InquiryItem[] = [
      {
        id: 1,
        author: "Talia H. · Copenhagen",
        body:
          locale === "fa"
            ? "آیا می‌توان برای حمایت از دیسک L4-L5 در طول بازدم از آجر چوب‌پنبه‌ای استفاده کرد؟"
            : "Can cork blocks be placed beneath the sacrum to offload shear force on L4-L5 during seated transitions?",
        votes: 18,
      },
      {
        id: 2,
        author: "Darius M. · Zurich",
        body:
          locale === "fa"
            ? "هنگام دم ۴ ثانیه‌ای، تمرکز دیافراگم روی پهلوها باشد یا کف لگن؟"
            : "During the 4s inhale cadence, should ribcage expansion precede pelvic floor down-regulation?",
        votes: 12,
      },
    ];

    set({
      intentions: initialIntentions,
      questions: initialQuestions,
    });
  },
}));
