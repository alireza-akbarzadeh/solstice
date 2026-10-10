import { getFormatter } from "next-intl/server";
import {
  CalendarDaysIcon,
  CreditCardIcon,
  GlobeIcon,
  MapPinIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/localized";
import type { WorkshopAttendeeStats, WorkshopEventDetails } from "../types";
import { WorkshopRegistrationForm } from "./registration-form";

export async function WorkshopEventBanner({
  pageSlug,
  event,
  locale,
  stats,
  viewerName,
  viewerEmail,
}: {
  pageSlug: string;
  event: WorkshopEventDetails;
  locale: Locale;
  stats: WorkshopAttendeeStats;
  viewerName?: string;
  viewerEmail?: string;
}) {
  const format = await getFormatter({ locale });
  const isFa = locale === "fa";

  const locationText = localize(event.location, locale);
  const priceText = event.priceLabel ? localize(event.priceLabel, locale) : "";
  const paymentInstructionsText = event.paymentInstructions
    ? localize(event.paymentInstructions, locale)
    : "";

  let formattedDate = event.startDate;
  try {
    const d = new Date(event.startDate);
    formattedDate = format.dateTime(d, {
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    // fallback to raw date
  }

  const LocationIcon =
    event.locationType === "online"
      ? VideoIcon
      : event.locationType === "hybrid"
        ? GlobeIcon
        : MapPinIcon;

  return (
    <section className="bg-surface-container-lowest/80 border-outline-variant/30 my-space-xl overflow-hidden rounded-3xl border shadow-sm">
      <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-12 lg:p-10">
        {/* Left Column: Event Overview & Logistics */}
        <div className="flex flex-col justify-between space-y-6 lg:col-span-7">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-primary">
              <CalendarDaysIcon className="size-4" />
              <span className="font-label-sm text-label-sm font-medium">
                {isFa ? "گردهمایی و کارگاه" : "Sanctuary Gathering"}
              </span>
            </div>

            <h2 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-on-surface">
              {isFa ? "جزئیات رویداد و پذیرش" : "Event Gathering Details"}
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Date */}
              <div className="bg-surface-container-low/60 rounded-2xl border border-outline-variant/20 p-4">
                <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                  <CalendarDaysIcon className="size-4 text-primary" />
                  <span>{isFa ? "تاریخ و زمان" : "Date & Time"}</span>
                </div>
                <p className="mt-1 font-body-md text-body-md font-medium text-on-surface">
                  {formattedDate}
                </p>
              </div>

              {/* Location */}
              <div className="bg-surface-container-low/60 rounded-2xl border border-outline-variant/20 p-4">
                <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                  <LocationIcon className="size-4 text-primary" />
                  <span>
                    {event.locationType === "online"
                      ? isFa
                        ? "آنلاین"
                        : "Online"
                      : event.locationType === "hybrid"
                        ? isFa
                          ? "ترکیبی"
                          : "Hybrid"
                        : isFa
                          ? "حضوری"
                          : "In-Person"}
                  </span>
                </div>
                <p className="mt-1 font-body-md text-body-md font-medium text-on-surface">
                  {locationText || (isFa ? "استودیو یوگا" : "Yoga Studio")}
                </p>
              </div>

              {/* Price / Fee */}
              {priceText && (
                <div className="bg-surface-container-low/60 rounded-2xl border border-outline-variant/20 p-4">
                  <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                    <CreditCardIcon className="size-4 text-clay" />
                    <span>{isFa ? "شهریه / سرمایه‌گذاری" : "Investment / Fee"}</span>
                  </div>
                  <p className="mt-1 font-body-md text-body-md font-medium text-on-surface">
                    {priceText}
                  </p>
                </div>
              )}

              {/* Capacity / Spots */}
              <div className="bg-surface-container-low/60 rounded-2xl border border-outline-variant/20 p-4">
                <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm">
                  <UsersIcon className="size-4 text-primary" />
                  <span>{isFa ? "وضعیت ظرفیت" : "Capacity"}</span>
                </div>
                <p className="mt-1 font-body-md text-body-md font-medium text-on-surface">
                  {stats.capacity
                    ? stats.isFull
                      ? isFa
                        ? "تکمیل ظرفیت (فهرست انتظار)"
                        : "Full (Waitlist Open)"
                      : isFa
                        ? `${format.number(stats.spotsRemaining ?? 0)} جای خالی باقی‌مانده`
                        : `${stats.spotsRemaining} spots remaining`
                    : isFa
                      ? "ظرفیت آزاد"
                      : "Open capacity"}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Guidance Card */}
          {paymentInstructionsText && (
            <div className="bg-surface-container-low/80 rounded-2xl border border-outline-variant/20 p-5">
              <h4 className="font-label-md text-label-md font-medium text-on-surface flex items-center gap-2">
                <CreditCardIcon className="size-4 text-primary" />
                <span>{isFa ? "راهنمای پرداخت و ثبت‌نام" : "Payment Instructions"}</span>
              </h4>
              <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
                {paymentInstructionsText}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Registration Form */}
        <div className="lg:col-span-5">
          <WorkshopRegistrationForm
            pageSlug={pageSlug}
            isFull={stats.isFull}
            isOpen={event.registrationOpen}
            defaultName={viewerName}
            defaultEmail={viewerEmail}
          />
        </div>
      </div>
    </section>
  );
}
