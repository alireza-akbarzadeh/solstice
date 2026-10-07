"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  EyeOffIcon,
  MessageSquareQuoteIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { localize } from "@/lib/localized";

import {
  deleteTestimonialAction,
  reorderTestimonialsAction,
  resetTestimonialsAction,
  toggleTestimonialHiddenAction,
} from "../server/actions";
import type { Testimonial, TestimonialPlacement } from "../types";
import { TestimonialDialog } from "./testimonial-dialog";

export function TestimonialsManager({ initialItems }: { initialItems: Testimonial[] }) {
  const t = useTranslations("Studio.testimonials");
  const locale = useLocale();
  const [items, setItems] = useState<Testimonial[]>(initialItems);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleOpenAdd = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Testimonial) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const next = [...items];
    const current = next[index]!;
    const target = next[targetIndex]!;
    next[index] = target;
    next[targetIndex] = current;

    setItems(next);

    startTransition(async () => {
      const result = await reorderTestimonialsAction(next.map((i) => i.id));
      if (!result.ok) {
        toast.error(t("errors.reorderFailed"));
        setItems(items); // revert
        return;
      }
      setItems(result.testimonials);
    });
  };

  const handleToggleHidden = (id: string, currentlyHidden: boolean) => {
    const nextHidden = !currentlyHidden;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, hidden: nextHidden } : item)));

    startTransition(async () => {
      const result = await toggleTestimonialHiddenAction(id, nextHidden);
      if (!result.ok) {
        toast.error(t("errors.saveFailed"));
        setItems(items); // revert
        return;
      }
      setItems(result.testimonials);
      toast.success(nextHidden ? t("hiddenNotice") : t("visibleNotice"));
    });
  };

  const handleDelete = (item: Testimonial) => {
    const nameStr = localize(item.name, locale);
    if (!window.confirm(t("deleteConfirm", { name: nameStr }))) return;

    startTransition(async () => {
      const result = await deleteTestimonialAction(item.id);
      if (!result.ok) {
        toast.error(t("errors.deleteFailed"));
        return;
      }
      setItems(result.testimonials);
      toast.success(t("deleted"));
    });
  };

  const handleReset = () => {
    if (!window.confirm(t("resetConfirm"))) return;

    startTransition(async () => {
      const result = await resetTestimonialsAction();
      if (!result.ok) {
        toast.error(t("errors.resetFailed"));
        return;
      }
      setItems(result.testimonials);
      toast.success(t("resetSuccess"));
    });
  };

  const placementLabel = (placement: TestimonialPlacement) => {
    switch (placement) {
      case "home":
        return t("placementOptions.home");
      case "membership":
        return t("placementOptions.membership");
      case "all":
      default:
        return t("placementOptions.all");
    }
  };

  return (
    <div className="flex flex-col gap-space-md rounded-xl border border-outline-variant/30 bg-surface-container-low/40 p-space-md">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-space-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquareQuoteIcon className="size-5" />
          </div>
          <div>
            <h3 className="font-label-lg text-label-lg font-semibold text-on-surface">{t("title")}</h3>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{t("description")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
            className="text-on-surface-variant hover:text-on-surface"
            title={t("resetToDefaults")}
          >
            <RotateCcwIcon className="size-3.5" data-icon="inline-start" />
            <span className="hidden sm:inline">{t("resetToDefaults")}</span>
          </Button>

          <Button type="button" size="sm" onClick={handleOpenAdd} disabled={isPending}>
            <PlusIcon className="size-4" data-icon="inline-start" />
            {t("addTestimonial")}
          </Button>
        </div>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/40 p-8 text-center">
          <MessageSquareQuoteIcon className="size-10 text-outline-variant" />
          <p className="mt-3 font-label-md text-label-md font-medium text-on-surface">{t("emptyTitle")}</p>
          <p className="mt-1 max-w-md font-body-sm text-body-sm text-on-surface-variant">{t("empty")}</p>
          <Button type="button" size="sm" onClick={handleOpenAdd} className="mt-4">
            <PlusIcon className="size-4" data-icon="inline-start" />
            {t("addTestimonial")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item, index) => {
            const name = localize(item.name, locale);
            const quote = localize(item.quote, locale);
            const roleOrMeta = localize(item.roleOrMeta, locale);
            const isFirst = index === 0;
            const isLast = index === items.length - 1;

            return (
              <div
                key={item.id}
                className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                  item.hidden
                    ? "border-outline-variant/20 bg-surface/40 opacity-70"
                    : "border-outline-variant/30 bg-surface shadow-xs"
                }`}
              >
                {/* Left: Avatar, Name, Quote */}
                <div className="flex min-w-0 flex-1 items-start gap-3.5">
                  {/* Reorder arrows */}
                  <div className="flex flex-col gap-1 pt-0.5">
                    <button
                      type="button"
                      disabled={isFirst || isPending}
                      onClick={() => handleMove(index, "up")}
                      className="rounded p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent"
                      title={t("actions.moveUp")}
                    >
                      <ArrowUpIcon className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast || isPending}
                      onClick={() => handleMove(index, "down")}
                      className="rounded p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-30 disabled:hover:bg-transparent"
                      title={t("actions.moveDown")}
                    >
                      <ArrowDownIcon className="size-3.5" />
                    </button>
                  </div>

                  {/* Avatar badge */}
                  <span
                    aria-hidden
                    className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold ${item.avatarColor}`}
                  >
                    {name.charAt(0) || "A"}
                  </span>

                  {/* Details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">{name}</span>
                      {roleOrMeta && (
                        <span className="font-body-sm text-body-sm text-on-surface-variant">• {roleOrMeta}</span>
                      )}
                      <div className="flex gap-0.5 text-clay">
                        {Array.from({ length: item.rating }, (_, i) => (
                          <StarIcon key={i} className="size-3 fill-current" />
                        ))}
                      </div>
                    </div>

                    <p className="line-clamp-2 font-body-sm text-body-sm italic text-on-surface/90 rtl:not-italic">
                      {quote}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {placementLabel(item.showOn)}
                      </Badge>
                      {item.hidden && (
                        <Badge variant="secondary" className="text-[11px] font-normal text-on-surface-variant">
                          <EyeOffIcon className="size-3" data-icon="inline-start" />
                          {t("visibility.hidden")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-2 border-t border-outline-variant/15 pt-2 sm:border-t-0 sm:pt-0">
                  <div className="flex items-center gap-1.5 pe-2">
                    <Switch
                      checked={!item.hidden}
                      onCheckedChange={() => handleToggleHidden(item.id, item.hidden)}
                      disabled={isPending}
                      title={item.hidden ? t("visibility.hidden") : t("visibility.visible")}
                    />
                    <span className="text-xs text-on-surface-variant">
                      {!item.hidden ? (
                        <EyeIcon className="size-3.5 text-primary" />
                      ) : (
                        <EyeOffIcon className="size-3.5 text-outline" />
                      )}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    disabled={isPending}
                  >
                    <PencilIcon className="size-3.5" data-icon="inline-start" />
                    {t("actions.edit")}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item)}
                    disabled={isPending}
                    className="text-error hover:bg-error-container/30 hover:text-error"
                  >
                    <Trash2Icon className="size-3.5" />
                    <span className="sr-only">{t("actions.delete")}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Dialog */}
      <TestimonialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        testimonial={editingItem}
        onSaved={(updated) => setItems(updated)}
      />
    </div>
  );
}
