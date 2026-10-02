import en from "../../../messages/en.json" with { type: "json" };
import fa from "../../../messages/fa.json" with { type: "json" };
import { defaultPageContent, pageDefinition } from "./definitions";
import type { CopyRecord } from "./types";

export function defaultContentFor(slug: string) {
  const definition = pageDefinition(slug);
  return definition
    ? defaultPageContent(definition, {
        en: en as CopyRecord,
        fa: fa as CopyRecord,
      })
    : null;
}
