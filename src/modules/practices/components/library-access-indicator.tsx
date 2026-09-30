import { getFormatter, getTranslations } from "next-intl/server";

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Ring showing how much of the library is open without membership.
export async function LibraryAccessIndicator({ open, total }: { open: number; total: number }) {
  const [t, format] = await Promise.all([getTranslations("Practices"), getFormatter()]);
  const ratio = total > 0 ? open / total : 0;

  return (
    <div className="flex items-center gap-4 rounded-xl bg-surface-container-low px-5 py-3 shadow-sm">
      <div className="relative flex items-center justify-center">
        <svg aria-hidden className="size-11 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={RADIUS} fill="transparent" stroke="currentColor" strokeWidth="2.5" className="text-surface-container-high" />
          <circle
            cx="22"
            cy="22"
            r={RADIUS}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
            strokeLinecap="round"
            className="text-primary"
          />
        </svg>
        <span aria-hidden className="absolute font-label-sm text-label-sm font-semibold text-primary">
          {format.number(open)}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="font-label-md text-label-md font-semibold tracking-wider text-on-surface uppercase">{t("accessTitle")}</span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          {t("accessDetail", { open, members: total - open })}
        </span>
      </div>
    </div>
  );
}
