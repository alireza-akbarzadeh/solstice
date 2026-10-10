import type {
  CopyRecord,
  CopyTree,
  PageContent,
  PageDefinition,
} from "./types";
import type { WorkshopEventDetails } from "@/modules/workshops/types";

export const pageDefinitions: PageDefinition[] = [
  {
    slug: "about",
    path: "/about",
    title: { en: "About", fa: "دربارهٔ ما" },
    namespaces: ["About"],
    assets: {
      portrait: "/images/brand/elena-portrait.jpg",
      hall: "/images/about/hall.jpg",
      linen: "/images/about/linen.jpg",
      tea: "/images/about/tea.jpg",
    },
  },
  {
    slug: "home",
    path: "/",
    title: { en: "Home", fa: "صفحهٔ اصلی" },
    namespaces: ["Home"],
    assets: {
      hero: "/images/home/04.jpg",
      portrait: "/images/brand/elena-portrait.jpg",
    },
  },
  {
    slug: "membership",
    path: "/membership",
    title: { en: "Membership", fa: "عضویت" },
    namespaces: ["Membership"],
    assets: {},
  },
  {
    slug: "practices",
    path: "/practices",
    title: { en: "Practice library & player", fa: "کتابخانه و پخش تمرین" },
    namespaces: ["Practices", "Practice", "PracticeDetail", "PracticeActions"],
    assets: {},
    manage: "/instructor/videos",
  },
  {
    slug: "programs",
    path: "/programs",
    title: { en: "Programs & journeys", fa: "برنامه‌ها و مسیرها" },
    namespaces: ["Programs", "Program"],
    assets: {},
    manage: "/instructor/programs",
  },
  {
    slug: "journal",
    path: "/journal",
    title: { en: "Journal & essay reader", fa: "مجله و خواندن مقاله" },
    namespaces: ["Journal"],
    assets: {},
    manage: "/instructor/journal",
  },
  {
    slug: "privacy",
    path: "/privacy",
    title: { en: "Privacy policy", fa: "حریم خصوصی" },
    namespaces: ["Legal.privacy"],
    assets: {},
  },
  {
    slug: "terms",
    path: "/terms",
    title: { en: "Terms of practice", fa: "شرایط استفاده" },
    namespaces: ["Legal.terms"],
    assets: {},
  },
  {
    slug: "ethics",
    path: "/ethics",
    title: { en: "Ethics & lineage", fa: "اخلاق و ریشه‌ها" },
    namespaces: ["Legal.ethics"],
    assets: {},
  },
  {
    slug: "dashboard",
    path: "/dashboard",
    title: { en: "Member dashboard", fa: "داشبورد اعضا" },
    namespaces: ["Dashboard"],
    assets: {},
  },
  {
    slug: "my-practices",
    path: "/my-practices",
    title: { en: "Saved practices", fa: "تمرین‌های ذخیره‌شده" },
    namespaces: ["MyPractices"],
    assets: {},
  },
  {
    slug: "progress",
    path: "/progress",
    title: { en: "Member progress", fa: "پیشرفت اعضا" },
    namespaces: ["Progress"],
    assets: {},
  },
  {
    slug: "profile",
    path: "/profile",
    title: { en: "Profile & account", fa: "پروفایل و حساب" },
    namespaces: ["Profile", "Account"],
    assets: {},
  },
  {
    slug: "community",
    path: "/community",
    title: { en: "Community & reflections", fa: "انجمن و گفت‌وگوها" },
    namespaces: ["Community", "Reflections"],
    assets: {},
  },
  {
    slug: "account-access",
    path: "/sign-in",
    title: {
      en: "Sign-in, registration & recovery",
      fa: "ورود، ثبت‌نام و بازیابی",
    },
    namespaces: ["Auth"],
    assets: {},
  },
  {
    slug: "site-settings",
    path: "/",
    title: { en: "Brand, navigation & footer", fa: "برند، منو و پاورقی" },
    namespaces: [
      "Brand",
      "Metadata",
      "Nav",
      "Footer",
      "Newsletter",
      "Legal.updated",
      "Legal.updatedDate",
      "NotFound",
      "Offline",
      "Notifications",
      "Pwa",
      "LocaleSwitcher",
    ],
    assets: {},
    settings: "/instructor/settings",
  },
];

export function pageDefinition(slug: string) {
  return pageDefinitions.find((definition) => definition.slug === slug);
}

const reserved = new Set([
  ...pageDefinitions.map((d) => d.slug),
  "api",
  "instructor",
  "fa",
  "en",
  "sign-in",
  "sign-up",
  "forgot-password",
  "reset-password",
  "verify-email",
  "checkout",
  "test",
  "offline",
  "images",
  "icons",
  "_next",
  "favicon",
  "robots",
  "sitemap",
  "manifest",
]);
export function isCustomPageSlug(slug: string) {
  return (
    /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug) &&
    slug.length <= 80 &&
    !reserved.has(slug)
  );
}

export function readCopyPath(
  copy: CopyRecord,
  path: string,
): CopyTree | undefined {
  let value: CopyTree | undefined = copy;
  for (const part of path.split(".")) {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return undefined;
    value = value[part];
  }
  return value;
}

export function applyCopyPath(copy: CopyRecord, path: string, value: CopyTree) {
  const parts = path.split(".");
  let node = copy;
  for (const part of parts.slice(0, -1)) {
    const child = node[part];
    if (!child || typeof child !== "object" || Array.isArray(child))
      node[part] = {};
    node = node[part] as CopyRecord;
  }
  node[parts.at(-1)!] = structuredClone(value);
}

export function blankWorkshopEvent(): WorkshopEventDetails {
  const empty = () => ({ en: "", fa: "" });
  return {
    enabled: false,
    startDate: "",
    endDate: "",
    timezone: "Asia/Tehran",
    locationType: "in_person",
    location: empty(),
    capacity: null,
    priceLabel: empty(),
    paymentInstructions: empty(),
    registrationOpen: true,
  };
}

export function blankPageContent(): PageContent {
  const empty = () => ({ en: "", fa: "" });
  return {
    title: empty(),
    description: empty(),
    seoTitle: empty(),
    image: "",
    imageAlt: empty(),
    videoUrl: "",
    actionLabel: empty(),
    actionHref: "",
    showInFooter: false,
    showInNavigation: false,
    body: [],
    copy: { en: {}, fa: {} },
    assets: {},
    event: blankWorkshopEvent(),
  };
}

export function defaultPageContent(
  definition: PageDefinition,
  messages: { en: CopyRecord; fa: CopyRecord },
): PageContent {
  const content = blankPageContent();
  content.title = { ...definition.title };
  content.assets = { ...definition.assets };
  for (const locale of ["en", "fa"] as const)
    for (const namespace of definition.namespaces) {
      const value = readCopyPath(messages[locale], namespace);
      if (value === undefined)
        throw new Error(`Missing page content: ${namespace}`);
      content.copy[locale][namespace] = structuredClone(value);
    }
  return content;
}

/** Preserve new default fields when previously saved website copy predates a code update. */
export function mergeCopyTree(
  base: CopyTree | undefined,
  saved: CopyTree,
): CopyTree {
  if (
    !base ||
    typeof base !== "object" ||
    Array.isArray(base) ||
    typeof saved !== "object" ||
    Array.isArray(saved)
  )
    return structuredClone(saved);
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(saved))
    result[key] = mergeCopyTree(result[key], value);
  return result;
}

/** Only registered page namespaces can override the application's translations. */
export function mergePublishedCopy(
  base: CopyRecord,
  locale: "en" | "fa",
  pages: { slug: string; publishedContent: PageContent | null }[],
) {
  const result = structuredClone(base);
  for (const page of pages) {
    const definition = pageDefinition(page.slug);
    if (!definition || !page.publishedContent) continue;
    for (const namespace of definition.namespaces) {
      const value = page.publishedContent.copy[locale][namespace];
      if (value !== undefined)
        applyCopyPath(
          result,
          namespace,
          mergeCopyTree(readCopyPath(result, namespace), value),
        );
    }
  }
  return result;
}
