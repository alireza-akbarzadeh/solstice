import en from "../../../messages/en.json" with { type: "json" };
import fa from "../../../messages/fa.json" with { type: "json" };
import { defaultPageContent, pageDefinition } from "./definitions";
import type { CopyRecord, CopyTree, PageContent } from "./types";
import { compatibleCopy } from "./schemas";

export function defaultMessages(locale: "en" | "fa"): CopyRecord {
  return (locale === "fa" ? fa : en) as CopyRecord;
}

export function defaultContentFor(slug: string) {
  const definition = pageDefinition(slug);
  return definition
    ? defaultPageContent(definition, {
        en: en as CopyRecord,
        fa: fa as CopyRecord,
      })
    : null;
}

function editableTree(
  template: CopyTree,
  saved: CopyTree | undefined,
): CopyTree {
  if (typeof template === "string")
    return typeof saved === "string" ? saved : template;
  if (Array.isArray(template)) {
    if (!Array.isArray(saved) || !template.length)
      return structuredClone(template);
    return saved.map((value, index) =>
      editableTree(
        template.find((example) => compatibleCopy(value, example)) ??
          template[index] ??
          template[0]!,
        value,
      ),
    );
  }
  const previous =
    saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  return Object.fromEntries(
    Object.entries(template).map(([key, value]) => [
      key,
      editableTree(value, previous[key]),
    ]),
  );
}

/** Existing saved pages inherit newly introduced fields without losing instructor copy. */
export function editableContentFor(
  slug: string,
  saved: PageContent,
): PageContent {
  const template = defaultContentFor(slug);
  if (!template) return saved;
  return {
    ...template,
    ...saved,
    copy: {
      en: editableTree(template.copy.en, saved.copy.en) as CopyRecord,
      fa: editableTree(template.copy.fa, saved.copy.fa) as CopyRecord,
    },
    // Only the template's keys, so assets a template retired (the old social links) drop out.
    assets: Object.fromEntries(
      Object.entries(template.assets).map(([key, value]) => [
        key,
        saved.assets[key] ?? value,
      ]),
    ),
  };
}
