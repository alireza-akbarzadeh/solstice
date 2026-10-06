"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { UsersIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import type { LiveClass, LiveClassRsvp } from "../../types";

export function ClassRosterDialog({
  liveClass,
  fetchRsvpsAction,
}: {
  liveClass: LiveClass;
  fetchRsvpsAction: (classId: number) => Promise<LiveClassRsvp[]>;
}) {
  const t = useTranslations("Studio.classes");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rsvps, setRsvps] = useState<LiveClassRsvp[]>([]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      void fetchRsvpsAction(liveClass.id)
        .then((data) => setRsvps(data))
        .finally(() => setLoading(false));
    }
  }, [open, liveClass.id, fetchRsvpsAction]);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UsersIcon className="size-3.5 me-1.5 text-primary" />
          <span>{t("totalAttendees", { count: liveClass.rsvpCount ?? 0 })}</span>
        </Button>
      </ResponsiveDialogTrigger>

      <ResponsiveDialogContent className="max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("rosterTitle")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {liveClass.title.en} · {new Date(liveClass.scheduledAt).toLocaleDateString()}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="py-space-sm max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-on-surface-variant flex items-center justify-center gap-2">
              <Loader2Icon className="size-5 animate-spin text-primary" />
              <span>Loading attendees...</span>
            </div>
          ) : rsvps.length === 0 ? (
            <p className="py-8 text-center text-on-surface-variant text-body-sm">
              {t("noAttendees")}
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant/30 space-y-1">
              {rsvps.map((rsvp) => (
                <li
                  key={rsvp.id}
                  className="py-2.5 px-3 rounded-lg hover:bg-surface-container flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="size-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs uppercase">
                      {(rsvp.userName ?? rsvp.userEmail ?? "P")[0]}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-medium">
                        {rsvp.userName ?? "Practitioner"}
                      </span>
                      <span className="font-body-sm text-xs text-on-surface-variant">
                        {rsvp.userEmail}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-outline">
                    {new Date(rsvp.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline">Close</Button>
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
