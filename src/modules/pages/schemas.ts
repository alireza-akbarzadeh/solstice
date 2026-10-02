import { z } from "zod";
import { parseYouTubeId } from "@/infrastructure/video/assets";
import type { CopyTree, PageContent } from "./types";

const text = (max: number) =>
  z.object({ en: z.string().trim().max(max), fa: z.string().trim().max(max) });
export function safeImage(value: string) {
  if (
    value.startsWith("/images/") &&
    !value.includes("..") &&
    !value.includes("\\")
  )
    return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function safePageLink(value: string) {
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\s]/.test(value) &&
    !value.includes("..")
  )
    return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
const optionalImage = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => !value || safeImage(value));
const bodyBlock = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text: text(12000) }),
  z.object({ type: z.literal("h2"), text: text(300) }),
  z.object({ type: z.literal("quote"), text: text(4000), source: text(300) }),
  z.object({
    type: z.literal("figure"),
    image: optionalImage,
    alt: text(300),
    caption: text(1000),
  }),
  z.object({
    type: z.literal("steps"),
    title: text(300),
    intro: text(2000),
    items: z.array(z.object({ title: text(300), body: text(6000) })).max(30),
  }),
]);
const copyTree: z.ZodType<CopyTree> = z.lazy(() =>
  z.union([
    z.string().max(20000),
    z.array(copyTree).max(100),
    z.record(
      z
        .string()
        .refine(
          (key) => !["__proto__", "prototype", "constructor"].includes(key),
        ),
      copyTree,
    ),
  ]),
);
export const pageContentSchema = z.object({
  title: text(200).refine((value) => !!value.en && !!value.fa),
  description: text(1600),
  seoTitle: text(200),
  image: optionalImage,
  imageAlt: text(300),
  videoUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((value) => !value || !!parseYouTubeId(value)),
  actionLabel: text(200),
  actionHref: z
    .string()
    .trim()
    .max(2000)
    .refine((value) => !value || safePageLink(value)),
  showInFooter: z.boolean(),
  showInNavigation: z.boolean().default(false),
  body: z.array(bodyBlock).max(100),
  copy: z.object({
    en: z.record(z.string(), copyTree),
    fa: z.record(z.string(), copyTree),
  }),
  assets: z.record(z.string(), z.string().trim().max(2000)),
});

/** Preserve complete ICU expressions and rich-text tags, including nested plurals. */
export function protectedMessageParts(text: string): string[] | null {
  const parts: string[] = [];
  let start = -1,
    depth = 0;
  for (let index = 0; index < text.length; index++) {
    if (text[index] === "{") {
      if (depth === 0) start = index;
      depth++;
    }
    if (text[index] === "}") {
      if (depth === 0) return null;
      depth--;
      if (depth === 0) parts.push(text.slice(start, index + 1));
    }
  }
  if (depth) return null;
  parts.push(...(text.match(/<\/?[a-zA-Z][^>]*>/g) ?? []));
  return parts.sort();
}

export function compatibleCopy(value: CopyTree, template: CopyTree): boolean {
  if (typeof template === "string") {
    if (typeof value !== "string") return false;
    const parts = protectedMessageParts(value);
    return (
      parts !== null &&
      JSON.stringify(parts) === JSON.stringify(protectedMessageParts(template))
    );
  }
  if (Array.isArray(template))
    return (
      Array.isArray(value) &&
      value.every((item) =>
        template.some((example) => compatibleCopy(item, example)),
      )
    );
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(template).sort();
  return (
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify(keys) &&
    keys.every((key) => compatibleCopy(value[key]!, template[key]!))
  );
}

/** Repeatable content stays paired across languages, even when submitted outside the editor. */
export function pairedCopyShape(en: CopyTree, fa: CopyTree): boolean {
  if (typeof en === "string") return typeof fa === "string";
  if (Array.isArray(en))
    return (
      Array.isArray(fa) &&
      en.length === fa.length &&
      en.every((item, index) => pairedCopyShape(item, fa[index]!))
    );
  if (!fa || typeof fa !== "object" || Array.isArray(fa)) return false;
  return (
    JSON.stringify(Object.keys(en).sort()) ===
      JSON.stringify(Object.keys(fa).sort()) &&
    Object.keys(en).every((key) => pairedCopyShape(en[key]!, fa[key]!))
  );
}

export function validBuiltinContent(
  content: PageContent,
  template: PageContent,
) {
  if (
    content.body.length ||
    content.videoUrl ||
    content.actionHref ||
    content.image ||
    content.showInFooter ||
    content.showInNavigation
  )
    return false;
  if (!pairedCopyShape(content.copy.en, content.copy.fa)) return false;
  if (
    !compatibleCopy(content.copy.en, template.copy.en) ||
    !compatibleCopy(content.copy.fa, template.copy.fa)
  )
    return false;
  if (
    JSON.stringify(Object.keys(content.assets).sort()) !==
    JSON.stringify(Object.keys(template.assets).sort())
  )
    return false;
  return Object.values(content.assets).every((value) => safeImage(value));
}

export function validCustomContent(content: PageContent, publishing: boolean) {
  if (
    Object.keys(content.copy.en).length ||
    Object.keys(content.copy.fa).length ||
    Object.keys(content.assets).length
  )
    return false;
  if (!publishing) return true;
  const filled = (value: { en: string; fa: string }) =>
    !!value.en.trim() && !!value.fa.trim();
  if (
    !filled(content.description) ||
    !content.body.length ||
    (content.image && !filled(content.imageAlt)) ||
    (content.actionHref && !filled(content.actionLabel))
  )
    return false;
  return content.body.every((block) => {
    switch (block.type) {
      case "p":
      case "h2":
      case "quote":
        return filled(block.text);
      case "figure":
        return !!block.image && safeImage(block.image) && filled(block.alt);
      case "steps":
        return (
          filled(block.title) &&
          block.items.length > 0 &&
          block.items.every((item) => filled(item.title) && filled(item.body))
        );
    }
  });
}
