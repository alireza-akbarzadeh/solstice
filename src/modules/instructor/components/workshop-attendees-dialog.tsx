"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckCircle2Icon,
  DownloadIcon,
  SearchIcon,
  Trash2Icon,
  UserCheckIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  getWorkshopAttendeesAction,
  removeWorkshopRegistrationAction,
  updateWorkshopRegistrationStatusAction,
} from "@/modules/workshops/actions";
import type {
  WorkshopAttendeeStats,
  WorkshopRegistration,
  WorkshopRegistrationStatus,
} from "@/modules/workshops/types";

export function WorkshopAttendeesDialog({
  open,
  onOpenChange,
  pageSlug,
  pageTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageSlug: string;
  pageTitle: string;
}) {
  const t = useTranslations("Workshops.studio");
  const locale = useLocale();
  const [registrations, setRegistrations] = useState<WorkshopRegistration[]>([]);
  const [stats, setStats] = useState<WorkshopAttendeeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWorkshopAttendeesAction(pageSlug);
      setRegistrations(data.registrations);
      setStats(data.stats);
    } catch {
      toast.error(t("removeFailed"));
    } finally {
      setLoading(false);
    }
  }, [pageSlug, t]);

  useEffect(() => {
    if (open) {
      void loadData();
    }
  }, [open, loadData]);

  const handleStatusChange = (
    id: number,
    status: WorkshopRegistrationStatus,
  ) => {
    startTransition(async () => {
      const res = await updateWorkshopRegistrationStatusAction({
        id,
        status,
        pageSlug,
      });
      if (res.ok) {
        toast.success(t("statusUpdated"));
        await loadData();
      } else {
        toast.error(t("updateFailed"));
      }
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const res = await removeWorkshopRegistrationAction({ id, pageSlug });
      if (res.ok) {
        toast.success(t("attendeeRemoved"));
        await loadData();
      } else {
        toast.error(t("removeFailed"));
      }
    });
  };

  const filtered = registrations.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone.includes(q)
    );
  });

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-4xl p-6 sm:p-8">
        <ResponsiveDialogHeader className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <ResponsiveDialogTitle className="font-headline-md text-headline-md text-on-surface">
                {t("rosterTitle")}
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                {pageTitle}
              </ResponsiveDialogDescription>
            </div>

            <a
              href={`/api/instructor/workshops/${pageSlug}/attendees`}
              download
              className="inline-flex"
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full border-primary/30"
              >
                <DownloadIcon className="size-4 text-primary" />
                <span>{t("exportCsv")}</span>
              </Button>
            </a>
          </div>
        </ResponsiveDialogHeader>

        {/* Stats Strip */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="bg-surface-container-low/70 rounded-2xl border border-outline-variant/20 p-3.5 text-center">
              <div className="font-body-xs text-body-xs text-on-surface-variant">
                {t("totalRegistered")}
              </div>
              <div className="font-headline-sm text-headline-sm font-semibold text-primary">
                {stats.registered}
              </div>
            </div>
            <div className="bg-surface-container-low/70 rounded-2xl border border-outline-variant/20 p-3.5 text-center">
              <div className="font-body-xs text-body-xs text-on-surface-variant">
                {t("totalConfirmed")}
              </div>
              <div className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {stats.confirmed}
              </div>
            </div>
            <div className="bg-surface-container-low/70 rounded-2xl border border-outline-variant/20 p-3.5 text-center">
              <div className="font-body-xs text-body-xs text-on-surface-variant">
                {t("totalWaitlist")}
              </div>
              <div className="font-headline-sm text-headline-sm font-semibold text-clay">
                {stats.waitlist}
              </div>
            </div>
            <div className="bg-surface-container-low/70 rounded-2xl border border-outline-variant/20 p-3.5 text-center">
              <div className="font-body-xs text-body-xs text-on-surface-variant">
                {t("spotsLeft")}
              </div>
              <div className="font-headline-sm text-headline-sm font-semibold text-primary">
                {stats.spotsRemaining ?? "∞"}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <SearchIcon className="text-on-surface-variant absolute start-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="ps-9"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(["all", "registered", "confirmed", "waitlist", "canceled"] as const).map(
              (f) => {
                const label =
                  f === "all"
                    ? t("all")
                    : f === "registered"
                      ? t("totalRegistered")
                      : f === "confirmed"
                        ? t("totalConfirmed")
                        : f === "waitlist"
                          ? t("totalWaitlist")
                          : t("totalCanceled");
                return (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className="rounded-full text-xs"
                  >
                    {label}
                  </Button>
                );
              },
            )}
          </div>
        </div>

        {/* Attendee List */}
        <div className="mt-4 max-h-[450px] overflow-y-auto rounded-2xl border border-outline-variant/20">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner className="size-6 text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-on-surface-variant p-8 text-center font-body-sm text-body-sm">
              {t("noAttendeesYet")}
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/20">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="hover:bg-surface-container-low/40 flex flex-col justify-between gap-4 p-4 transition-colors sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-body-md text-body-md font-medium text-on-surface">
                        {item.name}
                      </span>
                      <Badge
                        variant={
                          item.status === "confirmed"
                            ? "default"
                            : item.status === "registered"
                              ? "secondary"
                              : item.status === "waitlist"
                                ? "outline"
                                : "destructive"
                        }
                        className="rounded-full text-xs font-normal"
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <div className="font-body-xs text-body-xs text-on-surface-variant flex flex-wrap items-center gap-3">
                      <span>{item.email}</span>
                      <span>•</span>
                      <span dir="ltr">{item.phone}</span>
                      <span>•</span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString(locale)}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="font-body-xs text-body-xs text-on-surface-variant bg-surface-container/60 mt-1 max-w-xl rounded-lg p-2 italic">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {item.status !== "confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleStatusChange(item.id, "confirmed")}
                        title={t("confirmAttendee")}
                        className="size-8 p-0"
                      >
                        <UserCheckIcon className="size-4 text-primary" />
                      </Button>
                    )}

                    {item.status === "waitlist" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleStatusChange(item.id, "registered")}
                        title={t("promoteAttendee")}
                        className="size-8 p-0"
                      >
                        <CheckCircle2Icon className="size-4 text-primary" />
                      </Button>
                    )}

                    {item.status !== "canceled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleStatusChange(item.id, "canceled")}
                        title={t("cancelAttendee")}
                        className="size-8 p-0"
                      >
                        <XCircleIcon className="size-4 text-clay" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleDelete(item.id)}
                      title={t("deleteAttendee")}
                      className="text-destructive size-8 p-0 hover:bg-destructive/10"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
