import { PlusIcon, TagIcon } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import { cn } from "@/lib/utils";
import {
  PlanEditor,
  type EditablePlan,
} from "@/modules/instructor/components/plan-editor";
import {
  CurrencyPicker,
  PlanInventory,
  type PlanInventoryItem,
} from "@/modules/instructor/components/plan-inventory";
import { StudioPageHeader } from "@/modules/instructor/components/studio-page-header";
import { blankPlanFields } from "@/modules/memberships/plan-schemas";
import { getPlanDisplay } from "@/modules/memberships/server/plan-display";
import { getAllPlans, getPlanUsage } from "@/modules/memberships/server/plans";
import { requireInstructor } from "@/modules/memberships/server/viewer";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/instructor/plans">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Studio.plans" });
  return { title: t("metaTitle"), robots: { index: false } };
}

// No Stitch screen. Membership plans: what they cost, how often they bill, the free trial,
// and which one is recommended. The public membership page, checkout and price mentions
// across the site all read from here.
export default async function StudioPlansPage({
  params,
  searchParams,
}: PageProps<"/[locale]/instructor/plans">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  await requireInstructor(locale, "/instructor/plans");
  const query = await searchParams;
  const one = (key: string) =>
    Array.isArray(query[key]) ? query[key][0] : query[key];
  const editId = one("edit");
  const creating = one("new") === "1";

  const [t, tCurrency, plans, usage, display] = await Promise.all([
    getTranslations("Studio.plans"),
    getTranslations("Studio.plans.currency"),
    getAllPlans(),
    getPlanUsage(),
    getPlanDisplay(locale),
  ]);
  const { currency } = display.catalog;

  const items: PlanInventoryItem[] = plans.map((plan) => ({
    id: plan.id,
    name: localize(plan.name, locale) || plan.id,
    status: plan.status,
    featured: plan.featured,
    price: `${display.money(plan.price)} ${display.per(plan.intervalMonths)}`,
    billing: display.describe(plan).billing,
    members: usage[plan.id] ?? 0,
  }));

  const editRow = editId ? plans.find((plan) => plan.id === editId) : undefined;
  const editing: EditablePlan | null = editRow
    ? {
        id: editRow.id,
        status: editRow.status,
        featured: editRow.featured,
        name: editRow.name,
        description: editRow.description,
        badge: editRow.badge,
        features: editRow.features,
        price: editRow.price,
        intervalMonths: editRow.intervalMonths,
        trialDays: editRow.trialDays,
      }
    : creating
      ? { id: null, ...blankPlanFields() }
      : null;
  const onSale = plans.filter((plan) => plan.status === "active").length;

  return (
    <div className="gap-space-lg flex flex-col">
      <StudioPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        lede={t("lede", { onSale, total: plans.length })}
        actions={
          <Button asChild>
            <Link href="/instructor/plans?new=1">
              <PlusIcon data-icon="inline-start" />
              {t("new")}
            </Link>
          </Button>
        }
      />

      <div className="gap-gutter grid grid-cols-1 items-start xl:grid-cols-12">
        <div className="gap-space-md flex flex-col xl:col-span-5">
          {plans.length === 0 ? (
            <Empty className="bg-surface-container-low rounded-xl">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TagIcon />
                </EmptyMedia>
                <EmptyTitle className="font-headline-sm text-headline-sm">
                  {t("emptyTitle")}
                </EmptyTitle>
                <EmptyDescription>{t("emptyBody")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <PlanInventory items={items} editing={editRow?.id ?? null} />
          )}
          <CurrencyPicker key={currency} value={currency} />
        </div>

        {/* On a phone the open editor comes first rather than below every plan. */}
        <div
          className={cn(
            "xl:col-span-7",
            editing && "order-first xl:order-none",
          )}
        >
          {editing ? (
            <PlanEditor
              key={editing.id ?? "new"}
              plan={editing}
              currencyLabel={tCurrency(`short.${currency}`)}
              members={editing.id ? (usage[editing.id] ?? 0) : 0}
            />
          ) : (
            <Empty className="bg-surface-container-low rounded-xl">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TagIcon />
                </EmptyMedia>
                <EmptyTitle className="font-headline-sm text-headline-sm">
                  {t("pickTitle")}
                </EmptyTitle>
                <EmptyDescription>{t("pickBody")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}
