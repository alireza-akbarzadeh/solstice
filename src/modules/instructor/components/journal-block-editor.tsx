"use client";

import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { journalBlockTypes, type JournalBlockType, type JournalStoredBlock } from "@/modules/journal/types";

import { emptyLocalized, LocalizedField } from "./localized-field";

/** A new block of each kind, so adding one never starts from an invalid shape. */
function blankBlock(type: JournalBlockType): JournalStoredBlock {
  switch (type) {
    case "p":
      return { type: "p", text: { ...emptyLocalized } };
    case "h2":
      return { type: "h2", text: { ...emptyLocalized } };
    case "quote":
      return { type: "quote", text: { ...emptyLocalized }, source: { ...emptyLocalized } };
    case "figure":
      return { type: "figure", image: "", alt: { ...emptyLocalized }, caption: { ...emptyLocalized } };
    case "steps":
      return { type: "steps", title: { ...emptyLocalized }, intro: { ...emptyLocalized }, items: [] };
  }
}

/**
 * The essay body, as the list of blocks the reader's page renders. Deliberately not a rich-text
 * box: the public page draws each kind of block itself, so the studio edits those same kinds
 * rather than producing HTML nobody can style consistently.
 */
export function JournalBlockEditor({
  body,
  onChange,
  disabled = false,
}: {
  body: JournalStoredBlock[];
  onChange: (next: JournalStoredBlock[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("Studio.journal.editor.blocks");

  const update = (index: number, block: JournalStoredBlock) => onChange(body.map((b, i) => (i === index ? block : b)));
  const remove = (index: number) => onChange(body.filter((_, i) => i !== index));
  const move = (index: number, by: number) => {
    const target = index + by;
    if (target < 0 || target >= body.length) return;
    const next = [...body];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div>
          <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("eyebrow")}</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{t("title")}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("hint")}</p>
        </div>
        <Badge variant="outline">{t("count", { count: body.length })}</Badge>
      </div>

      {body.map((block, index) => (
        <section key={index} className="flex flex-col gap-space-sm rounded-xl bg-surface p-space-md shadow-sm">
          <header className="flex items-center justify-between gap-2">
            <Badge variant="secondary">{t(`types.${block.type}`)}</Badge>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={disabled || index === 0}
                onClick={() => move(index, -1)}
                aria-label={t("moveUp")}
              >
                <ChevronUpIcon />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={disabled || index === body.length - 1}
                onClick={() => move(index, 1)}
                aria-label={t("moveDown")}
              >
                <ChevronDownIcon />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={disabled}
                onClick={() => remove(index)}
                aria-label={t("remove")}
                className="text-destructive"
              >
                <Trash2Icon />
              </Button>
            </div>
          </header>

          {block.type === "p" && (
            <LocalizedField label={t("fields.text")} value={block.text} onChange={(text) => update(index, { ...block, text })} multiline rows={5} disabled={disabled} />
          )}

          {block.type === "h2" && (
            <LocalizedField label={t("fields.heading")} value={block.text} onChange={(text) => update(index, { ...block, text })} disabled={disabled} />
          )}

          {block.type === "quote" && (
            <>
              <LocalizedField label={t("fields.quote")} value={block.text} onChange={(text) => update(index, { ...block, text })} multiline disabled={disabled} />
              <LocalizedField label={t("fields.source")} value={block.source} onChange={(source) => update(index, { ...block, source })} disabled={disabled} />
            </>
          )}

          {block.type === "figure" && (
            <>
              <Field>
                <FieldLabel>{t("fields.image")}</FieldLabel>
                <Input
                  dir="ltr"
                  value={block.image}
                  disabled={disabled}
                  placeholder="/images/journal/… or https://…"
                  onChange={(e) => update(index, { ...block, image: e.target.value })}
                />
                <FieldDescription>{t("fields.imageHint")}</FieldDescription>
              </Field>
              <LocalizedField label={t("fields.alt")} value={block.alt} onChange={(alt) => update(index, { ...block, alt })} disabled={disabled} />
              <LocalizedField label={t("fields.caption")} value={block.caption} onChange={(caption) => update(index, { ...block, caption })} disabled={disabled} />
            </>
          )}

          {block.type === "steps" && (
            <>
              <LocalizedField label={t("fields.stepsTitle")} value={block.title} onChange={(title) => update(index, { ...block, title })} disabled={disabled} />
              <LocalizedField label={t("fields.stepsIntro")} value={block.intro} onChange={(intro) => update(index, { ...block, intro })} multiline disabled={disabled} />

              <div className="flex flex-col gap-space-sm">
                {block.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex flex-col gap-space-sm rounded-lg bg-surface-container-low p-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-clay uppercase">{t("step", { n: itemIndex + 1 })}</span>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        disabled={disabled}
                        aria-label={t("removeStep")}
                        onClick={() => update(index, { ...block, items: block.items.filter((_, i) => i !== itemIndex) })}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                    <LocalizedField
                      label={t("fields.stepTitle")}
                      value={item.title}
                      disabled={disabled}
                      onChange={(title) =>
                        update(index, { ...block, items: block.items.map((it, i) => (i === itemIndex ? { ...it, title } : it)) })
                      }
                    />
                    <LocalizedField
                      label={t("fields.stepBody")}
                      value={item.body}
                      multiline
                      disabled={disabled}
                      onChange={(body2) =>
                        update(index, { ...block, items: block.items.map((it, i) => (i === itemIndex ? { ...it, body: body2 } : it)) })
                      }
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  className="self-start"
                  onClick={() => update(index, { ...block, items: [...block.items, { title: { ...emptyLocalized }, body: { ...emptyLocalized } }] })}
                >
                  <PlusIcon data-icon="inline-start" />
                  {t("addStep")}
                </Button>
              </div>
            </>
          )}
        </section>
      ))}

      <div className="flex flex-wrap items-end gap-space-sm rounded-xl border border-dashed border-outline-variant p-space-md">
        <div className="min-w-48 flex-1">
          <ResponsiveSelect
            label={t("addLabel")}
            value=""
            disabled={disabled}
            placeholder={t("addPlaceholder")}
            onValueChange={(type) => onChange([...body, blankBlock(type as JournalBlockType)])}
            options={journalBlockTypes.map((type) => ({ value: type, label: t(`types.${type}`), description: t(`descriptions.${type}`) }))}
          />
        </div>
      </div>
    </div>
  );
}
