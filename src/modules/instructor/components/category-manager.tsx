"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownIcon, ArrowUpIcon, EllipsisIcon, EyeIcon, EyeOffIcon, PencilIcon, SaveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { categoryFormSchema, type CategoryFormValues } from "@/modules/categories/schemas";
import type { Category, CategoryKind } from "@/modules/categories/types";
import { newCategory, removeCategory, reorderCategory, saveCategory, type CategoryResult } from "@/modules/instructor/category-actions";

import { DeleteContentButton } from "./delete-content-button";
import { LocalizedField } from "./localized-field";

export type CategoryItem = Category & { label: string; uses: number };

const base = (kind: CategoryKind) => `/instructor/categories?kind=${kind}`;

/** One kind's categories in display order, with quick reorder and show/hide. */
export function CategoryList({ kind, items, editing }: { kind: CategoryKind; items: CategoryItem[]; editing: string | null }) {
  const t = useTranslations("Studio.categories");
  const router = useRouter();
  const [pending, start] = useTransition();

  const act = (work: () => Promise<CategoryResult>, success: string) =>
    start(async () => {
      const result = await work();
      if (result.ok) toast.success(success);
      else toast.error(t(`errors.${result.error}`));
    });

  return (
    <ul className="flex flex-col gap-space-xs">
      {items.map((item, index) => (
        <li
          key={item.slug}
          className={cn(
            "flex items-center gap-space-sm rounded-xl bg-surface-container-low p-space-sm shadow-sm",
            editing === item.slug && "ring-2 ring-primary",
            !item.visible && "opacity-75",
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-label-lg text-label-lg text-on-surface" dir="auto">
                {item.label}
              </span>
              {!item.visible && <Badge variant="secondary">{t("hidden")}</Badge>}
            </div>
            <p className="font-label-sm text-label-sm text-outline">
              <span dir="ltr">{item.slug}</span> · {t("uses", { count: item.uses })}
            </p>
          </div>
          <Button size="sm" variant={editing === item.slug ? "default" : "outline"} onClick={() => router.push(`${base(kind)}&edit=${encodeURIComponent(item.slug)}`)}>
            <PencilIcon data-icon="inline-start" />
            {t("edit")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label={t("more", { name: item.label })}>
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem disabled={pending || index === 0} onSelect={() => act(() => reorderCategory({ kind, slug: item.slug, direction: -1 }), t("moved"))}>
                  <ArrowUpIcon />
                  {t("moveUp")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={pending || index === items.length - 1}
                  onSelect={() => act(() => reorderCategory({ kind, slug: item.slug, direction: 1 }), t("moved"))}
                >
                  <ArrowDownIcon />
                  {t("moveDown")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={pending}
                  onSelect={() =>
                    act(
                      () => saveCategory({ kind, slug: item.slug, name: item.name, visible: !item.visible }),
                      t(item.visible ? "hiddenNow" : "shownNow", { name: item.label }),
                    )
                  }
                >
                  {item.visible ? <EyeOffIcon /> : <EyeIcon />}
                  {t(item.visible ? "hide" : "show")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      ))}
    </ul>
  );
}

const slugFrom = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** Creates or edits a category. The slug (the URL filter value) is fixed once created. */
export function CategoryEditor({ kind, category, uses }: { kind: CategoryKind; category: Category | null; uses: number }) {
  const t = useTranslations("Studio.categories");
  const router = useRouter();
  const isNew = category === null;
  const [customSlug, setCustomSlug] = useState(!isNew);
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { slug: category?.slug ?? "", name: category?.name ?? { en: "", fa: "" }, visible: category?.visible ?? true },
  });
  const saving = form.formState.isSubmitting;

  const fail = (result: CategoryResult) => {
    if (!result.ok) toast.error(t(`errors.${result.error}`));
  };
  const onSubmit = form.handleSubmit(async (values) => {
    const result = isNew ? await newCategory({ kind, ...values }) : await saveCategory({ kind, slug: category.slug, name: values.name, visible: values.visible });
    if (!result.ok) return fail(result);
    toast.success(t(isNew ? "created" : "saved"));
    if (isNew) router.replace(`${base(kind)}&edit=${encodeURIComponent(result.slug)}`);
    else form.reset(values);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-space-lg rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
      <div className="flex flex-wrap items-start justify-between gap-space-md">
        <div>
          <h2 className="font-headline-sm text-headline-sm">{t(isNew ? "editor.newTitle" : "editor.title")}</h2>
          {!isNew && <p className="font-body-sm text-body-sm text-on-surface-variant">{t("uses", { count: uses })}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={base(kind)}>{t("editor.close")}</Link>
          </Button>
          {!isNew && (
            <DeleteContentButton
              label={t("delete")}
              title={t("deleteTitle", { name: category.name.en || category.slug })}
              description={uses > 0 ? t("deleteInUse", { count: uses }) : t("deleteBody")}
              cancelLabel={t("editor.keep")}
              confirmLabel={t("delete")}
              disabled={saving || uses > 0}
              onConfirm={async () => {
                const result = await removeCategory({ kind, slug: category.slug });
                if (!result.ok) {
                  fail(result);
                  return false;
                }
                toast.success(t("deleted"));
                router.replace(base(kind));
                return true;
              }}
            />
          )}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
            {t(isNew ? "editor.create" : "editor.save")}
          </Button>
        </div>
      </div>

      <FieldGroup>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <LocalizedField
              label={t("editor.name")}
              value={field.value}
              maxLength={80}
              error={fieldState.invalid ? t("validation.name") : undefined}
              onChange={(value) => {
                field.onChange(value);
                // A new category's slug follows its English name until edited by hand.
                if (!customSlug) form.setValue("slug", slugFrom(value.en));
              }}
            />
          )}
        />
        <Controller
          control={form.control}
          name="slug"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="category-slug">{t("editor.slug")}</FieldLabel>
              <Input
                id="category-slug"
                dir="ltr"
                value={field.value}
                onBlur={field.onBlur}
                disabled={!isNew}
                placeholder="hatha"
                aria-invalid={fieldState.invalid || undefined}
                onChange={(event) => {
                  setCustomSlug(true);
                  field.onChange(event.target.value.toLowerCase());
                }}
              />
              {fieldState.invalid ? <FieldError>{t("validation.slug")}</FieldError> : <FieldDescription>{t("editor.slugHint")}</FieldDescription>}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="visible"
          render={({ field }) => (
            <Field orientation="horizontal" className="rounded-lg bg-surface p-space-md">
              <FieldContent>
                <FieldLabel htmlFor="category-visible">{t("editor.visible")}</FieldLabel>
                <FieldDescription>{t("editor.visibleHint")}</FieldDescription>
              </FieldContent>
              <Switch id="category-visible" checked={field.value} onCheckedChange={field.onChange} />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
