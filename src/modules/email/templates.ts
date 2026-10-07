export type EmailTemplateKey = "verify" | "reset" | "welcome";

export const EMAIL_TEMPLATE_KEYS: readonly EmailTemplateKey[] = ["verify", "reset", "welcome"] as const;

export type LocalizedEmailTemplate = {
  subject: string;
  body: string;
};

export type EmailTemplateEntry = {
  en: LocalizedEmailTemplate;
  fa: LocalizedEmailTemplate;
};

export type AllEmailTemplates = Record<EmailTemplateKey, EmailTemplateEntry>;

export type EmailTemplateMeta = {
  key: EmailTemplateKey;
  allowedVariables: readonly string[];
  requiredVariables: readonly string[];
};

export const EMAIL_TEMPLATE_METAS: Record<EmailTemplateKey, EmailTemplateMeta> = {
  verify: {
    key: "verify",
    allowedVariables: ["{name}", "{url}"],
    requiredVariables: ["{url}"],
  },
  reset: {
    key: "reset",
    allowedVariables: ["{name}", "{url}"],
    requiredVariables: ["{url}"],
  },
  welcome: {
    key: "welcome",
    allowedVariables: ["{name}", "{url}"],
    requiredVariables: [],
  },
};

export const DEFAULT_EMAIL_TEMPLATES: AllEmailTemplates = {
  verify: {
    en: {
      subject: "Confirm your email for Arte",
      body: "Hello {name},\n\nWelcome to the sanctuary. Please confirm your email address:\n\n{url}\n\n— Elena & Arte Yoga Studio",
    },
    fa: {
      subject: "تأیید ایمیل شما در آرته",
      body: "سلام {name}،\n\nبه پناهگاه خوش آمدید. لطفاً نشانی ایمیل خود را تأیید کنید:\n\n{url}\n\n— النا و استودیو یوگای آرته",
    },
  },
  reset: {
    en: {
      subject: "Reset your Arte password",
      body: "Hello {name},\n\nSomeone asked to reset the password for your Arte account. If it was you, choose a new one here (the link works for one hour):\n\n{url}\n\nIf it wasn’t you, you can ignore this email.\n\n— Arte Yoga Studio",
    },
    fa: {
      subject: "بازنشانی رمز عبور آرته",
      body: "سلام {name}،\n\nدرخواستی برای بازنشانی رمز عبور حساب آرته شما رسیده است. اگر خودتان بودید، رمز تازه را اینجا انتخاب کنید (این پیوند یک ساعت اعتبار دارد):\n\n{url}\n\nاگر شما نبودید، این ایمیل را نادیده بگیرید.\n\n— استودیو یوگای آرته",
    },
  },
  welcome: {
    en: {
      subject: "Welcome to Arte Yoga Studio",
      body: "Hello {name},\n\nWe are so glad to welcome you into the sanctuary. May your practice bring presence, strength, and ease to your everyday rhythm.\n\nBegin exploring practices and programs anytime:\n{url}\n\nWith warmth,\nElena & Arte Yoga Studio",
    },
    fa: {
      subject: "به استودیو یوگای آرته خوش آمدید",
      body: "سلام {name}،\n\nاز پیوستن شما به این پناهگاه آرامش و آگاهی بسیار خوشحالیم. امیدواریم هر لحظه از تمرین، حضوری آرام و نیروبخش به روزهایتان ببخشد.\n\nبرای آغاز و کاوش در تمرین‌ها و دوره‌ها:\n{url}\n\nبا مهر،\nالنا و استودیو یوگای آرته",
    },
  },
};

/** Interpolates variables into an email subject or body text safely. */
export function interpolateEmailText(text: string, variables: Record<string, string | undefined>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const token = key.startsWith("{") ? key : `{${key}}`;
    result = result.replaceAll(token, value ?? "");
  }
  return result;
}
