import { getFormatter, getTranslations } from "next-intl/server";

import type { RevenueMonth } from "@/modules/instructor/server/revenue";
import { cn } from "@/lib/utils";

const W = 600;
const H = 200;
const GUIDES = 4;

/**
 * Stitch draws this chart as a hand-written vector (studio-admin-transactions-revenue), so it
 * is plain SVG here too — no charting library for two series. The plot is held in LTR even in
 * Persian, so the axis labels and the curve always read in the same direction.
 */
export async function RevenueChart({ series }: { series: RevenueMonth[] }) {
  const [t, format] = await Promise.all([getTranslations("Studio.revenue"), getFormatter()]);

  const money = (n: number) => format.number(n, { style: "currency", currency: "USD", maximumFractionDigits: 0, notation: "compact" });
  const month = (m: string) => format.dateTime(new Date(`${m}-01T00:00:00Z`), { month: "short", timeZone: "UTC" });

  const peak = Math.max(1, ...series.map((m) => m.mrr));
  const x = (i: number) => (series.length < 2 ? W / 2 : (i / (series.length - 1)) * W);
  const y = (value: number) => H - (value / peak) * H;

  const line = series.map((m, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(m.mrr).toFixed(1)}`).join(" ");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const maxStarted = Math.max(1, ...series.map((m) => m.started));

  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
      <section className="rounded-xl bg-surface-container-low p-space-md shadow-sm lg:col-span-2 md:p-space-lg">
        <div className="mb-space-md">
          <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("chart.eyebrow")}</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("chart.title")}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("chart.note")}</p>
        </div>

        <div dir="ltr" className="flex gap-2">
          <div className="flex h-48 w-14 shrink-0 flex-col justify-between text-end font-label-sm text-label-sm text-outline">
            {Array.from({ length: GUIDES + 1 }, (_, i) => (
              <span key={i}>{money((peak / GUIDES) * (GUIDES - i))}</span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={t("chart.title")}
              className="h-48 w-full overflow-visible"
            >
              <defs>
                <linearGradient id="mrr-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {Array.from({ length: GUIDES + 1 }, (_, i) => (
                <line
                  key={i}
                  x1="0"
                  x2={W}
                  y1={(H / GUIDES) * i}
                  y2={(H / GUIDES) * i}
                  stroke="var(--hairline)"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              <path d={area} fill="url(#mrr-area)" />
              <path
                d={line}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div className="mt-1.5 flex justify-between font-label-sm text-label-sm text-outline">
              {series.map((m) => (
                <span key={m.month} className="flex-1 text-center first:text-start last:text-end">
                  {month(m.month)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-space-sm font-label-md text-label-md text-primary">
          {t("chart.current", { amount: format.number(series.at(-1)?.mrr ?? 0, { style: "currency", currency: "USD", maximumFractionDigits: 0 }) })}
        </p>
      </section>

      <section className="rounded-xl bg-surface-container-low p-space-md shadow-sm md:p-space-lg">
        <div className="mb-space-md">
          <span className="font-label-sm text-label-sm tracking-widest text-clay uppercase">{t("joins.eyebrow")}</span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("joins.title")}</h2>
        </div>

        <ul dir="ltr" className="flex h-48 items-end gap-1">
          {series.map((m) => (
            <li key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant">{m.started > 0 ? format.number(m.started) : ""}</span>
              <span
                className={cn("w-full rounded-t-sm", m.started > 0 ? "bg-clay" : "bg-surface-container-highest")}
                style={{ height: `${Math.max(2, (m.started / maxStarted) * 100)}%` }}
              />
              <span className="font-label-sm text-label-sm text-outline">{month(m.month).slice(0, 1)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
