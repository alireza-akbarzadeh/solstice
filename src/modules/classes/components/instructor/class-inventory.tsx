"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapPinIcon,
  MoreVerticalIcon,
  PlayIcon,
  Trash2Icon,
  TvIcon,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Localized } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LiveClass, LiveClassRsvp, LiveClassStatus } from "../../types";
import {
  deleteLiveClassAction,
  updateLiveClassStatusAction,
} from "../../server/actions";
import { ClassEditorDialog } from "./class-editor-dialog";
import { ClassRosterDialog } from "./class-roster-dialog";

export function ClassInventory({
  classes,
  availablePractices = [],
  fetchRsvpsAction,
}: {
  classes: LiveClass[];
  availablePractices: { slug: string; title: Localized }[];
  fetchRsvpsAction: (classId: number) => Promise<LiveClassRsvp[]>;
}) {
  const t = useTranslations("Studio.classes");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleStatusChange = (id: number, status: LiveClassStatus) => {
    startTransition(async () => {
      const res = await updateLiveClassStatusAction(id, status);
      if (res.ok) {
        toast.success("Class status updated");
        router.refresh();
      } else {
        toast.error("Failed to update status");
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const res = await deleteLiveClassAction(id);
      if (res.ok) {
        toast.success("Live session deleted");
        router.refresh();
      } else {
        toast.error("Failed to delete session");
      }
    });
  };

  const statusStyles: Record<LiveClassStatus, string> = {
    scheduled: "bg-surface-container-high text-on-surface-variant",
    live: "bg-secondary-container text-on-secondary-container font-semibold animate-pulse",
    completed: "bg-primary/10 text-primary font-medium",
    canceled: "bg-error/10 text-error line-through",
  };

  return (
    <div className="space-y-space-md">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">
            {t("scheduledCount", { count: classes.length })}
          </span>
        </div>

        <ClassEditorDialog availablePractices={availablePractices} />
      </div>

      {classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/60 p-space-xl text-center">
          <CalendarDaysIcon className="size-8 text-outline mx-auto mb-2" />
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
            No live classes scheduled yet. Create your first session with the button above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((item) => {
            const start = new Date(item.scheduledAt);
            const timeStr = start.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-xs transition-colors hover:border-outline-variant/60",
                  item.status === "live" && "border-secondary/40 ring-1 ring-secondary/20",
                )}
              >
                {/* Info Block */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex flex-col items-center justify-center size-14 rounded-xl bg-surface-container shrink-0 border border-outline-variant/30 text-center">
                    <span className="font-label-sm text-xs text-clay font-bold uppercase leading-none">
                      {start.toLocaleDateString([], { month: "short" })}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface leading-tight font-medium">
                      {start.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-label-sm", statusStyles[item.status])}>
                        {item.status.toUpperCase()}
                      </span>

                      <span className="text-xs text-on-surface-variant flex items-center gap-1 font-label-sm">
                        <ClockIcon className="size-3 text-outline" />
                        {timeStr} ({item.durationMinutes}m)
                      </span>

                      <span className="text-xs text-on-surface-variant flex items-center gap-1 font-label-sm">
                        <MapPinIcon className="size-3 text-outline" />
                        {item.locationName.en}
                      </span>
                    </div>

                    <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">
                      {item.title.en}
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant truncate max-w-xl" dir="rtl">
                      {item.title.fa}
                    </p>
                  </div>
                </div>

                {/* Actions Block */}
                <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-outline-variant/30">
                  {/* Roster Dialog */}
                  <ClassRosterDialog
                    liveClass={item}
                    fetchRsvpsAction={fetchRsvpsAction}
                  />

                  {/* Enter Room Link */}
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/classes/${item.slug}/live`} target="_blank">
                      <TvIcon className="size-3.5 me-1.5 text-primary" />
                      <span>Room</span>
                    </Link>
                  </Button>

                  {/* Edit Dialog */}
                  <ClassEditorDialog
                    liveClass={item}
                    availablePractices={availablePractices}
                    trigger={
                      <Button variant="outline" size="sm">
                        <span>Edit</span>
                      </Button>
                    }
                  />

                  {/* Status Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="More actions">
                        <MoreVerticalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, "live")}>
                        <PlayIcon className="size-4 me-2 text-secondary" />
                        <span>{t("markLive")}</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, "completed")}>
                        <CheckCircle2Icon className="size-4 me-2 text-primary" />
                        <span>{t("markCompleted")}</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => handleStatusChange(item.id, "scheduled")}>
                        <CalendarDaysIcon className="size-4 me-2 text-outline" />
                        <span>{t("markScheduled")}</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => handleDelete(item.id)}
                        className="text-error focus:text-error"
                      >
                        <Trash2Icon className="size-4 me-2" />
                        <span>{t("deleteClass")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
