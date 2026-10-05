"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  EllipsisIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  StarIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
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
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  changePlanStatus,
  recommendPlan,
  reorderPlan,
  saveCurrency,
  type PlanResult,
} from "@/modules/instructor/plan-actions";
import { currencies, type Currency } from "@/modules/memberships/plans";

export type PlanInventoryItem = {
  id: string;
  name: string;
  status: "active" | "hidden";
  featured: boolean;
  /** "$220 / year". */
  price: string;
  /** "Billed yearly after a 14-day free trial". */
  billing: string;
  /** The plan's prices in other currencies, already formatted; empty when it has none. */
  alsoIn: string;
  members: number;
};

/** The studio's plan list in display order, with quick actions; editing opens via `?edit=`. */
export function PlanInventory({
  items,
  editing,
}: {
  items: PlanInventoryItem[];
  editing: string | null;
}) {
  const t = useTranslations("Studio.plans");
  const router = useRouter();
  const [pending, start] = useTransition();

  const act = (work: () => Promise<PlanResult>, success: string) =>
    start(async () => {
      const result = await work();
      if (result.ok) toast.success(success);
      else toast.error(t(`editor.errors.${result.error}`));
    });

  return (
    <ul className="gap-space-sm flex flex-col">
      {items.map((item, index) => (
        <li
          key={item.id}
          className={cn(
            "gap-space-sm bg-surface-container-low p-space-md flex flex-col rounded-xl shadow-sm sm:flex-row sm:items-center",
            editing === item.id && "ring-primary ring-2",
            item.status === "hidden" && "opacity-75",
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-label-lg text-label-lg text-on-surface">
                {item.name}
              </p>
              {item.featured && (
                <Badge className="bg-clay gap-1 text-white">
                  <StarIcon className="fill-current" />
                  {t("recommended")}
                </Badge>
              )}
              <Badge
                variant={item.status === "active" ? "default" : "secondary"}
              >
                {t(`status.${item.status}`)}
              </Badge>
            </div>
            <p className="font-headline-sm text-headline-sm text-primary">
              {item.price}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {item.billing}
            </p>
            {item.alsoIn && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t("alsoIn", { prices: item.alsoIn })}
              </p>
            )}
            <p className="font-label-sm text-label-sm text-outline">
              {t("members", { count: item.members })}
            </p>
          </div>
          <div className="border-hairline pt-space-sm flex items-center gap-1.5 border-t sm:border-0 sm:pt-0">
            <Button
              size="sm"
              variant={editing === item.id ? "default" : "outline"}
              onClick={() =>
                router.push(
                  `/instructor/plans?edit=${encodeURIComponent(item.id)}`,
                )
              }
            >
              <PencilIcon data-icon="inline-start" />
              {t("edit")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("more", { name: item.name })}
                >
                  <EllipsisIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={pending || index === 0}
                    onSelect={() =>
                      act(
                        () => reorderPlan({ id: item.id, direction: -1 }),
                        t("moved"),
                      )
                    }
                  >
                    <ArrowUpIcon />
                    {t("moveUp")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={pending || index === items.length - 1}
                    onSelect={() =>
                      act(
                        () => reorderPlan({ id: item.id, direction: 1 }),
                        t("moved"),
                      )
                    }
                  >
                    <ArrowDownIcon />
                    {t("moveDown")}
                  </DropdownMenuItem>
                  {!item.featured && (
                    <DropdownMenuItem
                      disabled={pending}
                      onSelect={() =>
                        act(
                          () => recommendPlan({ id: item.id }),
                          t("recommendedNow", { name: item.name }),
                        )
                      }
                    >
                      <StarIcon />
                      {t("recommend")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    disabled={pending}
                    onSelect={() =>
                      act(
                        () =>
                          changePlanStatus({
                            id: item.id,
                            status:
                              item.status === "active" ? "hidden" : "active",
                          }),
                        t(item.status === "active" ? "hiddenNow" : "shownNow", {
                          name: item.name,
                        }),
                      )
                    }
                  >
                    {item.status === "active" ? <EyeOffIcon /> : <EyeIcon />}
                    {t(item.status === "active" ? "hide" : "show")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** One currency for the whole site. Changing it doesn't convert existing prices. */
export function CurrencyPicker({ value }: { value: Currency }) {
  const t = useTranslations("Studio.plans.currency");
  const [currency, setCurrency] = useState<Currency>(value);
  const [pending, start] = useTransition();

  return (
    <section className="gap-space-sm bg-surface-container-low p-space-md flex flex-col rounded-xl shadow-sm">
      <div>
        <h2 className="font-label-lg text-label-lg text-on-surface">
          {t("title")}
        </h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("body")}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <ResponsiveSelect
          label={t("label")}
          value={currency}
          onValueChange={(next) => setCurrency(next as Currency)}
          className="min-w-48 flex-1"
          options={currencies.map((code) => ({
            value: code,
            label: t(`names.${code}`),
          }))}
        />
        <Button
          disabled={pending || currency === value}
          onClick={() =>
            start(async () => {
              const result = await saveCurrency({ currency });
              if (result.ok) toast.success(t("saved"));
              else toast.error(t("failed"));
            })
          }
        >
          {t("save")}
        </Button>
      </div>
    </section>
  );
}
